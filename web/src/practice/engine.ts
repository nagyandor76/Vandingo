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

/** One Question of a Block and the Participant's answer to it: a true–false statement, or a word-matching pair. */
export interface BlockQuestion {
  question: PracticeQuestion
  /** True–false: the answer given. */
  given?: TrueFalseAnswer
  /** Word-matching: the Block index of the Question whose meaning is paired with this word. */
  paired?: number
  /** Set when the Block is closed; a missing answer is wrong. */
  correct?: boolean
  /** True–false: the statement has been the topmost unanswered one, so it is never read aloud automatically again. */
  announced?: boolean
}

/** Same-type Questions shown and scored together. */
export interface Block {
  type: QuestionType
  questions: BlockQuestion[]
  /** Closed Blocks are scored and can no longer be answered. */
  closed: boolean
  /** Set when the Block is closed: every answer was correct. */
  allCorrect?: boolean
  /**
   * Word-matching: the Block indices of the Questions in the order their meanings are shown.
   * The words are shown in Block order, so the two columns are shuffled apart.
   */
  meaningOrder?: number[]
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

/** Text to read aloud, in the language of its `speak_text`. */
export interface Speech {
  text: string
  lang: string
}

/** How a Question's text is read aloud, or nothing if it has no `speak_text`. Its answer is never read. */
export const speechOf = ({ text, speak_text }: PracticeQuestion): Speech | undefined =>
  speak_text ? { text, lang: speak_text } : undefined

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
  /**
   * The latest statement to read aloud automatically. A new one is a new object; it stays the same object
   * until the next one, so it is read only once. Unset while the topmost unanswered statement has no `speak_text`.
   */
  speech?: Speech
  clock: () => number
  startedAt: number
}

export function startPractice(input: PracticeInput): PracticeState {
  const selected = select(input)
  const timeLimitSeconds = selected.reduce((sum, question) => sum + question.time, 0)
  return announce({
    blocks: toBlocks(selected, input.random),
    blockIndex: 0,
    timeLimitSeconds,
    remainingSeconds: timeLimitSeconds,
    finished: false,
    clock: input.clock,
    startedAt: input.clock(),
  })
}

export const currentBlock = (state: PracticeState): Block => state.blocks[state.blockIndex]

/** Answers one statement of the current Block; a closed Block ignores it. */
export function answer(state: PracticeState, questionIndex: number, value: TrueFalseAnswer): PracticeState {
  const block = currentBlock(state)
  if (block.closed) return state
  const questions = block.questions.map((entry, i) => (i === questionIndex ? { ...entry, given: value } : entry))
  return announce(withCurrentBlock(state, { ...block, questions }))
}

/**
 * Reads aloud the topmost unanswered statement of the current true–false Block when it becomes the topmost
 * for the first time; without a `speak_text` it stays silent rather than reading the one below.
 */
function announce(state: PracticeState): PracticeState {
  const block = currentBlock(state)
  if (!block || block.closed || block.type !== 'true-false') return state
  const topIndex = block.questions.findIndex((entry) => entry.given === undefined)
  if (topIndex < 0 || block.questions[topIndex].announced) return state
  const questions = block.questions.map((entry, i) => (i === topIndex ? { ...entry, announced: true } : entry))
  return { ...withCurrentBlock(state, { ...block, questions }), speech: speechOf(block.questions[topIndex].question) }
}

/**
 * Pairs a word of the current word-matching Block with a meaning, both given by their Question's index
 * in the Block. A pair either one was in comes apart. Once every word is paired, the Block is scored.
 */
export function pair(state: PracticeState, word: number, meaning: number): PracticeState {
  const block = currentBlock(state)
  if (block.closed || block.type !== 'word-matching') return state
  const questions = block.questions.map((entry, i) =>
    i === word ? { ...entry, paired: meaning } : entry.paired === meaning ? { ...entry, paired: undefined } : entry,
  )
  return closeBlock(withCurrentBlock(state, { ...block, questions }))
}

/** Takes the pair of a word of the current word-matching Block apart; a scored Block ignores it. */
export function unpair(state: PracticeState, word: number): PracticeState {
  const block = currentBlock(state)
  if (block.closed || block.type !== 'word-matching') return state
  const questions = block.questions.map((entry, i) => (i === word ? { ...entry, paired: undefined } : entry))
  return withCurrentBlock(state, { ...block, questions })
}

const isFullyPaired = (block: Block) => block.questions.every((entry) => entry.paired !== undefined)

