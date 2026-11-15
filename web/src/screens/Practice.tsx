import { type RefObject, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { Alert, alpha, Box, Button, ButtonBase, CircularProgress, Paper, Stack, Typography, useTheme } from '@mui/material'
import { fetchQuestions, fetchQuizzes, fetchSubjects, saveResult } from '../api.ts'
import { playBlockSound, speak, stopSpeaking } from '../audio.ts'
import {
  createPractice,
  type Block,
  type BlockQuestion,
  type Practice as PracticeModule,
  type PracticeResult,
  type PracticeSnapshot,
  type SaveStatus,
  type Selection,
  type Side,
  type SpellingView,
  type TrueFalseAnswer,
} from '../practice/practice.ts'
import { formatTime } from '../format.ts'
import Screen from './Screen.tsx'

const data = { fetchSubjects, fetchQuestions, fetchQuizzes, saveResult }
const audio = { speak, stop: stopSpeaking, playBlockSound }

const loading: PracticeSnapshot = { phase: 'loading' }
const noSubscription = () => () => {}
const loadingSnapshot = () => loading

/** The Practice shown on this screen, from its start until the screen is left. */
function usePractice(participant: string, subject: string, from: number, to: number, complete: boolean) {
  const [practice, setPractice] = useState<PracticeModule>()
  useEffect(() => {
    if (!complete) return
    const started = createPractice({ participant, subject, from, to }, { data, audio })
    setPractice(started)
    return () => started.dispose()
  }, [participant, subject, from, to, complete])
  const snapshot = useSyncExternalStore(practice?.subscribe ?? noSubscription, practice?.getSnapshot ?? loadingSnapshot)
  return { practice, snapshot }
}

/** One Practice, from the first Block to the summary. Leaving before the end saves nothing. */
export default function Practice() {
  const [params] = useSearchParams()
  const participant = params.get('participant') ?? ''
  const subject = params.get('subject') ?? ''
  const from = Number(params.get('from'))
  const to = Number(params.get('to'))
  // Only reachable from the start screen; a hand-typed address may lack any of these.
  const complete = Boolean(participant && subject && from && to)
  const { practice, snapshot } = usePractice(participant, subject, from, to, complete)

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
  if (snapshot.phase === 'load-failed') {
    return (
      <Screen title="Gyakorlás">
        <Alert severity="error">Nem sikerült betölteni a kérdéseket.</Alert>
      </Screen>
    )
  }
  if (!practice || snapshot.phase === 'loading') {
    return (
      <Screen title="Gyakorlás">
        <CircularProgress sx={{ alignSelf: 'center' }} />
      </Screen>
    )
  }
  if (snapshot.phase === 'empty') {
    return (
      <Screen title="Gyakorlás">
        <Alert severity="info">Ebben a tartományban nincs elég kitölthető kérdés.</Alert>
      </Screen>
    )
  }
  if (snapshot.phase === 'finished') {
    return <Summary result={snapshot.result} passed={snapshot.passed} saveStatus={snapshot.saveStatus} onRetry={practice.retrySave} />
  }

  const { block, blockIndex, blockCount, progress, correctInBlock, remainingSeconds, resultReady, timedOut } = snapshot
  const allCorrect = block.allCorrect

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
          sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: remainingSeconds <= 10 ? 'error.main' : 'text.primary' }}
        >
          {formatTime(remainingSeconds)}
        </Typography>
      </Stack>

      <Stack spacing={1.25} sx={{ px: 2, py: 2, flex: 1, maxWidth: 600, width: '100%', mx: 'auto' }}>
        <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="h3" component="h1">
            {titles[block.type]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {snapshot.subjectName} · {blockIndex + 1}/{blockCount}
          </Typography>
        </Stack>
        {block.type === 'word-matching' ? (
          <WordMatching block={block} selection={snapshot.selection} onTap={practice.tap} />
        ) : block.type === 'spelling' && snapshot.spelling ? (
          <Spelling
            key={blockIndex}
            block={block}
            spelling={snapshot.spelling}
            onPlace={practice.place}
            onTakeBack={practice.takeBack}
            onReadAloud={() => practice.readAloud(0)}
          />
        ) : (
          block.questions.map((entry, i) => (
            <Statement
              key={`${blockIndex}-${i}`}
              entry={entry}
              closed={block.closed}
              onAnswer={(value) => practice.answer(i, value)}
              onReadAloud={() => practice.readAloud(i)}
            />
          ))
        )}
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
              {timedOut ? 'Lejárt az idő. ' : ''}
              {allCorrect ? 'Mind helyes.' : `${correctInBlock} / ${block.questions.length} helyes`}
            </Typography>
          )}
          {block.closed ? (
            <Button variant="contained" color={allCorrect ? 'primary' : 'error'} sx={{ minWidth: 140 }} onClick={practice.next}>
              {resultReady ? 'Eredmény' : 'Következő'}
            </Button>
          ) : hints[block.type] ? (
            // These Blocks are scored by themselves: once every word is paired, or the word is spelled.
            <>
              <Typography color="text.secondary" sx={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center' }}>
                {hints[block.type]}
              </Typography>
              {block.type === 'spelling' && (
                <Button variant="outlined" aria-label="Utolsó betű vissza" sx={{ minWidth: 64, fontSize: 20 }} onClick={practice.takeBackLast}>
                  ⌫
                </Button>
              )}
            </>
          ) : (
            <Button variant="contained" fullWidth onClick={practice.close}>
              Kész
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  )
}

const titles: Partial<Record<Block['type'], string>> = {
  'true-false': 'Igaz vagy hamis?',
  'word-matching': 'Párosítsd össze!',
  spelling: 'Rakd ki angolul!',
}

/** What to do in a Block that is scored by itself, without a „Kész” button. */
const hints: Partial<Record<Block['type'], string>> = {
  'word-matching': 'Koppints egy szóra, majd a párjára.',
  spelling: 'Koppints a betűkre sorban.',
}

const answerLabels: Record<TrueFalseAnswer, string> = { true: 'Igaz', false: 'Hamis' }

/**
 * One true–false statement; tapping its text reads it aloud again. Once closed, a correct one turns green
 * with the given answer marked; a wrong or missing one turns red with the correct answer marked, in red.
 */
function Statement({ entry, closed, onAnswer, onReadAloud }: {
  entry: BlockQuestion
  closed: boolean
  onAnswer: (value: TrueFalseAnswer) => void
  onReadAloud: () => void
}) {
  const tone = !closed ? undefined : entry.correct ? 'success' : 'error'
  const marked = closed && !entry.correct ? entry.question.answer[0] : entry.given

  return (
    <Paper sx={{ p: 1.5, ...(tone && { borderColor: `${tone}.main`, bgcolor: `${tone}.soft` }) }}>
      <Typography
        onClick={onReadAloud}
        sx={{ fontWeight: 500, mb: 1.25, ...(entry.question.speak_text && { cursor: 'pointer' }) }}
      >
        {entry.question.text}
      </Typography>
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

/**
 * A word-matching Block: the English words on the left, their meanings shuffled on the right.
 * Two taps make a pair, starting on either side; tapping a paired item takes its pair apart.
 * Once scored, each pair turns green or red; an unpaired item (time ran out) is red.
 */
function WordMatching({ block, selection, onTap }: { block: Block; selection?: Selection; onTap: (side: Side, index: number) => void }) {
  const wordOf = (meaning: number) => {
    const word = block.questions.findIndex((entry) => entry.paired === meaning)
    return word < 0 ? undefined : word
  }

  const tile = (side: Side, index: number, text: string, word: number | undefined) => (
    <Tile
      key={`${side}-${index}`}
      text={text}
      pairNumber={word === undefined ? undefined : word + 1}
      tone={!block.closed ? undefined : word !== undefined && block.questions[word].correct ? 'success' : 'error'}
      selected={selection?.side === side && selection.index === index}
      onClick={() => onTap(side, index)}
    />
  )

  return (
    <Stack direction="row" spacing={1.25}>
      <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
        {block.questions.map((entry, i) =>
          tile('word', i, entry.question.text, entry.paired === undefined ? undefined : i),
        )}
      </Stack>
      <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
        {block.meaningOrder!.map((meaning) => tile('meaning', meaning, block.questions[meaning].question.answer[0], wordOf(meaning)))}
      </Stack>
    </Stack>
  )
}

/** One word or meaning: a paired one shows its pair's number in a faded green, a scored one green or red. */
function Tile({ text, pairNumber, tone, selected, onClick }: {
  text: string
  pairNumber?: number
  tone?: 'success' | 'error'
  selected: boolean
  onClick: () => void
}) {
  const theme = useTheme()
  const { primary } = theme.palette
  // A paired item keeps the selection's green, faded; its number tells which pair it is in.
  const paired = pairNumber !== undefined
  const color = tone ? theme.palette[tone].main : selected ? primary.main : paired ? alpha(primary.main, 0.45) : theme.palette.divider

  return (
    <ButtonBase
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        minHeight: 56,
        px: 1.25,
        py: 1,
        gap: 1,
        justifyContent: 'flex-start',
        textAlign: 'left',
        borderRadius: 1,
        border: `1.5px solid ${color}`,
        bgcolor: tone ? theme.palette[tone].soft : selected ? primary.soft : paired ? alpha(primary.soft, 0.5) : 'background.paper',
        boxShadow: selected ? `0 0 0 3px ${primary.soft}` : '0 1px 2px rgba(16,24,40,0.06)',
        transition: 'background-color 120ms, border-color 120ms, box-shadow 120ms',
        ...(tone && { pointerEvents: 'none' }),
      }}
    >
      {paired && (
        <Box
          sx={{
            flex: 'none',
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: tone ? 'common.white' : primary.dark,
            bgcolor: tone ? theme.palette[tone].main : primary.soft,
            ...(!tone && { border: `1px solid ${alpha(primary.main, 0.45)}` }),
          }}
        >
          {pairNumber}
        </Box>
      )}
      <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{text}</Typography>
    </ButtonBase>
  )
}

/**
 * A spelling Block: the Hungarian meaning, the answer line with its spaces and punctuation given, and the letter
 * tiles. A tapped tile fills the next empty slot and fades; a tapped letter in the answer line goes back. Once
 * scored, each letter turns green or red, a right one showing the word's own case; a wrong word shows the correct
 * one below. A scored word with a reading can be heard again; before scoring it is never read, as that would give
 * its spelling away.
 */
function Spelling({ block, spelling, onPlace, onTakeBack, onReadAloud }: {
  block: Block
  spelling: SpellingView
  onPlace: (tile: number) => void
  onTakeBack: (place: number) => void
  onReadAloud: () => void
}) {
  const answerLine = useRef<HTMLDivElement>(null)
  const width = useWidth(answerLine)
  const words = wordsOf(spelling.slots)
  // The longest word must fit on one line, so the slots shrink for it.
  const longest = Math.max(...words.map((word) => word.length))
  const slotWidth = fitSize(width, longest, slotGap, maxSlotWidth)
  const fontSize = Math.round(slotWidth * 0.8)
  return (
    <Stack spacing={2.5} sx={{ alignItems: 'center', pt: 1 }}>
      <Typography variant="h2" component="p" sx={{ textAlign: 'center' }}>
        {spelling.meaning}
      </Typography>
      <Stack
        ref={answerLine}
        direction="row"
        sx={{ width: '100%', flexWrap: 'wrap', justifyContent: 'center', columnGap: 2, rowGap: 1 }}
        aria-label="Válasz"
      >
        {width > 0 && words.map((word) => (
          // A line breaks only between words, never inside one.
          <Stack key={word[0].place} direction="row" sx={{ gap: `${slotGap}px` }}>
            {word.map(({ slot, place }) => {
              if ('given' in slot) {
                return (
                  <Box key={place} sx={{ display: 'grid', placeItems: 'end center', fontSize, fontWeight: 600 }}>
                    {slot.given}
                  </Box>
                )
              }
              const tone = slot.correct === undefined ? undefined : slot.correct ? 'success.main' : 'error.main'
              return (
                <ButtonBase
                  key={place}
                  onClick={() => onTakeBack(place)}
                  disabled={block.closed || slot.letter === undefined}
                  aria-label={slot.letter ? `${slot.letter} vissza` : 'üres hely'}
                  sx={{
                    width: slotWidth,
                    height: Math.round(slotWidth * 1.3),
                    display: 'grid',
                    placeItems: 'center',
                    fontSize,
                    fontWeight: 700,
                    borderBottom: 2,
                    borderColor: tone ?? 'text.secondary',
                    color: tone ?? 'text.primary',
                  }}
                >
                  {slot.letter}
                </ButtonBase>
              )
            })}
          </Stack>
        ))}
      </Stack>
      {(spelling.hearable || (spelling.correctWord && !block.allCorrect)) && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {spelling.correctWord && !block.allCorrect && (
            <Typography sx={{ fontWeight: 600 }}>
              Helyesen: <Box component="span" sx={{ color: 'success.main' }}>{spelling.correctWord}</Box>
            </Typography>
          )}
          {spelling.hearable && (
            <ButtonBase aria-label="Felolvasás" onClick={onReadAloud} sx={{ width: 44, height: 44, fontSize: 22, borderRadius: 1 }}>
              🔊
            </ButtonBase>
          )}
        </Stack>
      )}
      <LetterTiles tiles={spelling.tiles} closed={block.closed} onPlace={onPlace} />
    </Stack>
  )
}

