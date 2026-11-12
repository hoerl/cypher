// Cypher in a Claude Code pane. The host side: the /cypher command, the pane
// and its skin, the stored theme, and the broker between the pane and the
// helper process that holds the live connection.
//
//   /cypher        opens the pane and starts helper/cypher-helper.mjs
//   /cypher <invite link or code>   the same, entering that room
//   helper stdout  RoomView events (contract.ts), relayed to the pane as props
//   pane posts     intents, forwarded to the helper over its private socket
//   pane closed    the helper is stopped: you are in the room only while you
//                  can see it
//   a long turn    the pane opens by itself, without the keys (auto.ts);
//                  /cypher auto off stops that
//
// The pane is one Client, and a Client gets its keys only from a click. Only
// the fullscreen layout reports clicks, so on the main screen the pane would
// be out of reach. There the host draws Claude's own text field under it and
// relays what the field is given (text, Enter, ↑↓) as strokes.
//
// This module holds no credential and makes no decision about the room. No
// room text is returned to the model or written to a log.
import type { EngineInterface, HookStream, ProcessSpawnChunk, ProcessSpawnResult, Register, Timer } from 'claude-code'

import { AUTO_SAYS, DWELL_MS, OPENED_FIRST, OPENED_ITSELF, autoWord, opensByItself } from './auto'
import type { AutoWord } from './auto'
import { inviteOf, isEvent, isIntent } from './contract'
import type { Event, Intent, RoomView } from './contract'
import { isProfile } from './profile'
import type { Profile } from './profile'
import type { Answer, Stroke } from './session'
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
const DEFAULT_ORIGIN = 'https://cypherchat.org'
const NO_NODE = 'Cypher needs Node.js 22 or newer on your PATH · nodejs.org'
const STOPPED = 'disconnected · run /cypher to reconnect'
const SEEN_KEY = 'seen'
const TIP = 'hint: make tui fullscreen for better user experience'
const TIP_MS = 8000
// Stored `false` once the person turns the self-opening off; absent, it is on.
const AUTO_KEY = 'auto'
// Stored once the person has been told how to stop it.
const AUTO_TOLD_KEY = 'autoTold'
// The main screen's text field and the two stops beside it. The stops are
// never pressed: a move of the focus ring onto one is ↑ or ↓, and is refused.
const FIELD = 'say'
const STEP_BACK = 'back'
const STEP_ON = 'on'
const PROMPT = '›'
const STEPS = '↑↓'
const SEND = 'send'
type Field = { value: string; placeholder: string; enter: string }
const KEPT = 'the keys stay in the field'
const STROKES_KEPT = 32
// The pane asks for half the terminal's width at a 3:2 shape. A cell is
// about twice as tall as it is wide, so 3:2 on screen is 3 columns per row.
// Requests, not grants: the dock takes the columns (capped at 45%), the
// inline pane takes the rows (and spans the full width), and view.tsx lays
// out in whatever it gets.
const SHARE = 2
const COLUMNS_PER_ROW = 3
const MIN_ROWS = 12
// The desktop pane's own title bar, which the window's rows include.
const DESKTOP_FRAME_ROWS = 2
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
// Whether Claude's text field stands in for the composer: the main screen,
// fixed for the session. What it gave, newest last; ids only ever rise, so a
// pane that outlives a reload of this module still tells new from old.
let fielded = false
// The fullscreen tip waits for the first drawing: only a render names the
// surface, and the desktop app has no fullscreen setting to suggest.
let tipPending = false
let strokes: Stroke[] = []
let strokeId = Date.now()
// What the field is drawn with (a new `draft` is a new, empty-handed field)
// and the text it holds as far as this side knows.
let field = { value: '', placeholder: '', enter: SEND, draft: 0 }
let held = ''

// ---- opening by itself -------------------------------------------------------

// The wait a running turn started; cancelled when the turn ends first.
let dwell: Timer | null = null
// Whether the pane is up, as far as this module's life knows.
let shown = false
// The setting as last read, for the pane's check.
let auto = true

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

