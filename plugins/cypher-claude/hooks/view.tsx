// The Cypher pane's Client: draws one Session in its theme's skin, feeds it
// the raw keys the pane gets once clicked, and the pointer: hover lights a tab
// or a row, a press on a tab goes there, a press and release on a row picks it.
// The session lives here, outside surface.state, because a Client's state must
// be plain data and a session is a mutable object. The room itself arrives in
// props (the host relays the helper's views); what the person does leaves as
// posts (intents, the theme, the exit).
//
// Layout, top to bottom: header (brand, you), tabs, the room line where the
// room matters, the body, the composer where there is one, the hint. A
// conversation sits on the composer (time flows toward you); a list or a page
// hangs under the tab that opened it. Depth comes from three background steps
// (pane, hover, raised); nothing animates, since every change answers a key or
// a click the person just made.
//
// On the main screen no click reaches a Client, so no key does either. There
// the host draws Claude's own text field under this one (`fielded`), relays
// what it is given as strokes, and this draws no composer of its own.
import type { ClientModule, ClientPointerEvent, ClientSurface } from 'claude-code'

import { clip, same, spansOf, tabStrip, targetAt, width, wrapped } from './layout'
import type { HitMap, Segment, Target } from './layout'
import type { QrRun, RoomView } from './contract'
import type { Profile } from './profile'
import { SEPARATOR, Session, tabs } from './session'
import type { Answer, Line, Report, Stroke } from './session'
import { skinFor } from './skins'
import type { Skin } from './skins'

// `docked`: the dock draws a divider on its left only, so the Client draws
// the matching one on its right. `paneFocused`: whether Claude has the pane
// focused, which is not yet whether the Client has the keys (that takes a
// click), but its loss means the keys went back to Claude.
// `seq` numbers the views, so a redraw that repeats one is not news; `answer`
// is the host's reply to the last intent; `problem` a host-side failure (no
// Node.js, the helper gone) shown where the notice goes.
type Props = {
  profile?: Profile | null
  view?: RoomView | null
  seq?: number
  answer?: Answer | null
  problem?: string | null
  // The server's host when it is not Cypher's own; shown beside the brand.
  server?: string | null
  docked?: boolean
  paneFocused?: boolean
  // Claude's text field stands in for the composer; `strokes` is what it gave.
  fielded?: boolean
  strokes?: Stroke[] | null
}
// What the host's text field should hold, say when empty, and call Enter.
type Field = { value: string; placeholder: string; enter: string }
const NO_FIELD: Field = { value: '', placeholder: '', enter: '' }
type Frame = { frame: number }
// A body row as drawn: wrapped, keyed, and a message's continuation indented
// to the message column.
type Drawn = Line & { key: string; indent: number }
type Role = 'text' | 'dim' | 'accent' | 'self'

const PAD = 1 // side padding, in cells
const ROOMY_FROM = 16 // below this many rows: one header row, no spacers
const MIN_ROWS = 6
const MIN_COLUMNS = 24
const HALF = 2
const NICK_GAP = 2 // cells between the name column and the message
const NICK_COLUMN_MAX = 14 // longer names push their own message right
const MIN_NAME = 6
const MIN_PLACE = 4 // a room name cut shorter than this says nothing
const BRAND = 'cypher'
const BRAND_GAP = '  '
const PROMPT = '› '
const EDGE = '│'
const LABELS: Record<string, string> = { null: 'chat', rooms: 'rooms', who: 'people', settings: 'settings' }
const ROLE: Record<string, Role> = { dim: 'dim', accent: 'accent', name: 'self' }
const QR_INK: Record<QrRun['foreground'], string> = { black: '#000000', white: '#ffffff' }
const labels = tabs.map(tab => LABELS[String(tab)] ?? '')

// One session per pane instance, starting from the stored profile.
let session = new Session()
let seenSeq = -1
let seenAnswer = -1
let hover: Target | null = null
let pressed: Target | null = null
let hits: HitMap = new Map()
let paneWasFocused = false
// The last stroke taken, and the field as this side believes it stands.
let seenStroke = 0
let shown: Field = NO_FIELD

