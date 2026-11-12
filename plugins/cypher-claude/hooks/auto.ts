// When the pane opens by itself: Claude has been working for a while, so the
// person is waiting, and the room is put beside the chat without a command.
// `/cypher auto off` stops it, `/cypher auto on` brings it back, and
// `/cypher auto` says which it is. Shared by register.tsx and its tests.

// How long a turn runs before the pane opens. A short answer opens nothing.
const DWELL_SECONDS = 15
const MS_PER_SECOND = 1000
export const DWELL_MS = DWELL_SECONDS * MS_PER_SECOND

export type Auto = {
  // The stored setting; on until the person turns it off.
  enabled: boolean
  // The pane is already up (and so is the room).
  open: boolean
}

// The whole policy. A pane the person closed comes back on the next long
// turn: closing it is for now, and `/cypher auto off` is for good.
export function opensByItself(auto: Auto): boolean {
  return auto.enabled && !auto.open
}

export type AutoWord = 'on' | 'off' | 'status'

const WORD = 'auto'
const WORDS: Readonly<Record<string, AutoWord>> = { '': 'status', on: 'on', off: 'off' }

// `/cypher auto`, `/cypher auto on`, `/cypher auto off`; anything else is an
// invite or nothing, and is /cypher's own to read.
export function autoWord(args: string): AutoWord | null {
  const [first = '', second = '', ...rest] = args.trim().toLowerCase().split(' ').filter(Boolean)
  if (first !== WORD || rest.length > 0) return null
  return WORDS[second] ?? null
}

export const AUTO_SAYS: Readonly<Record<AutoWord, (enabled: boolean) => string>> = {
  on: () => 'cypher opens by itself while Claude works · /cypher auto off stops it',
  off: () => 'cypher stays closed until you run /cypher · /cypher auto on brings it back',
  status: enabled => `cypher opening by itself is ${enabled ? 'on' : 'off'} · /cypher auto ${enabled ? 'off' : 'on'} changes it`,
}

// Said each time the pane opens by itself. The first time ever, the way to
// stop it follows; after that it is in the pane's settings and the README.
export const OPENED_ITSELF = "claude's cooking. come hang in cypher."
export const OPENED_FIRST = `${OPENED_ITSELF} · /cypher auto off to stop`
