import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router'
import { Alert, Box, Button, ButtonBase, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { fetchQuizzes, fetchSubjects, saveQuiz, type QuizRef, type QuizSummary, type Subject, type ValidationError } from '../api.ts'
import { readQuizFile } from '../editor/upload.ts'
import ConfirmDialog from './ConfirmDialog.tsx'
import Screen from './Screen.tsx'

const difficulties = Array.from({ length: 20 }, (_, i) => i + 1)

/** What the Quiz editor needs to start a Quiz that isn't saved yet. */
export interface NewQuizState {
  newQuizName: string
}

type UploadedQuiz = Extract<ReturnType<typeof readQuizFile>, { ok: true }>

type UploadResult =
  | { status: 'saved'; name: string; difficulty: number }
  | { status: 'refused'; message: string }
  | { status: 'invalid'; errors: ValidationError[] }
  | { status: 'failed' }

/** Field names the server reports, as the labels the user sees. */
const fieldLabels: Record<string, string> = { name: 'Név', default_time: 'Alapidő', difficulty: 'Szint', questions: 'Kérdések' }

/** Picks the Subject, then opens one of its Quizzes or starts a new one. The Subject is kept in the URL. */
export default function Editor() {
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()
  const subject = search.get('tantargy') ?? ''
  const [subjects, setSubjects] = useState<Subject[]>()
  const [subjectsError, setSubjectsError] = useState(false)
  const [quizzes, setQuizzes] = useState<{ subject: string; list: QuizSummary[] }>()
  const [quizzesFailedFor, setQuizzesFailedFor] = useState<string>()
  const [name, setName] = useState('')
  const [difficulty, setDifficulty] = useState<number | ''>('')
  const fileInput = useRef<HTMLInputElement>(null)
  // An uploaded Quiz waiting for the user to confirm replacing the one at its Difficulty.
  const [pendingUpload, setPendingUpload] = useState<UploadedQuiz>()
  // The Quiz at the upload's Difficulty, as the server named it when the save was refused.
  const [occupant, setOccupant] = useState<QuizRef>()
  const [uploadResult, setUploadResult] = useState<UploadResult>()

  useEffect(() => {
    fetchSubjects().then(setSubjects, () => setSubjectsError(true))
  }, [])

  useEffect(() => {
    if (!subject) return
    let current = true
    fetchQuizzes(subject).then(
      (list) => current && setQuizzes({ subject, list }),
      () => current && setQuizzesFailedFor(subject),
    )
    return () => {
      current = false
    }
  }, [subject])

  const list = quizzes?.subject === subject ? quizzes.list : undefined
  const quizzesError = quizzesFailedFor === subject
  const freeDifficulties = difficulties.filter((d) => !list?.some((quiz) => quiz.difficulty === d))

  /** Saves the uploaded Quiz at its own Difficulty in the selected Subject; a Quiz already there is replaced only with `overwrite`. */
  const save = async (upload: UploadedQuiz, overwrite: boolean) => {
    setPendingUpload(undefined)
    try {
      const outcome = await saveQuiz(subject, upload.difficulty, upload.quiz, { overwrite })
      if (outcome.status === 'saved') {
        setUploadResult({ status: 'saved', name: upload.quiz.name ?? '', difficulty: upload.difficulty })
        setQuizzes({ subject, list: await fetchQuizzes(subject) })
      } else if (outcome.status === 'occupied') {
        setOccupant(outcome.occupied[0])
        setPendingUpload(upload)
      } else if (outcome.status === 'invalid') {
        setUploadResult({ status: 'invalid', errors: outcome.errors })
      } else {
        setUploadResult({ status: 'failed' })
      }
    } catch {
      setUploadResult({ status: 'failed' })
    }
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    setUploadResult(undefined)
    let text: string
    try {
      text = await file.text()
    } catch {
      setUploadResult({ status: 'refused', message: 'A fájlt nem sikerült beolvasni.' })
      return
    }
    const read = readQuizFile(text)
    if (read.ok) await save(read, false)
    else setUploadResult({ status: 'refused', message: read.message })
  }


  const create = () => {
    const state: NewQuizState = { newQuizName: name.trim() }
    navigate(`/szerkeszto/${encodeURIComponent(subject)}/${difficulty}`, { state })
  }

  return (
    <Screen title="Szerkesztő mód">
      {subjectsError && <Alert severity="error">Nem sikerült betölteni a tantárgyakat.</Alert>}
      {!subjectsError && !subjects && <CircularProgress sx={{ alignSelf: 'center' }} />}
      {subjects?.length === 0 && <Alert severity="info">Még nincs egyetlen tantárgy sem. A Beállításokban hozhatsz létre.</Alert>}
      {subjects && subjects.length > 0 && (
        <TextField
          select
          label="Tantárgy"
          value={subject}
          onChange={(event) => {
            setSearch({ tantargy: event.target.value }, { replace: true })
            setDifficulty('')
          }}
        >
          {subjects.map(({ key, name }) => (
            <MenuItem key={key} value={key}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      )}

      {quizzesError && <Alert severity="error">Nem sikerült betölteni a kvízeket.</Alert>}
      {subject && !quizzesError && !list && <CircularProgress sx={{ alignSelf: 'center' }} />}
      {list && (
        <>
          <Typography variant="h3" component="h2">
            Kvíz megnyitása
          </Typography>
          <Box>
            <Button variant="outlined" onClick={() => fileInput.current?.click()}>
              Feltöltés JSON-ből
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(event) => {
                void upload(event.target.files?.[0])
                // The same file can be chosen again.
                event.target.value = ''
              }}
            />
          </Box>
          {uploadResult?.status === 'saved' && (
            <Alert severity="success">
              Feltöltve: {uploadResult.difficulty}. szint – {uploadResult.name}.
            </Alert>
          )}
          {uploadResult?.status === 'refused' && <Alert severity="error">{uploadResult.message}</Alert>}
          {uploadResult?.status === 'failed' && <Alert severity="error">Nem sikerült feltölteni.</Alert>}
          {uploadResult?.status === 'invalid' && (
            <Alert severity="error">
              A fájl hibás, semmi nem mentődött:
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {uploadResult.errors.map((error, i) => (
                  <li key={i}>
                    {error.row !== undefined ? `${error.row + 1}. sor` : (fieldLabels[error.field] ?? error.field)}: {error.message}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          {list.length === 0 && <Alert severity="info">Ebben a tantárgyban még nincs kvíz.</Alert>}
          {list.length > 0 && (
            <Paper sx={{ overflow: 'hidden' }}>
              {list.map((quiz, i) => {
                const count = Object.values(quiz.question_counts).reduce((sum, n) => sum + (n ?? 0), 0)
                return (
                  <ButtonBase
                    key={quiz.difficulty}
                    component={RouterLink}
                    to={`/szerkeszto/${encodeURIComponent(subject)}/${quiz.difficulty}`}
                    sx={{
                      width: '100%', minHeight: 56, px: 2, py: 1, gap: 1.5, justifyContent: 'space-between', textAlign: 'left',
                      borderTop: i > 0 ? 1 : 0, borderColor: 'divider', '&:hover': { bgcolor: 'grey.50' },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {quiz.difficulty} – {quiz.name}
                      </Typography>
                      <Typography variant="caption" component="p" color="text.secondary">
                        {count} kérdés
                      </Typography>
                    </Box>
                    <Typography color="text.secondary" aria-hidden>
                      ›
                    </Typography>
                  </ButtonBase>
                )
              })}
            </Paper>
          )}

          <Typography variant="h3" component="h2" sx={{ pt: 1 }}>
            Új kvíz
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <TextField label="Név" value={name} onChange={(event) => setName(event.target.value)} />
              <TextField
                select
                label="Szint"
                value={difficulty}
                onChange={(event) => setDifficulty(Number(event.target.value))}
                helperText="Csak a még szabad szintek választhatók."
              >
                {freeDifficulties.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="contained" disabled={!name.trim() || difficulty === ''} onClick={create}>
                Létrehozás
              </Button>
            </Stack>
          </Paper>
        </>
      )}
      <ConfirmDialog
        open={pendingUpload !== undefined}
        title="Foglalt szint"
        confirmLabel="Felülírás"
        onConfirm={() => pendingUpload && save(pendingUpload, true)}
        onCancel={() => setPendingUpload(undefined)}
      >
        A(z) {pendingUpload?.difficulty}. szinten már van kvíz{occupant && <>: „{occupant.name}”</>}. Felülírod? A régi kvíz elvész.
      </ConfirmDialog>
    </Screen>
  )
}
