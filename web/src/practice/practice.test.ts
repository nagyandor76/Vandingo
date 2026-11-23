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

/**
 * Records what the Practice asked the audio port to do, in order. A reading or a sound goes on until the test
 * ends it: `endSound` and `endReading` end the oldest one still going, and let what follows it happen.
 */
function recordingAudio() {
  const calls: string[] = []
  const sounds: (() => void)[] = []
  const readings: (() => void)[] = []
  const goOnIn = (queue: (() => void)[]) => new Promise<void>((resolve) => queue.push(resolve))
  const endOldestIn = async (queue: (() => void)[]) => {
    queue.shift()?.()
    await settle()
  }
  return {
    calls,
    endSound: () => endOldestIn(sounds),
    endReading: () => endOldestIn(readings),
    audio: {
      speak: ({ text }: { text: string }) => {
        calls.push(`speak ${text}`)
        return goOnIn(readings)
      },
      stop: () => calls.push('stop'),
      playBlockSound: (allCorrect: boolean) => {
        calls.push(`sound ${allCorrect ? 'correct' : 'wrong'}`)
        return goOnIn(sounds)
      },
    },
  }
}

/** Shuffles nothing, so the Questions keep the order they are given in. */
const inOrder = () => 0.999999

const choice = { participant: 'Vanda', subject: 'history', from: 1, to: 2 }

let practice: Practice | undefined

