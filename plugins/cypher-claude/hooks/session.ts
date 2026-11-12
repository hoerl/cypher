// One Cypher pane: what the server says (a RoomView, from the helper through
// the host) and what only this screen owns (the tab, the selection, the
// search, the composer, per-room drafts, the theme being previewed). Keys turn
// into local moves or into intents for the server; nothing here talks to the
// network. view.tsx reads what a session exposes and draws it.
//
// Escape never reaches a Client (it hands the keys back to Claude), so
// Backspace on an empty composer takes Escape's role: one step back.
import type { ClientKeyEvent } from 'claude-code'

import { inviteOf } from './contract'
import type { Intent, Person, QrRun, RoomInfo, RoomView } from './contract'
import { clip } from './layout'
import { themes } from './profile'
import type { Profile, Theme } from './profile'

export type Panel = null | 'rooms' | 'who' | 'settings' | 'theme' | 'help'
// A row as the view draws it. `nick` marks a message (drawn in the name
// column), `own` your own, `item` a row the pointer can pick (its index in
// the panel's list), `qr` one row of a sign-in code.
export type Line = {
  text: string
  kind: 'text' | 'dim' | 'accent' | 'name' | 'own' | 'selected'
  nick?: string | null
  own?: boolean
  item?: number
  qr?: QrRun[]
}
export type BodyKind = 'chat' | 'list' | 'page'
// What the session asks the host for: keep a profile, keep whether the pane
// opens by itself, close, run an intent,
// or put text (an invite link) on the clipboard.
export type Report = { profile: Profile } | { auto: boolean } | { exit: true } | { id: number; intent: Intent } | { id: number; copy: string }
export type Answer = { id: number; ok: boolean }
// What Claude's own text field hands the pane on the main screen, where no
// click (and so no key) reaches it: the field's text as it changes, Enter
// with the text, or a step off the field (↑ or shift+tab, ↓ or tab).
export type Stroke = { id: number; text?: string; key?: 'return' | 'up' | 'down' }

type Draft = { input: string; cursor: number }
type Setting = 'name' | 'signin' | 'signout' | 'verify' | 'theme' | 'auto'
const CHECK = { on: '[x]', off: '[ ]' }

export const tabs: readonly Panel[] = [null, 'rooms', 'who', 'settings']
const TAB_OF: Partial<Record<NonNullable<Panel>, Panel>> = { theme: 'settings' }
const MENUS: readonly Panel[] = ['rooms', 'who', 'settings', 'theme']
const PAGE = 5
const MAX_INPUT = 500
const ROOM_COLUMN = 18
const GAP_MS = 300_000 // a pause this long gets a time stamp
const THEME_PREVIEW = 4 // messages shown under the theme list
const HOUR_MINUTE: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
const LOCKED = '#######'
export const SEPARATOR = ' · '
const INVITE_ACTION = 'Copy invite link'
const INVITE_COPIED = 'invite link copied'
const LINK_COPIED = 'link copied'
// On a sign-in page: the key that copies its link, as Claude's own sign-in has.
const COPY_KEY = 'c'
// A guest has no name: the header offers the way in, and a first message
// waits while they pick one (the app's claim card, in the app's words).
const SIGN_IN = 'sign in'
const YOU = 'you'
const CLAIM_TITLE = 'Choose a Cypher name'
const CLAIM_PLACEHOLDER = 'Pick a name'
const CLAIM_NAMELESS = '…'
const CLAIM_HINT = 'enter join the chat · /signin sign in · delete cancel'
const CLAIM_HINT_FIELD = 'enter join the chat · /signin sign in · ↓ cancel'
const CLAIM_ENTER = 'join'
const HELP_GAP = 2
// The rooms list ends in the way to make one, as the app's does.
const START_ROOM = '+ Start a room'
const NAME_ROOM = 'Name your room'
const START_ENTER = 'start'
const START_HINT = 'enter start · delete cancel'
const START_HINT_FIELD = 'type a name · enter start · ↑↓ cancel'
const MAX_TOPIC = 100
// Runs of spaces: what separates a command from its argument. Splits
// "/join  lobby" into two; "/join" stays one.
// https://regex101.com/?regex=%5Cs%2B&testString=%2Fjoin%20%20lobby
const SPACES = /\s+/

