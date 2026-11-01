import { describe, expect, it } from 'vitest'
import { quizNamesOf, rangeLabel, namesLabel } from './resultLabels'

const quizzes = [
  { difficulty: 3, name: 'Ókor' },
  { difficulty: 4, name: 'Középkor' },
  { difficulty: 5, name: 'Újkor' },
]

describe('rangeLabel', () => {
  it('shows a range of levels', () => expect(rangeLabel(3, 5)).toBe('3–5. szint'))
  it('shows one level as one number', () => expect(rangeLabel(3, 3)).toBe('3. szint'))
})

describe('quizNamesOf', () => {
  it('takes the names of the first and the last level', () => {
    expect(quizNamesOf(quizzes, 3, 5)).toEqual({ quizNameFrom: 'Ókor', quizNameTo: 'Újkor' })
  })
  it('gives the same name at both ends for a single level', () => {
    expect(quizNamesOf(quizzes, 4, 4)).toEqual({ quizNameFrom: 'Középkor', quizNameTo: 'Középkor' })
  })
  it('leaves out a name it cannot find', () => {
    expect(quizNamesOf(quizzes, 1, 4)).toEqual({ quizNameTo: 'Középkor' })
  })
})

describe('namesLabel', () => {
  it('joins the two names', () => expect(namesLabel('Ókor', 'Középkor')).toBe('Ókor – Középkor'))
  it('shows one name for a single level', () => expect(namesLabel('Ókor', 'Ókor')).toBe('Ókor'))
  it('is empty for old Results without names', () => expect(namesLabel(undefined, undefined)).toBe(''))
  it('shows the one name there is', () => expect(namesLabel('Ókor', undefined)).toBe('Ókor'))
})
