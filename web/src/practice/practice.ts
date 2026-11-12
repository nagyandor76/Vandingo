// The Practice: one sitting, from loading its Questions to saving its Result. It drives the Practice engine
// (the rules) through time, sound and saving; screens render its snapshot and forward the Participant's taps.

import type { NewResult, QuizSummary, Subject } from '../api.ts'
import { quizNamesOf } from '../resultLabels.ts'
import {
  answer,
  closeBlock,
  currentBlock,
  isPassed,
  next,
  readAloud,
  startPractice,
  tap,
  tick,
  type Block,
  type PracticeQuestion,
  type PracticeResult,
  type PracticeState,
  type Selection,
  type Side,
  type Speech,
  type TrueFalseAnswer,
} from './engine.ts'

// What a screen needs to render a Practice, so it never reaches into the engine itself.
export type { Block, BlockQuestion, PracticeResult, Selection, Side, TrueFalseAnswer } from './engine.ts'

/** How often the countdown follows the clock. */
const tickMs = 250

/** With the Subject's auto_advance on, how long a scored Block stays on screen. */
const autoAdvanceMs = 2000

/** Where a Practice gets its Questions and puts its Result: the backend in the browser. */
export interface PracticeData {
  fetchSubjects(): Promise<Subject[]>
  fetchQuestions(subject: string, from: number, to: number): Promise<PracticeQuestion[]>
  fetchQuizzes(subject: string): Promise<QuizSummary[]>
  saveResult(result: NewResult): Promise<void>
}

/** How a Practice is heard. */
export interface PracticeAudio {
  speak(speech: Speech): void
  stop(): void
  playBlockSound(allCorrect: boolean): void
}

/** Who practises which Subject, over which inclusive Difficulty range. */
export interface PracticeChoice {
  participant: string
  subject: string
  from: number
  to: number
}

export interface PracticePorts {
  data: PracticeData
  audio: PracticeAudio
  /** Returns a number in [0, 1), like Math.random. */
  random?: () => number
}

export type PracticeSnapshot =
  | { phase: 'loading' }
  | { phase: 'load-failed' }
  /** The range holds no playable Block. */
  | { phase: 'empty' }
  | {
      phase: 'running'
      subjectName: string
      block: Block
      blockIndex: number
      blockCount: number
      remainingSeconds: number
      /** The share of Blocks scored, from 0 to 1. */
      progress: number
      correctInBlock: number
      selection?: Selection
      /** The Practice has its Result: the last Block is scored, or time ran out. */
      resultReady: boolean
      timedOut: boolean
    }
  | { phase: 'finished'; result: PracticeResult; passed: boolean; saveStatus: SaveStatus }

export type SaveStatus = 'saving' | 'saved' | 'failed'

export interface Practice {
  subscribe(listener: () => void): () => void
  getSnapshot(): PracticeSnapshot
  /** Answers one statement of the current true–false Block. */
  answer(questionIndex: number, value: TrueFalseAnswer): void
  /** Taps a word or a meaning of the current word-matching Block, by its Question's index in the Block. */
  tap(side: Side, index: number): void
  /** Reads a Question of the current Block aloud again, if it has a `speak_text`. */
  readAloud(questionIndex: number): void
  /** Closes and scores the current true–false Block. */
  close(): void
  /** Moves on from a scored Block: to the next one, or to the summary once there is a Result. */
  next(): void
  /** Sends the Result again after its save failed. */
  retrySave(): void
  /** Stops the clock and the sound; a Practice left before its end is not saved. */
  dispose(): void
}

