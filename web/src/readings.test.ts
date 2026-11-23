import { describe, expect, it } from 'vitest'
import { readingsOn, setReadingsOn } from './readings.ts'

/** An in-memory stand-in for the browser's storage. */
function memoryStore() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

describe('readings on this device', () => {
  it('are on until turned off, and stay as last set', () => {
    const store = memoryStore()
    expect(readingsOn(store)).toBe(true)

    setReadingsOn(false, store)
    expect(readingsOn(store)).toBe(false)

    setReadingsOn(true, store)
    expect(readingsOn(store)).toBe(true)
  })

  it('are on where the browser keeps nothing, and turning them off there fails quietly', () => {
    const refusing = {
      getItem: (): string | null => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }

    expect(() => setReadingsOn(false, refusing)).not.toThrow()
    expect(readingsOn(refusing)).toBe(true)
  })
})
