import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NewResult, QuizSummary, Subject } from '../api.ts'
import type { PracticeQuestion } from './engine.ts'
import { createPractice, type Practice, type PracticeData } from './practice.ts'

const history: Subject = { key: 'history', name: 'Történelem', max_questions: 20, auto_advance: false }

const statement = (text: string, answer = 'true', speak_text?: string): PracticeQuestion => ({
  type: 'true-false',
  text,
  answer: [answer],
  time: 10,
  ...(speak_text && { speak_text }),
})

const statements = (count: number) => Array.from({ length: count }, (_, i) => statement(`Állítás ${i + 1}`))

const quizzes: QuizSummary[] = [
  { difficulty: 1, name: 'Ókor', question_counts: { 'true-false': 3 } },
  { difficulty: 2, name: 'Középkor', question_counts: { 'true-false': 3 } },
]

/** An in-memory stand-in for the backend; every saved Result is kept. */
function memoryData({
  subjects = [history],
  questions = statements(3),
  quizList = quizzes,
}: { subjects?: Subject[]; questions?: PracticeQuestion[]; quizList?: QuizSummary[] } = {}) {
  const saved: NewResult[] = []
  const data: PracticeData = {
    fetchSubjects: async () => subjects,
    fetchQuestions: async () => questions,
    fetchQuizzes: async () => quizList,
    saveResult: async (result) => {
      saved.push(result)
    },
  }
  return { data, saved }
}

/** Records what the Practice asked the audio port to do, in order. */
function recordingAudio() {
  const calls: string[] = []
  return {
    calls,
    audio: {
      speak: ({ text }: { text: string }) => calls.push(`speak ${text}`),
      stop: () => calls.push('stop'),
      playBlockSound: (allCorrect: boolean) => calls.push(`sound ${allCorrect ? 'correct' : 'wrong'}`),
    },
  }
}

/** Shuffles nothing, so the Questions keep the order they are given in. */
const inOrder = () => 0.999999

const choice = { participant: 'Vanda', subject: 'history', from: 1, to: 2 }

let practice: Practice | undefined

function open(data: PracticeData, audio = recordingAudio().audio) {
  practice = createPractice(choice, { data, audio, random: inOrder })
  return practice
}

/** Lets pending fetches and saves settle. */
const settle = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  practice?.dispose()
  practice = undefined
  vi.useRealTimers()
})

describe('loading a Practice', () => {
  it('starts once the Subject and its Questions are loaded', async () => {
    const p = open(memoryData().data)
    expect(p.getSnapshot()).toEqual({ phase: 'loading' })

    await settle()

    expect(p.getSnapshot()).toMatchObject({ phase: 'running', subjectName: 'Történelem', blockIndex: 0, blockCount: 1, remainingSeconds: 30 })
  })

  it('fails to load for an unknown Subject, or when the Questions cannot be fetched', async () => {
    const unknown = open(memoryData({ subjects: [] }).data)
    await settle()
    expect(unknown.getSnapshot()).toEqual({ phase: 'load-failed' })

    const { data } = memoryData()
    const broken = open({ ...data, fetchQuestions: () => Promise.reject(new Error('offline')) })
    await settle()
    expect(broken.getSnapshot()).toEqual({ phase: 'load-failed' })
  })

  it('is empty when the range has no playable Block', async () => {
    const p = open(memoryData({ questions: statements(2) }).data)
    await settle()

    expect(p.getSnapshot()).toEqual({ phase: 'empty' })
  })
})

describe('the shared countdown', () => {
  it('counts down as time passes', async () => {
    const p = open(memoryData().data)
    await settle()

    await vi.advanceTimersByTimeAsync(4200)

    expect(p.getSnapshot()).toMatchObject({ phase: 'running', remainingSeconds: 26 })
  })

  it('when time runs out, scores the Block and saves the Result exactly once', async () => {
    const { data, saved } = memoryData()
    const p = open(data)
    await settle()
    p.answer(0, 'true')

    await vi.advanceTimersByTimeAsync(30_000)
    await vi.advanceTimersByTimeAsync(60_000)

    expect(p.getSnapshot()).toMatchObject({ phase: 'running', remainingSeconds: 0, timedOut: true, resultReady: true, correctInBlock: 1 })
    expect(saved).toEqual([
      {
        participant: 'Vanda',
        subject: 'history',
        difficultyFrom: 1,
        difficultyTo: 2,
        quizNameFrom: 'Ókor',
        quizNameTo: 'Középkor',
        total: 3,
        correct: 1,
        incorrect: 2,
        scorePercent: 33,
        timeLimitSeconds: 30,
        elapsedSeconds: 30,
      },
    ])
  })
})

