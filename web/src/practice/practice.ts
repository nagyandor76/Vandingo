// The Practice: one sitting, from loading its Questions to saving its Result. It drives the Practice engine
// (the rules) through time, sound and saving; screens render its snapshot and forward the Participant's taps.

import type { NewResult, QuizSummary, Subject } from '../api.ts'
import { quizNamesOf } from '../resultLabels.ts'
import {
  answer,
  closeBlock,
  currentBlock,
  isPassed,
  multipleChoiceView,
  next,
  place,
  readAloud,
  readOnlyOnceScored,
  spellingView,
  startPractice,
  takeBack,
  takeBackLast,
  tap,
  tick,
  toggle,
  type Block,
  type MultipleChoiceView,
  type PracticeQuestion,
  type PracticeResult,
  type PracticeState,
  type Selection,
  type Side,
  type Speech,
  type SpellingView,
  type TrueFalseAnswer,
} from './engine.ts'

// What a screen needs to render a Practice, so it never reaches into the engine itself.
export type { Block, BlockQuestion, MultipleChoiceOption, MultipleChoiceView, PracticeResult, Selection, Side, SpellingSlot, SpellingView, TrueFalseAnswer } from './engine.ts'

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

/**
 * How a Practice is heard. A reading and a Block sound each settle once they are over: finished,
 * cut off by the next reading or by `stop`, or failed. They never reject.
 */
export interface PracticeAudio {
  speak(speech: Speech): Promise<void>
  stop(): void
  playBlockSound(allCorrect: boolean): Promise<void>
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
      /** A spelling Block: the word's meaning, its answer line and its tiles. */
      spelling?: SpellingView
      /** A multiple-choice Block: the question and its options, in the order they are shown. */
      multipleChoice?: MultipleChoiceView
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
  /** Chooses an option of the current multiple-choice Block, by its place among the options shown, or lets go of it. */
  toggle(option: number): void
  /** Places a tile of the current spelling Block, by its index, in the first empty slot of the word. */
  place(tile: number): void
  /** Takes the last placed letter of the current spelling Block back to its tile. */
  takeBackLast(): void
  /** Takes back the letter at a place of the spelling Block's answer line, counting given characters too. */
  takeBack(place: number): void
  /**
   * Reads a Question of the current Block aloud again, if it has a `speak_text`; a spelling word or a multiple-choice
   * Question only once scored.
   */
  readAloud(questionIndex: number): void
  /** „Kész”: closes and scores the current true–false or multiple-choice Block. */
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
      ...(block.type === 'spelling' && { spelling: spellingView(block) }),
      ...(block.type === 'multiple-choice' && { multipleChoice: multipleChoiceView(block) }),
      resultReady: state.result !== undefined,
      timedOut: state.result !== undefined && state.remainingSeconds === 0,
    }
  }

  let quizNames: Pick<NewResult, 'quizNameFrom' | 'quizNameTo'> = {}
  let ticking: ReturnType<typeof setInterval> | undefined
  let advancing: ReturnType<typeof setTimeout> | undefined
  let submitted: NewResult | undefined
  let saveStatus: SaveStatus | undefined

  /** The scored spelling or multiple-choice Block whose sound is still playing; what is asked to be read waits for it. */
  let soundOf: number | undefined

  /** The Participant is still on this Block of the Practice and hasn't left. */
  const stillOn = (blockIndex: number) => !disposed && state?.blockIndex === blockIndex && !state.finished

  /**
   * With auto_advance, moves on from the scored Block after a while, unless the Participant moves on first.
   * Once there is a Result, the Participant moves on to the summary by hand.
   */
  const advanceLater = (blockIndex: number) => {
    clearTimeout(advancing)
    if (!autoAdvance || !stillOn(blockIndex) || state!.result) return
    advancing = setTimeout(() => update(next(state!)), autoAdvanceMs)
  }

  /**
   * Reads the Question of a scored spelling or multiple-choice Block, then moves on only once the latest reading
   * is over, so the move on never cuts it off; a reading asked for meanwhile restarts the wait.
   */
  const readScored = (speech: Speech, blockIndex: number) => {
    clearTimeout(advancing)
    audio.speak(speech).then(() => {
      if (state?.speech === speech) advanceLater(blockIndex)
    })
  }

  /**
   * A spelling or multiple-choice Block just scored: its sound first, then its Question if it has a reading (the
   * latest one asked for by the end of the sound), then the move on.
   */
  const soundThenRead = (block: Block, blockIndex: number, speech: Speech | undefined) => {
    soundOf = blockIndex
    audio.playBlockSound(block.allCorrect!).then(() => {
      if (soundOf !== blockIndex) return
      soundOf = undefined
      if (!stillOn(blockIndex)) return
      if (speech && state!.speech) readScored(state!.speech, blockIndex)
    })
    if (!speech) advanceLater(blockIndex)
  }

  /** Moves the engine on and does what the move asks for: reading aloud, the Block sound, saving a new Result. */
  const update = (moved: PracticeState) => {
    const previous = state!
    if (disposed || moved === previous) return
    state = moved
    // A pending move on is dropped once the Participant moved on, or once there is a Result.
    if (moved.blockIndex !== previous.blockIndex || moved.result) clearTimeout(advancing)
    if (moved.blockIndex !== previous.blockIndex) soundOf = undefined
    const newSpeech = moved.speech && moved.speech !== previous.speech ? moved.speech : undefined
    const block = currentBlock(moved)
    const scoredBefore = moved.blockIndex === previous.blockIndex && currentBlock(previous).closed
    const scoredNow = block.closed && !scoredBefore
    if (readOnlyOnceScored(block)) {
      // Read only once scored, after the Block sound.
      if (scoredNow) {
        audio.stop()
        soundThenRead(block, moved.blockIndex, newSpeech)
      } else if (newSpeech && soundOf !== moved.blockIndex) readScored(newSpeech, moved.blockIndex)
    } else {
      if (newSpeech) audio.speak(newSpeech)
      if (scoredNow) {
        // One sound per scored Block, cutting off any reading.
        audio.stop()
        audio.playBlockSound(block.allCorrect!)
        advanceLater(moved.blockIndex)
      }
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
    toggle: (option) => state && update(toggle(state, option)),
    place: (tile) => state && update(place(state, tile)),
    takeBackLast: () => state && update(takeBackLast(state)),
    takeBack: (place) => state && update(takeBack(state, place)),
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
