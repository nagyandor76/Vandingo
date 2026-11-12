import { describe, expect, it } from 'vitest'
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
  usableTypes,
  type PracticeInput,
  type PracticeQuestion,
  type PracticeState,
  type TrueFalseAnswer,
} from './engine'

const trueFalse = (text: string, time = 10, answer = 'true'): PracticeQuestion => ({
  type: 'true-false',
  text,
  answer: [answer],
  time,
})

const statements = (count: number) => Array.from({ length: count }, (_, i) => trueFalse(`Állítás ${i + 1}`))

const fixedRandom = () => 0

/** A repeatable random source (mulberry32), for checking a rule over many different draws. */
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const seeds = Array.from({ length: 50 }, (_, i) => i + 1)

/** A clock the test moves forward by hand. */
function manualClock() {
  let now = 0
  return { clock: () => now, advance: (seconds: number) => (now += seconds * 1000) }
}

const start = (questions: PracticeQuestion[], overrides: Partial<PracticeInput> = {}) =>
  startPractice({
    questions,
    settings: { max_questions: 20, auto_advance: false },
    random: fixedRandom,
    clock: () => 0,
    ...overrides,
  })

const wordPair = (english: string, hungarian: string, time = 10): PracticeQuestion => ({
  type: 'word-matching',
  text: english,
  answer: [hungarian],
  time,
})

const fruits: [string, string][] = [
  ['apple', 'alma'],
  ['pear', 'körte'],
  ['plum', 'szilva'],
  ['grape', 'szőlő'],
  ['melon', 'dinnye'],
  ['cherry', 'cseresznye'],
  ['peach', 'barack'],
  ['lemon', 'citrom'],
  ['orange', 'narancs'],
  ['fig', 'füge'],
  ['date', 'datolya'],
]

const words = (count: number) => fruits.slice(0, count).map(([english, hungarian]) => wordPair(english, hungarian))

/** Taps a word, then a meaning. */
const pairByTaps = (state: PracticeState, word: number, meaning: number) => tap(tap(state, 'word', word), 'meaning', meaning)

const pairing = (state: PracticeState) => currentBlock(state).questions.map((entry) => entry.paired)

const shownTexts = (state: PracticeState) => state.blocks.flatMap((block) => block.questions.map((entry) => entry.question.text))

