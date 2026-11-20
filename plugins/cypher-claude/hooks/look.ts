// The look Claude Code wears in the desktop and mobile apps: the member's
// Cypher skin as the app's colors, and a wordless scene behind the
// conversation, one dot per person online in Cypher. Pure pieces only: the
// palettes, the scene, what a poke or a mention does to the dots, and the words for
// `/cypher skin`. Shared by register.tsx and its tests. The scene never
// carries text, so nothing from Cypher can reach a screenshot of it.
import type { ThemeColors, ThemeSetArgs } from 'claude-code'

import { kitFor } from './kit/registry'
import { makeColors } from './make-colors.js'
import { WEB_SKINS } from './web-skins'
import type { WebSkin } from './web-skins'

export const SCENE = 'cypher-online'
// The app frosts a backdrop under its panels by default, which smears the dots
// into smudges (seen in the desktop app); with no frosting they are crisp.
const BACKDROP = { scene: SCENE, glass: false } as const

// A kit may paint Desktop's panels its own way (95 lays them on its teal desktop).
function backdropFor(skin: string | null): ThemeSetArgs['backdrop'] {
  const glass = kitFor(skin)?.glass
  return glass ? { scene: SCENE, glass } : BACKDROP
}

type Mode = 'light' | 'dark'

// How light a color reads, from 0 (black) to 255 (white), by the usual
// weights for red, green and blue.
const RED_WEIGHT = 0.299
const GREEN_WEIGHT = 0.587
const BLUE_WEIGHT = 0.114
const MIDDLE = 128
const HEX = 16
const RED = [1, 3] as const
const GREEN = [3, 5] as const
const BLUE = [5, 7] as const
const part = (hex: string, [from, to]: readonly [number, number]): number => parseInt(hex.slice(from, to), HEX)
const lightness = (hex: string): number =>
  part(hex, RED) * RED_WEIGHT + part(hex, GREEN) * GREEN_WEIGHT + part(hex, BLUE) * BLUE_WEIGHT

/** Whether a built-in skin is a light one or a dark one, from its surface. */
// A skin by its id. An id is the account's own text, so one that happens to name
// something every object has (`constructor`) is no skin.
const skinOf = (id: string | null): WebSkin | undefined =>
  id !== null && Object.hasOwn(WEB_SKINS, id) ? WEB_SKINS[id] : undefined

export function modeOf(skin: string): Mode | null {
  const kit = kitFor(skin)
  if (kit) return kit.mode
  const colors = skinOf(skin)
  if (!colors) return null
  return lightness(colors.surface) > MIDDLE ? 'light' : 'dark'
}

type Palette = { theme: ThemeColors; problems: string[] }
const palettes = new Map<string, Palette>()

// A skin is made for one mode, and the palette builder refuses a light skin's
// colors in the dark half, so each palette gives its own mode alone: a surface
// then draws in that mode whatever the person's own setting.
function build(skin: string): Palette | null {
  // A skin with a kit brings its own palette, measured from its original.
  const kit = kitFor(skin)
  if (kit) return makeColors(kit.palette)
  const colors = skinOf(skin)
  const mode = modeOf(skin)
  if (!colors || !mode) return null
  const gray = { anchors: { 'surface-0': colors.surface, 'text-primary': colors.text, 'text-muted': colors.muted } }
  return makeColors({
    label: `Cypher ${skin}`,
    roles: { accent: colors.accent, danger: colors.danger },
    [mode]: { gray },
    only: mode,
  })
}

/** Claude's palette for a built-in skin, and what the builder said about it; null for any other id. */
export function paletteFor(skin: string | null): Palette | null {
  if (skin === null) return null
  const made = palettes.get(skin) ?? build(skin)
  if (made) palettes.set(skin, made)
  return made
}

/**
 * The whole theme for a skin, colors and scene in one, since a set names the
 * whole theme. An id that is no built-in skin (an imported one, whose colors
 * never leave its browser) gets the scene alone and keeps the app's colors.
 */
export function lookFor(skin: string | null): ThemeSetArgs {
  const palette = paletteFor(skin)
  const mode = palette && skin ? modeOf(skin) : null
  if (!palette || !mode) return { backdrop: backdropFor(skin) }
  return { colors: palette.theme, backdrop: backdropFor(skin), overrideColorScheme: mode }
}

// ---- attention ----

/** What the dots are doing: at rest, flashing for a new poke or mention, or lit until it is seen. */
export type Attention = 'rest' | 'flash' | 'bright'

/**
 * What a new answer does to the dots. `aimed` is the time of the newest poke or
 * mention the member has not seen (null: nothing waits), and `seen` is that time
 * from the answer before, or undefined before the first answer, which only sets
 * the baseline: something that landed while Claude was closed lights the dots
 * without a flash.
 */
