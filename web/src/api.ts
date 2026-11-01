// Thin client for the backend's /api endpoints.

import type { QuestionType } from './practice/engine.ts'

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