export function createPractice(choice: PracticeChoice, { data, audio, random = Math.random }: PracticePorts): Practice {
  const { subject, from, to } = choice
  const listeners = new Set<() => void>()
  let snapshot: PracticeSnapshot = { phase: 'loading' }
  let subjectName = ''
  let autoAdvance = false
  let state: PracticeState | undefined
  let disposed = false

  const publish = (next: PracticeSnapshot) => {
    snapshot = next
    for (const listener of listeners) listener()
  }

  const describe = (state: PracticeState): PracticeSnapshot => {
    if (state.finished) return { phase: 'finished', result: state.result!, passed: isPassed(state.result!), saveStatus: saveStatus! }
    const block = currentBlock(state)
    return {
      phase: 'running',
      subjectName,
      block,
      blockIndex: state.blockIndex,
      blockCount: state.blocks.length,
      remainingSeconds: state.remainingSeconds,
      progress: (state.blockIndex + (block.closed ? 1 : 0)) / state.blocks.length,
      correctInBlock: block.questions.filter((entry) => entry.correct).length,
      selection: state.selection,
      resultReady: state.result !== undefined,
      timedOut: state.result !== undefined && state.remainingSeconds === 0,
    }
  }

  let quizNames: Pick<NewResult, 'quizNameFrom' | 'quizNameTo'> = {}
  let ticking: ReturnType<typeof setInterval> | undefined
  let advancing: ReturnType<typeof setTimeout> | undefined
  let submitted: NewResult | undefined
  let saveStatus: SaveStatus | undefined

  /** Moves the engine on and does what the move asks for: reading aloud, the Block sound, saving a new Result. */
  const update = (moved: PracticeState) => {
    const previous = state!
    if (disposed || moved === previous) return
    state = moved
    // A pending move on is dropped once the Participant moved on, or once there is a Result.
    if (moved.blockIndex !== previous.blockIndex || moved.result) clearTimeout(advancing)
    if (moved.speech && moved.speech !== previous.speech) audio.speak(moved.speech)
    const block = currentBlock(moved)
    const scoredBefore = moved.blockIndex === previous.blockIndex && currentBlock(previous).closed
    if (block.closed && !scoredBefore) {
      // One sound per scored Block, cutting off any reading.
      audio.stop()
      audio.playBlockSound(block.allCorrect!)
      // Once there is a Result, the Participant moves on to the summary by hand.
      if (autoAdvance && !moved.result) advancing = setTimeout(() => update(next(state!)), autoAdvanceMs)
    }
    if (moved.finished && !previous.finished) audio.stop()
    if (moved.result && !previous.result) {
      clearInterval(ticking)
      submitted = { participant: choice.participant, subject, difficultyFrom: from, difficultyTo: to, ...quizNames, ...moved.result }
      save()
    }
    publish(describe(moved))
  }

  /** Saves the Result; how it went shows on the summary, unless the Participant has left. */
  const save = () => {
    saveStatus = 'saving'
    const settled = (status: SaveStatus) => () => {
      if (disposed) return
      saveStatus = status
      publish(describe(state!))
    }
    data.saveResult(submitted!).then(settled('saved'), settled('failed'))
  }

  // The names are best effort: a Result without them is still a Result.
  const names = data.fetchQuizzes(subject).then((quizzes) => quizNamesOf(quizzes, from, to), () => ({}))
  Promise.all([data.fetchSubjects(), data.fetchQuestions(subject, from, to), names]).then(
    ([subjects, questions, namesAtStart]) => {
      if (disposed) return
      const settings = subjects.find((s) => s.key === subject)
      if (!settings) return publish({ phase: 'load-failed' })
      subjectName = settings.name
      autoAdvance = settings.auto_advance
      quizNames = namesAtStart
      state = startPractice({ questions, settings, random, clock: Date.now })
      if (state.blocks.length === 0) return publish({ phase: 'empty' })
      ticking = setInterval(() => update(tick(state!)), tickMs)
      if (state.speech) audio.speak(state.speech)
      publish(describe(state))
    },
    () => !disposed && publish({ phase: 'load-failed' }),
  )

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    answer: (questionIndex, value) => state && update(answer(state, questionIndex, value)),
    tap: (side, index) => state && update(tap(state, side, index)),
    readAloud: (questionIndex) => state && update(readAloud(state, questionIndex)),
    close: () => state && update(closeBlock(state)),
    next: () => state && update(next(state)),
    retrySave() {
      if (saveStatus !== 'failed') return
      save()
      publish(describe(state!))
    },
    dispose() {
      disposed = true
      clearInterval(ticking)
      clearTimeout(advancing)
      audio.stop()
    },
  }
}