/**
 * Closes and scores the current Block; after the last one the Practice has its Result.
 * A word-matching Block closes only once every word is paired.
 */
export function closeBlock(state: PracticeState): PracticeState {
  const block = currentBlock(state)
  if (block.closed || (block.type === 'word-matching' && !isFullyPaired(block))) return state
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
  const questions = block.questions.map((entry, i) => ({
    ...entry,
    correct: block.type === 'word-matching' ? entry.paired === i : entry.given === entry.question.answer[0],
  }))
  const allCorrect = questions.every((entry) => entry.correct)
  return withCurrentBlock(state, { ...block, questions, closed: true, allCorrect })
}

/** Moves on from a closed Block to the next one, or to the summary once the Practice has its Result. */
export function next(state: PracticeState): PracticeState {
  if (!currentBlock(state).closed) return state
  if (state.result) return { ...state, finished: true }
  return announce({ ...state, blockIndex: state.blockIndex + 1 })
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
 * from the usable types only. An English or Hungarian word is shown only once, so a word-matching
 * Question repeating an earlier pick's word is left out. A word-matching Block needs at least 2 pairs, so a lonely
 * word-matching Question is swapped for another playable Question of the range, or left out if there is none.
 */
function select({ questions, settings, random }: PracticeInput): PracticeQuestion[] {
  const counts: Partial<Record<QuestionType, number>> = {}
  for (const { type } of questions) counts[type] = (counts[type] ?? 0) + 1
  const types = usableTypes(counts)
  const candidates = withoutRepeatedWords(
    shuffle(
      questions.filter((question) => types.includes(question.type)),
      random,
    ),
  )
  const selected = candidates.slice(0, settings.max_questions)
  const wordMatching = selected.filter((question) => question.type === 'word-matching')
  if (wordMatching.length !== 1) return selected
  const others = selected.filter((question) => question !== wordMatching[0])
  const swap = candidates.slice(settings.max_questions).find((question) => question.type !== 'word-matching')
  return swap ? [...others, swap] : others
}

/** Keeps the first word-matching Question of each English and each Hungarian word, ignoring case and surrounding spaces. */
function withoutRepeatedWords(questions: PracticeQuestion[]): PracticeQuestion[] {
  const seen = new Set<string>()
  const normalized = (word: string) => word.trim().toLowerCase()
  return questions.filter((question) => {
    if (question.type !== 'word-matching') return true
    const english = `en:${normalized(question.text)}`
    const hungarian = `hu:${normalized(question.answer[0])}`
    if (seen.has(english) || seen.has(hungarian)) return false
    seen.add(english).add(hungarian)
    return true
  })
}

/**
 * Groups the selected Questions into same-type Blocks of a whole Block's size; the last of a type may be
 * shorter. A word-matching Block needs at least 2 pairs, so a single pair left over takes one more from the
 * Block before it. Each next Block's type is picked at random, weighted by the Questions left of each type.
 */
function toBlocks(questions: PracticeQuestion[], random: () => number): Block[] {
  const queues = (Object.entries(blockSizes) as [QuestionType, number][]).map(([type, size]) => {
    const ofType = questions.filter((question) => question.type === type)
    const sizes = Array.from({ length: Math.ceil(ofType.length / size) }, (_, i) => Math.min(size, ofType.length - i * size))
    if (type === 'word-matching' && sizes.length > 1 && sizes.at(-1) === 1) {
      sizes[sizes.length - 2]--
      sizes[sizes.length - 1]++
    }
    let offset = 0
    return sizes.map((count): Block => {
      const block: Block = { type, questions: ofType.slice(offset, offset + count).map((question) => ({ question })), closed: false }
      if (type === 'word-matching') block.meaningOrder = shuffledApart([...block.questions.keys()], random)
      offset += count
      return block
    })
  })

  const blocks: Block[] = []
  const left = (queue: Block[]) => queue.reduce((sum, block) => sum + block.questions.length, 0)
  for (let total = questions.length; total > 0; ) {
    let pick = random() * total
    const queue = queues.find((q) => (pick -= left(q)) < 0) ?? queues.findLast((q) => q.length > 0)!
    const block = queue.shift()!
    blocks.push(block)
    total -= block.questions.length
  }
  return blocks
}

/** Shuffles the indices so that the order always differs from the original one, rotating it if the draw left it in place. */
function shuffledApart(indices: number[], random: () => number): number[] {
  const order = shuffle(indices, random)
  return order.every((index, i) => index === indices[i]) ? [...order.slice(1), order[0]] : order
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
