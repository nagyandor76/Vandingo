import { describe, expect, it } from 'vitest'
import { readQuizFile } from './upload'

const question = { type: 'true-false', text: 'Athén Görögországban van.', answer: ['true'] }
const file = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({ name: 'Görögök', subject: 'history', difficulty: 3, default_time: 10, questions: [question], ...overrides })

describe('readQuizFile', () => {
  it('gives the Difficulty from the file and the Quiz to save', () => {
    expect(readQuizFile(file())).toEqual({
      ok: true,
      difficulty: 3,
      quiz: { name: 'Görögök', default_time: 10, questions: [question] },
    })
  })

  it("ignores the file's subject", () => {
    const result = readQuizFile(file({ subject: 'geography' }))
    expect(result.ok && result.quiz).toEqual({ name: 'Görögök', default_time: 10, questions: [question] })
  })

  it('reports text that is not JSON', () => {
    expect(readQuizFile('ez nem json')).toEqual({ ok: false, message: 'A fájl nem érvényes JSON.' })
  })

  it.each([['null'], ['[1, 2]'], ['"szöveg"'], ['42']])('reports JSON that is not a Quiz object: %s', (text) => {
    expect(readQuizFile(text)).toEqual({ ok: false, message: 'A fájl nem kvíz: a JSON-nak egy objektumnak kell lennie.' })
  })

  it.each([[undefined], [null], ['3'], [2.5], [true]])('reports a missing or non-integer difficulty: %s', (difficulty) => {
    const text = JSON.stringify({ name: 'x', default_time: 10, questions: [question], difficulty })
    expect(readQuizFile(text)).toEqual({ ok: false, message: 'A fájlból hiányzik a szint (difficulty), vagy nem egész szám.' })
  })

  it("leaves what is missing or of the wrong kind to the server's check", () => {
    const result = readQuizFile(JSON.stringify({ difficulty: 5, name: 7, default_time: 'sok', questions: 'nincs' }))
    expect(result).toEqual({ ok: true, difficulty: 5, quiz: { name: null, default_time: null, questions: [] } })
  })
})
