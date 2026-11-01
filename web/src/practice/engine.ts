// The Practice engine: the rules of one Practice, independent of the UI.
// Screens only render the state it returns and forward the Participant's actions.

export type QuestionType = 'true-false' | 'word-matching' | 'multiple-choice' | 'ordered'

/** The question types a Practice can present, with the number of Questions in one whole Block. */
const blockSizes: Partial<Record<QuestionType, number>> = { 'true-false': 3, 'word-matching': 5 }

/**
 * The playable types a Practice draws from, given a range's Question count per type: a type is used
 * only if the range holds at least one whole Block of it. Nothing used means the Practice can't start.
 */
export function usableTypes(counts: Partial<Record<QuestionType, number>>): QuestionType[] {
  return (Object.keys(blockSizes) as QuestionType[]).filter((type) => (counts[type] ?? 0) >= blockSizes[type]!)
}

/** A Question as served for a Practice, its `time` already resolved against the Quiz default. */
export interface PracticeQuestion {
  type: QuestionType
  text: string
  options?: string[]
  answer: string[]
  time: number
  speak_text?: string
  speak_answer?: string
}

export interface SubjectSettings {
  max_questions: number
  auto_advance: boolean
}

export interface PracticeInput {
  questions: PracticeQuestion[]
  settings: SubjectSettings
  /** Returns a number in [0, 1), like Math.random. */
  random: () => number
  /** Returns the current time in milliseconds, like Date.now. */
  clock: () => number
}

export type TrueFalseAnswer = 'true' | 'false'

/** One statement of a true–false Block and the Participant's answer to it. */
export interface BlockQuestion {
  question: PracticeQuestion
  given?: TrueFalseAnswer
  /** Set when the Block is closed; a missing answer is wrong. */
  correct?: boolean
}

/** Same-type Questions shown and scored together. */
export interface Block {
  type: QuestionType
  questions: BlockQuestion[]
  /** Closed Blocks are scored and can no longer be answered. */
  closed: boolean
}

/** The scores of a finished Practice: what its Result records, apart from who, what and when. */
export interface PracticeResult {
  /** The number of selected Questions, even if time ran out before some were shown. */
  total: number
  correct: number
  incorrect: number
  scorePercent: number
  timeLimitSeconds: number
  /** From the start until the last Block was scored; the whole time limit if time ran out. */
  elapsedSeconds: number
}

/** Passed: every selected Question answered correctly. */
export const isPassed = (result: PracticeResult) => result.correct === result.total

export interface PracticeState {
  /** Every Block of the Practice, in the order they are shown. */
  blocks: Block[]
  /** The Block on screen. */
  blockIndex: number
  timeLimitSeconds: number
  remainingSeconds: number
  /** Set as soon as the last Block is scored, or time runs out. */
  result?: PracticeResult
  /** The Participant moved on from the last Block: show the summary. */
  finished: boolean
  clock: () => number
  startedAt: number
}

export function startPractice(input: PracticeInput): PracticeState {
  const selected = select(input)
  const timeLimitSeconds = selected.reduce((sum, question) => sum + question.time, 0)
  return {
    blocks: toBlocks(selected),
    blockIndex: 0,
    timeLimitSeconds,
    remainingSeconds: timeLimitSeconds,
    finished: false,
    clock: input.clock,
    startedAt: input.clock(),
  }
}

export const currentBlock = (state: PracticeState): Block => state.blocks[state.blockIndex]

/** Answers one statement of the current Block; a closed Block ignores it. */
export function answer(state: PracticeState, questionIndex: number, value: TrueFalseAnswer): PracticeState {
  const block = currentBlock(state)
  if (block.closed) return state
  const questions = block.questions.map((entry, i) => (i === questionIndex ? { ...entry, given: value } : entry))
  return withCurrentBlock(state, { ...block, questions })
}

/** Closes and scores the current Block; after the last one the Practice has its Result. */
export function closeBlock(state: PracticeState): PracticeState {
  if (currentBlock(state).closed) return state
  const closed = scoreCurrentBlock(state)
  if (state.blockIndex < state.blocks.length - 1) return closed
  const elapsedSeconds = Math.min(Math.round(elapsedMs(state) / 1000), state.timeLimitSeconds)
  return { ...closed, result: score(closed, elapsedSeconds) }
}

/**
 * Lets the countdown follow the clock. When time runs out, the current Block is scored and
 * the Practice has its Result: whatever was not answered or not shown is wrong.
 */
export function tick(state: PracticeState): PracticeState {
  if (state.result) return state
  const remainingSeconds = Math.max(0, Math.ceil(state.timeLimitSeconds - elapsedMs(state) / 1000))
  if (remainingSeconds > 0) return remainingSeconds === state.remainingSeconds ? state : { ...state, remainingSeconds }
  const closed = currentBlock(state).closed ? state : scoreCurrentBlock(state)
  return { ...closed, remainingSeconds, result: score(closed, state.timeLimitSeconds) }
}

const elapsedMs = (state: PracticeState) => state.clock() - state.startedAt

function scoreCurrentBlock(state: PracticeState): PracticeState {
  const block = currentBlock(state)
  const questions = block.questions.map((entry) => ({ ...entry, correct: entry.given === entry.question.answer[0] }))
  return withCurrentBlock(state, { ...block, questions, closed: true })
}

/** Moves on from a closed Block to the next one, or to the summary once the Practice has its Result. */
export function next(state: PracticeState): PracticeState {
  if (!currentBlock(state).closed) return state
  if (state.result) return { ...state, finished: true }
  return { ...state, blockIndex: state.blockIndex + 1 }
}

/** Every selected Question counts; anything not scored correct is wrong. */
function score(state: PracticeState, elapsedSeconds: number): PracticeResult {
  const questions = state.blocks.flatMap((block) => block.questions)
  const total = questions.length
  const correct = questions.filter((entry) => entry.correct).length
  // Rounded down, so only an all-correct Practice shows 100% (Passed).
  const scorePercent = total === 0 ? 0 : Math.floor((correct / total) * 100)
  return { total, correct, incorrect: total - correct, scorePercent, timeLimitSeconds: state.timeLimitSeconds, elapsedSeconds }
}

const withCurrentBlock = (state: PracticeState, block: Block): PracticeState => ({
  ...state,
  blocks: state.blocks.map((b, i) => (i === state.blockIndex ? block : b)),
})

/**
 * Picks the Practice's Questions at random, without repetition, up to the Subject's maximum,
 * from the usable types only. Word-matching Blocks don't exist yet (ticket 04), so those are left out.
 */
function select({ questions, settings, random }: PracticeInput): PracticeQuestion[] {
  const counts: Partial<Record<QuestionType, number>> = {}
  for (const { type } of questions) counts[type] = (counts[type] ?? 0) + 1
  const types: QuestionType[] = usableTypes(counts).filter((type) => type !== 'word-matching')
  const candidates = questions.filter((question) => types.includes(question.type))
  return shuffle(candidates, random).slice(0, settings.max_questions)
}

/** Groups the selected Questions into Blocks of a whole Block's size; the last one may be shorter. */
function toBlocks(questions: PracticeQuestion[]): Block[] {
  const size = blockSizes['true-false']!
  const blocks: Block[] = []
  for (let i = 0; i < questions.length; i += size) {
    blocks.push({ type: 'true-false', questions: questions.slice(i, i + size).map((question) => ({ question })), closed: false })
  }
  return blocks
}

/** Fisher–Yates shuffle into a new array. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
