// Whether readings aloud are on, on this device: set on the Settings screen, kept by the browser, never on the server.
// The Block sounds play either way.

/** The part of the browser's storage this needs. */
type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>

const key = 'vandingo.readings'

/** Whether readings aloud are on here: on unless turned off, and on where the browser keeps nothing. */
export function readingsOn(store = browserStore()): boolean {
  try {
    return store?.getItem(key) !== 'off'
  } catch {
    return true
  }
}

/** Turns readings aloud on or off here; where the browser keeps nothing, it stays as it was. */
export function setReadingsOn(on: boolean, store = browserStore()) {
  try {
    store?.setItem(key, on ? 'on' : 'off')
  } catch {
    // Storage blocked or full: the setting stays as it was.
  }
}

/** The browser's storage, if there is one and it may be used (private windows and blocked site data may refuse it). */
function browserStore(): KeyValueStore | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}