// Whether the keys reach the Client. It cannot ask, so it infers: a click or
// a key in it says yes; the pane losing Claude's focus (a click on the prompt,
// another pane) says no. Only the change counts, since a click can land
// before the host has redrawn the pane as focused.
function followFocus(paneFocused: boolean) {
  if (paneWasFocused && !paneFocused) session.focused = false
  paneWasFocused = paneFocused
}

// New props: a view the session has not seen, an answer it has not had.
function absorb(props: Props) {
  if (props.view && props.seq !== undefined && props.seq !== seenSeq) {
    seenSeq = props.seq
    session.receive(props.view)
  }
  if (props.answer && props.answer.id !== seenAnswer) {
    seenAnswer = props.answer.id
    session.answer(props.answer)
  }
}

// Strokes from Claude's text field, oldest first. Enter empties the field by
// itself; any other text is what the field now holds.
function absorbStrokes(strokes: Stroke[]) {
  strokes
    .filter(stroke => stroke.id > seenStroke)
    .forEach(stroke => {
      seenStroke = stroke.id
      if (stroke.text !== undefined) shown = { ...shown, value: stroke.key === 'return' ? '' : stroke.text }
      session.take(stroke)
    })
}

// The field is the person's until the session changes it (a line sent, a
// draft restored, /nick filled in) or the tab wants another placeholder:
// then the host is told what to draw.
function fieldNews(): Field | null {
  const next = { value: session.input, placeholder: session.placeholder ?? '', enter: session.enterLabel }
  const changed = JSON.stringify(next) !== JSON.stringify(shown)
  shown = next
  return changed ? next : null
}

// Every row wrapped to `room`; messages wrap beside the name column.
function wrapAll(rows: Line[], room: number, column: number): Drawn[] {
  return rows.flatMap((row, r) => {
    if (row.qr) return [{ ...row, key: `${r}-qr`, indent: 0 }]
    if (!row.nick) {
      return wrapped(row.text, room).map((text, i) => ({ ...row, text, key: `${r}-${i}`, indent: 0 }))
    }
    const message = row.text.slice(row.nick.length).trimStart()
    // A name longer than the column is cut to it, so a row never outgrows the pane.
    const nick = clip(row.nick, column - NICK_GAP)
    return wrapped(message, Math.max(1, room - column)).map((text, i) => ({
      ...row,
      text,
      nick: i === 0 ? nick : null,
      key: `${r}-${i}`,
      indent: column,
    }))
  })
}

// The rows that fit in `space`. A conversation shows its newest rows,
// `session.scroll` up; a list keeps its selected row in view; a page reads
// from the top.
function bodyLines(room: number, space: number, column: number): Drawn[] {
  const all = wrapAll(session.rows, room, column)
  // A QR code is all or nothing: left out when it would be cut.
  const qr = all.filter(line => line.qr)
  const qrFits = all.length <= space && qr.every(line => qrWidth(line.qr ?? []) <= room)
  const messages = qrFits ? all : all.filter(line => !line.qr)
  const body = messages
  const extra = Math.max(0, body.length - space)
  if (session.kind === 'list') {
    const chosen = body.findIndex(line => line.item !== undefined && line.item === session.chosen)
    const start = Math.min(extra, Math.max(0, chosen - space + 1))
    return body.slice(start, start + space)
  }
  session.scroll = Math.min(session.scroll, extra)
  const start = session.handoff ? 0 : extra - session.scroll
  return body.slice(start, start + space)
}

const qrWidth = (runs: QrRun[]) => runs.reduce((sum, run) => sum + width(run.text), 0)

// The name column: as wide as the longest name, up to a cap.
function nameColumn(): number {
  const widest = session.rows.reduce((most, row) => Math.max(most, row.nick ? width(row.nick) : 0), 0)
  return Math.min(NICK_COLUMN_MAX, widest) + NICK_GAP
}

