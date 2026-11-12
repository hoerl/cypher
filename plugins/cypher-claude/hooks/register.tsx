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
//   a prompt sent  the pane opens by itself, without the keys (auto.ts);
//                  the desktop app is invited by a toast on a long turn
//                  instead; /cypher auto off stops both
//   desktop app    no pane: /cypher opens the connector's own window
//                  (portal.ts) by asking the model for it
//
// The pane is one Client, and a Client gets its keys only from a click. Only
// the fullscreen layout reports clicks, so on the main screen the pane would
// be out of reach. There the host draws Claude's own text field under it and
// relays what the field is given (text, Enter, ↑↓) as strokes.
//
// This module holds no credential and makes no decision about the room. No
// room text is returned to the model or written to a log.
import type { EngineInterface, HookStream, ProcessSpawnChunk, ProcessSpawnResult, Register, Timer } from 'claude-code'

import { AUTO_SAYS, DWELL_MS, INVITED, OPENED_FIRST, autoWord, opensByItself } from './auto'
import type { AutoWord } from './auto'
import { inviteOf, isEvent, isIntent } from './contract'
import type { Event, Intent, RoomView } from './contract'
import { NO_CONNECTOR, PORTAL_WAITS, portalAsk, portalTool } from './portal'
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
const STOPPED_HERE = 'Cypher opens in the chat here.'
const SEEN_KEY = 'seen'
const TIP = 'hint: make tui fullscreen for better user experience'
const TIP_MS = 8000
// The wait between /cypher's run ending and the mod's prompt for the window.
const ASK_AFTER_MS = 50
// Stored `false` once the person turns the self-opening off; absent, it is on.
const AUTO_KEY = 'auto'
// Where a prompt a person sent comes from; a task's notice, a schedule and a
// peer session are not the person waiting.
const PERSON_SENT: readonly string[] = ['composer', 'bridge', 'sdk']
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
// Where the session draws, once a drawing has said: the desktop app is
// invited, not opened on. And whether the pane now up opened by itself.
let desktop = false
let byItself = false
// A main-loop turn is running: a prompt of the mod's waits for its end.
let working = false
// The mod's own prompt for the room's window, until it is sent.
let asking: string | null = null
// The invite /cypher was last given, for a pane the desktop app turns away.
let invited: string | null = null
// A pane the desktop app drew is on its way out; one drawing starts that.
let leaving = false

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

// The pane arriving says enough. The first time ever, a line says how to
// stop it; after that, nothing.
async function greet($: Engine) {
  if ((await $.store.get(AUTO_TOLD_KEY)) === true) return
  $.ui.toast(OPENED_FIRST, { timeoutMs: TIP_MS })
  await $.store.set(AUTO_TOLD_KEY, true)
}

// A prompt was sent: the room is put beside the chat, the keys left with the
// prompt. An open no surface draws is withdrawn, so no room is joined out of
// sight.
async function arrive($: Engine) {
  try {
    if (!opensByItself({ enabled: await autoEnabled($), open: shown || starting })) return
    profile = await storedProfile($)
    freshField()
    if (!(await showPane($, false))) return void (await $.ui.close({ id: PANE }))
    byItself = true
    await greet($)
    await startHelper($, null)
  } catch (error) {
    stopHelper()
    $.ui.log(`${COMMAND}: the pane did not open by itself: ${String(error)}`, { to: 'debug' })
  }
}

// The desktop app, a turn run long: an invitation, and no pane.
async function invite($: Engine) {
  dwell = null
  if (desktop && !shown && (await autoEnabled($))) $.ui.toast(INVITED, { timeoutMs: TIP_MS })
}

// The mod's own prompt. The engine takes none from inside /cypher's own run,
// so it is sent just after: from a timer, or as the running turn ends.
async function ask($: Engine) {
  const text = asking
  if (text === null) return
  asking = null
  try {
    await $.prompt.submit({ text, asUser: true })
  } catch (error) {
    $.ui.log(`${COMMAND}: the window was not asked for: ${String(error)}`, { to: 'debug' })
  }
}

// The desktop app: the room's own window, which only the model's call opens.
// Says whether it was asked for; with no connector here, it was not.
async function openPortal($: Engine, invite: string | null): Promise<boolean> {
  const tool = portalTool(await $.tool.list())
  if (!tool) return false
  if (shown) await $.ui.close({ id: PANE })
  asking = portalAsk(invite)
  if (working) $.ui.toast(PORTAL_WAITS, { timeoutMs: TIP_MS })
  else $.clock.after(ASK_AFTER_MS, () => void ask($))
  return true
}

// /cypher in the desktop app: the window, or how to get one. Never the pane.
async function openOnDesktop($: Engine, invite: string | null) {
  if (!(await openPortal($, invite))) $.ui.toast(NO_CONNECTOR, { timeoutMs: TIP_MS })
}

// A pane opened before the session said it draws in the desktop app: it is
// closed, and what the desktop app gets is given in its place.
async function turnAway($: Engine) {
  const wasByItself = byItself
  byItself = false
  try {
    await $.ui.close({ id: PANE })
    if (wasByItself) $.ui.toast(INVITED, { timeoutMs: TIP_MS })
    else await openOnDesktop($, invited)
  } finally {
    leaving = false
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
      invited = inviteOf(e.args)
      if (desktop) {
        await openOnDesktop($, invited)
        return {}
      }
      profile = await storedProfile($)
      await autoEnabled($)
      size = sizeFor(e.presentation.columns)
      byItself = false
      fielded = !e.presentation.isFullscreen
      freshField()
      // The room only while you can see it: no pane, no connection.
      if (await showPane($, true)) {
        tipPending = true
        await startHelper($, invited)
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

  // The pane opens as the person's prompt is sent. A slash command and a
  // prompt they did not type open nothing.
  on('prompt.submit', async ($, e, next) => {
    const sent = await next(e)
    const typed = e.command === undefined && e.isMeta !== true && PERSON_SENT.includes(e.origin.kind)
    if (typed && !desktop) await arrive($)
    return sent
  })

  // Draws nothing: the band above the prompt says which surface draws the
  // session before any pane is up.
  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    desktop = e.surface === 'desktop'
    return next(e)
  })

  on('session.attach', async ($, e, next) => {
    if (e.surface === 'desktop') desktop = true
    return next(e)
  })

  // The main loop's turn alone: a subagent's run is part of the same wait.
  // The timer outlives this dispatch, and is the module's own until it fires.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      working = true
      stopDwell()
      dwell = $.clock.after(DWELL_MS, () => void invite($))
    }
    return next(e)
  })

  // The pane stays when the turn ends: a conversation is not cut off.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      working = false
      stopDwell()
      void ask($)
    }
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
    if (e.surface === 'desktop') {
      desktop = true
      if (!leaving) {
        leaving = true
        void turnAway($)
      }
      return <Text dimColor>{STOPPED_HERE}</Text>
    }
    if (e.surface !== 'terminal') return <Text dimColor>Cypher opens in the terminal or the desktop app.</Text>
    const { Box, Button, Client, Input } = $.ui.resolve(e)
    // The drawing knows its layout where the surface says; /cypher's word
    // stands until then, and after a reload of this module.
    if (e.viewport?.isFullscreen !== undefined) fielded = !e.viewport.isFullscreen
    if (tipPending) {
      tipPending = false
      void tip($)
    }
    const withField = fielded
    const rows = e.props.scroll.bodyRows - Number(withField)
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
