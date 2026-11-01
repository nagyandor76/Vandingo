// Thin client for the backend's /api endpoints.

import type { PracticeQuestion, PracticeResult, QuestionType } from './practice/engine.ts'

export interface Subject {
  key: string
  name: string
  max_questions: number
  auto_advance: boolean
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`${path}: ${response.status}`)
  return (await response.json()) as T
}

export const fetchSubjects = () => getJson<Subject[]>('/api/subjects')

/** What the Difficulty pickers need to know about a Quiz. */
export interface QuizSummary {
  difficulty: number
  name: string
  /** Question count by question type; types without Questions are missing. */
  question_counts: Partial<Record<QuestionType, number>>
}

export const fetchQuizzes = (subject: string) =>
  getJson<QuizSummary[]>(`/api/subjects/${encodeURIComponent(subject)}/quizzes`)

/** Every Question of a Subject's Difficulty range, both ends included. */
export const fetchQuestions = (subject: string, from: number, to: number) =>
  getJson<PracticeQuestion[]>(`/api/subjects/${encodeURIComponent(subject)}/questions?from=${from}&to=${to}`)

/** A Result as submitted; the server adds its id and completion time. */
export interface NewResult extends PracticeResult {
  participant: string
  subject: string
  difficultyFrom: number
  difficultyTo: number
}

export async function saveResult(result: NewResult): Promise<void> {
  const response = await fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  })
  if (!response.ok) throw new Error(`/api/results: ${response.status}`)
}

/** A saved Result: the summary of one finished Practice. */
export interface Result extends NewResult {
  id: string
  /** ISO date and time. */
  completedAt: string
}

/** The Participant's latest Results, whatever their Subject, newest first. */
export const fetchResults = (participant: string, limit: number) =>
  getJson<Result[]>(`/api/results?${new URLSearchParams({ participant, limit: String(limit) })}`)

export const fetchResult = (id: string) => getJson<Result>(`/api/results/${encodeURIComponent(id)}`)

/** Why something can't be saved; `row` is the Question's index, missing when the error is about the whole thing. */
export interface ValidationError {
  row?: number
  field: string
  message: string
}

/** How a save went: saved, rejected with the reasons, or rejected because the key or place is taken. */
export type SaveOutcome = { status: 'saved' } | { status: 'invalid'; errors: ValidationError[] } | { status: 'conflict' }

async function send(method: 'POST' | 'PUT', path: string, body: unknown): Promise<SaveOutcome> {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (response.ok) return { status: 'saved' }
  if (response.status === 400) {
    const { errors } = (await response.json()) as { errors?: ValidationError[] }
    if (errors) return { status: 'invalid', errors }
  }
  if (response.status === 409) return { status: 'conflict' }
  throw new Error(`${path}: ${response.status}`)
}

/** Creates a Subject with the default settings; its key can never change. */
export const createSubject = (key: string, name: string) => send('POST', '/api/subjects', { key, name })

export const saveSubjectSettings = (key: string, settings: Pick<Subject, 'max_questions' | 'auto_advance'>) =>
  send('PUT', `/api/subjects/${encodeURIComponent(key)}`, settings)

/** Downloads the whole data directory as a dated ZIP (a plain link, so it works on every device). */
export const exportUrl = '/api/export'

/** A Question as stored in its Quiz: `time` is missing when the Quiz default applies. */
export interface Question extends Omit<PracticeQuestion, 'time'> {
  time?: number
}

export interface Quiz {
  name: string
  subject: string
  difficulty: number
  default_time: number
  questions: Question[]
}

/** The Quiz at this Difficulty, or null if there is none. */
export async function fetchQuiz(subject: string, difficulty: number): Promise<Quiz | null> {
  const path = `/api/subjects/${encodeURIComponent(subject)}/quizzes/${difficulty}`
  const response = await fetch(path)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`${path}: ${response.status}`)
  return (await response.json()) as Quiz
}

/**
 * Writes the Quiz to its Difficulty, after the server has checked it. A Quiz moved from `originalDifficulty`
 * no longer stays there. If another Quiz is at the Difficulty, it is a conflict unless `overwrite`.
 */
export const saveQuiz = (
  subject: string,
  difficulty: number,
  // A missing name or default time is sent as null, so the server's check reports it.
  quiz: Pick<Quiz, 'questions'> & { name: string | null; default_time: number | null },
  { originalDifficulty, overwrite = false }: { originalDifficulty?: number; overwrite?: boolean } = {},
) => {
  const query = new URLSearchParams()
  if (originalDifficulty !== undefined) query.set('original_difficulty', String(originalDifficulty))
  if (overwrite) query.set('overwrite', 'true')
  const search = query.toString() ? `?${query}` : ''
  return send('PUT', `/api/subjects/${encodeURIComponent(subject)}/quizzes/${difficulty}${search}`, quiz)
}

/** Removes the Quiz at this Difficulty. */
export async function deleteQuiz(subject: string, difficulty: number): Promise<void> {
  const path = `/api/subjects/${encodeURIComponent(subject)}/quizzes/${difficulty}`
  const response = await fetch(path, { method: 'DELETE' })
  if (!response.ok) throw new Error(`${path}: ${response.status}`)
}
