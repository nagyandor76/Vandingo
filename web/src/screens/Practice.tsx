import { useCallback, useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { Alert, Box, Button, ButtonBase, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { fetchQuestions, fetchSubjects, saveResult, type NewResult } from '../api.ts'
import {
  answer,
  closeBlock,
  currentBlock,
  isPassed,
  next,
  startPractice,
  tick,
  type BlockQuestion,
  type PracticeResult,
  type PracticeState,
  type TrueFalseAnswer,
} from '../practice/engine.ts'
import Screen from './Screen.tsx'

type SaveStatus = 'saving' | 'saved' | 'failed'

/** One Practice, from the first Block to the summary. Leaving before the end saves nothing. */
export default function Practice() {
  const [params] = useSearchParams()
  const participant = params.get('participant') ?? ''
  const subject = params.get('subject') ?? ''
  const from = Number(params.get('from'))
  const to = Number(params.get('to'))
  // Only reachable from the start screen; a hand-typed address may lack any of these.
  const complete = Boolean(participant && subject && from && to)

  const [subjectName, setSubjectName] = useState('')
  const [state, setState] = useState<PracticeState>()
  const [loadError, setLoadError] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>()
  const savedResult = useRef<PracticeResult>(undefined)

  useEffect(() => {
    if (!complete) return
    let current = true
    Promise.all([fetchSubjects(), fetchQuestions(subject, from, to)]).then(
      ([subjects, questions]) => {
        const settings = subjects.find((s) => s.key === subject)
        if (!current) return
        if (!settings) return setLoadError(true)
        setSubjectName(settings.name)
        setState(startPractice({ questions, settings, random: Math.random, clock: Date.now }))
      },
      () => current && setLoadError(true),
    )
    return () => {
      current = false
    }
  }, [complete, subject, from, to])

  const running = state !== undefined && state.blocks.length > 0 && !state.result
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setState((s) => s && tick(s)), 250)
    return () => clearInterval(timer)
  }, [running])

  const result = state?.result
  const save = useCallback(() => {
    if (!result) return
    setSaveStatus('saving')
    const submitted: NewResult = { participant, subject, difficultyFrom: from, difficultyTo: to, ...result }
    saveResult(submitted).then(
      () => setSaveStatus('saved'),
      () => setSaveStatus('failed'),
    )
  }, [result, participant, subject, from, to])

  // The Result is saved as soon as there is one: after the last Block, or when time runs out.
  useEffect(() => {
    if (!result || savedResult.current === result) return
    savedResult.current = result
    save()
  }, [result, save])

  if (!complete) {
    return (
      <Screen title="Gyakorlás">
        <Alert severity="warning">Előbb válaszd ki a Kitöltőt, a tantárgyat és a szinteket.</Alert>
        <Button component={RouterLink} to="/kitoltes" variant="contained" fullWidth>
          Kitöltés
        </Button>
      </Screen>
    )
  }
  if (loadError) {
    return (
      <Screen title="Gyakorlás">
        <Alert severity="error">Nem sikerült betölteni a kérdéseket.</Alert>
      </Screen>
    )
  }
  if (!state) {
    return (
      <Screen title="Gyakorlás">
        <CircularProgress sx={{ alignSelf: 'center' }} />
      </Screen>
    )
  }
  if (state.blocks.length === 0) {
    return (
      <Screen title="Gyakorlás">
        <Alert severity="info">Ebben a tartományban nincs elég igaz–hamis kérdés; a szópárosítás hamarosan érkezik.</Alert>
      </Screen>
    )
  }
  if (state.finished) {
    return <Summary result={state.result!} saveStatus={saveStatus} onRetry={save} />
  }

  const block = currentBlock(state)
  const progress = (state.blockIndex + (block.closed ? 1 : 0)) / state.blocks.length
  const allCorrect = block.questions.every((entry) => entry.correct)
  const correctCount = block.questions.filter((entry) => entry.correct).length

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 2, pt: 2, maxWidth: 600, width: '100%', mx: 'auto' }}>
        <ButtonBase
          component={RouterLink}
          to="/"
          aria-label="Kilépés"
          sx={{ width: 40, height: 40, ml: -1, fontSize: 20, color: 'text.secondary', borderRadius: 1 }}
        >
          ✕
        </ButtonBase>
        <Box sx={{ flex: 1, height: 6, bgcolor: 'grey.200', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ width: `${progress * 100}%`, height: '100%', bgcolor: 'primary.main', transition: 'width 300ms' }} />
        </Box>
        <Typography
          aria-label="Hátralévő idő"
          sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: state.remainingSeconds <= 10 ? 'error.main' : 'text.primary' }}
        >
          {formatTime(state.remainingSeconds)}
        </Typography>
      </Stack>

      <Stack spacing={1.25} sx={{ px: 2, py: 2, flex: 1, maxWidth: 600, width: '100%', mx: 'auto' }}>
        <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="h3" component="h1">
            Igaz vagy hamis?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subjectName} · {state.blockIndex + 1}/{state.blocks.length}
          </Typography>
        </Stack>
        {block.questions.map((entry, i) => (
          <Statement
            key={`${state.blockIndex}-${i}`}
            entry={entry}
            closed={block.closed}
            onAnswer={(value) => setState((s) => s && answer(s, i, value))}
          />
        ))}
      </Stack>

      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          borderTop: 1,
          borderColor: block.closed ? (allCorrect ? 'success.main' : 'error.main') : 'divider',
          bgcolor: block.closed ? (allCorrect ? 'success.soft' : 'error.soft') : 'background.paper',
          px: 2,
          pt: 1.5,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ maxWidth: 600, mx: 'auto', alignItems: 'center' }}>
          {block.closed && (
            <Typography sx={{ flex: 1, fontWeight: 700, color: allCorrect ? 'success.main' : 'error.main' }}>
              {state.result && state.remainingSeconds === 0 ? 'Lejárt az idő. ' : ''}
              {allCorrect ? 'Mind helyes.' : `${correctCount} / ${block.questions.length} helyes`}
            </Typography>
          )}
          {block.closed ? (
            <Button
              variant="contained"
              color={allCorrect ? 'primary' : 'error'}
              sx={{ minWidth: 140 }}
              onClick={() => setState((s) => s && next(s))}
            >
              {state.result ? 'Eredmény' : 'Következő'}
            </Button>
          ) : (
            <Button variant="contained" fullWidth onClick={() => setState((s) => s && closeBlock(s))}>
              Kész
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  )
}

