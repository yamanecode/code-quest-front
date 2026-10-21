// Short feedback tones made with the Web Audio API (no audio files).
// Sound is never the only feedback: the page always shows text too.

export type Tone = 'correct' | 'levelUp' | 'badge'

// Notes in Hz, played one after the other.
const TONES: Record<Tone, number[]> = {
  correct: [660, 880],
  levelUp: [523, 659, 784, 1047],
  badge: [880, 1175, 1568],
}

const NOTE_SECONDS = 0.12
const VOLUME = 0.15

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (context) return context
  const AudioContextClass = globalThis.AudioContext
  if (typeof AudioContextClass !== 'function') return null
  context = new AudioContextClass()
  return context
}

export function playTone(tone: Tone, options: { muted: boolean }): void {
  if (options.muted) return
  try {
    const audio = getContext()
    if (!audio) return
    TONES[tone].forEach((frequency, index) => {
      const start = audio.currentTime + index * NOTE_SECONDS
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(VOLUME, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + NOTE_SECONDS)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start(start)
      oscillator.stop(start + NOTE_SECONDS)
    })
  }
  catch {
    // Some browsers block audio until the user interacts; the text feedback is enough.
  }
}
