// Cypher in a Claude Code pane. The host side: the /cypher command, the pane
// and its skin, the stored theme, and the broker between the pane and the
// helper process that holds the live connection.
//
//   /cypher        opens the pane and starts helper/cypher-helper.mjs
//   helper stdout  RoomView events (contract.ts), relayed to the pane as props
//   pane posts     intents, forwarded to the helper over its private socket
//   pane closed    the helper is stopped: you are in the room only while you
//                  can see it
//
// This module holds no credential and makes no decision about the room. No
// room text is returned to the model or written to a log.
import type { EngineInterface, HookStream, ProcessSpawnChunk, ProcessSpawnResult, Register } from 'claude-code'

import { isEvent, isIntent } from './contract'
import type { Event, Intent, RoomView } from './contract'
import { isProfile } from './profile'
import type { Profile } from './profile'
import type { Answer } from './session'
import { skinFor } from './skins'

type Engine = EngineInterface
type Helper = HookStream<ProcessSpawnChunk, ProcessSpawnResult>
type Link = { socket: string; token: string }

const COMMAND = 'cypher'
const PANE = 'cypher'
const TITLE = 'cypher'
const CLIENT_KEY = 'room'
const STORE_KEY = 'profile'
const HELPER = 'helper/cypher-helper.mjs'
const DEFAULT_ORIGIN = 'https://cypher.hoerl.org'
const NO_NODE = 'Cypher needs Node.js 22 or newer on your PATH · nodejs.org'
const STOPPED = 'disconnected · run /cypher to reconnect'
// The pane asks for half the terminal's width at a 3:2 shape. A cell is
// about twice as tall as it is wide, so 3:2 on screen is 3 columns per row.
// Requests, not grants: the dock takes the columns (capped at 45%), the
// inline pane takes the rows (and spans the full width), and view.tsx lays
// out in whatever it gets.
const SHARE = 2
const COLUMNS_PER_ROW = 3
const MIN_ROWS = 12
type Size = { rows: number; columns: number }

// Nothing to ask for until a terminal has been measured (headless, or a
// repaint before /cypher ran in this module's life).
function sizeFor(terminalColumns: number): Size | Record<string, never> {
  const columns = Math.floor(terminalColumns / SHARE)
  if (columns < 1) return {}
  return { columns, rows: Math.max(MIN_ROWS, Math.round(columns / COLUMNS_PER_ROW)) }
}

// ---- what the pane is drawn from -------------------------------------------

let profile: Profile | null = null
let size: Size | Record<string, never> = {}
let view: RoomView | null = null
let seq = 0
let answer: Answer | null = null
let problem: string | null = null
// The server, named only when it is not the default: CYPHER_ORIGIN can come
// from a project's settings, so the pane always says where it is talking.
let server: string | null = null

// ---- the helper ------------------------------------------------------------

let helper: Helper | null = null
let link: Link | null = null
// Which start is current: a stream from an older one is ignored.
let generation = 0

function redraw($: Engine) {
  $.ui.invalidate('ui.render')
}

// One line of the helper's stdout.
function take($: Engine, line: string) {
  let event: Event
  try {
    const parsed: unknown = JSON.parse(line)
    if (!isEvent(parsed)) return
    event = parsed
  } catch {
    return
  }
  if (event.type === 'ready') link = { socket: event.socket, token: event.token }
  else if (event.type === 'view') {
    view = event.view
    seq += 1
    problem = null
  } else problem = event.message
  redraw($)
}

// The helper is gone (it exited, or never started): say so, unless a newer
// start has replaced it.
function ended($: Engine, run: number, why: string) {
  if (run !== generation) return
  helper = null
  link = null
  problem ??= why
  redraw($)
}

// Reads the helper one piece at a time until it ends. Only stdout is read:
// stderr is dropped unread, so nothing the helper might print reaches a log.
// Each piece schedules the next read, so a long session builds no chain.
async function pump($: Engine, stream: Helper, run: number, buffer = '') {
  let step: IteratorResult<ProcessSpawnChunk, ProcessSpawnResult>
  try {
    step = await stream.next()
  } catch {
    // The first pull rejects when the child cannot start: no node on PATH.
    return ended($, run, NO_NODE)
  }
  if (run !== generation) return
  if (step.done) return ended($, run, STOPPED)
  if (step.value.stream !== 'stdout') return void pump($, stream, run, buffer)
  const lines = (buffer + step.value.text).split('\n')
  lines.slice(0, -1).forEach(line => take($, line))
  void pump($, stream, run, lines.at(-1) ?? '')
}

function hostOf(origin: string): string {
  try {
    return new URL(origin).host
  } catch {
    return origin
  }
}

