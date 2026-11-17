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
//   desktop app    no pane at all: the toast on a long turn, and the same
//                  line for /cypher. The room there is the connector's own.
//   the look       in the desktop and mobile apps the session wears the
//                  member's Cypher skin, with a dot behind the conversation
//                  for each person online, when their account allows it
//                  (look.ts); /cypher skin off stops it on this computer
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
import type { Event, Intent, NoLook, RoomView } from './contract'
import { FLASH_MS, LOOK_SAYS, MOTION_MS, SCENE, STILL, alt, attend, lookFor, scene, skinWord } from './look'
import type { Attention, Change, SkinWord } from './look'
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
// A pane the desktop app drew is on its way out; one drawing starts that.
let leaving = false

// ---- the look ------------------------------------------------------------------
//
// In the desktop and mobile apps the session wears the member's Cypher skin:
// the app's colors, and a wordless scene behind the conversation with a dot
// for each person online. The member allows it with a switch in Cypher's
// settings, kept on their account. A second helper, in its read-only mode,
// asks the server what the account says; it never sits in a room. It starts
// where a desktop or mobile surface draws, so a terminal asks nothing.

// The account's last answer, so the next session starts in the right look.
const LOOK_KEY = 'look'
// This computer's own off, whatever the account says.
const LOOK_OFF_KEY = 'lookOff'
const LOOK_RETRY_MS = 15_000

type Known = { skin: string | null; match: boolean }

// What the account last said; null until a stored or fresh answer is read.
let known: Known | null = null
let lookOff = false
// Whether a surface that draws a look has shown itself. The desktop app is one;
// so is the mobile app, which `desktop` does not cover.
let lookSurface = false
// Whether this module set the theme that stands: only then may it clear it.
let looking = false
// The skin the standing theme was set for.
let worn: string | null = null
let online = 0
// The time of the newest unseen poke or mention in the last answer; undefined
// until the first one.
let seenAimed: number | null | undefined
let attention: Attention = 'rest'
let flash: Timer | null = null
// What the next drawing shows as motion, and the timer that draws it still again.
let change: Change = STILL
let settle: Timer | null = null
// Why the helper has nothing to say, when it has said so.
let noLook: NoLook | null = null
let lookHelper: Helper | null = null
let lookGeneration = 0
// Set before the first await, so drawings that arrive during a start wait for
// it instead of starting a second helper.
let lookStarting = false
// A helper that ended by itself is not started again until the pause is over.
let lookPaused = false
// One theme change at a time, in the order they were asked for.
let wearing: Promise<void> = Promise.resolve()

// The surfaces that draw a look. A terminal draws none.
const showsLook = (surface: string): boolean => surface === 'desktop' || surface === 'mobile'

// The scene as last drawn: the apps ask for the backdrop more often than it changes.
let drawn: { key: string; svg: string } | null = null
function sceneNow(): string {
  const state = online > 0 ? attention : 'rest'
  const key = JSON.stringify([worn, online, state, change])
  if (drawn?.key !== key) drawn = { key, svg: scene(worn, online, state, change) }
  return drawn.svg
}

function isKnown(value: unknown): value is Known {
  const given = value as Partial<Record<keyof Known, unknown>> | null | undefined
  return (given?.skin === null || typeof given?.skin === 'string') && typeof given.match === 'boolean'
}

// Makes the theme agree with the account and this computer's off: sets it,
// sets it again for another skin, or clears the one this module set.
async function wearNow($: Engine) {
  if (!known?.match || lookOff) {
    if (looking) await $.theme.clear()
    looking = false
    return
  }
  if (looking && worn === known.skin) return
  const skin = known.skin
  const result = await $.theme.set(lookFor(skin))
  looking = true
  worn = skin
  if (!result.isDrawn) $.ui.log(`${COMMAND}: look not drawn: ${result.reason}`, { to: 'debug' })
}

function wear($: Engine): Promise<void> {
  wearing = wearing.then(() => wearNow($)).catch(error => {
    $.ui.log(`${COMMAND}: look not set: ${String(error)}`, { to: 'debug' })
  })
  return wearing
}

