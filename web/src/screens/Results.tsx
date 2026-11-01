import { useEffect, useState } from 'react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router'
import { Alert, Box, ButtonBase, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { fetchResult, fetchResults, fetchSubjects, type Result, type Subject } from '../api.ts'
import { formatTime } from '../format.ts'
import { participants, type Participant } from '../participants.ts'
import { namesLabel, rangeLabel } from '../resultLabels.ts'
import { isPassed } from '../practice/engine.ts'
import ParticipantPicker from './ParticipantPicker.tsx'
import Screen from './Screen.tsx'

const listLength = 10

/** The Subjects' display names by key; a key stands for itself until the names arrive. */
function useSubjectNames() {
  const [names, setNames] = useState<Record<string, string>>({})
  useEffect(() => {
    fetchSubjects().then(
      (subjects: Subject[]) => setNames(Object.fromEntries(subjects.map(({ key, name }) => [key, name]))),
      () => {},
    )
  }, [])
  return (key: string) => names[key] ?? key
}

const formatDate = (iso: string) => new Date(iso).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })

/** A Participant's latest Results, newest first. The Participant is kept in the URL, so coming back from a Result keeps it. */
export function ResultList() {
  const [search, setSearch] = useSearchParams()
  const picked = search.get('kitolto')
  const participant = participants.find((name) => name === picked) ?? null
  const subjectName = useSubjectNames()
  const [results, setResults] = useState<{ participant: Participant; list: Result[] }>()
  const [failedFor, setFailedFor] = useState<Participant>()

  useEffect(() => {
    if (!participant) return
    let current = true
    fetchResults(participant, listLength).then(
      (list) => current && setResults({ participant, list }),
      () => current && setFailedFor(participant),
    )
    return () => {
      current = false
    }
  }, [participant])

  const list = results?.participant === participant ? results.list : undefined
  const error = participant !== null && failedFor === participant

  return (
    <Screen title="Eredmény böngésző">
      <ParticipantPicker value={participant} onChange={(name) => setSearch({ kitolto: name }, { replace: true })} />
      {error && <Alert severity="error">Nem sikerült betölteni az eredményeket.</Alert>}
      {participant && !error && !list && <CircularProgress sx={{ alignSelf: 'center' }} />}
      {list?.length === 0 && <Alert severity="info">{participant} még nem töltött ki gyakorlást.</Alert>}
      {list && list.length > 0 && (
        <Paper sx={{ overflow: 'hidden' }}>
          {list.map((result, i) => {
            const passed = isPassed(result)
            const names = namesLabel(result.quizNameFrom, result.quizNameTo)
            return (
              <ButtonBase
                key={result.id}
                component={RouterLink}
                to={`/eredmenyek/${result.id}`}
                sx={{
                  width: '100%', minHeight: 64, px: 2, py: 1.25, gap: 1.5, justifyContent: 'space-between', textAlign: 'left',
                  borderTop: i > 0 ? 1 : 0, borderColor: 'divider', '&:hover': { bgcolor: 'grey.50' },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600 }}>
                    {subjectName(result.subject)} · {rangeLabel(result.difficultyFrom, result.difficultyTo)}
                  </Typography>
                  {names && (
                    <Typography variant="body2" noWrap color="text.secondary">
                      {names}
                    </Typography>
                  )}
                  <Typography variant="caption" component="p" color="text.secondary">
                    {formatDate(result.completedAt)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: passed ? 'success.main' : 'text.primary' }}>
                    {result.scorePercent}%
                  </Typography>
                  <Typography variant="caption" component="p" sx={{ color: passed ? 'success.main' : 'text.secondary' }}>
                    {passed ? '✓ Teljesítve' : 'Nem teljesítve'}
                  </Typography>
                </Box>
              </ButtonBase>
            )
          })}
        </Paper>
      )}
    </Screen>
  )
}

/** Everything a Result records. */
export function ResultDetails() {
  const { id } = useParams()
  const subjectName = useSubjectNames()
  const [result, setResult] = useState<Result | null>()

  useEffect(() => {
    fetchResult(id!).then(setResult, () => setResult(null))
  }, [id])

  const back = result ? `/eredmenyek?kitolto=${encodeURIComponent(result.participant)}` : '/eredmenyek'

  if (result === undefined) {
    return (
      <Screen title="Eredmény" back={back}>
        <CircularProgress sx={{ alignSelf: 'center' }} />
      </Screen>
    )
  }
  if (result === null) {
    return (
      <Screen title="Eredmény" back={back}>
        <Alert severity="error">Nem sikerült betölteni az eredményt.</Alert>
      </Screen>
    )
  }

  const passed = isPassed(result)
  const names = namesLabel(result.quizNameFrom, result.quizNameTo)
  const rows: [string, string][] = [
    ['Kitöltő', result.participant],
    ['Tantárgy', subjectName(result.subject)],
    ['Időpont', formatDate(result.completedAt)],
    ['Tartomány', rangeLabel(result.difficultyFrom, result.difficultyTo)],
    ...(names ? [['Quiz', names] as [string, string]] : []),
    ['Kérdések', String(result.total)],
    ['Helyes', String(result.correct)],
    ['Hibás', String(result.incorrect)],
    ['Időkeret', formatTime(result.timeLimitSeconds)],
    ['Felhasznált idő', formatTime(result.elapsedSeconds)],
  ]

  return (
    <Screen title="Eredmény" back={back}>
      <Paper sx={{ p: 2.5, textAlign: 'center', ...(passed && { borderColor: 'success.main', bgcolor: 'success.soft' }) }}>
        <Typography variant="h1" component="p" sx={{ fontSize: 48, color: passed ? 'success.main' : 'text.primary' }}>
          {result.scorePercent}%
        </Typography>
        <Typography variant="h3" component="p" sx={{ color: passed ? 'success.main' : 'text.secondary' }}>
          {passed ? 'Teljesítve!' : 'Nem teljesítve'}
        </Typography>
      </Paper>
      <Paper component="dl" sx={{ m: 0, overflow: 'hidden' }}>
        {rows.map(([label, value], i) => (
          <Stack
            key={label}
            direction="row"
            sx={{ px: 2, py: 1.25, justifyContent: 'space-between', gap: 2, borderTop: i > 0 ? 1 : 0, borderColor: 'divider' }}
          >
            <Typography component="dt" color="text.secondary">
              {label}
            </Typography>
            <Typography component="dd" sx={{ m: 0, fontWeight: 600, textAlign: 'right' }}>
              {value}
            </Typography>
          </Stack>
        ))}
      </Paper>
    </Screen>
  )
}