// Set before the first await, so a second /cypher during a start waits its
// turn instead of starting a second helper.
let starting = false

async function startHelper($: Engine) {
  if (helper || starting) return
  starting = true
  try {
    const origin = (await $.env.get('CYPHER_ORIGIN')) || DEFAULT_ORIGIN
    const run = ++generation
    server = origin === DEFAULT_ORIGIN ? null : hostOf(origin)
    view = null
    problem = null
    const stream = $.process.spawn({ argv: ['node', `${$.plugin.root}/${HELPER}`, '--origin', origin] })
    helper = stream
    void pump($, stream, run)
  } finally {
    starting = false
  }
}

// Ending the loop is what kills the child (and with it the connection).
function stopHelper() {
  generation += 1
  const stream = helper
  helper = null
  link = null
  view = null
  if (stream) void close(stream)
}

async function close(stream: Helper) {
  try {
    await stream.return(undefined as never)
  } catch {
    // Already ended.
  }
}

// Hands one intent to the helper; the answer goes back to the pane.
async function forward($: Engine, id: number, intent: Intent) {
  let ok = false
  if (link) {
    try {
      const response = await $.http.fetch('http://cypher/intent', {
        method: 'POST',
        socketPath: link.socket,
        headers: { Authorization: `Bearer ${link.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(intent),
      })
      ok = response.ok && (JSON.parse(response.text) as { ok?: unknown }).ok === true
    } catch {
      ok = false
    }
  }
  answer = { id, ok }
  redraw($)
}

// ---- the pane ----------------------------------------------------------------

async function storedProfile($: Engine): Promise<Profile | null> {
  const saved: unknown = await $.store.get(STORE_KEY)
  return isProfile(saved) ? { theme: saved.theme } : null
}

// Opens the pane, or repaints an open one in the profile's skin; says
// whether a surface draws it. No closeOnEscape: closing leaves the room, so
// a stray Escape must not do it (the close mark and /exit do).
async function showPane($: Engine, focus: boolean): Promise<boolean> {
  const opened = await $.ui.open({
    id: PANE,
    title: TITLE,
    ...(focus ? { focus: true } : {}),
    ...size,
    backgroundColor: skinFor(profile?.theme).background,
  })
  // A Client takes the keys only from a click: $.ui.focus is refused for it.
  if (!opened.isPlaced) $.ui.log(`${COMMAND}: pane not placed: ${opened.reason}`, { to: 'debug' })
  return opened.isPlaced
}

// A post from the Client: an intent, a theme to keep, or the exit.
async function receive($: Engine, data: unknown) {
  const post = data as { id?: unknown; intent?: unknown; profile?: unknown; exit?: unknown } | null
  if (typeof post?.id === 'number' && isIntent(post.intent)) return forward($, post.id, post.intent)
  if (post?.exit === true) return $.ui.close({ id: PANE })
  if (!isProfile(post?.profile)) return
  const themeChanged = post.profile.theme !== profile?.theme
  profile = { theme: post.profile.theme }
  await $.store.set(STORE_KEY, profile)
  if (themeChanged) await showPane($, false)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    try {
      await $.command.register({
        name: COMMAND,
        description: 'Open the Cypher room in a pane beside the chat (click it to type)',
        immediate: true,
      })
    } catch (error) {
      $.ui.log(`${COMMAND}: command not registered: ${String(error)}`)
    }

    return started
  })

  // `{}`: no output row, so nothing about the room reaches the model.
  on('command.run', { command: COMMAND }, async ($, e) => {
    try {
      profile = await storedProfile($)
      size = sizeFor(e.presentation.columns)
      // The room only while you can see it: no pane, no connection.
      if (await showPane($, true)) await startHelper($)
    } catch (error) {
      stopHelper()
      $.ui.log(`${COMMAND}: the pane did not open: ${String(error)}`)
    }

    return {}
  })

  // However the pane goes (closed, Escape, /exit, an unload), the room goes.
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE) {
      stopHelper()
      answer = null
      problem = null
    }
    return next(e)
  })

  on('ui.message', async ($, e, next) => {
    if (e.requestId !== PANE) return next(e)
    await receive($, e.data)

    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    if (e.surface !== 'terminal' && e.surface !== 'desktop') {
      return <Text dimColor>Cypher opens in the terminal or the desktop app.</Text>
    }
    const { Client } = $.ui.resolve(e)
    return (
      <Client
        key={CLIENT_KEY}
        module="./view.tsx"
        props={{
          profile,
          view,
          seq,
          answer,
          problem,
          server,
          docked: e.props.placement === 'dock',
          paneFocused: e.props.isFocused,
        }}
        width={e.props.bodyColumns}
        height={e.props.scroll.bodyRows}
      />
    )
  })
}
