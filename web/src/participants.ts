/** The fixed set of people who play quizzes. */
export const participants = ['Janka', 'Vanda', 'Gréta', 'János'] as const

export type Participant = (typeof participants)[number]