async function startHelper($: Engine, invite: string | null) {
  if (starting) return
  // Already in a room: an invite moves there.
  if (helper) {
    if (invite) void forward($, 0, { type: 'command', text: `/join ${invite}` })
    return
  }
  starting = true
  try {
    const origin = (await $.env.get('CYPHER_ORIGIN')) || DEFAULT_ORIGIN
    const run = ++generation
    server = origin === DEFAULT_ORIGIN ? null : hostOf(origin)
    view = null
    problem = null
    const join = invite ? ['--join', invite] : []
    const stream = $.process.spawn({ argv: ['node', `${$.plugin.root}/${HELPER}`, '--origin', origin, ...join] })
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

// One stroke from the text field. Text that only replaces unsent text takes
// its place, so typing does not grow the list.
function stroke($: Engine, given: Omit<Stroke, 'id'>) {
  if (given.text !== undefined) held = given.key === 'return' ? '' : given.text
  const last = strokes.at(-1)
  const replaces = last !== undefined && last.key === undefined && given.key === undefined
  strokeId += 1
  strokes = [...(replaces ? strokes.slice(0, -1) : strokes), { ...given, id: strokeId }].slice(-STROKES_KEPT)
  redraw($)
}

// The pane's word on the field. Text the field does not already hold needs
// a new field: the old one keeps what the person typed.
function showField($: Engine, next: Field) {
  const fresh = next.value !== held
  field = { ...next, draft: field.draft + Number(fresh) }
  held = next.value
  redraw($)
}

function isField(value: unknown): value is Field {
  const given = value as Partial<Record<keyof Field, unknown>> | null | undefined
  return [given?.value, given?.placeholder, given?.enter].every(part => typeof part === 'string')
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
  shown = opened.isPlaced
  return opened.isPlaced
}

// The composer starts empty, and the main screen's field with it.
function freshField() {
  strokes = []
  field = { value: '', placeholder: '', enter: SEND, draft: field.draft + 1 }
  held = ''
}

function stopDwell() {
  dwell?.cancel()
  dwell = null
}

async function autoEnabled($: Engine): Promise<boolean> {
  auto = (await $.store.get(AUTO_KEY)) !== false
  return auto
}

async function keepAuto($: Engine, enabled: boolean) {
  auto = enabled
  await $.store.set(AUTO_KEY, enabled)
  if (!enabled) stopDwell()
  redraw($)
}

// The arrival line; the first one ever also says how to stop it.
async function greet($: Engine) {
  const told = (await $.store.get(AUTO_TOLD_KEY)) === true
  $.ui.toast(told ? OPENED_ITSELF : OPENED_FIRST, { timeoutMs: TIP_MS })
  if (!told) await $.store.set(AUTO_TOLD_KEY, true)
}

// The turn has run long: the room is put beside the chat, the keys left with
// the prompt. An open the surface does not draw (a narrow terminal holds an
// unasked pane back) is withdrawn, so no room is joined out of sight.
async function arrive($: Engine) {
  dwell = null
  try {
    if (!opensByItself({ enabled: await autoEnabled($), open: shown || starting })) return
    profile = await storedProfile($)
    freshField()
    if (!(await showPane($, false))) return void (await $.ui.close({ id: PANE }))
    await greet($)
    await startHelper($, null)
  } catch (error) {
    stopHelper()
    $.ui.log(`${COMMAND}: the pane did not open by itself: ${String(error)}`, { to: 'debug' })
  }
}

// `/cypher auto …`: keeps the setting and says what now holds.
async function setAuto($: Engine, word: AutoWord) {
  if (word !== 'status') await keepAuto($, word === 'on')
  $.ui.toast(AUTO_SAYS[word](await autoEnabled($)), { timeoutMs: TIP_MS })
}

// Puts an invite link on the clipboard; the pane hears whether it took.
async function copy($: Engine, id: number, text: string) {
  let ok = false
  try {
    ok = (await $.ui.copy({ text })).isCopied
  } catch {
    ok = false
  }
  answer = { id, ok }
  redraw($)
}

// A post from the Client: what its field should show, and its reports in
// order, one at a time.
async function receive($: Engine, data: unknown) {
  const post = data as { reports?: unknown; field?: unknown } | null
  if (isField(post?.field)) showField($, post.field)
  const reports: unknown[] = Array.isArray(post?.reports) ? post.reports : []
  await reports.reduce<Promise<unknown>>(async (done, report) => {
    await done
    return act($, report)
  }, Promise.resolve())
}

// One report: an intent, a link to copy, a theme to keep, or the exit.
async function act($: Engine, data: unknown) {
  const post = data as { id?: unknown; intent?: unknown; copy?: unknown; profile?: unknown; auto?: unknown; exit?: unknown } | null
  if (typeof post?.auto === 'boolean') return keepAuto($, post.auto)
  if (typeof post?.id === 'number' && isIntent(post.intent)) return forward($, post.id, post.intent)
  if (typeof post?.id === 'number' && typeof post.copy === 'string') return copy($, post.id, post.copy)
  if (post?.exit === true) return $.ui.close({ id: PANE })
  if (!isProfile(post?.profile)) return
  const themeChanged = post.profile.theme !== profile?.theme
  profile = { theme: post.profile.theme }
  await $.store.set(STORE_KEY, profile)
  if (themeChanged) await showPane($, false)
}

// Someone back on the main screen is told what fullscreen would give them;
// the first visit is left alone.
async function tip($: Engine) {
  const back = (await $.store.get(SEEN_KEY)) === true
  if (back && fielded) $.ui.toast(TIP, { timeoutMs: TIP_MS })
  if (!back) await $.store.set(SEEN_KEY, true)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    try {
      await $.command.register({
        name: COMMAND,
        description: 'Open the Cypher room in a pane beside the chat (click it to type)',
        argumentHint: '[invite link | auto on | auto off]',
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
      const word = autoWord(e.args)
      if (word) {
        await setAuto($, word)
        return {}
      }
      profile = await storedProfile($)
      await autoEnabled($)
      size = sizeFor(e.presentation.columns)
      fielded = !e.presentation.isFullscreen
      freshField()
      // The room only while you can see it: no pane, no connection.
      if (await showPane($, true)) {
        tipPending = true
        await startHelper($, inviteOf(e.args))
      }
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
      shown = false
    }
    return next(e)
  })

  // The main loop's turn alone: a subagent's run is part of the same wait.
  // The timer outlives this dispatch, and is the module's own until it fires.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      stopDwell()
      dwell = $.clock.after(DWELL_MS, () => void arrive($))
    }
    return next(e)
  })

  // The pane stays when the turn ends: a conversation is not cut off.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) stopDwell()
    return next(e)
  })

  on('ui.message', async ($, e, next) => {
    if (e.requestId !== PANE) return next(e)
    await receive($, e.data)

    return {}
  })

  // ↑ and ↓ (and tab) in the text field move the focus ring onto a stop
  // beside it. The move is the key: it is passed on as a stroke and refused,
  // so the keys stay in the field.
  on('ui.focus', async ($, e, next) => {
    const stepped = e.element === STEP_BACK || e.element === STEP_ON
    if (e.requestId !== PANE || !fielded || e.origin.kind !== 'person' || !stepped) return next(e)
    stroke($, { key: e.element === STEP_ON ? 'down' : 'up' })

    return { deny: KEPT }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    if (e.surface !== 'terminal' && e.surface !== 'desktop') {
      return <Text dimColor>Cypher opens in the terminal or the desktop app.</Text>
    }
    const { Box, Button, Client, Input } = $.ui.resolve(e)
    // The drawing knows its layout where the surface says; /cypher's word
    // stands until then, and after a reload of this module.
    if (e.viewport?.isFullscreen !== undefined) fielded = !e.viewport.isFullscreen
    if (tipPending) {
      tipPending = false
      if (e.surface === 'terminal') void tip($)
    }
    const withField = fielded && e.surface === 'terminal'
    // The desktop app gives the pane the window's height, but its bodyRows
    // can be the few rows the tree asked for: fill the window there.
    const rows = e.surface === 'desktop'
      ? Math.max(e.props.scroll.bodyRows, (e.viewport?.rows ?? 0) - DESKTOP_FRAME_ROWS)
      : e.props.scroll.bodyRows - Number(withField)
    const room = (
      <Client
        key={CLIENT_KEY}
        module="./view.tsx"
        props={{
          profile,
          auto,
          view,
          seq,
          answer,
          problem,
          server,
          docked: e.props.placement === 'dock',
          paneFocused: e.props.isFocused,
          fielded: withField,
          strokes: withField ? strokes : null,
        }}
        width={e.props.bodyColumns}
        height={rows}
      />
    )
    if (!withField) return room
    return (
      <Box flexDirection="column">
        {room}
        <Box columnGap={1} paddingX={1}>
          <Button key={STEP_BACK} plain onPress={() => undefined}>
            {PROMPT}
          </Button>
          <Input
            key={`${FIELD}-${field.draft}`}
            autoFocus
            value={field.value}
            placeholder={field.placeholder}
            submitLabel={field.enter || SEND}
            onInput={text => stroke($, { text })}
            onSubmit={text => stroke($, { text, key: 'return' })}
          />
          <Button key={STEP_ON} plain onPress={() => undefined}>
            {STEPS}
          </Button>
        </Box>
      </Box>
    )
  })
}