function open(data: PracticeData, audio = recordingAudio().audio, random = inOrder) {
  practice = createPractice(choice, { data, audio, random })
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

  it('cuts off the English word of the last pair with the Block sound, and reads nothing after it', async () => {
    const { audio, calls, endSound } = recordingAudio()
    const pairs = [['apple', 'alma'], ['pear', 'körte'], ['plum', 'szilva'], ['grape', 'szőlő'], ['melon', 'dinnye']]
    const p = open(
      memoryData({ questions: pairs.map(([text, meaning]) => ({ type: 'word-matching', text, answer: [meaning], time: 10, speak_text: 'en-GB' })) }).data,
      audio,
    )
    await settle()
    for (const i of [0, 1, 2, 3]) {
      p.tap('meaning', i)
      p.tap('word', i)
    }
    p.tap('meaning', 4)
    calls.length = 0

    p.tap('word', 4)
    await endSound()

    expect(calls).toEqual(['speak melon', 'stop', 'sound correct'])
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

describe('a spelling Block', () => {
  const spelling = (text: string, meaning: string, speak_text?: string): PracticeQuestion => ({
    type: 'spelling',
    text,
    answer: [meaning],
    time: 20,
    ...(speak_text && { speak_text }),
  })

  /** The running snapshot's spelling Block, as the Participant sees it. */
  const spellingOf = (p: Practice) => {
    const snapshot = p.getSnapshot()
    if (snapshot.phase !== 'running' || !snapshot.spelling) throw new Error('no spelling Block on screen')
    return snapshot.spelling
  }

  const letters = (tiles: { letter: string }[]) => tiles.map((tile) => tile.letter)

  it('shows one word with its Hungarian meaning, its spaces and punctuation given, and a tile per letter plus two', async () => {
    const p = open(memoryData({ questions: [spelling('Get (up)!', 'Kelj fel!')] }).data)
    await settle()

    const { meaning, slots, tiles } = spellingOf(p)
    expect(p.getSnapshot()).toMatchObject({ blockCount: 1 })
    expect(meaning).toBe('Kelj fel!')
    expect(slots).toEqual([
      { letter: undefined },
      { letter: undefined },
      { letter: undefined },
      { given: ' ' },
      { given: '(' },
      { letter: undefined },
      { letter: undefined },
      { given: ')' },
      { given: '!' },
    ])
    expect(tiles).toHaveLength(7)
    expect(tiles.every((tile) => !tile.used && /^[a-z]$/.test(tile.letter))).toBe(true)
    const extras = [...letters(tiles)]
    for (const letter of 'getup') extras.splice(extras.indexOf(letter), 1)
    expect(extras).toHaveLength(2)
  })

  it('deals the tiles in alphabetical order, the same letters side by side', async () => {
    // Extra letters `g` (among the word's letters) and `s` for `stuff`, then draws that would mix the tiles up if
    // they were shuffled.
    const draws = [0.05, 0.7]
    const p = open(memoryData({ questions: [spelling('Stuff', 'cucc')] }).data, undefined, () => draws.shift() ?? 0.3)
    await settle()

    expect(letters(spellingOf(p).tiles)).toEqual(['f', 'f', 'g', 's', 's', 't', 'u'])
  })

  it('puts at least one extra letter among the letters of the word, so the tiles never show it in one piece', async () => {
    // Whatever the draws, `hit` gets an extra letter after `h` and before `t`: `h i j t x`, never `a h i t x`.
    for (const draw of [0, 0.5, 0.999999]) {
      const p = open(memoryData({ questions: [spelling('hit', 'üt')] }).data, undefined, () => draw)
      await settle()

      const extras = [...letters(spellingOf(p).tiles)]
      for (const letter of 'hit') extras.splice(extras.indexOf(letter), 1)
      expect(extras.some((letter) => letter > 'h' && letter < 't')).toBe(true)
      p.dispose()
    }
  })

  it('deals two extra letters even for a word with no letter between its first and last', async () => {
    const p = open(memoryData({ questions: [spelling('ab', 'ab')] }).data)
    await settle()

    expect(spellingOf(p).tiles).toHaveLength(4)
  })

  it('keeps the correct word out of the snapshot until the word is scored', async () => {
    const p = open(memoryData({ questions: [spelling('hit', 'üt')] }).data)
    await settle()

    expect(spellingOf(p).correctWord).toBeUndefined()
  })

  it('ignores a tile that is not on the screen', async () => {
    const p = open(memoryData({ questions: [spelling('hi', 'szia')] }).data)
    await settle()

    p.place(-1)
    p.place(99)

    expect(spellingOf(p).slots).toEqual([{ letter: undefined }, { letter: undefined }])
  })

  /** Places the tile of each letter in turn, picking an unused tile of that letter. */
  const spell = (p: Practice, word: string) => {
    for (const letter of word) p.place(spellingOf(p).tiles.findIndex((tile) => tile.letter === letter && !tile.used))
  }

  it('places a tapped tile in the next empty slot, and a used tile only once', async () => {
    const p = open(memoryData({ questions: [spelling('a hit', 'egy ütés')] }).data)
    await settle()
    const tile = (letter: string) => spellingOf(p).tiles.findIndex((t) => t.letter === letter)

    p.place(tile('h'))
    p.place(tile('h'))
    p.place(tile('a'))

    const { slots, tiles } = spellingOf(p)
    expect(slots).toEqual([{ letter: 'h' }, { given: ' ' }, { letter: 'a' }, { letter: undefined }, { letter: undefined }])
    expect(tiles.filter((t) => t.used).map((t) => t.letter).sort()).toEqual(['a', 'h'])
  })

  it('is scored right as the last slot is filled, whatever the case of the word, with the correct sound', async () => {
    const { audio, calls } = recordingAudio()
    const p = open(memoryData({ questions: [spelling('Hi!', 'Szia!'), spelling('Hit', 'üt')] }).data, audio)
    await settle()

    p.close()
    spell(p, 'h')
    expect(p.getSnapshot()).toMatchObject({ block: { closed: false } })

    spell(p, 'i')

    expect(p.getSnapshot()).toMatchObject({ block: { closed: true, allCorrect: true }, correctInBlock: 1 })
    expect(spellingOf(p)).toMatchObject({
      slots: [{ letter: 'H', correct: true }, { letter: 'i', correct: true }, { given: '!' }],
      correctWord: 'Hi!',
    })
    expect(calls).toEqual(['stop', 'sound correct'])
  })

  it('marks each wrong letter of a wrong word, with the wrong sound', async () => {
    const { audio, calls } = recordingAudio()
    const p = open(memoryData({ questions: [spelling('hit', 'üt'), spelling('hat', 'kalap')] }).data, audio)
    await settle()

    spell(p, 'iht')

    expect(p.getSnapshot()).toMatchObject({ block: { closed: true, allCorrect: false }, correctInBlock: 0 })
    expect(spellingOf(p).slots).toEqual([
      { letter: 'i', correct: false },
      { letter: 'h', correct: false },
      { letter: 't', correct: true },
    ])
    expect(calls).toEqual(['stop', 'sound wrong'])
  })

  describe('fixing a word while spelling it', () => {
    /** The letters on the used tiles, in alphabetical order. */
    const used = (p: Practice) => letters(spellingOf(p).tiles.filter((tile) => tile.used)).sort()

    it('takes back the last placed letter, its tile ready to be placed again', async () => {
      const p = open(memoryData({ questions: [spelling('a hit', 'egy ütés')] }).data)
      await settle()
      spell(p, 'ah')

      p.takeBackLast()

      expect(spellingOf(p).slots).toEqual([{ letter: 'a' }, { given: ' ' }, { letter: undefined }, { letter: undefined }, { letter: undefined }])
      expect(used(p)).toEqual(['a'])
      spell(p, 'h')
      expect(used(p)).toEqual(['a', 'h'])
    })

    it('takes back a letter tapped in the answer line; the next tile fills the first empty slot', async () => {
      const p = open(memoryData({ questions: [spelling('a hit', 'egy ütés')] }).data)
      await settle()
      spell(p, 'ahi')

      p.takeBack(2) // the `h`: places in the answer line count the given space too

      expect(spellingOf(p).slots).toEqual([{ letter: 'a' }, { given: ' ' }, { letter: undefined }, { letter: 'i' }, { letter: undefined }])
      expect(used(p)).toEqual(['a', 'i'])
      spell(p, 'h')
      p.takeBackLast()
      expect(spellingOf(p).slots).toEqual([{ letter: 'a' }, { given: ' ' }, { letter: undefined }, { letter: 'i' }, { letter: undefined }])
    })

    it('ignores taking back in a scored Block, on a given character or on an empty slot', async () => {
      const p = open(memoryData({ questions: [spelling('a hit', 'egy ütés'), spelling('hat', 'kalap')] }).data)
      await settle()
      spell(p, 'a')
      p.takeBack(1)
      p.takeBack(2)
      expect(used(p)).toEqual(['a'])

      spell(p, 'hit')
      p.takeBackLast()
      p.takeBack(0)

      expect(p.getSnapshot()).toMatchObject({ block: { closed: true, allCorrect: true } })
      expect(used(p)).toEqual(['a', 'h', 'i', 't'])
    })
  })

  it('counts a half-spelled word as wrong when time runs out', async () => {
    const p = open(memoryData({ questions: [spelling('hit', 'üt')] }).data)
    await settle()
    spell(p, 'h')

    await vi.advanceTimersByTimeAsync(20_000)

    expect(p.getSnapshot()).toMatchObject({ timedOut: true, block: { closed: true, allCorrect: false } })
    expect(spellingOf(p).slots).toEqual([
      { letter: 'h', correct: true },
      { letter: undefined, correct: false },
      { letter: undefined, correct: false },
    ])
  })

  it('comes one word per Block, mixed with the Blocks of other types', async () => {
    const p = open(memoryData({ questions: [...statements(3), spelling('hit', 'üt'), spelling('hat', 'kalap')] }).data)
    await settle()

    expect(p.getSnapshot()).toMatchObject({ blockCount: 3 })
    const types: string[] = []
    for (let i = 0; i < 3; i++) {
      const snapshot = p.getSnapshot()
      if (snapshot.phase !== 'running') throw new Error('not running')
      types.push(snapshot.block.type)
      if (snapshot.block.type === 'spelling') spell(p, snapshot.block.questions[0].question.text)
      else p.close()
      p.next()
    }
    expect(types.sort()).toEqual(['spelling', 'spelling', 'true-false'])
  })

  describe('reading aloud', () => {
    it('reads the word only after the Block sound, for a right word and for a wrong one', async () => {
      const { audio, calls, endSound } = recordingAudio()
      const p = open(memoryData({ questions: [spelling('Hit', 'üt', 'en-GB'), spelling('hat', 'kalap', 'en-GB')] }).data, audio)
      await settle()

      spell(p, 'hit')
      expect(calls).toEqual(['stop', 'sound correct'])
      await endSound()
      expect(calls).toEqual(['stop', 'sound correct', 'speak Hit'])

      p.next()
      calls.length = 0
      spell(p, 'hta')
      await endSound()
      expect(calls).toEqual(['stop', 'sound wrong', 'speak hat'])
    })

    it('reads nothing before the word is scored, not even when asked, and again on request once it is', async () => {
      const { audio, calls, endSound, endReading } = recordingAudio()
      const p = open(memoryData({ questions: [spelling('hit', 'üt', 'en-GB')] }).data, audio)
      await settle()

      p.readAloud(0)
      spell(p, 'hi')
      expect(calls).toEqual([])
      expect(spellingOf(p).hearable).toBe(false)

      spell(p, 't')
      await endSound()
      await endReading()
      p.readAloud(0)

      expect(calls).toEqual(['stop', 'sound correct', 'speak hit', 'speak hit'])
      expect(spellingOf(p).hearable).toBe(true)
    })

    it('only plays the Block sound for a word without a reading', async () => {
      const { audio, calls, endSound } = recordingAudio()
      const p = open(memoryData({ questions: [spelling('hit', 'üt')] }).data, audio)
      await settle()

      spell(p, 'hit')
      await endSound()
      p.readAloud(0)

      expect(calls).toEqual(['stop', 'sound correct'])
      expect(spellingOf(p).hearable).toBe(false)
    })

    it('reads nothing late once the Participant has moved on or left', async () => {
      const { audio, calls, endSound } = recordingAudio()
      const words = [spelling('hit', 'üt', 'en-GB'), spelling('hat', 'kalap', 'en-GB')]
      const p = open(memoryData({ questions: words }).data, audio)
      await settle()
      spell(p, 'hit')
      p.next()
      await endSound()
      p.dispose()

      const left = open(memoryData({ questions: words }).data, audio)
      await settle()
      spell(left, 'hit')
      left.dispose()
      await endSound()

      expect(calls.filter((call) => call.startsWith('speak'))).toEqual([])
    })

    it('with auto_advance, moves on 2 seconds after the reading ends, or after scoring without a reading', async () => {
      const { audio, endSound, endReading } = recordingAudio()
      const words = [spelling('hit', 'üt', 'en-GB'), spelling('hat', 'kalap'), spelling('hot', 'forró')]
      const p = open(memoryData({ subjects: [{ ...history, auto_advance: true }], questions: words }).data, audio)
      await settle()

      spell(p, 'hit')
      await vi.advanceTimersByTimeAsync(3000)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 0 })
      await endSound()
      await vi.advanceTimersByTimeAsync(3000)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 0 })
      await endReading()
      await vi.advanceTimersByTimeAsync(1900)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 0 })
      await vi.advanceTimersByTimeAsync(100)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 1 })

      spell(p, 'hat')
      await vi.advanceTimersByTimeAsync(2000)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 2 })
    })

    it('reads a word asked for during the Block sound only after the sound, once', async () => {
      const { audio, calls, endSound } = recordingAudio()
      const p = open(memoryData({ questions: [spelling('hit', 'üt', 'en-GB')] }).data, audio)
      await settle()
      spell(p, 'hit')

      p.readAloud(0)
      expect(calls).toEqual(['stop', 'sound correct'])
      await endSound()

      expect(calls).toEqual(['stop', 'sound correct', 'speak hit'])
    })

    it('with auto_advance, waits 2 seconds after the end of a reading asked for again', async () => {
      const { audio, endSound, endReading } = recordingAudio()
      const words = [spelling('hit', 'üt', 'en-GB'), spelling('hat', 'kalap')]
      const p = open(memoryData({ subjects: [{ ...history, auto_advance: true }], questions: words }).data, audio)
      await settle()
      spell(p, 'hit')
      await endSound()

      p.readAloud(0)
      await endReading() // the first reading, cut off by the second
      await vi.advanceTimersByTimeAsync(3000)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 0 })
      await endReading()
      await vi.advanceTimersByTimeAsync(2000)

      expect(p.getSnapshot()).toMatchObject({ blockIndex: 1 })
    })

    it('with auto_advance, stays on the scored word when time runs out during its sound or reading', async () => {
      const { audio, endSound, endReading } = recordingAudio()
      const words = [{ ...spelling('hit', 'üt', 'en-GB'), time: 2 }, { ...spelling('hat', 'kalap'), time: 1 }]
      const p = open(memoryData({ subjects: [{ ...history, auto_advance: true }], questions: words }).data, audio)
      await settle()
      spell(p, 'hit')

      await vi.advanceTimersByTimeAsync(4000)
      await endSound()
      await endReading()
      await vi.advanceTimersByTimeAsync(4000)

      expect(p.getSnapshot()).toMatchObject({ phase: 'running', blockIndex: 0, resultReady: true })
    })
  })
})

