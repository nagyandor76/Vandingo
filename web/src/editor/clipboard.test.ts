import { describe, expect, it } from 'vitest'
import { copyCells, parseClipboard, pasteCells } from './clipboard'
import { emptyRow, toQuestion, type EditorRow } from './rows'

describe('parseClipboard', () => {
  it('reads Excel text as rows of cells, ignoring the closing line break', () => {
    expect(parseClipboard('Ló\thorse\r\nKutya\tdog\r\n')).toEqual([
      ['Ló', 'horse'],
      ['Kutya', 'dog'],
    ])
  })

  it('reads quoted cells with line breaks, tabs and quotes inside', () => {
    expect(parseClipboard('"két\r\nsor"\t"a ""b"" c"\tx\r\n')).toEqual([['két\nsor', 'a "b" c', 'x']])
  })

  it('keeps empty cells', () => {
    expect(parseClipboard('a\t\tc\n\tb\t\n')).toEqual([
      ['a', '', 'c'],
      ['', 'b', ''],
    ])
  })

  it('reads a single cell without a line break', () => {
    expect(parseClipboard('egy')).toEqual([['egy']])
  })
})

const row = (overrides: Partial<EditorRow> = {}): EditorRow => ({ ...emptyRow(), ...overrides })

const fields = (rows: EditorRow[], ...names: (keyof EditorRow)[]) =>
  rows.map((r) => Object.fromEntries(names.map((name) => [name, r[name]])))

describe('pasteCells', () => {
  it('fills the range from the given cell rightwards and downwards, leaving other cells alone', () => {
    const rows = [
      row({ type: 'word-matching', text: 'macska', answer: 'cica' }),
      row({ type: 'word-matching', text: 'ló', answer: 'paci' }),
      row({ type: 'word-matching', text: 'kutya', answer: 'eb' }),
    ]
    const pasted = pasteCells(rows, { row: 1, field: 'text' }, [
      ['horse', ''],
      ['dog', 'kutya'],
    ])
    expect(fields(pasted, 'text', 'options', 'answer')).toEqual([
      { text: 'macska', options: '', answer: 'cica' },
      { text: 'horse', options: '', answer: 'paci' },
      { text: 'dog', options: 'kutya', answer: 'eb' },
    ])
  })

  it("adds the missing rows, of the last row's type", () => {
    const rows = [row({ type: 'word-matching', text: 'cat', answer: 'macska' })]
    const pasted = pasteCells(rows, { row: 0, field: 'text' }, [
      ['horse', '', 'ló'],
      ['dog', '', 'kutya'],
      ['bird', '', 'madár'],
    ])
    expect(fields(pasted, 'type', 'text', 'answer')).toEqual([
      { type: 'word-matching', text: 'horse', answer: 'ló' },
      { type: 'word-matching', text: 'dog', answer: 'kutya' },
      { type: 'word-matching', text: 'bird', answer: 'madár' },
    ])
    expect(new Set(pasted.map((r) => r.id)).size).toBe(3)
  })

  it('reads cells as the grid shows them: type names, Igaz/Hamis, – for no reading aloud', () => {
    const pasted = pasteCells([row()], { row: 0, field: 'type' }, [
      ['Igaz–hamis', 'A Nap csillag', '', 'Hamis', '15', '–', 'hu-HU'],
      ['Feleletválasztós', 'Főváros?', 'Buda; Pest', 'Pest', '', '', ''],
      ['word-matching', 'horse', '', 'ló', '', 'en-GB', '–'],
    ])
    expect(pasted.map(toQuestion)).toEqual([
      { type: 'true-false', text: 'A Nap csillag', answer: ['false'], time: 15, speak_answer: 'hu-HU' },
      { type: 'multiple-choice', text: 'Főváros?', options: ['Buda', 'Pest'], answer: ['Pest'] },
      { type: 'word-matching', text: 'horse', answer: ['ló'], speak_text: 'en-GB' },
    ])
  })

  it('keeps wrong data as it is, so the save rejects it', () => {
    const pasted = pasteCells([row()], { row: 0, field: 'type' }, [['Kvíz', 'Kérdés', '', 'Talán', 'sok']])
    expect(toQuestion(pasted[0])).toEqual({ type: 'Kvíz', text: 'Kérdés', answer: ['Talán'], time: 0 })
  })

  it('clears the last save\'s error from the rows it changes', () => {
    const error = { row: 0, field: 'text', message: 'A kérdés szövege nem lehet üres.' }
    const rows = [row({ error }), row({ error: { ...error, row: 1 } })]
    const pasted = pasteCells(rows, { row: 0, field: 'text' }, [['Kérdés']])
    expect(pasted.map((r) => r.error)).toEqual([undefined, { ...error, row: 1 }])
  })
})

describe('copyCells', () => {
  const rows = [
    row({ type: 'true-false', text: 'A Nap csillag', answer: 'false', time: 15, speak_answer: 'hu-HU' }),
    row({ type: 'multiple-choice', text: 'Két\nsor, "idézettel"', options: 'Buda; Pest', answer: 'Pest' }),
    row({ type: 'word-matching', text: 'horse', answer: 'ló', speak_text: 'en-GB' }),
  ]

  it('writes the range between two cells as Excel reads it, as the grid shows it', () => {
    expect(copyCells(rows, { row: 0, field: 'type' }, { row: 1, field: 'speak_answer' })).toBe(
      'Igaz–hamis\tA Nap csillag\t\tHamis\t15\t–\thu-HU\r\n' +
        'Feleletválasztós\t"Két\nsor, ""idézettel"""\tBuda; Pest\tPest\t\t–\t–\r\n',
    )
  })

  it('takes the range from either corner', () => {
    expect(copyCells(rows, { row: 2, field: 'answer' }, { row: 1, field: 'options' })).toBe('Buda; Pest\tPest\r\n\tló\r\n')
  })

  it('pastes back as the same rows', () => {
    const copied = copyCells(rows, { row: 0, field: 'type' }, { row: 2, field: 'speak_answer' })
    const pasted = pasteCells([row()], { row: 0, field: 'type' }, parseClipboard(copied))
    expect(pasted.map(toQuestion)).toEqual(rows.map(toQuestion))
  })
})
