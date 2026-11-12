import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSubject, saveQuiz } from './api.ts'

/** Answers every request with this status and JSON body. */
function answerWith(status: number, body?: unknown) {
  vi.stubGlobal('fetch', async () => new Response(body === undefined ? null : JSON.stringify(body), { status }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const quiz = { name: 'Egyiptom', default_time: 14, questions: [] }

describe('saving a Quiz', () => {
  it('names the Quizzes occupying the Difficulty, as the server tells them', async () => {
    answerWith(409, { occupied: [{ subject: 'history', difficulty: 3, name: 'Ókor' }] })

    expect(await saveQuiz('history', 3, quiz)).toEqual({
      status: 'occupied',
      occupied: [{ subject: 'history', difficulty: 3, name: 'Ókor' }],
    })
  })

  it('tells a Subject that is not there', async () => {
    answerWith(404)

    expect(await saveQuiz('nosuch', 3, quiz)).toEqual({ status: 'notFound' })
  })

  it('gives the reasons a Quiz is invalid', async () => {
    answerWith(400, { errors: [{ field: 'name', message: 'Kötelező.' }] })

    expect(await saveQuiz('history', 3, quiz)).toEqual({ status: 'invalid', errors: [{ field: 'name', message: 'Kötelező.' }] })
  })
})

describe('creating a Subject', () => {
  it('is occupied, with no Quizzes named, when the key is taken', async () => {
    answerWith(409)

    expect(await createSubject('history', 'Történelem')).toEqual({ status: 'occupied', occupied: [] })
  })
})
