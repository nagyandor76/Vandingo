import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Button, CircularProgress, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { fetchQuizzes, fetchSubjects, type QuizSummary, type Subject } from '../api.ts'
import { participants, type Participant } from '../participants.ts'
import { usableTypes, type QuestionType } from '../practice/engine.ts'
import Screen from './Screen.tsx'

/** Picks the Participant, the Subject and the inclusive Difficulty range of a Practice. */
export default function PracticeStart() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>()
  const [subjectsError, setSubjectsError] = useState(false)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [subject, setSubject] = useState('')
  const [quizzes, setQuizzes] = useState<QuizSummary[]>()
  const [quizzesError, setQuizzesError] = useState(false)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)

  useEffect(() => {
    fetchSubjects().then(setSubjects, () => setSubjectsError(true))
  }, [])

  useEffect(() => {
    if (!subject) return
    let current = true
    fetchQuizzes(subject).then(
      (list) => {
        if (!current) return
        setQuizzes(list)
        setFrom(list[0]?.difficulty ?? 0)
        setTo(list.at(-1)?.difficulty ?? 0)
      },
      () => current && setQuizzesError(true),
    )
    return () => {
      current = false
    }
  }, [subject])

  const changeSubject = (key: string) => {
    if (key === subject) return
    setSubject(key)
    setQuizzes(undefined)
    setQuizzesError(false)
  }

  const changeFrom = (difficulty: number) => {
    setFrom(difficulty)
    if (to < difficulty) setTo(difficulty)
  }

  const rangeCounts: Partial<Record<QuestionType, number>> = {}
  for (const quiz of quizzes ?? []) {
    if (quiz.difficulty < from || quiz.difficulty > to) continue
    for (const [type, count] of Object.entries(quiz.question_counts) as [QuestionType, number][]) {
      rangeCounts[type] = (rangeCounts[type] ?? 0) + count
    }
  }
  const startable = usableTypes(rangeCounts).length > 0
  const notEnough = quizzes !== undefined && quizzes.length > 0 && !startable

  const start = () => {
    const query = new URLSearchParams({ participant: participant!, subject, from: String(from), to: String(to) })
    navigate(`/kitoltes/gyakorlas?${query}`)
  }

  return (
    <Screen title="Kitöltés">
      {subjectsError && <Alert severity="error">Nem sikerült betölteni a tantárgyakat.</Alert>}
      {!subjectsError && !subjects && <CircularProgress sx={{ alignSelf: 'center' }} />}
      {subjects?.length === 0 && <Alert severity="info">Még nincs egyetlen tantárgy sem.</Alert>}
      {subjects && subjects.length > 0 && (
        <>
          <Stack spacing={1}>
            <Typography variant="h3" component="h2">
              Ki tölti ki?
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              color="primary"
              value={participant}
              onChange={(_, value: Participant | null) => value && setParticipant(value)}
              aria-label="Kitöltő"
            >
              {participants.map((name) => (
                <ToggleButton key={name} value={name} sx={{ minHeight: 48 }}>
                  {name}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          <TextField select label="Tantárgy" value={subject} onChange={(event) => changeSubject(event.target.value)}>
            {subjects.map(({ key, name }) => (
              <MenuItem key={key} value={key}>
                {name}
              </MenuItem>
            ))}
          </TextField>

          {quizzesError && <Alert severity="error">Nem sikerült betölteni a kvízeket.</Alert>}
          {subject && !quizzesError && !quizzes && <CircularProgress sx={{ alignSelf: 'center' }} />}
          {quizzes?.length === 0 && <Alert severity="info">Ebben a tantárgyban még nincs kvíz.</Alert>}
          {quizzes && quizzes.length > 0 && (
            <>
              <DifficultyPicker label="Kezdő szint" quizzes={quizzes} value={from} onChange={changeFrom} />
              <DifficultyPicker
                label="Záró szint"
                quizzes={quizzes.filter((quiz) => quiz.difficulty >= from)}
                value={to}
                onChange={setTo}
              />
            </>
          )}

          {notEnough && <Alert severity="warning">Ebben a tartományban nincs elég kitölthető kérdés.</Alert>}
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={!participant || !startable}
            onClick={start}
          >
            Start
          </Button>
        </>
      )}
    </Screen>
  )
}

function DifficultyPicker({ label, quizzes, value, onChange }: {
  label: string
  quizzes: QuizSummary[]
  value: number
  onChange: (difficulty: number) => void
}) {
  return (
    <TextField select label={label} value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {quizzes.map(({ difficulty, name }) => (
        <MenuItem key={difficulty} value={difficulty}>
          {difficulty} – {name}
        </MenuItem>
      ))}
    </TextField>
  )
}
