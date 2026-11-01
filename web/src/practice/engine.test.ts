import { describe, expect, it } from 'vitest'
import { startPractice, type PracticeQuestion } from './engine'

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