// Called wherever a desktop or mobile surface shows itself.
async function startLook($: Engine) {
  lookSurface = true
  if (lookHelper || lookStarting || lookPaused || lookOff) return
  lookStarting = true
  try {
    const run = ++lookGeneration
    const origin = (await $.env.get('CYPHER_ORIGIN')) || DEFAULT_ORIGIN
    // Turned off while this start waited: start nothing.
    if (run !== lookGeneration) return
    const stream = $.process.spawn({ argv: ['node', `${$.plugin.root}/${HELPER}`, '--look', '--origin', origin] })
    lookHelper = stream
    void readLines(stream, () => run === lookGeneration, line => takeLook($, line), () => lookGone($))
  } catch (error) {
    // It could not be started: wait out the same pause as a helper that ended.
    $.ui.log(`${COMMAND}: look helper not started: ${String(error)}`, { to: 'debug' })
    lookGone($)
  } finally {
    lookStarting = false
  }
}

// The read-only helper ended by itself: the look stays as it is, and the next
// drawing starts the helper again only after a pause, so a helper that cannot
// run is not started on every frame.
function lookGone($: Engine) {
  lookHelper = null
  noLook = 'unreachable'
  lookPaused = true
  $.clock.after(LOOK_RETRY_MS, () => {
    lookPaused = false
    redraw($)
  })
}

function stopLook() {
  lookGeneration += 1
  const stream = lookHelper
  lookHelper = null
  seenAimed = undefined
  if (stream) void close(stream)
}

function takeLook($: Engine, line: string) {
  let event: unknown
  try {
    event = JSON.parse(line)
  } catch {
    return
  }
  if (!isEvent(event)) return
  if (event.type === 'nolook') {
    // Signed out or out of reach: the look that stands is left alone.
    noLook = event.reason
    return
  }
  if (event.type !== 'look') return
  noLook = null
  if (event.skin !== known?.skin || event.match !== known.match) {
    known = { skin: event.skin, match: event.match }
    void $.store.set(LOOK_KEY, known)
  }
  // Every answer, not only a changed one: a set that failed is tried again, and
  // one already standing costs nothing.
  void wear($)
  const next = attend(seenAimed, event.aimed)
  seenAimed = event.aimed
  moved($, {
    arrived: Math.max(0, event.count - online),
    left: Math.max(0, online - event.count),
    settling: next === 'rest' && attention !== 'rest',
  })
  online = event.count
  if (next === 'flash') return startFlash($)
  // A flash in progress ends lit by itself; nothing else waits on a timer.
  if (attention !== 'flash' || next === 'rest') {
    flash?.cancel()
    flash = null
    attention = next
  }
  redraw($)
}

// A change is drawn once with its motion, then again still once that has played.
function moved($: Engine, next: Change) {
  if (!next.arrived && !next.left && !next.settling) return
  settle?.cancel()
  change = next
  settle = $.clock.after(MOTION_MS, () => {
    settle = null
    change = STILL
    redraw($)
  })
}

// One flash: a drawing with it, then, once it has played, the dots stay lit.
function startFlash($: Engine) {
  flash?.cancel()
  attention = 'flash'
  flash = $.clock.after(FLASH_MS, () => {
    flash = null
    attention = 'bright'
    redraw($)
  })
  redraw($)
}

function lookStatus(): string {
  if (lookOff) return LOOK_SAYS.off
  if (!lookSurface) return LOOK_SAYS.terminal
  if (noLook === 'signed-out') return LOOK_SAYS.signedOut
  if (!known) return LOOK_SAYS.unknown
  return known.match ? LOOK_SAYS.on : LOOK_SAYS.unset
}

// `/cypher skin …`: this computer's own off and on, and what now holds. The
// account's switch is Cypher's to change, never this command's.
async function setSkin($: Engine, word: SkinWord) {
  if (word.kind === 'off') {
    lookOff = true
    await $.store.set(LOOK_OFF_KEY, true)
    stopLook()
    await wear($)
  }
  if (word.kind === 'on') {
    lookOff = false
    await $.store.delete(LOOK_OFF_KEY)
    await wear($)
    if (lookSurface) void startLook($)
  }
  // Said in the transcript, where the model does not read it.
  $.ui.log(lookStatus())
}

// A session starts in the look the account last asked for, before the helper
// has answered. A terminal draws no look, so setting one there shows nothing.
async function restoreLook($: Engine) {
  lookOff = (await $.store.get(LOOK_OFF_KEY)) === true
  // A surface may have shown itself, and started the helper, while this read waited.
  if (lookOff) stopLook()
  const saved: unknown = await $.store.get(LOOK_KEY)
  // An answer that arrived in the meantime is newer than the stored one.
  known ??= isKnown(saved) ? saved : null
  await wear($)
}

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
  } else if (event.type === 'fatal') problem = event.message
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