// Feedback on the press (Apple's rule): a tab switches at once, a row lights
// at once and commits on release over the same row, so dragging off cancels.
// Returns whether anything visible changed.
function point(event: ClientPointerEvent): boolean {
  const target = event.type === 'leave' ? null : targetAt(hits, event.x, event.y)
  if (event.type === 'down' && event.button === 'left') {
    session.focused = true
    pressed = target
    if (target?.kind === 'tab') session.goTab(target.index)
    if (target?.kind === 'step') session.goTab(session.activeTab + target.index)
    if (target?.kind === 'item') session.highlight(target.index)
    if (target?.kind === 'invite') session.copyInvite()
    if (target?.kind === 'signin') session.signIn()
    return true
  }
  if (event.type === 'up') {
    if (pressed?.kind === 'item' && same(pressed, target)) session.choose(pressed.index)
    pressed = null
    return true
  }
  const changed = !same(hover, target)
  hover = target
  return changed
}

// Text props for each role in the skin.
const paint = (skin: Skin) => ({
  text: { color: skin.text },
  dim: { color: skin.dim },
  accent: { color: skin.accent },
  self: { color: skin.self },
})

// One post a frame is all a Client gets, so everything goes in one.
function deliver(surface: ClientSurface<Frame>) {
  const reports: Report[] = session.reports()
  const news = session.fielded ? fieldNews() : null
  if (reports.length || news) surface.post({ reports, ...(news ? { field: news } : {}) })
}

function redraw(surface: ClientSurface<Frame>) {
  surface.setState({ frame: (surface.state?.frame ?? 0) + 1 })
}

