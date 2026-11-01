import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Alert, Button, CircularProgress, MenuItem, Stack, TextField, Typography, useTheme } from '@mui/material'
import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef, type ICellRendererParams } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { deleteQuiz, fetchQuiz, fetchQuizzes, fetchSubjects, saveQuiz, type QuizSummary, type ValidationError } from '../api.ts'
import { emptyRow, questionTypes, speechLanguages, toQuestion, toRow, type EditorRow } from '../editor/rows.ts'
import ConfirmDialog from './ConfirmDialog.tsx'
import type { NewQuizState } from './Editor.tsx'
import Screen from './Screen.tsx'

ModuleRegistry.registerModules([AllCommunityModule])

/** A new Quiz's default time per Question, in seconds. */
const newQuizDefaultTime = 10

const difficulties = Array.from({ length: 20 }, (_, i) => i + 1)

const typeLabel = (type: unknown) => questionTypes.find((t) => t.type === type)?.label ?? String(type ?? '')
const trueFalseLabel = (value: unknown) => (value === 'true' ? 'Igaz' : value === 'false' ? 'Hamis' : String(value ?? ''))
const languageLabel = (value: unknown) => (value ? String(value) : '–')

/** Field names the server reports, as the column headers the user sees. */
const fieldLabels: Record<string, string> = {
  name: 'Név',
  default_time: 'Alapidő',
  difficulty: 'Szint',
  questions: 'Kérdések',
}

type Loaded =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'ready'; isNew: boolean }

