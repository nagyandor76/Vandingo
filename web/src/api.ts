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
