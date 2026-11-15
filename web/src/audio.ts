// A thin adapter over the browser's speech synthesis and Web Audio: the Practice's audio port in the browser.
// The Practice decides what to read aloud and when; this is where it is spoken and where the Block sounds are played.

import type { Speech } from './practice/engine.ts'

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined

/**
 * The reading in progress and how to settle its promise. Kept so that a cut-off reading settles even where the
 * browser fires no event for a cancelled utterance, and so the utterance isn't garbage-collected mid-reading
 * (which drops its `end` event in some Chrome versions).
 */
let reading: { utterance: SpeechSynthesisUtterance; settle: () => void } | undefined

function settleReading() {
  const current = reading
  reading = undefined
  current?.settle()
}

/**
 * Reads the text aloud in its language (e.g. `en-GB`), cutting off whatever was being read. Settles once the
 * reading is over: finished, cut off, or failed.
 */
export function speak({ text, lang }: Speech): Promise<void> {
  if (!synth) return Promise.resolve()
  settleReading()
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  // Some Android browsers ignore `lang` unless a voice of that language is picked explicitly.
  const voices = synth.getVoices()
  const voice =
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
  if (voice) utterance.voice = voice
  return new Promise((resolve) => {
    // Some browsers never fire `end` (iOS before audio is unlocked, Chrome on long texts): settle anyway, well
    // after any real reading of this text would have finished.
    const fallback = setTimeout(() => over(), readingFallbackMs(text))
    reading = {
      utterance,
      settle: () => {
        clearTimeout(fallback)
        resolve()
      },
    }
    const over = () => {
      if (reading?.utterance === utterance) settleReading()
    }
    utterance.onend = over
    utterance.onerror = over
    synth.speak(utterance)
  })
}

/** A generous upper bound on how long reading the text takes: far slower than any speech voice. */
const readingFallbackMs = (text: string) => 3000 + text.length * 250

export function stopSpeaking() {
  settleReading()
  synth?.cancel()
}

let context: AudioContext | undefined

/**
 * Mobile browsers (iOS Safari above all) only let a page make sound after a tap. The page's first tap,
 * wherever it lands, unlocks it, so speech and sounds that follow without a tap of their own are allowed too.
 */
function unlockAudio() {
  if (synth) synth.speak(new SpeechSynthesisUtterance(''))
  audioContext()?.resume()
}

if (typeof window !== 'undefined') window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true })

function audioContext() {
  if (!context && typeof AudioContext !== 'undefined') context = new AudioContext()
  return context
}

/**
 * The sound after a scored Block: a rising chime if every answer was correct, a low buzz if not. Settles once
 * the notes are scheduled to be over; timed by the clock rather than the notes' `ended` events, which a
 * suspended audio context would never fire.
 */
export function playBlockSound(allCorrect: boolean): Promise<void> {
  const ctx = audioContext()
  if (!ctx) return Promise.resolve()
  void ctx.resume()
  const notes = allCorrect
    ? [
        { frequency: 660, start: 0, length: 0.12 },
        { frequency: 880, start: 0.12, length: 0.22 },
      ]
    : [
        { frequency: 220, start: 0, length: 0.18 },
        { frequency: 185, start: 0.18, length: 0.3 },
      ]
  /** Each note fades out at its length and stops a moment later. */
  const stopOf = ({ start, length }: { start: number; length: number }) => start + length + 0.02
  for (const { frequency, start, length } of notes) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = allCorrect ? 'sine' : 'triangle'
    oscillator.frequency.value = frequency
    const at = ctx.currentTime + start
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(at)
    oscillator.stop(ctx.currentTime + stopOf({ start, length }))
  }
  const end = Math.max(...notes.map(stopOf))
  return new Promise((resolve) => setTimeout(resolve, end * 1000))
}