// Names onKey uses for keys that type nothing; any other key is typed text.
const SPECIAL = new Set([
  'up',
  'down',
  'left',
  'right',
  'return',
  'tab',
  'backspace',
  'delete',
  'pageup',
  'pagedown',
  'home',
  'end',
  'escape',
])
// Keys the terminal names that type a character.
const TYPED: Record<string, string> = { space: ' ' }
const COMMANDS = [
  '/signin',
  '/signout',
  '/verify',
  '/open',
  '/rooms',
  '/join',
  '/invite',
  '/who',
  '/nick',
  '/ignore',
  '/settings',
  '/theme',
  '/help',
  '/exit',
]
// Commands the pane answers itself; the rest go to the server.
const LOCAL: Record<string, Panel> = {
  '/rooms': 'rooms',
  '/who': 'who',
  '/settings': 'settings',
  '/theme': 'theme',
  '/colors': 'theme',
  '/help': 'help',
}
const HELP: Array<[string, string]> = [
  ['/signin', 'Sign in to chat'],
  ['/verify', 'Verify with World ID'],
  ['/signout', 'Sign out'],
  ['/open', 'Open the sign-in link'],
  ['/rooms', 'Find a room'],
  ['/join <room>', 'Move to a room, by name or invite'],
  ['/invite', 'Copy this room’s invite link'],
  ['/who', 'See who is here'],
  ['/nick <name>', 'Choose your name'],
  ['/ignore <name>', 'Mute someone'],
  ['/theme', 'Choose a theme'],
  ['/exit', 'Close the pane'],
]
// Hints where Claude's text field feeds the pane: only ↑↓, Enter and text
// arrive, so ↑↓ walk a list's rows and then the tabs.
const FIELD_TABS = '↑↓ tabs'
const FIELD_HINTS: Record<string, string> = {
  theme: '↑↓ preview · enter save',
  rooms: '↑↓ select · enter join · type to search',
  who: '↑↓ select · enter mute',
  settings: '↑↓ select · enter change',
}
// What Enter does in the field, beside it: one word.
const FIELD_ENTER: Record<string, string> = { rooms: 'join', who: 'mute', settings: 'change', theme: 'save' }
const HELP_KEYS = '←→ / tab switch · ↑↓ select · enter open · delete back'
const HELP_KEYS_FIELD = '↑↓ move · enter open'
const HELP_TYPING = 'Type to chat. Enter sends. Tab completes a command.'
const HELP_TYPING_FIELD = 'Type to chat. Enter sends.'
const IDENTITY_LABEL: Record<string, string> = {
  guest: 'guest · sign in to chat',
  account: 'signed in · not verified',
  human: 'verified human ✓',
}
const CONNECTION_NOTE: Record<string, string> = {
  connecting: ' · connecting',
  reconnecting: ' · reconnecting',
  closed: ' · offline',
}
const SETTING_LABEL: Record<Setting, (s: Session) => string> = {
  name: s => `name     ${s.name}`,
  signin: () => 'account  /signin',
  signout: () => 'account  sign out',
  verify: () => 'verify with world id',
  theme: s => `theme    ${s.theme}`,
  auto: s => `auto     ${s.auto ? CHECK.on : CHECK.off} open while claude works`,
}

