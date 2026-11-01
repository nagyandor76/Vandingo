import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router'
import { Alert, Box, Button, ButtonBase, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { fetchQuizzes, fetchSubjects, type QuizSummary, type Subject } from '../api.ts'
import Screen from './Screen.tsx'

const difficulties = Array.from({ length: 20 }, (_, i) => i + 1)

/** What the Quiz editor needs to start a Quiz that isn't saved yet. */
export interface NewQuizState {
  newQuizName: string
}

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
    </Screen>
  )
}