describe('Practice engine', () => {
  it('runs one shared countdown: the sum of the selected Questions’ time', () => {
    const state = start([trueFalse('A', 10), trueFalse('B', 14), trueFalse('C', 6)])

    expect(state.timeLimitSeconds).toBe(30)
    expect(state.remainingSeconds).toBe(30)
  })

  it('selects at most the Subject’s max_questions, without repetition', () => {
    const state = start(statements(10), { settings: { max_questions: 4, auto_advance: false } })

    const texts = shownTexts(state)
    expect(texts).toHaveLength(4)
    expect(new Set(texts).size).toBe(4)
  })

  it('selects every Question when the range holds fewer than the maximum', () => {
    const state = start(statements(5))

    expect(shownTexts(state).sort()).toEqual(['Állítás 1', 'Állítás 2', 'Állítás 3', 'Állítás 4', 'Állítás 5'])
  })

  it('selects only playable types, and only those that fill a whole Block in the range', () => {
    const others: PracticeQuestion[] = [
      { type: 'multiple-choice', text: 'Melyek városok?', options: ['Théba', 'Róma'], answer: ['Théba'], time: 10 },
      { type: 'ordered', text: 'Sorrend', options: ['a', 'b'], answer: ['a', 'b'], time: 10 },
    ]

    expect(shownTexts(start([...statements(3), ...others])).sort()).toEqual(['Állítás 1', 'Állítás 2', 'Állítás 3'])
    expect(shownTexts(start([...statements(2), ...others]))).toEqual([])
  })

  it('forms Blocks of 3 statements; the last one may be shorter', () => {
    const state = start(statements(8))

    expect(state.blocks.map((block) => block.questions.length)).toEqual([3, 3, 2])
  })

  it('scores a closed Block: a matching answer is correct, a wrong or missing one is not', () => {
    let state = start([trueFalse('A', 10, 'true'), trueFalse('B', 10, 'false'), trueFalse('C', 10, 'true')])
    const textAt = (i: number) => currentBlock(state).questions[i].question.text
    const answerFor = (text: string, right: boolean): TrueFalseAnswer =>
      ((text === 'B') === right ? 'false' : 'true')

    state = answer(state, 0, answerFor(textAt(0), true))
    state = answer(state, 1, answerFor(textAt(1), false))
    state = closeBlock(state)

    expect(currentBlock(state).closed).toBe(true)
    expect(currentBlock(state).questions.map((entry) => entry.correct)).toEqual([true, false, false])
  })

  it('keeps a closed answer unchanged', () => {
    let state = start(statements(3))
    state = answer(state, 0, 'false')
    state = closeBlock(state)
    state = answer(state, 0, 'true')
    state = answer(state, 1, 'true')

    expect(currentBlock(state).questions.map((entry) => [entry.given, entry.correct])).toEqual([
      ['false', false],
      [undefined, false],
      [undefined, false],
    ])
  })

  it('finishes after the last Block, with the time elapsed until it was scored', () => {
    const { clock, advance } = manualClock()
    let state = start(statements(4), { clock })

    for (const i of [0, 1, 2]) state = answer(state, i, 'true')
    advance(7)
    state = closeBlock(state)
    expect(state.result).toBeUndefined()
    state = next(state)

    state = answer(state, 0, 'false')
    advance(5)
    state = closeBlock(state)
    advance(30)
    state = next(state)

    expect(state.finished).toBe(true)
    expect(state.result).toEqual({
      total: 4,
      correct: 3,
      incorrect: 1,
      scorePercent: 75,
      timeLimitSeconds: 40,
      elapsedSeconds: 12,
    })
  })

  it('counts the shared countdown down as time passes', () => {
    const { clock, advance } = manualClock()
    let state = start(statements(3), { clock })

    advance(4.2)
    state = tick(state)

    expect(state.remainingSeconds).toBe(26)
    expect(state.result).toBeUndefined()
  })

  it('when time runs out, scores the current Block and counts every Question not yet shown as wrong', () => {
    const { clock, advance } = manualClock()
    let state = start(statements(9), { clock })
    for (const i of [0, 1, 2]) state = answer(state, i, 'true')
    state = closeBlock(state)
    state = next(state)
    state = answer(state, 1, 'true')

    advance(95)
    state = tick(state)

    expect(state.remainingSeconds).toBe(0)
    expect(currentBlock(state).closed).toBe(true)
    expect(currentBlock(state).questions.map((entry) => entry.correct)).toEqual([false, true, false])
    expect(state.result).toEqual({
      total: 9,
      correct: 4,
      incorrect: 5,
      scorePercent: 44,
      timeLimitSeconds: 90,
      elapsedSeconds: 90,
    })
    expect(next(state).finished).toBe(true)
  })

  it('is Passed only with every Question correct: 100%', () => {
    let state = start(statements(3))
    for (const i of [0, 1, 2]) state = answer(state, i, 'true')
    state = closeBlock(state)

    expect(state.result?.scorePercent).toBe(100)
    expect(isPassed(state.result!)).toBe(true)

    state = start(statements(3))
    for (const i of [0, 1]) state = answer(state, i, 'true')
    state = closeBlock(state)

    expect(state.result?.scorePercent).toBe(66)
    expect(isPassed(state.result!)).toBe(false)
  })

  it('moves on only from a closed Block', () => {
    let state = start(statements(6))
    state = next(state)

    expect(state.blockIndex).toBe(0)
  })
})

