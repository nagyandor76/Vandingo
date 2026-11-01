// Reads an uploaded Quiz file (specification 4.2) into what the Quiz save needs; the server does the real check.

import type { Question } from '../api.ts'

export type QuizFile =
  | { ok: true; difficulty: number; quiz: { name: string | null; default_time: number | null; questions: Question[] } }
  | { ok: false; message: string }

const fail = (message: string): QuizFile => ({ ok: false, message })

/**
 * The file's text as the Difficulty to save at and the Quiz to save. The file's own `subject` is ignored: the Quiz
 * goes to the selected Subject. Only a file the server could not even read is refused here; anything else
 * missing or wrong is left to the server's check, which reports it by row and field.
 */
export function readQuizFile(text: string): QuizFile {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return fail('A fájl nem érvényes JSON.')
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return fail('A fájl nem kvíz: a JSON-nak egy objektumnak kell lennie.')
  }
  const file = json as Record<string, unknown>
  if (typeof file.difficulty !== 'number' || !Number.isInteger(file.difficulty)) {
    return fail('A fájlból hiányzik a szint (difficulty), vagy nem egész szám.')
  }
  return {
    ok: true,
    difficulty: file.difficulty,
    quiz: {
      name: typeof file.name === 'string' ? file.name : null,
      default_time: typeof file.default_time === 'number' ? file.default_time : null,
      questions: Array.isArray(file.questions) ? (file.questions as Question[]) : [],
    },
  }
}
