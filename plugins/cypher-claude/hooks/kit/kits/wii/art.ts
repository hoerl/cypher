// The Wii Menu (2006, as system menu 3.0 drew it). Colors were read pixel by
// pixel from its screenshot, the tile and button geometry from the community
// Figma file Cypher's Wee skin was built on (sources and sampled pixels:
// README.md beside this file). No logo or channel art is drawn.
import type { BalloonArt, CardArt } from '../../kit'

// ---- ground ----

const STRIPE = '#f3f3f3'
const STRIPE_DARK = '#ededed'

// The menu's faint ruled background: four pixels light, two a shade darker.
export const RULED =
  '<pattern id="ruled" width="6" height="6" patternUnits="userSpaceOnUse">' +
  `<rect width="6" height="4" fill="${STRIPE}"/><rect y="4" width="6" height="2" fill="${STRIPE_DARK}"/>` +
  '</pattern>'

/** The bar along the foot of the menu, where the clock sits. */
export const BAR = '#d1d3d9'
export const CYAN = '#34beed'
export const INK = '#383e3f'

// The round console buttons at the bar's ends (Wii, mail): a white sphere
// greying to its edge, inside a cyan ring.
export const ROUND =
  '<radialGradient id="round" cx="0.38" cy="0.3" r="0.7">' +
  '<stop offset="0.18" stop-color="#ffffff"/><stop offset="0.46" stop-color="#ececec"/><stop offset="0.78" stop-color="#d9d9d9"/>' +
  '</radialGradient>'

// ---- tiles ----

// A channel tile: white, its grey outline two pixels wide and rounded 14.
const TILE_RADIUS = 14
const TILE_LINE = 2
const ROUNDED = { shape: 'round', size: TILE_RADIUS } as const
const CORNERS: CardArt['corners'] = { tl: ROUNDED, tr: ROUNDED, br: ROUNDED, bl: ROUNDED }

/** A channel tile at rest (the Disc Channel): white inside a grey outline. */
export const TILE: CardArt = { face: '#ffffff', edge: '#b4b4b4', weight: TILE_LINE, corners: CORNERS }

/**
 * The tile the pointer is on: outlined in the menu's cyan, and washed with it,
 * as the menu tints what you have picked, so your words never read as Claude's.
 */
export const POINTED: CardArt = { face: '#e6f6fd', edge: CYAN, weight: TILE_LINE, corners: CORNERS }

// ---- buttons ----

// The menu's pill button: white at the top, cooling to blue-grey at its foot,
// with a thin cyan edge. Its ends are half its height.
const PILL_RADIUS = 11
const PILL_FOOT = 11

/** A tool row: the Wii's pill button. */
export const PILL: BalloonArt = {
  head: '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f6f7f9"/>',
  body: '#eef1f5',
  sole: '<stop offset="0" stop-color="#eef1f5"/><stop offset="0.4" stop-color="#e3e8ef"/><stop offset="1" stop-color="#c9d1dc"/>',
  edge: '#8fd3ee',
  edgeBottom: '#6fc4e6',
  radius: PILL_RADIUS,
  foot: PILL_FOOT,
  tail: 0,
  side: 'left',
}

// ---- spinner ----

// The menu's wait: eight cyan beads round a ring, the brightest stepping on
// one bead at a time and the ones behind it fading. Still for a person who
// asked for less motion.
const WAIT_SIZE = 20
export const BEADS_SIZE = { width: WAIT_SIZE, height: WAIT_SIZE }
export const BEADS =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WAIT_SIZE}" height="${WAIT_SIZE}" viewBox="0 0 20 20">` +
  '<style>:root{color-scheme:light}' +
  '@media (prefers-reduced-motion: no-preference){.ring{animation:turn 0.8s steps(8) infinite}}' +
  '@keyframes turn{to{transform:rotate(360deg)}}' +
  '.ring{transform-origin:10px 10px;transform-box:view-box}' +
  '</style>' +
  '<g class="ring">' +
  `<circle cx="10" cy="2.5" r="2" fill="${CYAN}"/>` +
  `<circle cx="15.3" cy="4.7" r="2" fill="${CYAN}" opacity="0.15"/>` +
  `<circle cx="17.5" cy="10" r="2" fill="${CYAN}" opacity="0.15"/>` +
  `<circle cx="15.3" cy="15.3" r="2" fill="${CYAN}" opacity="0.15"/>` +
  `<circle cx="10" cy="17.5" r="2" fill="${CYAN}" opacity="0.2"/>` +
  `<circle cx="4.7" cy="15.3" r="2" fill="${CYAN}" opacity="0.35"/>` +
  `<circle cx="2.5" cy="10" r="2" fill="${CYAN}" opacity="0.55"/>` +
  `<circle cx="4.7" cy="4.7" r="2" fill="${CYAN}" opacity="0.8"/>` +
  '</g>' +
  '</svg>'