describe('word-matching in a Practice', () => {
  it('shows word-matching Questions in Blocks of at most 5 pairs', () => {
    const state = start(words(10))

    expect(state.blocks.map((block) => [block.type, block.questions.length])).toEqual([
      ['word-matching', 5],
      ['word-matching', 5],
    ])
  })

  it('shows the meanings in a column of their own, never in the order of the words', () => {
    for (const seed of seeds) {
      // 7 pairs: Blocks of 5 and 2.
      for (const block of start(words(7), { random: seededRandom(seed) }).blocks) {
        const order = block.meaningOrder!
        const inWordOrder = [...block.questions.keys()]
        expect([...order].sort()).toEqual(inWordOrder)
        expect(order).not.toEqual(inWordOrder)
      }
    }
  })

  it('never forms a word-matching Block of a single pair: the last Block takes one from the Block before it', () => {
    const pairCounts = (count: number) => start(words(count)).blocks.map((block) => block.questions.length)

    expect(pairCounts(6)).toEqual([4, 2])
    expect(pairCounts(11)).toEqual([5, 4, 2])
    expect(pairCounts(7)).toEqual([5, 2])
  })

  it('shows an English or Hungarian word only once in a Practice, whatever its case or surrounding spaces', () => {
    const repeats = [wordPair('Apple ', 'almafa'), wordPair('coast', 'part'), wordPair('shore', 'Part'), wordPair('pip', 'körte')]
    const normalized = (word: string) => word.trim().toLowerCase()

    for (const seed of seeds) {
      const pairs = start([...words(5), ...repeats], { random: seededRandom(seed) }).blocks.flatMap((block) =>
        block.questions.map((entry) => entry.question),
      )

      const english = pairs.map((pair) => normalized(pair.text))
      const hungarian = pairs.map((pair) => normalized(pair.answer[0]))
      expect(new Set(english).size).toBe(english.length)
      expect(new Set(hungarian).size).toBe(hungarian.length)
      expect(pairs).toHaveLength(6)
    }
  })

  it('picks each next Block’s type at random, weighted by the Questions left of each type', () => {
    const blockTypes = (questions: PracticeQuestion[], random: number) =>
      start(questions, { random: () => random }).blocks.map((block) => block.type)

    // 3 statements and 5 pairs left: true–false comes first with a chance of 3/8.
    expect(blockTypes([...statements(3), ...words(5)], 0.37)).toEqual(['true-false', 'word-matching'])
    expect(blockTypes([...statements(3), ...words(5)], 0.38)).toEqual(['word-matching', 'true-false'])
    // 6/11 for true–false first, then 3/8 once 3 statements and 5 pairs are left.
    expect(blockTypes([...statements(6), ...words(5)], 0.5)).toEqual(['true-false', 'word-matching', 'true-false'])
  })

  it('pairs a word and a meaning in two taps, starting on either side', () => {
    let state = start(words(5))
    state = tap(state, 'word', 0)
    expect(state.selection).toEqual({ side: 'word', index: 0 })
    state = tap(state, 'meaning', 2)
    state = tap(state, 'meaning', 1)
    state = tap(state, 'word', 3)

    expect(pairing(state)).toEqual([2, undefined, undefined, 1, undefined])
    expect(state.selection).toBeUndefined()
  })

  it('scores the Block pair by pair once every word is paired', () => {
    let state = start(words(5))
    for (const [word, meaning] of [[0, 0], [1, 2], [2, 1], [3, 3]]) state = pairByTaps(state, word, meaning)
    expect(currentBlock(state).closed).toBe(false)

    state = pairByTaps(state, 4, 4)

    expect(currentBlock(state).closed).toBe(true)
    expect(currentBlock(state).questions.map((entry) => entry.correct)).toEqual([true, false, false, true, true])
    expect(state.result).toMatchObject({ total: 5, correct: 3, incorrect: 2 })
  })

  it('cannot close a word-matching Block before every word is paired', () => {
    let state = pairByTaps(start(words(5)), 0, 0)

    state = closeBlock(state)

    expect(currentBlock(state).closed).toBe(false)
    expect(state.result).toBeUndefined()
  })

  it('takes a pair apart when either of its halves is tapped, even with the other side selected', () => {
    let state = pairByTaps(start(words(5)), 0, 1)
    state = tap(state, 'word', 0)
    expect(pairing(state)).toEqual([undefined, undefined, undefined, undefined, undefined])

    state = pairByTaps(state, 0, 1)
    state = tap(state, 'word', 2)
    state = tap(state, 'meaning', 1)
    expect(pairing(state)).toEqual([undefined, undefined, undefined, undefined, undefined])
    expect(state.selection).toBeUndefined()
  })

  it('selects again on the same side, and lets go of the selection when it is tapped again', () => {
    let state = tap(start(words(5)), 'word', 0)
    state = tap(state, 'word', 1)
    expect(state.selection).toEqual({ side: 'word', index: 1 })

    state = tap(state, 'word', 1)
    expect(state.selection).toBeUndefined()
  })

  it('lets go of a selection when time runs out', () => {
    const { clock, advance } = manualClock()
    let state = tap(start(words(5), { clock }), 'word', 0)

    advance(50)
    state = tick(state)

    expect(state.selection).toBeUndefined()
  })

  it('ignores taps once the Block is scored', () => {
    let state = start(words(5))
    for (const i of [0, 1, 2, 3, 4]) state = pairByTaps(state, i, i)
    state = tap(state, 'word', 4)

    expect(pairing(state)).toEqual([0, 1, 2, 3, 4])
    expect(state.selection).toBeUndefined()
  })

  it('when time runs out mid-Block, scores the pairs made and counts the unpaired words as wrong', () => {
    const { clock, advance } = manualClock()
    let state = start(words(7), { clock })
    state = pairByTaps(state, 0, 0)
    state = pairByTaps(state, 1, 2)
    state = pairByTaps(state, 3, 3)

    advance(70)
    state = tick(state)

    expect(currentBlock(state).closed).toBe(true)
    expect(currentBlock(state).questions.map((entry) => entry.correct)).toEqual([true, false, false, true, false])
    expect(state.result).toMatchObject({ total: 7, correct: 2, incorrect: 5, elapsedSeconds: 70 })
  })

  it('swaps a lonely word-matching Question for another playable Question of the range', () => {
    for (const seed of seeds) {
      const state = start([...statements(5), ...words(5)], {
        settings: { max_questions: 4, auto_advance: false },
        random: seededRandom(seed),
      })

      const types = state.blocks.flatMap((block) => block.questions.map((entry) => entry.question.type))
      expect(types).toHaveLength(4)
      expect(types.filter((type) => type === 'word-matching')).not.toHaveLength(1)
    }
  })
})

