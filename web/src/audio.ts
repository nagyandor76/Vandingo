// A thin adapter over the browser's speech synthesis and Web Audio: the Practice's audio port in the browser.
// The Practice decides what to read aloud and when; this is where it is spoken and where the Block sounds are played.

import type { Speech } from './practice/engine.ts'

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined

/** Reads the text aloud in its language (e.g. `en-GB`), cutting off whatever was being read. */
export function speak({ text, lang }: Speech) {
  if (!synth) return
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  // Some Android browsers ignore `lang` unless a voice of that language is picked explicitly.
  const voices = synth.getVoices()
  const voice =
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
  if (voice) utterance.voice = voice
  synth.speak(utterance)
}

export function stopSpeaking() {
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

/** The sound after a scored Block: a rising chime if every answer was correct, a low buzz if not. */
export function playBlockSound(allCorrect: boolean) {
  const ctx = audioContext()
  if (!ctx) return
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
    oscillator.stop(at + length + 0.02)
  }
}
