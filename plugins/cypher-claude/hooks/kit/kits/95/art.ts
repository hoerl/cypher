// Windows 95, as its own screenshots show it. Every color and ring here was
// read pixel by pixel from GUIdebook's Windows 95 gallery (sources and the
// sampled pixels: README.md beside this file). No logo or icon is drawn.
import type { BevelArt } from '../../kit'

// ---- the system colors ----

export const FACE = '#c0c0c0' // a window's and a button's face
const HILIGHT = '#ffffff'
const LIGHT = '#dfdfdf'
const SHADOW = '#808080'
const DARK = '#000000'
export const NAVY = '#000080' // a title bar and the selection
// The desktop Windows 95 starts on (the empty and first-run desktops).
export const TEAL = '#008080'

// ---- frames ----

/** A push button ("Next >", Display Properties' "OK"): white then light gray above, gray then black below. */
export const BUTTON: BevelArt = {
  face: FACE,
  rings: [
    { lit: HILIGHT, shade: DARK },
    { lit: LIGHT, shade: SHADOW },
  ],
}

/**
 * A window (Display Properties): light gray then white above and left, gray then
 * black below and right, and one pixel of face between the frame and the caption.
 */
export const WINDOW: BevelArt = {
  face: FACE,
  rings: [
    { lit: LIGHT, shade: DARK },
    { lit: HILIGHT, shade: SHADOW },
    { lit: FACE, shade: FACE },
  ],
}

/** The selection: a list's chosen line, flat navy under white words. */
export const SELECTION: BevelArt = {
  face: NAVY,
  rings: [{ lit: NAVY, shade: NAVY }],
}

// ---- people online ----

// A checked radio button (Display Properties' "Center"), 12 pixels square:
// k black, d gray, l light gray, w white; a dot is the face showing through.
const RADIO_ROWS = [
  '....dddd....',
  '..ddkkkkdd..',
  '.dkkwwwwkkw.',
  '.dkwwwwwwlw.',
  'dkwwwkkwwwlw',
  'dkwwkkkkwwlw',
  'dkwwkkkkwwlw',
  'dkwwwkkwwwlw',
  '.dkwwwwwwlw.',
  '.dllwwwwllw.',
  '..wwllllww..',
  '....wwww....',
]
const RADIO_INK: Readonly<Record<string, string>> = { k: DARK, d: SHADOW, l: LIGHT, w: HILIGHT }
export const RADIO_SIZE = RADIO_ROWS.length
const radioPixels = RADIO_ROWS.flatMap((row, y) =>
  [...row].map((ink, x) => {
    const fill = RADIO_INK[ink]
    return fill ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>` : ''
  }),
).join('')
/** The radio as a pattern that fills one dot's circle, its bounding box mapped to the 12 pixels. */
export const RADIO =
  `<pattern id="radio" width="1" height="1" patternContentUnits="objectBoundingBox" viewBox="0 0 ${RADIO_SIZE} ${RADIO_SIZE}" shape-rendering="crispEdges">` +
  radioPixels +
  '</pattern>'

// ---- spinner ----

// Setup's "Copying files..." bar (the Setup screenshot): a one-pixel black
// frame around a white field 18 pixels tall. Windows 95 had no busy bar, so a
// navy block, the selection's color, sweeps through the field and comes round
// again. Still, half in view, for a person who asked for less motion.
const BAR_WIDTH = 160
const BAR_HEIGHT = 20
const BLOCK = 48
const SWEEP_MS = 1400
// The frame's line on each side, and the half of the block shown when still.
const FRAME_LINES = 2
const HALF_BLOCK = BLOCK / FRAME_LINES
export const BAR_SIZE = { width: BAR_WIDTH, height: BAR_HEIGHT }
const INNER_WIDTH = BAR_WIDTH - FRAME_LINES
const INNER_HEIGHT = BAR_HEIGHT - FRAME_LINES
export const SETUP_BAR =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${BAR_WIDTH}" height="${BAR_HEIGHT}" viewBox="0 0 ${BAR_WIDTH} ${BAR_HEIGHT}" shape-rendering="crispEdges">` +
  '<style>' +
  `.block{transform:translateX(${HALF_BLOCK}px)}` +
  `@media (prefers-reduced-motion: no-preference){.block{animation:sweep ${SWEEP_MS}ms linear infinite}}` +
  `@keyframes sweep{from{transform:translateX(-${BLOCK}px)}to{transform:translateX(${INNER_WIDTH}px)}}` +
  '</style>' +
  `<defs><clipPath id="inside"><rect x="1" y="1" width="${INNER_WIDTH}" height="${INNER_HEIGHT}"/></clipPath></defs>` +
  `<rect width="${BAR_WIDTH}" height="${BAR_HEIGHT}" fill="${DARK}"/>` +
  `<rect x="1" y="1" width="${INNER_WIDTH}" height="${INNER_HEIGHT}" fill="${HILIGHT}"/>` +
  `<g clip-path="url(#inside)"><rect class="block" x="1" y="1" width="${BLOCK}" height="${INNER_HEIGHT}" fill="${NAVY}"/></g>` +
  '</svg>'
