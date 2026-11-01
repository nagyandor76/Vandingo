// The Practice engine: the rules of one Practice, independent of the UI.
// Screens only render the state it returns and forward the Participant's actions.

export type QuestionType = 'true-false' | 'word-matching' | 'multiple-choice' | 'ordered'

/** A Question as served for a Practice, its `time` already resolved against the Quiz default. */
export interface PracticeQuestion {
  type: QuestionType
  text: string
  options?: string[]
  answer: string[]
  time: number
  speak_text?: string
  speak_answer?: string
}

export interface SubjectSettings {
  max_questions: number
  auto_advance: boolean
}

export interface PracticeInput {
  questions: PracticeQuestion[]
  settings: SubjectSettings
  /** Returns a number in [0, 1), like Math.random. */
  random: () => number
  /** Returns the current time in milliseconds, like Date.now. */
  clock: () => number
}

export interface PracticeState {
  timeLimitSeconds: number
  remainingSeconds: number
}

export function startPractice(input: PracticeInput): PracticeState {
  const timeLimitSeconds = input.questions.reduce((sum, question) => sum + question.time, 0)
  return { timeLimitSeconds, remainingSeconds: timeLimitSeconds }
}