// Reads a helper one piece at a time until it ends, a whole line at a time.
// Only stdout is read: stderr is dropped unread, so nothing the helper might
// print reaches a log. Each piece schedules the next read, so a long session
// builds no chain. `isCurrent` false: a newer start replaced this one.
// `onEnd(failed)`: failed when the first pull rejects, as when the child
// cannot start (no node on PATH).
async function readLines(
  stream: Helper,
  isCurrent: () => boolean,
  onLine: (line: string) => void,
  onEnd: (failed: boolean) => void,
  buffer = '',
) {
  let step: IteratorResult<ProcessSpawnChunk, ProcessSpawnResult>
  try {
    step = await stream.next()
  } catch {
    if (isCurrent()) onEnd(true)
    return
  }
  if (!isCurrent()) return
  if (step.done) return onEnd(false)
  if (step.value.stream !== 'stdout') return void readLines(stream, isCurrent, onLine, onEnd, buffer)
  const lines = (buffer + step.value.text).split('\n')
  lines.slice(0, -1).forEach(onLine)
  void readLines(stream, isCurrent, onLine, onEnd, lines.at(-1) ?? '')
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
    void readLines(stream, () => run === generation, line => take($, line), failed =>
      ended($, run, failed ? NO_NODE : STOPPED),
    )
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
  if (desktop && !shown && (await autoEnabled($))) inviteHere($)
}

// The desktop app has no pane: the invitation is all the mod says there.
function inviteHere($: Engine) {
  $.ui.toast(INVITED, { timeoutMs: TIP_MS })
}

// A pane opened before the session said it draws in the desktop app: it is
// closed, and the invitation shown in its place.
async function turnAway($: Engine) {
  byItself = false
  try {
    await $.ui.close({ id: PANE })
    inviteHere($)
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
        argumentHint: '[invite link | auto on | auto off | skin on | skin off]',
        immediate: true,
      })
    } catch (error) {
      $.ui.log(`${COMMAND}: command not registered: ${String(error)}`)
    }
    try {
      await restoreLook($)
    } catch (error) {
      $.ui.log(`${COMMAND}: look not restored: ${String(error)}`, { to: 'debug' })
    }

    return started
  })

  // `{}`: no output row, so nothing about the room reaches the model.
  on('command.run', { command: COMMAND }, async ($, e) => {
    try {
      const skin = skinWord(e.args)
      if (skin) {
        await setSkin($, skin)
        return {}
      }
      const word = autoWord(e.args)
      if (word) {
        await setAuto($, word)
        return {}
      }
      if (desktop) {
        inviteHere($)
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

  // The pane opens as the person's prompt is sent. A slash command and a
  // prompt they did not type open nothing.
  on('prompt.submit', async ($, e, next) => {
    const sent = await next(e)
    const typed = e.command === undefined && e.isMeta !== true && PERSON_SENT.includes(e.origin.kind)
    if (typed && !desktop) await arrive($)
    return sent
  })

  // The scene behind the conversation: drawn only for Cypher's own, and never
  // with words. Only the dots.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== $.plugin.name || e.props.scene !== SCENE) return next(e)
    // Spelled out, so the element table below is the drawing surface's own.
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    if (e.surface === 'desktop') desktop = true
    void startLook($)
    const { Svg } = $.ui.resolve(e)
    return <Svg source={sceneNow()} alt={alt(online)} isInteractive />
  })

  // Draws nothing: the band above the prompt says which surface draws the
  // session before any pane is up. A desktop or mobile surface is where the
  // look shows, so that is where the account is asked about it.
  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    desktop = e.surface === 'desktop'
    if (showsLook(e.surface)) void startLook($)
    return next(e)
  })

  on('session.attach', async ($, e, next) => {
    if (e.surface === 'desktop') desktop = true
    if (showsLook(e.surface)) void startLook($)
    return next(e)
  })

  // The main loop's turn alone: a subagent's run is part of the same wait.
  // The timer outlives this dispatch, and is the module's own until it fires.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      stopDwell()
      dwell = $.clock.after(DWELL_MS, () => void invite($))
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
    if (e.surface === 'desktop') {
      desktop = true
      if (!leaving) {
        leaving = true
        void turnAway($)
      }
      return <Text dimColor>{INVITED}</Text>
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
