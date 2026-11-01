// The Editor's grid rows: one Question per row, its lists as `;`-separated text in one cell.

import type { Question, ValidationError } from '../api.ts'
import type { QuestionType } from '../practice/engine.ts'

export const questionTypes: { type: QuestionType; label: string }[] = [
  { type: 'true-false', label: 'Igaz–hamis' },
  { type: 'word-matching', label: 'Szópárosítás' },
  { type: 'multiple-choice', label: 'Feleletválasztós' },
  { type: 'ordered', label: 'Sorrendező' },
]

/** Speech languages offered in the grid; '' means no reading aloud. */
export const speechLanguages = ['', 'en-GB', 'en-US', 'hu-HU']

export interface EditorRow {
  /** Stable while the Editor is open, so errors stay on their row when rows are added or deleted. */
  id: number
  type: QuestionType
  text: string
  options: string
  answer: string
  time: number | null
  speak_text: string
  speak_answer: string
  /** Why the server refused this row at the last save. */
  error?: ValidationError
}

/** A `;`-separated cell as a list: items trimmed, empty ones dropped. */
export const splitList = (cell: string) =>
  cell
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item !== '')

export const joinList = (items: string[] | undefined) => (items ?? []).join('; ')

let nextId = 1

export const emptyRow = (type: QuestionType = 'true-false'): EditorRow => ({
  id: nextId++,
  type,
  text: '',
  options: '',
  answer: type === 'true-false' ? 'true' : '',
  time: null,
  speak_text: '',
  speak_answer: '',
})

export const toRow = (question: Question): EditorRow => ({
  id: nextId++,
  type: question.type,
  text: question.text,
  options: joinList(question.options),
  answer: joinList(question.answer),
  time: question.time ?? null,
  speak_text: question.speak_text ?? '',
  speak_answer: question.speak_answer ?? '',
})

export const toQuestion = (row: EditorRow): Question => ({
  type: row.type,
  text: row.text.trim(),
  ...(row.options.trim() && { options: splitList(row.options) }),
  answer: splitList(row.answer),
  ...(row.time !== null && { time: row.time }),
  ...(row.speak_text && { speak_text: row.speak_text }),
  ...(row.speak_answer && { speak_answer: row.speak_answer }),
})