describe('the Result', () => {
  /** Answers every statement of the current Block with `true` and closes it. */
  const answerAllTrue = (p: Practice) => {
    for (const i of [0, 1, 2]) p.answer(i, 'true')
    p.close()
  }

  it('is saved as soon as the last Block is scored, and shown once the Participant moves on', async () => {
    const { data, saved } = memoryData()
    const p = open(data)
    await settle()

    answerAllTrue(p)
    expect(p.getSnapshot()).toMatchObject({ phase: 'running', resultReady: true, timedOut: false })
    await settle()
    expect(saved).toHaveLength(1)

    p.next()
    expect(p.getSnapshot()).toMatchObject({
      phase: 'finished',
      passed: true,
      saveStatus: 'saved',
      result: { total: 3, correct: 3, scorePercent: 100 },
    })
  })

  it('is not Passed unless every Question is correct', async () => {
    const p = open(memoryData().data)
    await settle()

    p.answer(0, 'false')
    p.close()
    p.next()

    expect(p.getSnapshot()).toMatchObject({ phase: 'finished', passed: false })
  })

  it('when saving fails, sends the same Result again on retry', async () => {
    const { data, saved } = memoryData()
    let fail = true
    const p = open({ ...data, saveResult: (result) => (fail ? Promise.reject(new Error('offline')) : data.saveResult(result)) })
    await settle()
    answerAllTrue(p)
    p.next()
    expect(p.getSnapshot()).toMatchObject({ phase: 'finished', saveStatus: 'saving' })
    await settle()
    expect(p.getSnapshot()).toMatchObject({ phase: 'finished', saveStatus: 'failed' })

    fail = false
    p.retrySave()
    await settle()

    expect(p.getSnapshot()).toMatchObject({ phase: 'finished', saveStatus: 'saved' })
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ participant: 'Vanda', correct: 3 })
  })

  it('left while saving, tells no one how the save went', async () => {
    const { data } = memoryData()
    const p = open({ ...data, saveResult: () => Promise.reject(new Error('offline')) })
    await settle()
    answerAllTrue(p)
    const listener = vi.fn()
    p.subscribe(listener)

    p.dispose()
    await settle()

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('sound', () => {
  const spokenStatements = [statement('A', 'true', 'hu-HU'), statement('B', 'true', 'hu-HU'), statement('C', 'true', 'hu-HU')]

  it('reads aloud each new topmost unanswered statement once', async () => {
    const { audio, calls } = recordingAudio()
    const p = open(memoryData({ questions: spokenStatements }).data, audio)
    await settle()
    expect(calls).toEqual(['speak A'])

    p.answer(1, 'true')
    p.answer(0, 'true')

    expect(calls).toEqual(['speak A', 'speak C'])
  })

  it('cuts off any reading and plays one sound when a Block is scored', async () => {
    const { audio, calls } = recordingAudio()
    const p = open(memoryData({ questions: [...spokenStatements, ...statements(3)] }).data, audio)
    await settle()
    calls.length = 0

    p.answer(0, 'false')
    p.close()
    p.close()

    expect(calls).toEqual(['speak B', 'stop', 'sound wrong'])
  })

  it('plays the Block sound when time runs out, too', async () => {
    const { audio, calls } = recordingAudio()
    open(memoryData().data, audio)
    await settle()

    await vi.advanceTimersByTimeAsync(31_000)

    expect(calls).toEqual(['stop', 'sound wrong'])
  })

  it('reads an English word when it is tapped, never its Hungarian meaning', async () => {
    const { audio, calls } = recordingAudio()
    const pairs = [['apple', 'alma'], ['pear', 'körte'], ['plum', 'szilva'], ['grape', 'szőlő'], ['melon', 'dinnye']]
    const p = open(
      memoryData({ questions: pairs.map(([text, meaning]) => ({ type: 'word-matching', text, answer: [meaning], time: 10, speak_text: 'en-GB' })) }).data,
      audio,
    )
    await settle()

    p.tap('word', 1)
    p.tap('meaning', 1)
    p.tap('word', 1)

    expect(calls).toEqual(['speak pear', 'speak pear'])
  })

  it('reads nothing when a word is tapped in a scored Block', async () => {
    const { audio, calls } = recordingAudio()
    const pairs = [['apple', 'alma'], ['pear', 'körte'], ['plum', 'szilva'], ['grape', 'szőlő'], ['melon', 'dinnye']]
    const p = open(
      memoryData({ questions: pairs.map(([text, meaning]) => ({ type: 'word-matching', text, answer: [meaning], time: 10, speak_text: 'en-GB' })) }).data,
      audio,
    )
    await settle()
    for (const i of [0, 1, 2, 3, 4]) {
      p.tap('word', i)
      p.tap('meaning', i)
    }
    calls.length = 0

    p.tap('word', 0)

    expect(calls).toEqual([])
  })

  it('reads a statement again when asked, even once its Block is scored', async () => {
    const { audio, calls } = recordingAudio()
    const p = open(memoryData({ questions: [...spokenStatements, ...statements(3)] }).data, audio)
    await settle()
    p.close()
    calls.length = 0

    p.readAloud(2)

    expect(calls).toEqual(['speak C'])
  })

  it('falls silent when the Practice is left, and when it reaches its summary', async () => {
    const left = recordingAudio()
    open(memoryData().data, left.audio).dispose()
    expect(left.calls).toEqual(['stop'])

    const finished = recordingAudio()
    const p = open(memoryData().data, finished.audio)
    await settle()
    p.close()
    finished.calls.length = 0
    p.next()
    expect(finished.calls).toEqual(['stop'])
  })
})

describe('auto_advance', () => {
  const autoHistory: Subject = { ...history, auto_advance: true }

  it('moves on from a scored Block after 2 seconds', async () => {
    const p = open(memoryData({ subjects: [autoHistory], questions: statements(9) }).data)
    await settle()
    p.close()

    await vi.advanceTimersByTimeAsync(1900)
    expect(p.getSnapshot()).toMatchObject({ blockIndex: 0 })
    await vi.advanceTimersByTimeAsync(100)
    expect(p.getSnapshot()).toMatchObject({ blockIndex: 1 })
  })

  it('moves on only once when the Participant moves on first', async () => {
    const p = open(memoryData({ subjects: [autoHistory], questions: statements(9) }).data)
    await settle()
    p.close()
    p.next()

    await vi.advanceTimersByTimeAsync(2000)

    expect(p.getSnapshot()).toMatchObject({ blockIndex: 1 })
  })

  it('stays on a scored Block without auto_advance', async () => {
    const p = open(memoryData({ questions: statements(6) }).data)
    await settle()
    p.close()

    await vi.advanceTimersByTimeAsync(5000)

    expect(p.getSnapshot()).toMatchObject({ blockIndex: 0 })
  })

  it('stays on a scored Block when time runs out before it moves on', async () => {
    const p = open(memoryData({ subjects: [autoHistory], questions: statements(6) }).data)
    await settle()
    await vi.advanceTimersByTimeAsync(59_000)
    p.close()

    await vi.advanceTimersByTimeAsync(5000)

    expect(p.getSnapshot()).toMatchObject({ phase: 'running', blockIndex: 0, timedOut: true })
  })

  it('stays on the last Block once there is a Result, even with auto_advance', async () => {
    const p = open(memoryData({ subjects: [autoHistory] }).data)
    await settle()
    p.close()

    await vi.advanceTimersByTimeAsync(5000)

    expect(p.getSnapshot()).toMatchObject({ phase: 'running', resultReady: true })
  })
})

describe('what the snapshot tells', () => {
  it('starts and saves a Result without Quiz names when the names cannot be fetched', async () => {
    const { data, saved } = memoryData()
    const p = open({ ...data, fetchQuizzes: () => Promise.reject(new Error('offline')) })
    await settle()
    expect(p.getSnapshot()).toMatchObject({ phase: 'running' })

    p.close()
    await settle()

    expect(saved).toHaveLength(1)
    expect(saved[0]).not.toHaveProperty('quizNameFrom')
    expect(saved[0]).not.toHaveProperty('quizNameTo')
  })

  it('stops the countdown once there is a Result', async () => {
    const p = open(memoryData().data)
    await settle()
    await vi.advanceTimersByTimeAsync(5000)
    p.close()

    await vi.advanceTimersByTimeAsync(10_000)

    expect(p.getSnapshot()).toMatchObject({ remainingSeconds: 25, timedOut: false })
  })

  it('counts a scored Block into the progress, and the correct answers of the Block on screen', async () => {
    const p = open(memoryData({ questions: [statement('A'), statement('B'), statement('C', 'false'), ...statements(3)] }).data)
    await settle()
    expect(p.getSnapshot()).toMatchObject({ progress: 0, correctInBlock: 0 })

    p.answer(0, 'true')
    p.answer(2, 'true')
    p.close()
    expect(p.getSnapshot()).toMatchObject({ progress: 0.5, correctInBlock: 1 })

    p.next()
    expect(p.getSnapshot()).toMatchObject({ progress: 0.5, blockIndex: 1, correctInBlock: 0 })
  })
})