export function attend(seen: number | null | undefined, aimed: number | null): Attention {
  if (aimed === null) return 'rest'
  if (seen === undefined) return 'bright'
  return seen === null || aimed > seen ? 'flash' : 'bright'
}

// ---- words ----

export type SkinWord = { kind: 'status' } | { kind: 'on' } | { kind: 'off' }

const WORD = 'skin'

// `/cypher skin`, `… on`, `… off`. Anything else is not a skin word and is
// /cypher's own to read.
export function skinWord(args: string): SkinWord | null {
  const [first = '', second, ...rest] = args.trim().toLowerCase().split(' ').filter(Boolean)
  if (first !== WORD || rest.length > 0) return null
  if (second === undefined) return { kind: 'status' }
  return second === 'on' || second === 'off' ? { kind: second } : null
}

const NOTE = 'shows only in the desktop and mobile apps'
const SWITCH = 'turn on Match in Claude Code in cypher’s settings'

export const LOOK_SAYS = {
  on: 'cypher skin is on here · it follows the skin you pick in cypher · /cypher skin off stops it on this computer',
  off: 'cypher skin is off on this computer · /cypher skin on brings it back',
  unset: `cypher skin is not on for your account · ${SWITCH}`,
  unknown: `cypher skin follows your account · ${SWITCH} · nothing heard from cypher yet`,
  signedOut: 'cypher skin · signed out, so nothing to follow · /cypher signs you in',
  terminal: `cypher skin ${NOTE} · the terminal has the pane`,
}

// ---- scene ----

export const MAX_DOTS = 24
// An imported skin's colors are unknown, so its dots are a grey that reads on
// a light app and a dark one, over the app's own ground.
export const PLAIN_DOTS = '#808080'
const RADIUS = 3
// The scene is fixed to the window and the conversation scrolls over it, so
// text crosses the dots. At rest they are a watermark, faint enough to read
// through (the member's choice, seen in the desktop app); lit, they are plain
// to see but still let text through.
const REST_OPACITY = 0.22
const LIT_OPACITY = 0.6
// The crest of the ripple, the one moment the dots are meant to catch the eye.
const RIPPLE_OPACITY = 0.9
// Lit dots are a little larger as well as brighter, so a glance tells them
// from resting ones without comparing shades.
const LIT_SCALE = 1.3

// The scene is the whole window, and the app's own chrome lies over it: a title
// bar across the top, a sidebar on the left, and at times a panel on the right.
// So the dots are one line at the middle of the window, just under the title
// bar, measured in points so a large window does not enlarge them.
const STEP = 14 // from one dot's centre to the next
const ROW = 58 // below the title bar
const HALF = 2

// Slot k steps out from the middle, right then left, so the nth person always
// takes the same place: a newcomer never moves anyone already there, and a few
// people sit centred. `ring` is how many steps out it is, which is the order a
// ripple reaches it in.
function slot(k: number): { cx: number; ring: number } {
  const ring = Math.ceil(k / HALF)
  const side = k % HALF === 0 ? 1 : -1
  return { cx: side * ring * STEP, ring }
}

// ---- motion ----
//
// A redraw replaces the whole drawing, so nothing can ease from one drawing to
// the next by itself. Each change is therefore drawn once with its motion, and
// the mod draws the scene again, still, once that has played.

/** What changed since the drawing before: who arrived, who left, and whether lit dots are going back to rest. */
export type Change = { arrived: number; left: number; settling: boolean }
export const STILL: Change = { arrived: 0, left: 0, settling: false }

// Starts fast and lands softly: an arrival is seen at once.
const EASE_OUT = 'cubic-bezier(0.23,1,0.32,1)'
const ENTER_MS = 240
// Leaving is quicker than arriving: it asks for no attention.
const LEAVE_MS = 160
const SETTLE_MS = 300
// People arriving together come in one after another, from the middle out.
const ARRIVE_STAGGER_MS = 30
// What is aimed at the member ripples out from the middle and leaves every dot lit.
const RIPPLE_MS = 560
const RIPPLE_STAGGER_MS = 40
const RIPPLE_PEAK = 1.7
const START_SCALE = 0.6
const FADE_MS = 200
const OUTERMOST_RING = Math.ceil((MAX_DOTS - 1) / HALF)

/** How long the ripple takes to cross a full line and settle lit. */
export const FLASH_MS = RIPPLE_MS + OUTERMOST_RING * RIPPLE_STAGGER_MS
/** How long any other change takes at its longest: a full line arriving. */
export const MOTION_MS = ENTER_MS + (MAX_DOTS - 1) * ARRIVE_STAGGER_MS

const resting = `opacity:${REST_OPACITY};transform:none`
const lit = `opacity:${LIT_OPACITY};transform:scale(${LIT_SCALE})`

