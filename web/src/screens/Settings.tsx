import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material'
import { createSubject, exportUrl, fetchSubjects, saveSubjectSettings, takeOverFromSource, type SeedItem, type Subject } from '../api.ts'
import Screen from './Screen.tsx'

/** Subjects' settings, and creating a new Subject. */
export default function Settings() {
  const [subjects, setSubjects] = useState<Subject[]>()
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    fetchSubjects().then(setSubjects, () => setError(true))
  }, [])
  useEffect(load, [load])

  return (
    <Screen title="Beállítások">
      <Typography variant="h3" component="h2">
        Tantárgyak
      </Typography>
      {error && <Alert severity="error">Nem sikerült betölteni a tantárgyakat.</Alert>}
      {!error && !subjects && <CircularProgress sx={{ alignSelf: 'center' }} />}
      {subjects?.length === 0 && <Alert severity="info">Még nincs egyetlen tantárgy sem.</Alert>}
      {subjects?.map((subject) => <SubjectSettings key={subject.key} subject={subject} />)}

      <Typography variant="h3" component="h2" sx={{ pt: 1 }}>
        Új tantárgy
      </Typography>
      <NewSubject takenKeys={subjects?.map(({ key }) => key) ?? []} onCreated={load} />

      <Typography variant="h3" component="h2" sx={{ pt: 1 }}>
        Biztonsági mentés
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Az összes tantárgy, kvíz és eredmény egyetlen ZIP-fájlban.
          </Typography>
          <Button variant="outlined" href={exportUrl} download>
            Adatok letöltése
          </Button>
        </Stack>
      </Paper>

      <Typography variant="h3" component="h2" sx={{ pt: 1 }}>
        Átvétel a forrásból
      </Typography>
      <TakeOver onDone={load} />
    </Screen>
  )
}

/** Copies the Quizzes and Subjects missing from the data directory from the initial-data source. */
function TakeOver({ onDone }: { onDone: () => void }) {
  const [items, setItems] = useState<SeedItem[]>()
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    setFailed(false)
    try {
      setItems(await takeOverFromSource())
      onDone()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography color="text.secondary">
          A forrásban lévő, de még hiányzó kvízeket és tantárgyakat átmásolja. A meglévőket nem írja felül.
        </Typography>
        {failed && <Alert severity="error">Nem sikerült az átvétel.</Alert>}
        {items?.length === 0 && <Alert severity="info">Nem volt új kvíz vagy tantárgy.</Alert>}
        {items && items.length > 0 && (
          <Alert severity="success">
            Átvéve:
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {items.map((item) => (
                <li key={`${item.subject}/${item.difficulty ?? 'subject'}`}>
                  {item.difficulty === null
                    ? `Új tantárgy: ${item.name} (${item.subject})`
                    : `${item.subject}, ${item.difficulty}. szint: ${item.name}`}
                </li>
              ))}
            </ul>
          </Alert>
        )}
        <Button variant="outlined" disabled={busy} onClick={run}>
          Átvétel a forrásból
        </Button>
      </Stack>
    </Paper>
  )
}

type Status = 'saving' | 'saved' | 'failed'

function SubjectSettings({ subject }: { subject: Subject }) {
  const [maxQuestions, setMaxQuestions] = useState(String(subject.max_questions))
  const [autoAdvance, setAutoAdvance] = useState(subject.auto_advance)
  const [saved, setSaved] = useState({ max_questions: subject.max_questions, auto_advance: subject.auto_advance })
  const [status, setStatus] = useState<Status>()

  const max = Number(maxQuestions)
  const maxValid = Number.isInteger(max) && max >= 1
  const changed = max !== saved.max_questions || autoAdvance !== saved.auto_advance

  const save = async () => {
    const settings = { max_questions: max, auto_advance: autoAdvance }
    setStatus('saving')
    try {
      const outcome = await saveSubjectSettings(subject.key, settings)
      if (outcome.status !== 'saved') throw new Error(outcome.status)
      setSaved(settings)
      setStatus('saved')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontWeight: 600 }}>{subject.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            Kulcs: {subject.key}
          </Typography>
        </Box>
        <TextField
          label="Kérdések száma egy gyakorlásban (legfeljebb)"
          type="number"
          value={maxQuestions}
          onChange={(event) => {
            setMaxQuestions(event.target.value)
            setStatus(undefined)
          }}
          error={!maxValid}
          helperText={maxValid ? undefined : 'Legalább 1 egész szám.'}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={autoAdvance}
              onChange={(event) => {
                setAutoAdvance(event.target.checked)
                setStatus(undefined)
              }}
            />
          }
          label="Automatikus továbblépés (2 mp után)"
        />
        {status === 'saved' && <Alert severity="success">Mentve.</Alert>}
        {status === 'failed' && <Alert severity="error">Nem sikerült menteni.</Alert>}
        <Button variant="contained" disabled={!changed || !maxValid || status === 'saving'} onClick={save}>
          Mentés
        </Button>
      </Stack>
    </Paper>
  )
}

const keyPattern = /^[a-z0-9-]+$/

function NewSubject({ takenKeys, onCreated }: { takenKeys: string[]; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [problem, setProblem] = useState<string>()
  const [created, setCreated] = useState<string>()
  const [saving, setSaving] = useState(false)

  const keyProblem = key === ''
    ? undefined
    : !keyPattern.test(key)
      ? 'Csak kisbetű (a–z), számjegy (0–9) és - jel lehet.'
      : takenKeys.includes(key)
        ? 'Ez a kulcs már foglalt.'
        : undefined

  const create = async () => {
    setSaving(true)
    setProblem(undefined)
    try {
      const outcome = await createSubject(key, name.trim())
      if (outcome.status === 'saved') {
        setCreated(name.trim())
        setName('')
        setKey('')
        onCreated()
      } else if (outcome.status === 'conflict') {
        setProblem('Ez a kulcs már foglalt.')
      } else {
        setProblem(outcome.errors.map((error) => error.message).join(' '))
      }
    } catch {
      setProblem('Nem sikerült létrehozni a tantárgyat.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <TextField
          label="Megjelenített név"
          placeholder="pl. Történelem"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setCreated(undefined)
          }}
        />
        <TextField
          label="Kulcs"
          placeholder="pl. history"
          value={key}
          onChange={(event) => {
            setKey(event.target.value)
            setCreated(undefined)
          }}
          error={keyProblem !== undefined}
          helperText={keyProblem ?? 'Kisbetű (a–z), számjegy (0–9) és - jel. Később nem változtatható.'}
          slotProps={{ htmlInput: { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false } }}
        />
        {problem && <Alert severity="error">{problem}</Alert>}
        {created && <Alert severity="success">A(z) „{created}” tantárgy létrejött.</Alert>}
        <Button
          variant="contained"
          disabled={!name.trim() || !key || keyProblem !== undefined || saving}
          onClick={create}
        >
          Létrehozás
        </Button>
      </Stack>
    </Paper>
  )
}