/** The widest a letter slot of the answer line grows, and the gap between slots of a word. */
const maxSlotWidth = 28
const slotGap = 4

/** The answer line split into words at its spaces, each slot with its place in the whole line. */
function wordsOf(slots: SpellingView['slots']) {
  const words: { slot: SpellingView['slots'][number]; place: number }[][] = [[]]
  slots.forEach((slot, place) => {
    if ('given' in slot && slot.given === ' ') words.push([])
    else words.at(-1)!.push({ slot, place })
  })
  return words.filter((word) => word.length > 0)
}

/** The widest a letter tile grows, and the gap between tiles. */
const maxTileSize = 64
const tileGap = 6
/** The fewest rows that still leave tiles this big are used; if none does, the most rows, for the biggest tiles. */
const largeTileSize = 56
const maxTileRows = 3

/** How big each of `count` items in a row can be to fill the width with gaps between them, up to a limit. */
const fitSize = (width: number, count: number, gap: number, max: number) =>
  Math.min(max, Math.floor((width - (count - 1) * gap) / count))

/**
 * The letter tiles of a spelling Block, filling the width: in as few rows as keep them large, at most three, and as
 * big as the width allows up to a limit, so a short word gets large tiles in one row.
 */
function LetterTiles({ tiles, closed, onPlace }: {
  tiles: SpellingView['tiles']
  closed: boolean
  onPlace: (tile: number) => void
}) {
  const grid = useRef<HTMLDivElement>(null)
  const width = useWidth(grid)
  const columnsIn = (rows: number) => Math.ceil(tiles.length / rows)
  const fewerRows = Array.from({ length: maxTileRows - 1 }, (_, i) => i + 1)
  const rows = fewerRows.find((r) => fitSize(width, columnsIn(r), tileGap, maxTileSize) >= largeTileSize) ?? maxTileRows
  const columns = columnsIn(rows)
  const size = fitSize(width, columns, tileGap, maxTileSize)

  return (
    <Box
      ref={grid}
      sx={{ width: '100%', display: 'grid', justifyContent: 'center', gap: `${tileGap}px`, gridTemplateColumns: `repeat(${columns}, ${size}px)` }}
    >
      {width > 0 &&
        tiles.map((tile, i) => (
          <ButtonBase
            key={i}
            onClick={() => onPlace(i)}
            disabled={tile.used || closed}
            aria-label={tile.letter}
            sx={{
              width: size,
              height: size,
              borderRadius: 1,
              border: 1.5,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: '0 1px 2px rgba(16,24,40,0.06)',
              fontSize: Math.round(size * 0.45),
              fontWeight: 700,
              opacity: tile.used || closed ? 0.3 : 1,
              transition: 'opacity 120ms',
            }}
          >
            {tile.letter}
          </ButtonBase>
        ))}
    </Box>
  )
}

/**
 * The element's content width in pixels, kept up to date as it resizes; measured before the first paint, so what
 * depends on it never flashes empty.
 */
function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    setWidth(element.clientWidth)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return width
}

function Summary({ result, passed, saveStatus, onRetry }: {
  result: PracticeResult
  passed: boolean
  saveStatus: SaveStatus
  onRetry: () => void
}) {
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