// Only opacity and scale ever move. With reduced motion nothing changes size:
// an arrival, a departure and the lit state fade, and that is all.
function styleFor(attention: Attention, change: Change): string {
  const base = `.dot{transform-box:fill-box;transform-origin:center;${attention === 'rest' ? resting : lit}}`
  const moving: string[] = []
  const fading: string[] = []
  if (attention === 'flash') {
    moving.push(
      `@keyframes ripple{from{${resting}}45%{opacity:${RIPPLE_OPACITY};transform:scale(${RIPPLE_PEAK})}to{${lit}}}` +
        `.dot{animation:ripple ${RIPPLE_MS}ms ${EASE_OUT} both}`,
    )
    fading.push(`@keyframes glow{from{opacity:${REST_OPACITY}}}.dot{animation:glow ${FADE_MS}ms ease both}`)
  }
  if (change.settling && attention === 'rest') {
    moving.push(`@keyframes settle{from{${lit}}}.dot{animation:settle ${SETTLE_MS}ms ${EASE_OUT} both}`)
    fading.push(`@keyframes dim{from{opacity:${LIT_OPACITY}}}.dot{animation:dim ${FADE_MS}ms ease both}`)
  }
  if (change.arrived > 0) {
    moving.push(
      `@keyframes arrive{from{opacity:0;transform:scale(${START_SCALE})}}` +
        `.in{animation:arrive ${ENTER_MS}ms ${EASE_OUT} both}`,
    )
    fading.push(`@keyframes appear{from{opacity:0}}.in{animation:appear ${FADE_MS}ms ease both}`)
  }
  if (change.left > 0) {
    moving.push(
      `@keyframes leave{to{opacity:0;transform:scale(${START_SCALE})}}` +
        `.out{animation:leave ${LEAVE_MS}ms ease-out both}`,
    )
    fading.push(`@keyframes vanish{to{opacity:0}}.out{animation:vanish ${FADE_MS}ms ease both}`)
  }
  if (!moving.length) return `<style>${base}</style>`
  return (
    `<style>${base}` +
    `@media (prefers-reduced-motion: no-preference){${moving.join('')}}` +
    `@media (prefers-reduced-motion: reduce){${fading.join('')}}` +
    `</style>`
  )
}

/**
 * The SVG behind the conversation: a dot for each person online, up to the cap,
 * in one line. `change` is drawn once, as motion: see above.
 */
export function scene(skin: string | null, count: number, attention: Attention, change: Change = STILL): string {
  const colors = skinOf(skin)
  const kit = kitFor(skin)
  const fill = kit?.dot.fill ?? colors?.accent ?? PLAIN_DOTS
  const rim = kit?.dot.stroke ? ` stroke="${kit.dot.stroke}"` : ''
  const radius = kit?.dot.radius ?? RADIUS
  const ground = kit?.ground.fill ?? colors?.surface
  const shown = Math.max(0, Math.min(Math.floor(count), MAX_DOTS))
  const arrived = Math.max(0, Math.min(Math.floor(change.arrived), shown))
  const left = Math.max(0, Math.min(Math.floor(change.left), MAX_DOTS - shown))
  const shownChange: Change = { arrived, left, settling: change.settling }
  const firstNew = shown - arrived
  const dot = (k: number): string => {
    const { cx, ring } = slot(k)
    // The ripple reaches a dot by how far out it is; arrivals come one after another.
    const delay = attention === 'flash' ? ring * RIPPLE_STAGGER_MS : k >= firstNew && k < shown ? (k - firstNew) * ARRIVE_STAGGER_MS : 0
    const kind = k >= shown ? 'dot out' : k >= firstNew ? 'dot in' : 'dot'
    const wait = delay > 0 ? ` style="animation-delay:${delay}ms"` : ''
    return `<circle class="${kind}" cx="${cx}" cy="${ROW}" r="${radius}" fill="${fill}"${rim}${wait}/>`
  }
  const dots = Array.from({ length: shown + left }, (_, k) => dot(k)).join('')
  return (
    // No viewBox on the root: it is the window itself, one unit to a point, and the ground fills it.
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    styleFor(attention, shownChange) +
    (kit ? `<defs>${kit.ground.defs}${kit.dot.defs}</defs>` : '') +
    (ground ? `<rect width="100%" height="100%" fill="${ground}"/>` : '') +
    // Its left edge is the middle of the window, and the dots step out from it on both sides.
    `<svg x="50%" overflow="visible">${dots}</svg>` +
    `</svg>`
  )
}

// What a screen reader gets: the count and nothing else.
export function alt(count: number): string {
  if (count <= 0) return 'nobody online in Cypher'
  return count === 1 ? '1 person online in Cypher' : `${count} people online in Cypher`
}
