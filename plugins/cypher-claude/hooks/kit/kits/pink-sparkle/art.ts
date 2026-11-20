// Pink Sparkle has no original of its own: it is Cypher's pink-core skin, and
// these are that skin's values, from src/app/skins/pink.css (candy enamel,
// cream paper, plum outlines, floating sparkle). No logo or icon is drawn.
import type { BalloonArt, CardArt } from '../../kit'

// ---- the skin's colors ----

export const BLUSH = '#ffd7e8' // the ground
export const PAPER = '#fff8fc' // a panel's cream
export const PLUM = '#71324f' // every outline
export const FRAME = '#f6a6c7' // a window's enamel frame
export const MAGENTA = '#ad1769' // the accent
export const INK = '#502238'
const SPARK_GLOW = '#ed83b8'

// ---- ground ----

// Sparkles: the skin's four-point star (its points at 38% and 62%), white with
// a pink glow, scattered over a 220-point tile at eight sizes from 6 to 18.
const STARS =
  'M30 33L31.5 38.3L37 40L31.5 41.7L30 47L28.5 41.7L23 40L28.5 38.3Z' +
  'M150 17.5L151 20.9L154.5 22L151 23.1L150 26.5L149 23.1L145.5 22L149 20.9Z' +
  'M96 101L98 107.8L105 110L98 112.2L96 119L94 112.2L87 110L94 107.8Z' +
  'M190 144.5L191.2 148.7L195.5 150L191.2 151.3L190 155.5L188.8 151.3L184.5 150L188.8 148.7Z' +
  'M40 171L40.9 174L44 175L40.9 176L40 179L39.1 176L36 175L39.1 174Z' +
  'M160 197.5L161.7 203.2L167.5 205L161.7 206.8L160 212.5L158.3 206.8L152.5 205L158.3 203.2Z' +
  'M120 57L120.7 59.3L123 60L120.7 60.7L120 63L119.3 60.7L117 60L119.3 59.3Z' +
  'M210 76.5L210.8 79.2L213.5 80L210.8 80.8L210 83.5L209.2 80.8L206.5 80L209.2 79.2Z'

export const SPARKLES =
  '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5"/></filter>' +
  '<pattern id="sparkle" width="220" height="220" patternUnits="userSpaceOnUse">' +
  `<rect width="220" height="220" fill="${BLUSH}"/>` +
  `<path d="${STARS}" fill="${SPARK_GLOW}" filter="url(#glow)"/>` +
  `<path d="${STARS}" fill="#ffffff"/>` +
  '</pattern>'

// A candy gem: white light at its top-left, pink enamel to a magenta edge.
export const GEM =
  '<radialGradient id="gem" cx="0.38" cy="0.32" r="0.7">' +
  `<stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#ffd3e6"/><stop offset="0.7" stop-color="${FRAME}"/><stop offset="1" stop-color="${MAGENTA}"/>` +
  '</radialGradient>'

// ---- panels and buttons ----

const PANEL_RADIUS = 12
const PANEL_LINE = 2
// The panel's and the buttons' hard shadow, in pixels below.
const DROP = 2
const ROUNDED = { shape: 'round', size: PANEL_RADIUS } as const

/** The chat log's panel: cream paper in a two-pixel plum line, lit inside its top, a pink shadow under. */
export const PANEL: CardArt = {
  face: PAPER,
  edge: PLUM,
  weight: PANEL_LINE,
  corners: { tl: ROUNDED, tr: ROUNDED, br: ROUNDED, bl: ROUNDED },
  lit: '#ffffff',
  drop: { color: '#c76b95', height: DROP },
}

const BUTTON_RADIUS = 9
const BUTTON_FOOT = 11

// The candy enamel the skin's buttons wear: light above a hard step at the
// middle, glowing back up at the foot.
/** A tool row: the skin's pink candy button. */
export const CANDY: BalloonArt = {
  head: '<stop offset="0" stop-color="#fff8fc"/><stop offset="1" stop-color="#ffd3e6"/>',
  body: '#f7b2d0',
  sole: '<stop offset="0" stop-color="#f7b2d0"/><stop offset="1" stop-color="#ffe1ed"/>',
  edge: PLUM,
  edgeBottom: PLUM,
  shadow: '#b65c86',
  radius: BUTTON_RADIUS,
  foot: BUTTON_FOOT,
  tail: 0,
  side: 'left',
}

/** Your words: the same candy in the skin's magenta, as its default button. */
export const MAGENTA_CANDY: BalloonArt = {
  head: '<stop offset="0" stop-color="#e66aa8"/><stop offset="1" stop-color="#c42a7d"/>',
  body: MAGENTA,
  sole: `<stop offset="0" stop-color="${MAGENTA}"/><stop offset="1" stop-color="#c8428b"/>`,
  edge: PLUM,
  edgeBottom: '#5a2238',
  shadow: '#b65c86',
  radius: BUTTON_RADIUS,
  foot: BUTTON_FOOT,
  tail: 0,
  side: 'right',
}

// ---- spinner ----

// Three sparkles twinkling one after another, in the accent so they read on
// the blush. Still and lit for a person who asked for less motion.
const TWINKLE_WIDTH = 38
const TWINKLE_HEIGHT = 18
export const TWINKLE_SIZE = { width: TWINKLE_WIDTH, height: TWINKLE_HEIGHT }
export const TWINKLE =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TWINKLE_WIDTH}" height="${TWINKLE_HEIGHT}" viewBox="0 0 ${TWINKLE_WIDTH} ${TWINKLE_HEIGHT}">` +
  '<style>:root{color-scheme:light}' +
  '.s{transform-box:fill-box;transform-origin:center}' +
  '@media (prefers-reduced-motion: no-preference){' +
  '.s{animation:twinkle 0.9s cubic-bezier(0.77,0,0.175,1) infinite;opacity:0.35;transform:scale(0.55)}' +
  '.s2{animation-delay:0.15s}.s3{animation-delay:0.3s}}' +
  '@keyframes twinkle{40%{opacity:1;transform:scale(1)}80%{opacity:0.35;transform:scale(0.55)}}' +
  '</style>' +
  `<g fill="${MAGENTA}">` +
  '<path class="s" d="M6 4L7.1 7.8L11 9L7.1 10.2L6 14L4.9 10.2L1 9L4.9 7.8Z"/>' +
  '<path class="s s2" d="M19 4L20.1 7.8L24 9L20.1 10.2L19 14L17.9 10.2L14 9L17.9 7.8Z"/>' +
  '<path class="s s3" d="M32 4L33.1 7.8L37 9L33.1 10.2L32 14L30.9 10.2L27 9L30.9 7.8Z"/>' +
  '</g>' +
  '</svg>'
