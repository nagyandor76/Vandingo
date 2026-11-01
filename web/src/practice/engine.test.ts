import { describe, expect, it } from 'vitest'
import { startPractice, usableTypes, type PracticeQuestion } from './engine'

const trueFalse = (text: string, time: number): PracticeQuestion => ({
  type: 'true-false',
  text,
  answer: ['true'],
  time,
})

const fixedRandom = () => 0
const fixedClock = () => 0

describe('Practice engine', () => {
  it('runs one shared countdown: the sum of the selected Questions’ time', () => {
    const state = startPractice({
      questions: [trueFalse('A', 10), trueFalse('B', 14), trueFalse('C', 6)],
      settings: { max_questions: 20, auto_advance: false },
      random: fixedRandom,
      clock: fixedClock,
    })

    expect(state.timeLimitSeconds).toBe(30)
    expect(state.remainingSeconds).toBe(30)
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
