// When the pane opens by itself: the person has sent Claude a prompt, so they
// are about to wait, and the room is put beside the chat without a command.
// It opens as the prompt is sent because that is the one open Claude Code
// draws at any terminal width. The desktop app gets an invitation instead,
// once the turn has run long: its pane is not the room's own window.
// `/cypher auto off` stops it, `/cypher auto on` brings it back, and
// `/cypher auto` says which it is. Shared by register.tsx and its tests.

// How long a turn runs before the desktop app is invited. A short answer says nothing.
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
  on: () => 'cypher opens by itself when you send a prompt · /cypher auto off stops it',
  off: () => 'cypher stays closed until you run /cypher · /cypher auto on brings it back',
  status: enabled => `cypher opening by itself is ${enabled ? 'on' : 'off'} · /cypher auto ${enabled ? 'off' : 'on'} changes it`,
}

// Said the first time ever the pane opens by itself, with the way to stop it.
// After that the pane arriving is the whole message, and the way to stop it
// is in the pane's settings and the README.
export const OPENED_FIRST = "claude's cooking. come hang in cypher. · /cypher auto off to stop"
// All the mod says in the desktop app, which has no pane: on a long turn, and
// for /cypher. The room there is the Cypher connector's own window.
export const INVITED = 'claude is cooking. hang in cypher while you wait'