/** All Questions of one Quiz in a single grid; saved as a whole once the server has checked it. */
export default function QuizEditor() {
  const { subject = '', difficulty: difficultyParam = '' } = useParams()
  const difficulty = Number(difficultyParam)
  const location = useLocation()
  const navigate = useNavigate()
  const newQuizName = (location.state as NewQuizState | null)?.newQuizName
  const muiTheme = useTheme()

  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' })
  const [subjectName, setSubjectName] = useState(subject)
  const [name, setName] = useState('')
  const [defaultTime, setDefaultTime] = useState('')
  const [rows, setRows] = useState<EditorRow[]>([])
  const [quizErrors, setQuizErrors] = useState<ValidationError[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  // Where the Quiz is saved; changing it moves the Quiz there.
  const [targetDifficulty, setTargetDifficulty] = useState(difficulty)
  const [otherQuizzes, setOtherQuizzes] = useState<QuizSummary[]>([])
  const [confirm, setConfirm] = useState<'overwrite' | 'delete'>()
  const [deleteFailed, setDeleteFailed] = useState(false)
  const grid = useRef<AgGridReact<EditorRow>>(null)

  // The grid redraws only cells whose value changed; an error outline is not a value, so redraw on error changes.
  const errorKey = rows.map((row) => (row.error ? `${row.id}:${row.error.field}` : '')).join()
  useEffect(() => {
    grid.current?.api?.refreshCells({ force: true })
  }, [errorKey])

  useEffect(() => {
    fetchSubjects().then((subjects) => setSubjectName(subjects.find(({ key }) => key === subject)?.name ?? subject), () => {})
  }, [subject])

  useEffect(() => {
    setTargetDifficulty(difficulty)
    fetchQuizzes(subject).then((list) => setOtherQuizzes(list.filter((quiz) => quiz.difficulty !== difficulty)), () => {})
  }, [subject, difficulty])

  useEffect(() => {
    let current = true
    fetchQuiz(subject, difficulty).then(
      (quiz) => {
        if (!current) return
        if (quiz) {
          setName(quiz.name)
          setDefaultTime(String(quiz.default_time))
          setRows(quiz.questions.map(toRow))
          setLoaded({ status: 'ready', isNew: false })
        } else if (newQuizName !== undefined) {
          setName(newQuizName)
          setDefaultTime(String(newQuizDefaultTime))
          setRows(Array.from({ length: 5 }, () => emptyRow()))
          setLoaded({ status: 'ready', isNew: true })
        } else {
          setLoaded({ status: 'missing' })
        }
      },
      () => current && setLoaded({ status: 'failed' }),
    )
    return () => {
      current = false
    }
  }, [subject, difficulty, newQuizName])

  const changed = () => {
    setSaved(false)
    setSaveFailed(false)
  }

  const updateRow = (row: EditorRow) => {
    changed()
    // An edited row loses its error: it is checked again at the next save.
    setRows((all) => all.map((r) => (r.id === row.id ? { ...row, error: undefined } : r)))
  }

  const addRow = () => {
    changed()
    setRows((all) => [...all, emptyRow(all.at(-1)?.type)])
  }

  const deleteRow = (id: number) => {
    changed()
    setRows((all) => all.filter((r) => r.id !== id))
  }

  const isNew = loaded.status === 'ready' && loaded.isNew

  /** Saves to the chosen Difficulty; a Quiz already there is replaced only with `overwrite`, after the user confirmed it. */
  const save = async (overwrite = false) => {
    setConfirm(undefined)
    setSaving(true)
    changed()
    const saving = rows
    const target = targetDifficulty
    try {
      const outcome = await saveQuiz(
        subject,
        target,
        {
          name: name.trim(),
          default_time: defaultTime.trim() === '' ? null : Number(defaultTime),
          questions: saving.map(toQuestion),
        },
        { originalDifficulty: isNew ? undefined : difficulty, overwrite },
      )
      if (outcome.status === 'saved') {
        setRows(saving.map((row) => ({ ...row, error: undefined })))
        setQuizErrors([])
        setSaved(true)
        if (isNew || target !== difficulty) {
          // From now on it is an existing Quiz at its new Difficulty, also after a reload.
          navigate(`/szerkeszto/${encodeURIComponent(subject)}/${target}`, { replace: true, state: null })
        }
      } else if (outcome.status === 'conflict') {
        setConfirm('overwrite')
      } else if (outcome.status === 'invalid') {
        setRows(saving.map((row, i) => ({ ...row, error: outcome.errors.find((error) => error.row === i) })))
        setQuizErrors(outcome.errors.filter((error) => error.row === undefined))
      } else {
        setSaveFailed(true)
      }
    } catch {
      setSaveFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setConfirm(undefined)
    setDeleteFailed(false)
    try {
      await deleteQuiz(subject, difficulty)
      navigate(back, { replace: true })
    } catch {
      setDeleteFailed(true)
    }
  }

  const gridTheme = useMemo(
    () =>
      themeQuartz.withParams({
        accentColor: muiTheme.palette.primary.main,
        fontFamily: 'inherit',
        fontSize: 14,
        wrapperBorderRadius: muiTheme.shape.borderRadius,
      }),
    [muiTheme],
  )

  const columnDefs = useMemo<ColDef<EditorRow>[]>(() => {
    const errorOutline = (field: string) => (params: { data?: EditorRow }) =>
      params.data?.error?.field === field ? { outline: `2px solid ${muiTheme.palette.error.main}`, outlineOffset: -3 } : null
    // Wrapped text gets normal line spacing instead of the row height.
    const wrapped = { lineHeight: 1.45, paddingTop: 10, paddingBottom: 10 }
    const textColumn = (field: 'text' | 'options' | 'answer', headerName: string, flex: number): ColDef<EditorRow> => ({
      field,
      headerName,
      flex,
      minWidth: 160,
      wrapText: true,
      autoHeight: true,
      cellStyle: (params) => ({ ...wrapped, ...errorOutline(field)(params) }),
    })

    return [
      { headerName: '#', valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1, width: 56, editable: false, sortable: false },
      {
        field: 'type',
        headerName: 'Típus',
        width: 160,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: questionTypes.map(({ type }) => type) },
        valueFormatter: (p) => typeLabel(p.value),
        cellStyle: errorOutline('type'),
      },
      textColumn('text', 'Kérdés / állítás / angol szó', 2),
      { ...textColumn('options', 'Válaszlehetőségek (;)', 1.5) },
      {
        ...textColumn('answer', 'Helyes válasz (;)', 1.5),
        // In the select editor there is no row, and only true/false are offered.
        valueFormatter: (p) => (!p.data || p.data.type === 'true-false' ? trueFalseLabel(p.value) : p.value),
        cellEditorSelector: (p) =>
          p.data?.type === 'true-false'
            ? { component: 'agSelectCellEditor', params: { values: ['true', 'false'] } }
            : { component: 'agTextCellEditor' },
      },
      {
        field: 'time',
        headerName: 'Idő (mp)',
        width: 110,
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: { min: 1, precision: 0 },
        cellStyle: errorOutline('time'),
      },
      {
        field: 'speak_text',
        headerName: 'Felolvasás',
        width: 120,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: speechLanguages },
        valueFormatter: (p) => languageLabel(p.value),
      },
      {
        field: 'speak_answer',
        headerName: 'Válasz felolv.',
        width: 130,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: speechLanguages },
        valueFormatter: (p) => languageLabel(p.value),
      },
      {
        headerName: 'Hiba',
        colId: 'error',
        valueGetter: (p) => p.data?.error?.message ?? '',
        editable: false,
        flex: 1.5,
        minWidth: 160,
        wrapText: true,
        autoHeight: true,
        cellStyle: { ...wrapped, color: muiTheme.palette.error.main, fontWeight: 600 },
      },
      {
        colId: 'delete',
        headerName: '',
        width: 64,
        editable: false,
        sortable: false,
        cellRenderer: (p: ICellRendererParams<EditorRow>) => (
          <Button size="small" color="error" aria-label="Sor törlése" onClick={() => p.data && deleteRow(p.data.id)} sx={{ minWidth: 0, minHeight: 0, p: 0.5 }}>
            ✕
          </Button>
        ),
      },
    ]
  }, [muiTheme])

  const title = `${subjectName} – ${difficulty}. szint`
  const back = `/szerkeszto?tantargy=${encodeURIComponent(subject)}`

  if (loaded.status !== 'ready') {
    return (
      <Screen title={title} back={back}>
        {loaded.status === 'loading' && <CircularProgress sx={{ alignSelf: 'center' }} />}
        {loaded.status === 'missing' && <Alert severity="info">Ezen a szinten nincs kvíz.</Alert>}
        {loaded.status === 'failed' && <Alert severity="error">Nem sikerült betölteni a kvízt.</Alert>}
      </Screen>
    )
  }

  const rowsWithErrors = rows.filter((row) => row.error).length
  const occupant = otherQuizzes.find((quiz) => quiz.difficulty === targetDifficulty)

  return (
    <Screen title={title} back={back} wide>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
        <TextField
          label="Név"
          value={name}
          onChange={(event) => {
            changed()
            setName(event.target.value)
          }}
          error={quizErrors.some((e) => e.field === 'name')}
          sx={{ flex: 1, minWidth: 260 }}
        />
        <TextField
          label="Alapidő kérdésenként (mp)"
          type="number"
          value={defaultTime}
          onChange={(event) => {
            changed()
            setDefaultTime(event.target.value)
          }}
          error={quizErrors.some((e) => e.field === 'default_time')}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
          sx={{ width: 220 }}
        />
        <TextField
          select
          label="Szint"
          value={targetDifficulty}
          onChange={(event) => {
            changed()
            setTargetDifficulty(Number(event.target.value))
          }}
          error={quizErrors.some((e) => e.field === 'difficulty')}
          sx={{ width: 220 }}
        >
          {difficulties.map((d) => {
            const quizThere = otherQuizzes.find((quiz) => quiz.difficulty === d)
            return (
              <MenuItem key={d} value={d}>
                {quizThere ? `${d} (foglalt: ${quizThere.name})` : d}
              </MenuItem>
            )
          })}
        </TextField>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        A listákat (válaszlehetőségek, több helyes válasz) pontosvesszővel válaszd el, pl. „Théba; Memphisz”. Az üres idő az alapidőt jelenti.
      </Typography>

      {quizErrors.map((error) => (
        <Alert key={error.field} severity="error">
          {fieldLabels[error.field] ?? error.field}: {error.message}
        </Alert>
      ))}
      {rowsWithErrors > 0 && (
        <Alert severity="error">{rowsWithErrors} hibás sor – a hibás sorok pirosak, az okuk a Hiba oszlopban látszik.</Alert>
      )}

      <AgGridReact<EditorRow>
        ref={grid}
        theme={gridTheme}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={{ editable: true, sortable: false, resizable: true, suppressMovable: true }}
        getRowId={(p) => String(p.data.id)}
        getRowStyle={(p) => (p.data?.error ? { background: muiTheme.palette.error.soft } : undefined)}
        onCellValueChanged={(event) => event.data && updateRow(event.data)}
        stopEditingWhenCellsLoseFocus
        enterNavigatesVerticallyAfterEdit
        domLayout="autoHeight"
      />

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}>
        <Button variant="outlined" onClick={addRow}>
          + Új sor
        </Button>
        <Button variant="contained" onClick={() => save()} disabled={saving}>
          Mentés
        </Button>
        {saved && <Alert severity="success">Mentve.</Alert>}
        {saveFailed && <Alert severity="error">Nem sikerült menteni.</Alert>}
        {!isNew && (
          <Button color="error" onClick={() => setConfirm('delete')} sx={{ ml: 'auto !important' }}>
            Kvíz törlése
          </Button>
        )}
        {deleteFailed && <Alert severity="error">Nem sikerült törölni.</Alert>}
      </Stack>

      <ConfirmDialog
        open={confirm === 'overwrite'}
        title="Foglalt szint"
        confirmLabel="Felülírás"
        onConfirm={() => save(true)}
        onCancel={() => setConfirm(undefined)}
      >
        A(z) {targetDifficulty}. szinten már van kvíz{occupant && <>: „{occupant.name}”</>}. Felülírod? A régi kvíz elvész.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Kvíz törlése"
        confirmLabel="Törlés"
        onConfirm={remove}
        onCancel={() => setConfirm(undefined)}
      >
        Biztosan törlöd a(z) {difficulty}. szint kvízét („{name}”)? Ez nem vonható vissza.
      </ConfirmDialog>
    </Screen>
  )
}
