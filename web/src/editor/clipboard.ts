// Copy and paste between the Editor's grid and Excel: tab-separated text, one line per row.

import type { QuestionType } from '../practice/engine.ts'
import { emptyRow, languageLabel, questionTypes, trueFalseLabel, typeLabel, type EditorRow } from './rows.ts'

/** The grid's editable columns, left to right: a pasted range fills them in this order. */
export const clipboardFields = ['type', 'text', 'options', 'answer', 'time', 'speak_text', 'speak_answer'] as const

export type ClipboardField = (typeof clipboardFields)[number]

/** A cell of the grid: the row's index and its column. */
export interface CellPosition {
  row: number
  field: ClipboardField
}

/** Lower case with any dash as '-', so „Igaz-hamis” typed in Excel is the same as the grid's „Igaz–hamis”. */
const loose = (text: string) => text.trim().toLowerCase().replace(/[‐-―−]/g, '-')

/** A Question type from its key or the name the grid shows; anything else is kept, for the save to reject. */
const readType = (text: string) =>
  (questionTypes.find(({ type, label }) => loose(text) === loose(type) || loose(text) === loose(label))?.type ??
    text.trim()) as QuestionType

/** A true–false answer from Igaz/Hamis or true/false; anything else is kept, for the save to reject. */
const readTrueFalse = (text: string) => ({ igaz: 'true', hamis: 'false' })[loose(text)] ?? text.trim()

/** Seconds; empty means the default time. Text that is not a whole number becomes 0, which the save rejects. */
const readTime = (text: string) => {
  if (text.trim() === '') return null
  const seconds = Number(text.trim().replace(',', '.'))
  return Number.isInteger(seconds) ? seconds : 0
}

/** A speech language; the grid's '–' means none. */
const readLanguage = (text: string) => (loose(text) === '-' ? '' : text.trim())

/** The row with one cell set from pasted text. */
function setCell(row: EditorRow, field: ClipboardField, text: string): EditorRow {
  switch (field) {
    case 'type':
      return { ...row, type: readType(text) }
    case 'answer':
      return { ...row, answer: row.type === 'true-false' ? readTrueFalse(text) : text }
    case 'time':
      return { ...row, time: readTime(text) }
    case 'speak_text':
    case 'speak_answer':
      return { ...row, [field]: readLanguage(text) }
    default:
      return { ...row, [field]: text }
  }
}

/**
 * The rows with the pasted cells written from `start` rightwards and downwards; rows missing at the bottom are added.
 * Cells past the last column are dropped. Changed rows lose their error: they are checked again at the next save.
 */
export function pasteCells(rows: EditorRow[], start: CellPosition, cells: string[][]): EditorRow[] {
  const result = [...rows]
  const firstColumn = clipboardFields.indexOf(start.field)
  cells.forEach((line, offset) => {
    const index = start.row + offset
    let row = result[index] ?? emptyRow(result.at(-1)?.type)
    line.forEach((text, column) => {
      const field = clipboardFields[firstColumn + column]
      if (field) row = setCell(row, field, text)
    })
    result[index] = { ...row, error: undefined }
  })
  return result
}

/** A cell as the grid shows it. */
function cellText(row: EditorRow, field: ClipboardField): string {
  switch (field) {
    case 'type':
      return typeLabel(row.type)
    case 'answer':
      return row.type === 'true-false' ? trueFalseLabel(row.answer) : row.answer
    case 'time':
      return row.time === null ? '' : String(row.time)
    case 'speak_text':
    case 'speak_answer':
      return languageLabel(row[field])
    default:
      return row[field]
  }
}

/** A cell for Excel: quoted if it holds a tab, a line break or a quote. */
const excelCell = (text: string) => (/[\t\r\n"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text)

/** The cells between two corners, as the grid shows them, in the text Excel pastes. */
export function copyCells(rows: EditorRow[], from: CellPosition, to: CellPosition): string {
  const [top, bottom] = [Math.min(from.row, to.row), Math.max(from.row, to.row)]
  const [a, b] = [clipboardFields.indexOf(from.field), clipboardFields.indexOf(to.field)]
  const columns = clipboardFields.slice(Math.min(a, b), Math.max(a, b) + 1)
  return rows
    .slice(top, bottom + 1)
    .map((row) => columns.map((field) => excelCell(cellText(row, field))).join('\t') + '\r\n')
    .join('')
}

/** Clipboard text from Excel as rows of cells; quoted cells may hold tabs, line breaks and doubled quotes. */
export function parseClipboard(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let i = 0
  const endCell = () => {
    row.push(cell)
    cell = ''
  }
  const endRow = () => {
    endCell()
    rows.push(row)
    row = []
  }
  while (i < text.length) {
    const char = text[i]
    if (char === '"' && cell === '') {
      // A quoted cell: up to the lone closing quote.
      i++
      while (i < text.length) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') {
            cell += '"'
            i += 2
            continue
          }
          i++
          break
        }
        cell += text[i++]
      }
      continue
    }
    if (char === '\t') endCell()
    else if (char === '\r' && text[i + 1] === '\n') {
      endRow()
      i++
    } else if (char === '\n' || char === '\r') endRow()
    else cell += char
    i++
  }
  // The closing line break doesn't start another row.
  if (cell !== '' || row.length > 0) endRow()
  return rows.map((cells) => cells.map((value) => value.replace(/\r\n/g, '\n')))
}