const View: ClientModule<Props, Frame> = (props, surface) => {
  const { Box, Text } = surface.elements
  if (surface.state === undefined) {
    session = new Session(props.profile)
    seenSeq = -1
    seenAnswer = -1
    paneWasFocused = false
    // Strokes from before this instance are not replayed: one may be a sent line.
    seenStroke = Math.max(0, ...(props.strokes ?? []).map(stroke => stroke.id))
    shown = NO_FIELD
    hover = null
    pressed = null
    redraw(surface)
  }
  surface.onKey(event => {
    session.press(event)
    deliver(surface)
    redraw(surface)
  })
  surface.onPointer(event => {
    if (!point(event)) return
    deliver(surface)
    redraw(surface)
  })

  absorb(props)
  const fielded = props.fielded === true
  session.fielded = fielded
  if (fielded) {
    absorbStrokes(props.strokes ?? [])
    // The field has the keys whenever the pane does.
    session.focused = props.paneFocused === true
    deliver(surface)
  } else followFocus(props.paneFocused === true)
  const live = session.focused
  // The divider's colors are Claude's own (theme keys), as on the dock's left.
  const edge = props.docked ? (live ? 'permission' : 'inactive') : null
  const outer = Math.max(MIN_COLUMNS, surface.columns || MIN_COLUMNS)
  const columns = outer - Number(edge !== null)
  const height = Math.max(MIN_ROWS, surface.rows || MIN_ROWS)
  const inner = columns - PAD * HALF
  const roomy = height >= ROOMY_FROM
  const skin = skinFor(session.shownTheme)
  const ink = paint(skin)
  const guest = session.guest

  // The header: your name never shrinks past a third of the row; it is cut.
  const name = clip(session.badge, Math.max(MIN_NAME, Math.floor(inner / (HALF + 1))))
  const signIn: Target | null = session.nameless ? { kind: 'signin', index: 0 } : null
  // Another server than Cypher's own is named in the header, never hidden.
  const elsewhere = props.server ? ` @ ${clip(props.server, Math.max(MIN_NAME, Math.floor(inner / (HALF + 1))))}` : ''
  // The room rides beside the brand in what the row can spare: all of it
  // when the tabs have their own row, else what they leave as whole pills.
  const everyPill = tabStrip(labels, session.activeTab, Number.MAX_SAFE_INTEGER)
  const pills = everyPill.reduce((sum, pill) => sum + width(pill.text), 0)
  const spare = inner - width(BRAND + elsewhere) - width(name) - 1 - (roomy ? 0 : width(BRAND_GAP) + pills)
  const place = session.roomName && spare > MIN_PLACE ? ` ${clip(session.roomName, spare - 1)}` : ''
  const tabX = roomy ? 0 : width(BRAND + elsewhere + place + BRAND_GAP)
  const strip = tabStrip(labels, session.activeTab, roomy ? inner : inner - tabX - width(name) - 1)

  // Rows: header [+ tabs] [+ room] [+ spacer] | body | [spacer] [composer] hint.
  const composer = !fielded && (session.placeholder !== null || session.input !== '')
  const top = 1 + Number(roomy) + Number(session.showsRoom) + Number(roomy)
  const bottom = Number(roomy) + Number(composer) + 1
  const space = Math.max(1, height - top - bottom)
  const column = nameColumn()
  const lines = bodyLines(inner, space, column)
  const firstLine = top + (session.kind === 'chat' ? space - lines.length : 0)

  // The room line: where you are and who is here, then its one action when
  // the row has room for all of it. A narrow pane keeps /invite.
  const action = session.showsRoom ? session.inviteAction : null
  const roomRow = 1 + Number(roomy)
  const whole = action !== null && width(session.roomLine + SEPARATOR + action) <= inner
  const roomLine: Segment[] = whole
    ? [
        { text: session.roomLine + SEPARATOR, target: null },
        { text: action, target: { kind: 'invite', index: 0 } },
      ]
    : [{ text: clip(session.roomLine, inner), target: null }]

  // A guest's header ends in "sign in", on the tabs' row when they share it.
  const badgeSpans = signIn ? [{ from: PAD + inner - width(name), to: PAD + inner, target: signIn }] : []
  hits = new Map([
    ...(roomy ? [[0, badgeSpans]] : []),
    [roomy ? 1 : 0, [...spansOf(strip, PAD + tabX), ...(roomy ? [] : badgeSpans)]],
    ...(session.showsRoom ? [[roomRow, spansOf(roomLine, PAD)]] : []),
    ...lines.flatMap((line, i) =>
      line.item === undefined
        ? []
        : [[firstLine + i, [{ from: PAD, to: PAD + inner, target: { kind: 'item', index: line.item } as Target }]]],
    ),
  ] as Array<[number, ReturnType<typeof spansOf>]>)

  const segment = (seg: Segment, i: number) => {
    const lit = seg.target !== null && same(hover, seg.target)
    // The active tab wears the accent only while the keys are here; without
    // them it goes quiet, as a selection does in a window not in front.
    const look = seg.active
      ? { ...(live ? ink.accent : ink.text), backgroundColor: live ? skin.raised : skin.hover, weight: 'bold' as const }
      : { ...(lit ? ink.text : ink.dim), backgroundColor: lit ? skin.hover : undefined }
    return (
      <Text key={'seg-' + i} {...look}>
        {seg.text}
      </Text>
    )
  }

  const rowBackground = (line: Drawn) => {
    if (line.item === undefined) return undefined
    if (line.item === session.chosen) return skin.raised
    return same(hover, { kind: 'item', index: line.item }) ? skin.hover : undefined
  }

  const line = (row: Drawn) => {
    if (row.qr) {
      return (
        <Text key={row.key}>
          {row.qr.map((run, i) => (
            <Text key={`run-${i}`} color={QR_INK[run.foreground]} backgroundColor={QR_INK[run.background]}>
              {run.text}
            </Text>
          ))}
        </Text>
      )
    }
    if (row.indent === 0) {
      const chosen = row.item !== undefined && row.item === session.chosen
      const role: Role = chosen ? 'accent' : (ROLE[row.kind] ?? 'text')
      return (
        <Box key={row.key} width={inner} backgroundColor={rowBackground(row)}>
          <Text {...ink[role]}>{row.text || ' '}</Text>
        </Box>
      )
    }
    const nick = row.nick ?? ''
    const plain = nick.replace(' ✓', '')
    const pad = ' '.repeat(Math.max(1, row.indent - width(nick)))
    return (
      <Text key={row.key} {...ink.text}>
        <Text {...(row.own ? ink.self : ink.text)} weight="bold">
          {plain}
        </Text>
        <Text {...ink.accent}>{nick.endsWith('✓') ? ' ✓' : ''}</Text>
        {nick ? pad : ' '.repeat(row.indent)}
        {row.text}
      </Text>
    )
  }

  // The composer: before the first key or click it says how to reach it;
  // empty, it says what it is for; then the text with one inverse cell.
  const fits = Math.max(1, inner - width(PROMPT) - 1)
  const start = Math.max(0, session.cursor - fits + 1)
  const typed = Array.from(session.input).slice(start, start + fits)
  const at = session.cursor - start
  const field = () => {
    if (!session.focused) return <Text {...ink.dim}>click to type</Text>
    if (!session.input) {
      return (
        <Text {...ink.dim}>
          <Text inverse> </Text>
          {clip(session.placeholder ?? '', fits - 1)}
        </Text>
      )
    }
    return (
      <Text {...ink.text}>
        {typed.slice(0, at).join('')}
        <Text inverse>{typed[at] ?? ' '}</Text>
        {typed.slice(at + 1).join('')}
      </Text>
    )
  }

  const brand = (
    <Text>
      <Text {...ink.accent} weight="bold">
        {BRAND}
      </Text>
      {elsewhere && <Text {...ink.text}>{elsewhere}</Text>}
      {place && <Text {...ink.dim}>{place}</Text>}
    </Text>
  )
  const you = (
    <Text {...(guest ? ink.dim : ink.self)} backgroundColor={signIn && same(hover, signIn) ? skin.hover : undefined}>
      {name}
    </Text>
  )
  const spacer = roomy && <Text> </Text>
  const problem = props.problem ?? ''
  const footer = problem || session.notice || session.hint

  return (
    <Box width={outer} height={height} backgroundColor={skin.background}>
      <Box flexDirection="column" width={columns} height={height} paddingX={PAD}>
        <Box justifyContent="space-between">
          {roomy ? (
            brand
          ) : (
            <Text>
              {brand}
              {BRAND_GAP}
              {strip.map(segment)}
            </Text>
          )}
          {you}
        </Box>
        {roomy && <Text>{strip.map(segment)}</Text>}
        {session.showsRoom && (
          <Text {...ink.dim}>
            {roomLine.map((seg, i) =>
              // The action reads as text among the dim facts, and lights under the pointer.
              seg.target ? (
                <Text key={'room-' + i} {...ink.text} backgroundColor={same(hover, seg.target) ? skin.hover : undefined}>
                  {seg.text}
                </Text>
              ) : (
                seg.text
              ),
            )}
          </Text>
        )}
        {spacer}
        <Box flexDirection="column" flexGrow={1} justifyContent={session.kind === 'chat' ? 'flex-end' : 'flex-start'}>
          {lines.map(line)}
        </Box>
        {spacer}
        {composer && (
          <Box width={inner} backgroundColor={live ? skin.raised : undefined}>
            <Text>
              <Text {...(live ? ink.accent : ink.dim)} weight={live ? 'bold' : undefined}>
                {PROMPT}
              </Text>
              {field()}
            </Text>
          </Box>
        )}
        <Text {...(problem || session.notice ? ink.text : ink.dim)}>{clip(footer, inner)}</Text>
      </Box>
      {edge && <Text color={edge}>{Array.from({ length: height }, () => EDGE).join('\n')}</Text>}
    </Box>
  )
}

export default View
