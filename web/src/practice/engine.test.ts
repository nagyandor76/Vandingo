import { describe, expect, it } from 'vitest'
import {
  answer,
  closeBlock,
  currentBlock,
  isPassed,
  next,
  startPractice,
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

  it('leaves word-matching Questions out for now', () => {
    const words = ['apple', 'pear', 'plum', 'grape', 'melon'].map(
      (text): PracticeQuestion => ({ type: 'word-matching', text, answer: [text], time: 10 }),
    )

    expect(shownTexts(start([...statements(3), ...words])).sort()).toEqual(['Állítás 1', 'Állítás 2', 'Állítás 3'])
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