const answerLabels: Record<TrueFalseAnswer, string> = { true: 'Igaz', false: 'Hamis' }

/**
 * One true–false statement. Once closed, a correct one turns green with the given answer marked;
 * a wrong or missing one turns red with the correct answer marked, in red.
 */
function Statement({ entry, closed, onAnswer }: { entry: BlockQuestion; closed: boolean; onAnswer: (value: TrueFalseAnswer) => void }) {
  const tone = !closed ? undefined : entry.correct ? 'success' : 'error'
  const marked = closed && !entry.correct ? entry.question.answer[0] : entry.given

  return (
    <Paper sx={{ p: 1.5, ...(tone && { borderColor: `${tone}.main`, bgcolor: `${tone}.soft` }) }}>
      <Typography sx={{ fontWeight: 500, mb: 1.25 }}>{entry.question.text}</Typography>
      <Stack direction="row" spacing={1}>
        {(['true', 'false'] as const).map((value) => {
          const selected = marked === value
          const color = tone ?? 'primary'
          return (
            <Button
              key={value}
              variant="outlined"
              fullWidth
              aria-pressed={selected}
              disabled={closed && !selected}
              onClick={() => onAnswer(value)}
              sx={{
                ...(closed && { pointerEvents: 'none' }),
                ...(selected && {
                  borderColor: `${color}.main`,
                  color: color === 'primary' ? 'primary.dark' : `${color}.main`,
                  bgcolor: color === 'primary' ? 'primary.soft' : 'background.paper',
                  boxShadow: (theme) => `0 0 0 3px ${theme.palette[color].soft}`,
                  '&:hover': { borderColor: `${color}.main`, bgcolor: color === 'primary' ? 'primary.soft' : 'background.paper' },
                }),
              }}
            >
              {answerLabels[value]}
            </Button>
          )
        })}
      </Stack>
    </Paper>
  )
}

function Summary({ result, saveStatus, onRetry }: { result: PracticeResult; saveStatus?: SaveStatus; onRetry: () => void }) {
  const passed = isPassed(result)

  return (
    <Screen title="Eredmény">
      <Paper sx={{ p: 2.5, textAlign: 'center', ...(passed && { borderColor: 'success.main', bgcolor: 'success.soft' }) }}>
        <Typography variant="h1" component="p" sx={{ fontSize: 48, color: passed ? 'success.main' : 'text.primary' }}>
          {result.scorePercent}%
        </Typography>
        <Typography variant="h3" component="p" sx={{ color: passed ? 'success.main' : 'text.secondary' }}>
          {passed ? 'Teljesítve!' : 'Nem teljesítve'}
        </Typography>
      </Paper>
      <Stack direction="row" spacing={1.5}>
        <Tally label="Helyes" value={result.correct} color="success.main" />
        <Tally label="Hibás" value={result.incorrect} color="error.main" />
      </Stack>
      {saveStatus === 'saving' && <Alert severity="info">Mentés…</Alert>}
      {saveStatus === 'failed' && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Újra
            </Button>
          }
        >
          Nem sikerült elmenteni az eredményt.
        </Alert>
      )}
      <Button component={RouterLink} to="/kitoltes" variant="contained" size="large" fullWidth>
        Új gyakorlás
      </Button>
      <Button component={RouterLink} to="/" variant="outlined" fullWidth>
        Kezdőképernyő
      </Button>
    </Screen>
  )
}

function Tally({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
      <Typography variant="h2" component="p" sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  )
}

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