// Control and direction-changing characters never reach the room or the
// screen. Matches "\u0007" and "‮"; leaves "a" and "✓".
// https://regex101.com/?regex=%5B%5Cu0000-%5Cu001f%5Cu007f-%5Cu009f%5Cu202a-%5Cu202e%5Cu2066-%5Cu2069%5D&flags=g&testString=a%E2%9C%93%E2%80%AE
const UNSAFE =/[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g
const chars = (text: string) => Array.from(text)
const clean = (text: string) => text.replace(UNSAFE, '')
const nameOf = (person: { name: string; verified: boolean }) => clean(person.name) + (person.verified ? ' ✓' : '')
const mark = (chosen: boolean) => (chosen ? '›' : ' ')
const minutes = (at: number) => new Date(at).toLocaleTimeString('en-US', HOUR_MINUTE)

const EMPTY: RoomView = {
  connection: 'connecting',
  notice: '',
  busy: false,
  self: null,
  roomId: null,
  invite: null,
  rooms: [],
  locked: 0,
  people: [],
  messages: [],
  invitation: null,
}

export class Session {
  view: RoomView = EMPTY
  theme: Theme = 'terminal'
  // Whether the pane opens by itself on a long turn; the host keeps it.
  auto = true
  panel: Panel = null
  selected = 0
  query = ''
  // Rooms: the composer is naming a new room, not searching.
  naming = false
  input = ''
  cursor = 0
  // Rows scrolled up from the newest; view.tsx clamps it to what it can show.
  scroll = 0
  // Whether a key or a click has reached the pane: a Client gets the keys
  // only after a click, and cannot ask whether it has them.
  focused = false
  // Whether Claude's own text field stands in for the composer (the main
  // screen): its strokes arrive through `take`, and the hints name its keys.
  fielded = false
  // Whether the last move was between tabs (←→, Tab, a click on a tab).
  browsing = false
  // A problem only the pane knows about (a name /ignore cannot find).
  private note = ''
  private exited = false
  private readonly drafts = new Map<string, Draft>()
  // A guest's message, waiting for them to sign in: it goes back to the
  // composer once they have, and only their Enter sends it.
  private held: { roomId: string | null; text: string } | null = null
  // What the host has not been told yet, and messages not yet confirmed.
  private readonly outbox: Report[] = []
  private readonly unsent = new Map<number, { roomId: string | null; text: string }>()
  // Links handed to the host's clipboard, until it says whether each took.
  private readonly copying = new Map<number, { link: string; done: string }>()
  private nextId = 1
  private posted = ''

  constructor(profile?: Profile | null) {
    if (profile) this.theme = profile.theme
    this.posted = JSON.stringify({ theme: this.theme })
  }

  // ---- what the server says --------------------------------------------------

  // A new view from the helper. A move to another room swaps the composer
  // for that room's draft.
  receive(view: RoomView) {
    const moved = view.roomId !== this.view.roomId
    const signedIn = view.self !== null && view.self.identity !== 'guest'
    if (this.held && (moved || signedIn)) this.release()
    if (moved && this.panel === null) this.rememberDraft()
    this.view = view
    if (moved && this.panel === null) this.restoreInput()
    const count = this.count()
    if (this.selected >= count) this.selected = Math.max(0, count - 1)
  }

  // The host's answer to an intent: a message that did not reach the room
  // comes back to an empty composer in its room.
  answer({ id, ok }: Answer) {
    // A copy says it worked only once the clipboard took it; a link that
    // could not be copied is shown, to select by hand.
    const copy = this.copying.get(id)
    if (copy !== undefined) {
      this.copying.delete(id)
      this.note = ok ? copy.done : clean(copy.link)
      return
    }
    const unsent = this.unsent.get(id)
    this.unsent.delete(id)
    if (ok || !unsent || this.input || this.panel !== null || unsent.roomId !== this.view.roomId) return
    this.input = unsent.text
    this.cursor = chars(this.input).length
  }

  // ---- what the view reads -------------------------------------------------

  get name(): string {
    return this.view.self ? clean(this.view.self.name) : '…'
  }

  get guest(): boolean {
    return this.view.self?.identity !== 'account' && this.view.self?.identity !== 'human'
  }

  // What the header's right end says: your name, or the way to get one.
  get badge(): string {
    return this.nameless ? SIGN_IN : this.name
  }

  // A guest the server has told us about, not a pane still connecting.
  get nameless(): boolean {
    return this.view.self?.identity === 'guest'
  }

  // Picking a name for the message that waits; a sign-in page covers it.
  get claiming(): boolean {
    return this.held !== null && !this.handoff
  }

  get room(): RoomInfo | undefined {
    return this.view.rooms.find(r => r.id === this.view.roomId)
  }

  // The theme to paint: the highlighted one while choosing, so ↑↓ previews it.
  get shownTheme(): Theme {
    return this.panel === 'theme' ? (themes[this.selected] ?? this.theme) : this.theme
  }

  get activeTab(): number {
    const tab = this.panel ? (TAB_OF[this.panel] ?? this.panel) : null
    return Math.max(0, tabs.indexOf(tab))
  }

  get handoff(): boolean {
    return this.view.invitation !== null
  }

  // What the body is: a conversation (newest by the composer), a list (under
  // the tab that opened it), or a page of text (help, a sign-in).
  get kind(): BodyKind {
    if (this.handoff) return 'page'
    if (this.panel === null) return 'chat'
    return this.menu() ? 'list' : 'page'
  }

  get rows(): Line[] {
    if (this.handoff) return this.handoffRows()
    const rows: Record<string, () => Line[]> = {
      rooms: () => this.roomRows(),
      who: () => this.peopleRows(),
      settings: () => this.settingRows(),
      theme: () => this.themeRows(),
      help: () => this.helpRows(),
    }
    return (rows[String(this.panel)] ?? (() => this.chatRows()))()
  }

  // The list row that is chosen, where there is a list.
  get chosen(): number | null {
    return this.kind === 'list' ? this.selected : null
  }

  // The room you are in, for the header; empty before there is one.
  get roomName(): string {
    return this.room ? `#${clean(this.room.topic)}` : ''
  }

  // The keys that do something here, or how to get the keys at all.
  get hint(): string {
    if (this.fielded) return this.fieldHint
    // The composer already says "click to type" where there is one.
    if (!this.focused && this.placeholder === null) return 'click to use the keyboard'
    if (this.handoff) return 'enter opens the link · c copies · delete cancels'
    if (this.claiming) return CLAIM_HINT
    if (this.naming) return START_HINT
    const hints: Record<string, string> = {
      theme: '↑↓ preview · enter save · delete cancel',
      rooms: '↑↓ select · enter join · type to search · delete back',
      who: this.view.people.length ? '↑↓ select · enter mute · delete back' : 'delete back',
      settings: '↑↓ select · enter change · delete back',
    }
    if (this.panel) return hints[this.panel] ?? 'delete back'
    // Most useful first: a narrow pane cuts the tail.
    if (this.browsing && this.input) return '←→ tabs · type to edit your draft'
    return this.guest ? '←→ tabs · ? help · /signin' : '←→ tabs · ↑ next · ? help'
  }

  // What Enter does now, for the label beside Claude's text field.
  get enterLabel(): string {
    if (this.handoff) return 'open'
    if (this.claiming) return CLAIM_ENTER
    if (this.panel === 'rooms' && this.selected === this.startRow) return START_ENTER
    return FIELD_ENTER[String(this.panel)] ?? 'send'
  }

  private get fieldHint(): string {
    if (!this.focused) return 'ctrl+x tab to type'
    if (this.handoff) return 'enter opens the link · ↑ copies · ↓ cancels'
    if (this.claiming) return CLAIM_HINT_FIELD
    if (this.naming) return START_HINT_FIELD
    if (this.panel === 'who' && !this.view.people.length) return FIELD_TABS
    if (this.panel) return FIELD_HINTS[this.panel] ?? FIELD_TABS
    return this.guest ? '↑↓ tabs · /help · /signin' : '↑↓ tabs · /help'
  }

  // What an empty composer says it is for; null where there is no composer.
  get placeholder(): string | null {
    if (this.handoff) return null
    if (this.claiming) return CLAIM_PLACEHOLDER
    if (this.panel === null) return this.room ? `message #${clean(this.room.topic)}` : 'connecting…'
    if (this.naming) return NAME_ROOM
    return this.panel === 'rooms' ? 'search rooms' : null
  }

  // The room line matters where the room does: its conversation and people.
  get showsRoom(): boolean {
    return !this.handoff && (this.panel === null || this.panel === 'who')
  }

  get roomLine(): string {
    const note = CONNECTION_NOTE[this.view.connection] ?? ''
    if (!this.room) return `#…${note}`
    return `#${clean(this.room.topic)}${SEPARATOR}${this.view.people.length + 1} here${note}`
  }

  // The room line's one action, where there is a room to invite someone to.
  get inviteAction(): string | null {
    return this.view.invite ? INVITE_ACTION : null
  }

  get notice(): string {
    return this.note || clean(this.view.notice)
  }

  // ---- what the host drives ------------------------------------------------

  // One key, in the terminal client's order of precedence.
  press(event: ClientKeyEvent) {
    this.focused = true
    this.note = ''
    const key = TYPED[event.key] ?? event.key
    const ctrl = event.ctrl === true
    const vertical = key === 'up' || key === 'down'
    const sideways = key === 'left' || key === 'right'

    // Moving between tabs keeps ←→ on the tabs, even onto a saved draft,
    // until a key that is not a move: then ←→ edit the text again.
    if (!sideways && key !== 'tab') this.browsing = false

    if (this.handoff) return this.pressInHandoff(key)
    if (key === 'backspace' && !this.input) return this.back()
    if (key === '?' && !this.input) this.open('help')
    else if (key === 'tab') this.tab(event.shift === true)
    else if (this.panel === null && vertical) this.switchView(1)
    else if (this.menu() && vertical) this.move(key === 'down' ? 1 : -1)
    else if (sideways && (!this.input || this.browsing)) this.switchView(key === 'right' ? 1 : -1)
    else if (key === 'return') this.enter()
    else if (key === 'pageup') this.scroll += PAGE
    else if (key === 'pagedown') this.scroll = Math.max(0, this.scroll - PAGE)
    else if (this.moveCursor(key, ctrl)) return
    else if (ctrl && key === 'u') this.clearInput()
    else if (key === 'backspace' || key === 'delete') this.erase(key)
    else if (!ctrl && !event.meta && !SPECIAL.has(key)) this.type(key)

    this.search()
  }

  // One stroke from Claude's text field: its whole text, Enter, or a step.
  take(stroke: Stroke) {
    this.focused = true
    this.note = ''
    this.browsing = false
    if (stroke.key === 'up' || stroke.key === 'down') return this.step(stroke.key === 'down' ? 1 : -1)
    if (stroke.text !== undefined && !this.handoff) this.write(stroke.text)
    if (stroke.key === 'return') this.press({ key: 'return' })
  }

  // ---- the pointer ----------------------------------------------------------

  goTab(index: number) {
    if (!this.handoff) this.switchView(index - this.activeTab)
  }

  // The header's "sign in": the page /signin opens.
  signIn() {
    if (this.nameless && !this.handoff) this.ask({ type: 'signin' })
  }

  highlight(item: number) {
    if (!this.menu()) return
    if (item !== this.selected) this.naming = false
    this.selected = item
  }

  choose(item: number) {
    this.highlight(item)
    this.enter()
  }

  // The room line's action, or /invite: hand this room's link to the clipboard.
  copyInvite() {
    const link = this.view.invite
    if (!link) {
      this.note = 'Join a room first.'
      return
    }
    this.copy(link, INVITE_COPIED)
  }

  // Hands a link to the host's clipboard; `done` is said once it took.
  private copy(link: string, done: string) {
    const id = this.nextId++
    this.copying.set(id, { link, done })
    this.outbox.push({ id, copy: link })
  }

  // The sign-in page's link, to paste into a browser.
  private copySignin() {
    const url = this.view.invitation?.url
    if (url) this.copy(url, LINK_COPIED)
  }

  // What the host is to do, oldest first: intents, then a changed profile or
  // the exit. Each report is handed over once.
  reports(): Report[] {
    const out = this.outbox.splice(0)
    if (this.exited) return [...out, { exit: true }]
    const json = JSON.stringify({ theme: this.theme })
    if (json === this.posted) return out
    this.posted = json
    return [...out, { profile: { theme: this.theme } }]
  }

  // ---- moves ---------------------------------------------------------------

  private ask(intent: Intent): number {
    const id = this.nextId++
    this.outbox.push({ id, intent })
    return id
  }

  private menu() {
    return MENUS.includes(this.panel)
  }

  private count(): number {
    const counts: Record<string, () => number> = {
      rooms: () => this.startRow + 1,
      who: () => this.view.people.length,
      settings: () => this.settings().length,
      theme: () => themes.length,
    }
    return counts[String(this.panel)]?.() ?? 0
  }

  // The rooms panel searches as you type.
  private search() {
    if (this.panel !== 'rooms' || this.naming || this.input.startsWith('/')) return
    if (this.query !== this.input) this.selected = 0
    this.query = this.input
  }

  // The field's text, whole: what `type` does one key at a time.
  private write(text: string) {
    this.input = chars(clean(text.split('\n').join(' ')))
      .slice(0, MAX_INPUT)
      .join('')
    this.cursor = chars(this.input).length
    this.search()
  }

  // One step along all the field's ↑↓ can reach: a list's rows, then the
  // next tab (entered from its far end going back), so two keys walk the
  // whole pane. On a sign-in page ↓ is the way out.
  private step(direction: number) {
    if (this.handoff) {
      if (direction > 0) this.ask({ type: 'cancel' })
      else this.copySignin()
      return
    }
    if (this.claiming) {
      if (direction > 0) this.back()
      return
    }
    this.naming = false
    const to = this.selected + direction
    if (this.menu() && to >= 0 && to < this.count()) {
      this.selected = to
      return
    }
    this.switchView(direction)
    if (direction < 0 && this.menu()) this.selected = Math.max(0, this.count() - 1)
  }

  private move(direction: number) {
    this.naming = false
    const count = this.count()
    if (count) this.selected = (this.selected + direction + count) % count
  }

  private rememberDraft() {
    if (this.panel === null && !this.input.startsWith('/')) {
      this.drafts.set(this.view.roomId ?? '', { input: this.input, cursor: this.cursor })
    }
  }

  private restoreInput() {
    const saved = this.panel === null ? this.drafts.get(this.view.roomId ?? '') : undefined
    this.input = saved?.input ?? ''
    this.cursor = saved?.cursor ?? 0
  }

  // The waiting message goes back where it was typed: the composer when
  // its room is on screen, else that room's draft. Nothing is sent.
  private release() {
    const held = this.held
    if (!held) return
    this.held = null
    const draft = { input: held.text, cursor: chars(held.text).length }
    if (this.panel !== null || held.roomId !== this.view.roomId) {
      this.drafts.set(held.roomId ?? '', draft)
      return
    }
    this.input = draft.input
    this.cursor = draft.cursor
  }

  // Leaving for anywhere gives up on the name: the message is a draft again.
  private open(panel: Panel) {
    this.release()
    this.rememberDraft()
    this.naming = false
    this.panel = panel
    this.selected = panel === 'theme' ? Math.max(0, themes.indexOf(this.theme)) : 0
    this.query = ''
    this.restoreInput()
    this.scroll = panel === null ? 0 : Number.MAX_SAFE_INTEGER
  }

  private switchView(direction: number) {
    this.browsing = true
    this.open(tabs[(this.activeTab + direction + tabs.length) % tabs.length] ?? null)
  }

  // Tab completes a command when one matches, else walks the tabs.
  private tab(backwards: boolean) {
    const matches = COMMANDS.filter(command => command.startsWith(this.input))
    if (this.input.startsWith('/') && matches.length === 1) {
      this.input = matches[0] + ' '
      this.cursor = chars(this.input).length
    } else this.switchView(backwards ? -1 : 1)
  }

  // Escape's job: theme goes back to settings, any other panel to chat.
  private back() {
    // From a room's name, one step back is the list it was started from.
    if (this.naming) {
      this.naming = false
      return
    }
    const fromTheme = this.panel === 'theme'
    this.open(fromTheme ? 'settings' : null)
    if (fromTheme) this.selected = this.settings().indexOf('theme')
  }

  private pressInHandoff(key: string) {
    if (key === 'return') this.ask({ type: 'open' })
    else if (key.toLowerCase() === COPY_KEY) this.copySignin()
    else if (key === 'backspace' || key === 'delete') this.ask({ type: 'cancel' })
  }

  private settings(): Setting[] {
    const identity = this.view.self?.identity
    if (!this.view.self || identity === 'guest') return ['signin', 'theme', 'auto']
    return ['name', 'signout', ...(identity === 'human' ? [] : (['verify'] as const)), 'theme', 'auto']
  }

  private matchingRooms(): RoomInfo[] {
    const query = this.query.toLowerCase()
    return this.view.rooms.filter(r => r.topic.toLowerCase().includes(query))
  }

  private enter() {
    if (this.menu() && !this.input.startsWith('/')) return this.activate()
    this.submit()
  }

  // Enter on a list row.
  private activate() {
    const actions: Record<string, () => void> = {
      rooms: () => this.joinSelected(),
      who: () => {
        const person: Person | undefined = this.view.people[this.selected]
        if (person) this.ask({ type: 'mute', memberId: person.id })
      },
      settings: () => this.changeSetting(this.settings()[this.selected]),
      theme: () => {
        this.theme = themes[this.selected] ?? this.theme
        this.back()
      },
    }
    actions[String(this.panel)]?.()
  }

  // A locked room is a promise of verification: choosing one starts it.
  // Nothing chosen (a search that matched nothing) does nothing.
  private joinSelected() {
    if (this.naming) return this.startRoom()
    if (this.selected === this.startRow) return this.nameRoom()
    const matches = this.matchingRooms()
    const room = matches[this.selected]
    if (!room) {
      if (!this.query && this.selected >= matches.length && this.view.locked) this.ask({ type: 'verify' })
      return
    }
    if (room.id !== this.view.roomId) this.ask({ type: 'join', roomId: room.id })
    this.open(null)
  }

  // The row under the rooms: the last one, after any locked rooms.
  private get startRow(): number {
    return this.matchingRooms().length + (this.query ? 0 : this.view.locked)
  }

  // "Start a room" turns the composer into the room's name. What was
  // searched for and not found stays in it, as the name to begin with.
  // Only an account can start a room: a guest is shown the way in.
  private nameRoom() {
    if (this.nameless) {
      this.ask({ type: 'signin' })
      return
    }
    this.naming = true
    this.query = ''
    this.selected = this.startRow
  }

  // Enter on a name: the room is made and you are moved into it.
  private startRoom() {
    const topic = chars(clean(this.input).trim()).slice(0, MAX_TOPIC).join('')
    if (!topic) return
    this.ask({ type: 'create', topic })
    this.input = ''
    this.cursor = 0
    this.open(null)
  }

  private changeSetting(setting: Setting | undefined) {
    if (setting === 'name') {
      this.input = `/nick ${this.name}`
      this.cursor = chars(this.input).length
    } else if (setting === 'theme') this.open('theme')
    else if (setting === 'auto') {
      this.auto = !this.auto
      this.outbox.push({ auto: this.auto })
    }
    else if (setting) this.ask({ type: setting })
  }

  // Enter in the composer: a pane command, a server command, or a message.
  private submit() {
    const text = clean(this.input).trim()
    if (!text) return
    const [command = '', ...rest] = text.split(SPACES)
    const local = LOCAL[command.toLowerCase()]
    this.input = ''
    this.cursor = 0
    if (local !== undefined) return this.open(local)
    // The field types a lone ? as text, so there Enter is what asks.
    if (this.fielded && text === '?') return this.open('help')
    if (command === '/exit') {
      this.exited = true
      return
    }
    if (command === '/invite') return this.copyInvite()
    if (command === '/ignore') return this.ignore(rest.join(' '))
    if (command === '/join') return this.join(rest.join(' '))
    if (text.startsWith('/')) {
      this.ask({ type: 'command', text })
      return
    }
    // What is typed over a waiting message is the name to post it under; a
    // name the server refuses comes back to be changed.
    if (this.claiming) {
      this.unsent.set(this.ask({ type: 'claim', name: text }), { roomId: this.view.roomId, text })
      return
    }
    // No name yet: the message waits here while they pick one.
    if (this.nameless) {
      this.held = { roomId: this.view.roomId, text }
      this.scroll = 0
      return
    }
    const id = this.ask({ type: 'say', text })
    this.unsent.set(id, { roomId: this.view.roomId, text })
    this.drafts.delete(this.view.roomId ?? '')
    this.scroll = 0
  }

  // /join by an invite link or code, or by topic with or without its #. The
  // room that carries the code wins, so a room named after a code or a link
  // cannot take its invites; a link is never read as a name. Anything no room
  // answers to opens the list.
  private join(name: string) {
    const link = name.includes('join=')
    const invite = inviteOf(name)
    const wanted = name.replace(/^#/, '').toLowerCase()
    const invited = invite ? this.view.rooms.find(r => r.code === invite) : undefined
    const named = link ? undefined : this.view.rooms.find(r => r.topic.toLowerCase() === wanted)
    const room = invited ?? named
    if (!room) {
      this.open('rooms')
      if (link) this.note = 'That room is unavailable. Pick one here.'
      else this.note = name ? `No room is called ${clean(name)}. Pick one here.` : 'Pick a room here.'
      return
    }
    if (room.id !== this.view.roomId) this.ask({ type: 'join', roomId: room.id })
    this.open(null)
  }

  private ignore(name: string) {
    const person = this.view.people.find(p => p.name.toLowerCase() === name.toLowerCase())
    if (person) this.ask({ type: 'mute', memberId: person.id })
    else this.note = 'Use /ignore followed by a name from people.'
  }

  private clearInput() {
    this.input = ''
    this.cursor = 0
    this.drafts.delete(this.view.roomId ?? '')
  }

  private erase(key: string) {
    const text = chars(this.input)
    if (key === 'backspace' && this.cursor) text.splice(--this.cursor, 1)
    else if (key === 'delete') text.splice(this.cursor, 1)
    this.input = text.join('')
  }

  private type(text: string) {
    const insert = chars(clean(text.split('\n').join(' ')))
    const typed = chars(this.input)
    typed.splice(this.cursor, 0, ...insert)
    this.input = typed.slice(0, MAX_INPUT).join('')
    this.cursor = Math.min(chars(this.input).length, this.cursor + insert.length)
  }

  private moveCursor(key: string, ctrl: boolean) {
    const end = chars(this.input).length
    if (key === 'left') this.cursor = Math.max(0, this.cursor - 1)
    else if (key === 'right') this.cursor = Math.min(end, this.cursor + 1)
    else if (key === 'home' || (ctrl && key === 'a')) this.cursor = 0
    else if (key === 'end' || (ctrl && key === 'e')) this.cursor = end
    else return false
    return true
  }

  // ---- rows ----------------------------------------------------------------

  private listRow(text: string, index: number): Line {
    const chosen = index === this.selected
    return { text: `${mark(chosen)} ${text}`, kind: chosen ? 'selected' : 'text', item: index }
  }

  private chatRows(): Line[] {
    const { messages, people, self, connection } = this.view
    if (!self) return [{ text: connection === 'closed' ? 'Cypher is offline.' : 'connecting…', kind: 'dim' }]
    if (this.claiming) return [...this.messageRows(), ...this.claimRows()]
    if (!messages.length) {
      return [{ text: people.length ? 'It’s quiet in here.' : 'you’re first here', kind: 'accent' }]
    }
    return this.messageRows()
  }

  // The waiting message as it will read, under the name being typed, then
  // what the composer is asking for.
  private claimRows(): Line[] {
    const nick = this.input.startsWith('/') || !this.input.trim() ? CLAIM_NAMELESS : this.input.trim()
    return [
      { text: `${nick}  ${this.held?.text ?? ''}`, nick, own: true, kind: 'own' },
      { text: '', kind: 'dim' },
      { text: CLAIM_TITLE, kind: 'accent' },
    ]
  }

  private messageRows(): Line[] {
    const { messages } = this.view
    return messages.flatMap((m, i): Line[] => {
      const before = messages[i - 1]
      const paused = before !== undefined && m.at - before.at >= GAP_MS
      const stamp: Line[] = paused
        ? [
            { text: '', kind: 'dim' },
            { text: minutes(m.at), kind: 'dim' },
          ]
        : []
      const nick = nameOf({ name: m.author, verified: m.verified })
      return [...stamp, { text: `${nick}  ${clean(m.text)}`, nick, own: m.own, kind: m.own ? 'own' : 'text' }]
    })
  }

  private roomRows(): Line[] {
    const matches = this.matchingRooms()
    const search: Line[] = this.query ? [{ text: `search: ${this.query}`, kind: 'dim' }] : []
    const rooms = matches.map((r, i) => {
      const here = r.id === this.view.roomId ? ' · you' : ''
      // A long name is cut to its column, so the counts stay in one line.
      const name = clip('#' + clean(r.topic), ROOM_COLUMN).padEnd(ROOM_COLUMN)
      return this.listRow(`${name} ${r.count} here${here}`, i)
    })
    const locked = this.query
      ? []
      : Array.from({ length: this.view.locked }, (_, i) =>
          this.listRow(`${LOCKED.padEnd(ROOM_COLUMN)} verified humans only`, matches.length + i),
        )
    const none: Line[] =
      rooms.length || locked.length ? [] : [{ text: 'No rooms match. Backspace clears your search.', kind: 'dim' }]
    return [...search, ...rooms, ...locked, ...none, this.listRow(START_ROOM, this.startRow)]
  }

  // You are one of the room: in the list's column, marked as the list marks.
  private peopleRows(): Line[] {
    const self = this.view.self
    const you: Line[] = self
      ? [{ text: this.nameless ? `  ${YOU}` : `  ${nameOf({ name: self.name, verified: self.identity === 'human' })} · you`, kind: 'name' }]
      : []
    return [...you, ...this.view.people.map((p, i) => this.listRow(nameOf(p) + (p.muted ? ' · muted' : ''), i))]
  }

  private settingRows(): Line[] {
    const identity = this.view.self?.identity ?? 'guest'
    return [
      ...this.settings().map((setting, i) => this.listRow(SETTING_LABEL[setting](this), i)),
      { text: '', kind: 'dim' },
      { text: IDENTITY_LABEL[identity] ?? identity, kind: 'dim' },
    ]
  }

  private themeRows(): Line[] {
    const nick = this.nameless ? YOU : this.name
    const own: Line = { text: `${nick}  your message`, nick, own: true, kind: 'own' }
    return [
      ...themes.map((name, i) => this.listRow(name + (name === this.theme ? ' · current' : ''), i)),
      { text: '', kind: 'dim' },
      ...this.chatRows().slice(-THEME_PREVIEW),
      ...(this.view.messages.some(m => m.own) ? [] : [own]),
    ]
  }

  private helpRows(): Line[] {
    const width = Math.max(...HELP.map(([command]) => command.length)) + HELP_GAP
    return [
      { text: 'help', kind: 'accent' },
      { text: this.fielded ? HELP_KEYS_FIELD : HELP_KEYS, kind: 'dim' },
      ...HELP.map(([command, about]): Line => ({ text: `${command.padEnd(width)}${about}`, kind: 'text' })),
      { text: '', kind: 'dim' },
      { text: this.fielded ? HELP_TYPING_FIELD : HELP_TYPING, kind: 'dim' },
    ]
  }

  // A sign-in or verification: the link, the code, then the QR code, which
  // view.tsx leaves out when the pane is too small for it.
  private handoffRows(): Line[] {
    const invitation = this.view.invitation
    if (!invitation) return []
    const signin = invitation.kind === 'signin'
    const code: Line[] = invitation.code ? [{ text: `code  ${clean(invitation.code)}`, kind: 'text' }] : []
    return [
      { text: signin ? 'sign in' : 'verify with world id', kind: 'accent' },
      { text: signin ? 'Open this link to sign in with a passkey:' : 'Scan with World App, or open:', kind: 'dim' },
      { text: clean(invitation.url), kind: 'text' },
      ...code,
      { text: '', kind: 'dim' },
      ...invitation.qr.map((runs): Line => ({ text: '', kind: 'text', qr: runs })),
    ]
  }
}