describe('usable types of a range', () => {
  it('keeps a playable type only if it fills a whole Block: 3 true–false or 5 word-matching Questions', () => {
    expect(usableTypes({ 'true-false': 3, 'word-matching': 5 })).toEqual(['true-false', 'word-matching'])
    expect(usableTypes({ 'true-false': 2, 'word-matching': 5 })).toEqual(['word-matching'])
    expect(usableTypes({ 'true-false': 3, 'word-matching': 4 })).toEqual(['true-false'])
  })

  it('never keeps a type that is not playable, and leaves nothing to start when no Block fills up', () => {
    expect(usableTypes({ 'multiple-choice': 10, ordered: 10 })).toEqual([])
    expect(usableTypes({ 'true-false': 2, 'word-matching': 4 })).toEqual([])
  })
})

describe('reading aloud and Block scoring signals', () => {
  /** Shuffles nothing, so the Questions keep the order they are given in. */
  const inOrder = () => 0.999999
  const spoken = (text: string): PracticeQuestion => ({ ...trueFalse(text), speak_text: 'hu-HU' })

  it('reads aloud the topmost unanswered statement, each one at most once', () => {
    let state = start([spoken('A'), spoken('B'), spoken('C')], { random: inOrder })
    expect(state.speech).toMatchObject({ text: 'A', lang: 'hu-HU' })
    const first = state.speech

    state = answer(state, 1, 'true')
    expect(state.speech).toBe(first)

    state = answer(state, 0, 'true')
    expect(state.speech).toMatchObject({ text: 'C', lang: 'hu-HU' })
    const third = state.speech

    state = answer(state, 0, 'false')
    state = answer(state, 2, 'true')
    expect(state.speech).toBe(third)
  })

  it('stays silent when the topmost unanswered statement has no speak_text, never reading the one below', () => {
    let state = start([spoken('A'), trueFalse('B'), spoken('C')], { random: inOrder })

    state = answer(state, 0, 'true')
    expect(state.speech).toBeUndefined()

    state = answer(state, 2, 'true')
    expect(state.speech).toBeUndefined()
  })

  it('reads aloud the first statement of the next Block once the Participant moves on', () => {
    let state = start([spoken('A'), spoken('B'), spoken('C'), spoken('D')], { random: inOrder })

    state = next(closeBlock(state))
    expect(state.speech).toMatchObject({ text: 'D' })
  })

  it('reads nothing aloud in a word-matching Block', () => {
    const state = start(words(5).map((question) => ({ ...question, speak_text: 'en-GB' })))

    expect(state.speech).toBeUndefined()
  })

  it('reads an English word aloud each time it is tapped, but never its Hungarian meaning', () => {
    let state = start(
      words(5).map((question) => ({ ...question, speak_text: 'en-GB' })),
      { random: inOrder },
    )

    state = tap(state, 'word', 0)
    const first = state.speech
    expect(first).toEqual({ text: 'apple', lang: 'en-GB' })

    state = tap(state, 'word', 0)
    expect(state.speech).toEqual(first)
    expect(state.speech).not.toBe(first)

    const before = state.speech
    state = tap(state, 'meaning', 3)
    expect(state.speech).toBe(before)
  })

  it('reads nothing when a word is tapped in a scored Block', () => {
    let state = start(words(5).map((question) => ({ ...question, speak_text: 'en-GB' })))
    for (const i of [0, 1, 2, 3, 4]) state = pairByTaps(state, i, i)
    const before = state.speech

    state = tap(state, 'word', 0)

    expect(state.speech).toBe(before)
  })

  it('reads a statement aloud again on request, even once its Block is scored', () => {
    let state = start([spoken('A'), spoken('B'), trueFalse('C')], { random: inOrder })
    state = closeBlock(state)

    state = readAloud(state, 1)
    const again = state.speech
    expect(again).toEqual({ text: 'B', lang: 'hu-HU' })
    state = readAloud(state, 1)
    expect(state.speech).not.toBe(again)

    state = readAloud(state, 2)
    expect(state.speech).toEqual({ text: 'B', lang: 'hu-HU' })
  })

  it('tells whether every answer of a scored Block was correct', () => {
    let state = start(statements(6), { random: inOrder })
    expect(currentBlock(state).allCorrect).toBeUndefined()

    for (const i of [0, 1, 2]) state = answer(state, i, 'true')
    state = closeBlock(state)
    expect(currentBlock(state).allCorrect).toBe(true)

    state = next(state)
    state = answer(state, 0, 'false')
    state = closeBlock(state)
    expect(currentBlock(state).allCorrect).toBe(false)
  })

  it('tells whether every pair of a scored word-matching Block was correct', () => {
    const pairAll = (meanings: number[]) => meanings.reduce((state, meaning, word) => pairByTaps(state, word, meaning), start(words(5)))

    expect(currentBlock(pairAll([0, 1, 2, 3, 4])).allCorrect).toBe(true)
    expect(currentBlock(pairAll([1, 0, 2, 3, 4])).allCorrect).toBe(false)
  })
})