describe('a multiple-choice Block', () => {
  const choiceQuestion = (text: string, options: string[], answer: string[], speak_text?: string): PracticeQuestion => ({
    type: 'multiple-choice',
    text,
    options,
    answer,
    time: 20,
    ...(speak_text && { speak_text }),
  })
  const cities = choiceQuestion('Melyik város?', ['Budapest', 'Duna', 'Szeged', 'Mátra'], ['Budapest', 'Szeged'])

  /** The running snapshot's multiple-choice Block, as the Participant sees it. */
  const multipleChoiceOf = (p: Practice) => {
    const snapshot = p.getSnapshot()
    if (snapshot.phase !== 'running' || !snapshot.multipleChoice) throw new Error('no multiple-choice Block on screen')
    return snapshot.multipleChoice
  }
  const texts = (p: Practice) => multipleChoiceOf(p).options.map((option) => option.text)
  /** Toggles the options with these texts. */
  const choose = (p: Practice, ...chosen: string[]) => {
    for (const text of chosen) p.toggle(texts(p).indexOf(text))
  }

  it('is playable with a single Question, showing its text and its options shuffled, none chosen', async () => {
    // Fisher–Yates over 4 options draws 3 times: swap the last with the first, then leave the rest in place.
    const draws = [0, 0.999999, 0.999999]
    const p = open(memoryData({ questions: [cities] }).data, undefined, () => draws.shift() ?? 0.5)
    await settle()

    expect(multipleChoiceOf(p)).toEqual({
      text: 'Melyik város?',
      options: [
        { text: 'Mátra', chosen: false, faded: false },
        { text: 'Duna', chosen: false, faded: false },
        { text: 'Szeged', chosen: false, faded: false },
        { text: 'Budapest', chosen: false, faded: false },
      ],
      hearable: false,
    })
  })

  it('never shows the options in the order they are written, even when the shuffle leaves them in place', async () => {
    const p = open(memoryData({ questions: [cities] }).data, undefined, inOrder)
    await settle()

    expect(texts(p)).toEqual(['Duna', 'Szeged', 'Mátra', 'Budapest'])
  })

  it('chooses any number of options with a tap, and lets go of a chosen one with another', async () => {
    const p = open(memoryData({ questions: [cities] }).data)
    await settle()

    choose(p, 'Budapest', 'Duna', 'Szeged', 'Duna')

    const chosen = multipleChoiceOf(p).options.filter((option) => option.chosen).map((option) => option.text)
    expect(chosen.sort()).toEqual(['Budapest', 'Szeged'])
    expect(p.getSnapshot()).toMatchObject({ block: { closed: false } })
  })

  it('is scored right on „Kész” only with every right option chosen and nothing else, with one sound', async () => {
    const tries = [
      { chosen: ['Budapest', 'Szeged'], right: true },
      { chosen: ['Szeged', 'Budapest'], right: true },
      { chosen: ['Budapest'], right: false },
      { chosen: ['Budapest', 'Szeged', 'Duna'], right: false },
      { chosen: [], right: false },
    ]
    for (const { chosen, right } of tries) {
      const { audio, calls } = recordingAudio()
      const { data, saved } = memoryData({ questions: [cities] })
      const p = open(data, audio)
      await settle()

      choose(p, ...chosen)
      p.close()
      p.close()
      await settle()

      expect(p.getSnapshot()).toMatchObject({ block: { closed: true, allCorrect: right }, correctInBlock: right ? 1 : 0 })
      expect(calls).toEqual(['stop', `sound ${right ? 'correct' : 'wrong'}`])
      expect(saved).toMatchObject([{ total: 1, correct: right ? 1 : 0, scorePercent: right ? 100 : 0 }])
      p.dispose()
    }
  })

  it('once scored, marks the right options green and the wrongly chosen or missed ones red, fades the rest, and ignores taps', async () => {
    const p = open(memoryData({ questions: [cities] }).data)
    await settle()
    choose(p, 'Budapest', 'Duna')

    p.close()
    choose(p, 'Szeged', 'Duna')

    const byText = Object.fromEntries(multipleChoiceOf(p).options.map(({ text, ...rest }) => [text, rest]))
    expect(byText).toEqual({
      Budapest: { chosen: true, mark: 'right', faded: false },
      Duna: { chosen: true, mark: 'wrong', faded: false },
      Szeged: { chosen: false, mark: 'wrong', faded: false },
      Mátra: { chosen: false, faded: true },
    })
  })

  it('is wrong when time runs out before „Kész”, even with the right options chosen', async () => {
    const { data, saved } = memoryData({ questions: [cities] })
    const p = open(data)
    await settle()
    choose(p, 'Budapest', 'Szeged')

    await vi.advanceTimersByTimeAsync(20_000)

    expect(p.getSnapshot()).toMatchObject({ timedOut: true, correctInBlock: 0, block: { closed: true, allCorrect: false } })
    expect(saved).toMatchObject([{ total: 1, correct: 0, scorePercent: 0 }])
  })

  it('when time runs out, marks every right option red as not answered in time, and a wrong option chosen red', async () => {
    const p = open(memoryData({ questions: [cities] }).data)
    await settle()
    choose(p, 'Budapest', 'Duna')

    await vi.advanceTimersByTimeAsync(20_000)

    const byText = Object.fromEntries(multipleChoiceOf(p).options.map(({ text, mark }) => [text, mark]))
    expect(byText).toEqual({ Budapest: 'wrong', Duna: 'wrong', Szeged: 'wrong', Mátra: undefined })
  })

  it('comes one Question per Block, each once, mixed with the Blocks of other types', async () => {
    const towns = choiceQuestion('Melyik folyó?', ['Duna', 'Pest'], ['Duna'])
    const p = open(memoryData({ questions: [...statements(3), cities, towns] }).data, undefined, Math.random)
    await settle()

    expect(p.getSnapshot()).toMatchObject({ blockCount: 3 })
    const shown: string[] = []
    for (let i = 0; i < 3; i++) {
      const snapshot = p.getSnapshot()
      if (snapshot.phase !== 'running') throw new Error('not running')
      shown.push(snapshot.block.type === 'multiple-choice' ? multipleChoiceOf(p).text : snapshot.block.type)
      expect(snapshot.block.questions).toHaveLength(snapshot.block.type === 'multiple-choice' ? 1 : 3)
      p.close()
      p.next()
    }
    expect(shown.sort()).toEqual(['Melyik folyó?', 'Melyik város?', 'true-false'])
  })

  describe('reading aloud', () => {
    const spoken = choiceQuestion('Which city?', ['Budapest', 'Duna'], ['Budapest'], 'en-GB')

    it('reads nothing before „Kész”, not even when asked, then the Question after the Block sound, and again on request', async () => {
      const { audio, calls, endSound, endReading } = recordingAudio()
      const p = open(memoryData({ questions: [spoken] }).data, audio)
      await settle()

      p.readAloud(0)
      choose(p, 'Duna')
      expect(calls).toEqual([])
      expect(multipleChoiceOf(p).hearable).toBe(false)

      p.close()
      expect(calls).toEqual(['stop', 'sound wrong'])
      await endSound()
      await endReading()
      p.readAloud(0)

      expect(calls).toEqual(['stop', 'sound wrong', 'speak Which city?', 'speak Which city?'])
      expect(multipleChoiceOf(p).hearable).toBe(true)
    })

    it('only plays the Block sound for a Question without a reading', async () => {
      const { audio, calls, endSound } = recordingAudio()
      const p = open(memoryData({ questions: [cities] }).data, audio)
      await settle()

      p.close()
      await endSound()
      p.readAloud(0)

      expect(calls).toEqual(['stop', 'sound wrong'])
      expect(multipleChoiceOf(p).hearable).toBe(false)
    })

    it('with auto_advance, moves on 2 seconds after the reading ends, or after scoring without a reading', async () => {
      const { audio, endSound, endReading } = recordingAudio()
      const questions = [spoken, cities, choiceQuestion('Melyik folyó?', ['Duna', 'Pest'], ['Duna'])]
      const p = open(memoryData({ subjects: [{ ...history, auto_advance: true }], questions }).data, audio)
      await settle()

      p.close()
      await vi.advanceTimersByTimeAsync(3000)
      await endSound()
      await vi.advanceTimersByTimeAsync(3000)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 0 })
      await endReading()
      await vi.advanceTimersByTimeAsync(1900)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 0 })
      await vi.advanceTimersByTimeAsync(100)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 1 })

      p.close()
      await vi.advanceTimersByTimeAsync(2000)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 2 })
    })

    it('with auto_advance, waits 2 seconds after the end of a reading asked for again', async () => {
      const { audio, endSound, endReading } = recordingAudio()
      const p = open(memoryData({ subjects: [{ ...history, auto_advance: true }], questions: [spoken, cities] }).data, audio)
      await settle()
      p.close()
      await endSound()

      p.readAloud(0)
      await endReading() // the first reading, cut off by the second
      await vi.advanceTimersByTimeAsync(3000)
      expect(p.getSnapshot()).toMatchObject({ blockIndex: 0 })
      await endReading()
      await vi.advanceTimersByTimeAsync(2000)

      expect(p.getSnapshot()).toMatchObject({ blockIndex: 1 })
    })

    it('with auto_advance, stays on the Question when time runs out, and reads it after the sound', async () => {
      const { audio, calls, endSound, endReading } = recordingAudio()
      const p = open(memoryData({ subjects: [{ ...history, auto_advance: true }], questions: [{ ...spoken, time: 1 }, { ...cities, time: 1 }] }).data, audio)
      await settle()

      await vi.advanceTimersByTimeAsync(2000)
      await endSound()
      await endReading()
      await vi.advanceTimersByTimeAsync(4000)

      expect(calls).toEqual(['stop', 'sound wrong', 'speak Which city?'])
      expect(p.getSnapshot()).toMatchObject({ phase: 'running', blockIndex: 0, timedOut: true })
    })
  })
})
