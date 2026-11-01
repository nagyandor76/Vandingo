/** "3–5. szint", or "3. szint" for a single level. */
export const rangeLabel = (from: number, to: number) => (from === to ? `${from}. szint` : `${from}–${to}. szint`)

/** The names of the Quizzes at both ends of the range, as they are now; an end with no Quiz gets no name. */
export function quizNamesOf(quizzes: { difficulty: number; name: string }[], from: number, to: number) {
  const nameOf = (difficulty: number) => quizzes.find((quiz) => quiz.difficulty === difficulty)?.name
  const quizNameFrom = nameOf(from)
  const quizNameTo = nameOf(to)
  return {
    ...(quizNameFrom !== undefined && { quizNameFrom }),
    ...(quizNameTo !== undefined && { quizNameTo }),
  }
}

/** "Ókor – Középkor", one name when both ends are the same, empty for a Result without names. */
export function namesLabel(from?: string, to?: string) {
  if (from && to && from !== to) return `${from} – ${to}`
  return from || to || ''
}
