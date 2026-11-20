// Windows XP (Luna, blue), as GUIdebook's Windows XP Professional gallery shows
// it. Colors and bitmaps were read pixel by pixel from those screenshots; the
// hill and sky are a vector redrawing of the Bliss desktop, since a mod loads no
// pictures (sources and the sampled pixels: README.md beside this file). No
// logo or icon is drawn.
import type { BalloonArt, BevelArt } from '../../kit'
import { svg } from '../../kit'

// ---- the system colors ----

export const FACE = '#ece9d8' // a window's and a dialog's face
export const SELECTION = '#316ac5' // a list's chosen line
const BUTTON_EDGE = '#003c74'

// ---- pixel tables ----

// A row of six-digit colors, one per pixel; a dot is a pixel left clear.
type PixelRows = readonly string[]
const CLEAR = '.'

/** A table of pixels as one-pixel rects, `top` pixels down. */
function pixels(rows: PixelRows, top = 0): string {
  return rows
    .flatMap((line, y) =>
      line.split(' ').map((hex, x) => (hex === CLEAR ? '' : `<rect x="${x}" y="${y + top}" width="1" height="1" fill="#${hex}"/>`)),
    )
    .join('')
}

const CRISP = 'shape-rendering="crispEdges"'

// ---- title bar ----

// Display Properties' title bar, 29 pixels tall: its left and right ends with
// the rounded top corners (a dot is the desktop showing through), and the
// column of the bar between them, which stretches.
const TITLE_LEFT: PixelRows = [
  '. . . . . 004bcd',
  '. . . 014cd0 014cd0 0667f4',
  '. . 014cd0 025de9 0667f4 026cf1',
  '. 0041ca 0050e2 0053da 0165eb 0165eb',
  '. 0041ca 004bcd 005adf 005adf 005adf',
  '0032c1 004adc 004bcd 0053da 0053da 0053da',
  '0032c1 0032c1 0041ca 014cd0 0053da 0053da',
  '0024a6 0032c1 0041ca 014cd0 0053da 0053da',
  '0018ab 0032c1 003dcc 0245d0 0053da 0053da',
  '0018ab 0032c1 003dcc 0047d7 0053da 005adf',
  '0018ab 0031c6 003fd2 004ad8 0050e0 0054e3',
  '001abc 0037cb 003bd2 004adc 0053e1 0055e5',
  '001abc 0036d2 0040dc 004adc 0054e3 0055e5',
  '001abc 0036d2 0040dc 004adc 0051e5 0055e5',
  '001abc 0036d2 0040dc 0050e2 0058e6 0059e8',
  '0020c8 0038d8 0046e4 0051e5 0055ea 0058eb',
  '0020c8 0038d8 0046e4 0051e5 0058eb 005cec',
  '001fd2 003ddc 0046e4 0055e5 0058eb 005cec',
  '001fd2 003be0 0046e4 0055ea 005cec 005ff2',
  '0023d6 003be0 0046ea 0051eb 005ff2 005ff2',
  '0023d6 003be0 004be7 0058eb 005ff2 0160f5',
  '001fd2 003be2 004beb 0058ee 005ff2 0160f5',
  '001acf 003be2 004beb 0058ee 0160f5 0361f6',
  '001acf 003be2 004beb 0058ee 0160f5 0160f5',
  '001acf 003be2 004beb 0058ee 005bf2 0160f5',
  '001acf 003be0 004beb 0058ee 005bf2 0058ee',
  '001acf 003be0 004beb 004de3 0054e3 0058e6',
  '001acf 003be0 003be0 004be0 003dcc 0043cf',
  '001acf 003be0 003be0 004be0 0043cf 0043cf',
]
const TITLE_RIGHT: PixelRows = [
  '. . . . .',
  '003fd2 0031c6 . . .',
  '076ffd 0058f3 003bd2 . .',
  '005cec 0054e3 0043d3 003ddc .',
  '004ad8 0043d3 0037cb 0018ab .',
  '003dcc 0037cb 0032c1 0032c1 0015a0',
  '0031c6 0032c1 002ab7 0026ac 0015a0',
  '0031c6 0032c1 0022b9 0024a6 000e7d',
  '0031c6 002cc8 0022b9 0024a6 000e7d',
  '0037cb 002cc8 0020c8 0024a6 000e7d',
  '0036d2 002cc8 0020c8 0026ac 000e7d',
  '0036d2 002cc8 0020c8 0024a6 000e7d',
  '0036d2 0029d0 0020c8 0026ac 000e7d',
  '0035d8 0029d0 0020c8 0026ac 000e7d',
  '0035d8 0036d2 0029d0 002ab7 000e7d',
  '003ad9 0035d8 0029d0 0026ac 00138b',
  '003be0 0035d8 0023d6 002ab7 00138b',
  '0040e1 003be0 002edc 002ab7 001592',
  '0041e8 003be2 002edc 002ab7 001592',
  '0046ea 0041e8 003be2 0032c1 001592',
  '0047ef 0041e8 0038ea 002cc8 001592',
  '0047ef 0046ea 0038ea 0031c6 001592',
  '004cf3 0047ef 0038ea 0032c1 001592',
  '004cf3 0047ef 0038ea 0032c1 00138b',
  '004cf3 0047ef 0038ea 0032c1 00138b',
  '0047ef 0046ea 0038ea 0032c1 00138b',
  '0047ef 0047ef 0038ea 0032c1 00138b',
  '0035d8 003be0 0038ea 0032c1 00138b',
  '0043cf 003be0 002edc 0032c1 001592',
]
const TITLE_MIDDLE =
  '0059e8 3d95ff 2b90ff 016cfe 0365f1 005ce9 0058e6 0053e1 0053e1 0053e1 0055e5 0051e5 0055e5 0055e5 0055ea ' +
  '0055ea 0058ee 0058f3 005af5 0060f9 0060fc 0065fd 026afe 026afe 026afe 0065fd 0060f9 0046e0 0143cf'

export const TITLE_HEIGHT = TITLE_LEFT.length
const widthOf = (rows: PixelRows): number => rows[0]?.split(' ').length ?? 0
// Far wider than any window: the middle is cropped to its slot, as a balloon's strips are.
const TITLE_STRETCH = 4000

export const TITLE = {
  left: { source: svg(widthOf(TITLE_LEFT), TITLE_HEIGHT, `<g ${CRISP}>${pixels(TITLE_LEFT)}</g>`), width: widthOf(TITLE_LEFT) },
  middle: svg(
    TITLE_STRETCH,
    TITLE_HEIGHT,
    `<g ${CRISP}>` +
      TITLE_MIDDLE.split(' ')
        .map((hex, y) => `<rect y="${y}" width="${TITLE_STRETCH}" height="1" fill="#${hex}"/>`)
        .join('') +
      '</g>',
  ),
  right: { source: svg(widthOf(TITLE_RIGHT), TITLE_HEIGHT, `<g ${CRISP}>${pixels(TITLE_RIGHT)}</g>`), width: widthOf(TITLE_RIGHT) },
}

// ---- frames ----

// The window's blue sides and foot below the title bar, outermost first: the
// left side and top take `lit`, the right side and foot `shade` (Display
// Properties, x 0 to 2 and 401 to 403 at y 200; the foot at y 452 to 454).
const WINDOW_RINGS = [
  { lit: '#0831d8', shade: '#00138c' },
  { lit: '#166aee', shade: '#001ea1' },
  { lit: '#0855dd', shade: '#003edc' },
]

/** The window under its title bar: blue sides and foot, open at the top. */
export const WINDOW: BevelArt = { face: FACE, rings: WINDOW_RINGS, openTop: true }

/** A window with no title bar of its own, for the panes that carry a reply on. */
export const PANE: BevelArt = { face: FACE, rings: WINDOW_RINGS }

/** The selection: a list's chosen line, flat blue under white words. */
export const CHOSEN: BevelArt = { face: SELECTION, rings: [{ lit: SELECTION, shade: SELECTION }] }

/**
 * A push button (Display Properties' "Cancel"): a dark blue rim with rounded
 * corners round a face that runs from white at the top to a warm gray at the
 * foot.
 */
const BUTTON_RADIUS = 3
const BUTTON_FOOT = 4
export const BUTTON: BalloonArt = {
  radius: BUTTON_RADIUS,
  foot: BUTTON_FOOT,
  tail: 0,
  side: 'left',
  head: '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fcfcfb"/>',
  body: '#f4f4f0',
  sole:
    '<stop offset="0" stop-color="#f0f0ea"/><stop offset="0.34" stop-color="#ecebe6"/>' +
    '<stop offset="0.67" stop-color="#e2dfd6"/><stop offset="1" stop-color="#d6d0c5"/>',
  edge: BUTTON_EDGE,
  edgeBottom: BUTTON_EDGE,
}

// ---- people online ----

// A step Setup has finished ("Collecting information"): a dark blue rim, a
// white ring and a green bead lit from the upper left, 16 pixels across.
export const BULLET =
  '<pattern id="bullet" width="1" height="1" patternContentUnits="objectBoundingBox" viewBox="0 0 16 16">' +
  '<radialGradient id="bead" cx="0.4" cy="0.35" r="0.65">' +
  '<stop offset="0" stop-color="#6cd75f"/><stop offset="0.45" stop-color="#2ec023"/><stop offset="1" stop-color="#07a305"/>' +
  '</radialGradient>' +
  '<circle cx="8" cy="8" r="8" fill="#194d80"/>' +
  '<circle cx="8" cy="8" r="6.6" fill="#ffffff"/>' +
  '<circle cx="8" cy="8" r="4.2" fill="url(#bead)"/>' +
  '</pattern>'

// ---- spinner ----

// Setup's progress squares (bottom right of the "Installing Windows" screen):
// five 7-pixel squares 14 pixels apart on the navy band, one of them lit
// green. The lit one steps along and comes round again; still on the first
// square for a person who asked for less motion.
const LIT: PixelRows = [
  '92a6cd dfe4e5 d6e4dc d3e4d9 cfe4d5 cce4d2 a4b3d1',
  'e3e8e7 90e190 7dda7d 6ad46a 5ace5a 40bf40 bce7bc',
  'd8e6de 7dd97d 77d977 5ed15e 4ccb4c 3bc13b b8e5b8',
  'd2e6d8 67d267 6bd56b 5bd65b 47db47 33d033 b5eab5',
  'cce6d1 54cb54 64d564 5dde5d 47ea47 2ae12a afecaf',
  'cde9cf 35bb35 44c444 41d041 30df30 22d622 afebaf',
  'a5b4d3 bae6ba b4e4b4 b4e9b4 b0edb0 afedaf b6c3d9',
]
const DIM: PixelRows = [
  '003399 003298 003298 003298 003298 003298 003298',
  '003399 003a87 004b65 004b65 004b65 003a86 003298',
  '003399 004c66 007f00 007f00 007f00 004b65 003298',
  '003399 004c66 007f00 007f00 007f00 004b65 003298',
  '003399 004c66 007f00 007f00 007f00 004b65 003298',
  '003399 003a87 004b65 004b65 004b65 003a87 003298',
  '003399 003399 003399 003399 003399 003399 003399',
]
const BAND = '#08339b'
const SQUARES = 5
const PITCH = 14
const SQUARE = LIT.length
const MARGIN = 3
const STEP_MS = 250
const BAND_WIDTH = MARGIN + (SQUARES - 1) * PITCH + SQUARE + MARGIN
const BAND_HEIGHT = MARGIN + SQUARE + MARGIN
export const SQUARES_SIZE = { width: BAND_WIDTH, height: BAND_HEIGHT }
const dims = Array.from(
  { length: SQUARES },
  (_, k) => `<g transform="translate(${MARGIN + k * PITCH} ${MARGIN})">${pixels(DIM)}</g>`,
).join('')
export const SETUP_SQUARES =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${BAND_WIDTH}" height="${BAND_HEIGHT}" viewBox="0 0 ${BAND_WIDTH} ${BAND_HEIGHT}" ${CRISP}>` +
  '<style>' +
  `@media (prefers-reduced-motion: no-preference){.lit{animation:step ${STEP_MS * SQUARES}ms steps(${SQUARES}) infinite}}` +
  `@keyframes step{from{transform:translateX(0)}to{transform:translateX(${SQUARES * PITCH}px)}}` +
  '</style>' +
  `<rect width="${BAND_WIDTH}" height="${BAND_HEIGHT}" fill="${BAND}"/>` +
  dims +
  `<g class="lit"><g transform="translate(${MARGIN} ${MARGIN})">${pixels(LIT)}</g></g>` +
  '</svg>'

// ---- ground ----

// Bliss, the desktop XP starts on, redrawn in vectors over its 800 by 570
// pixels above the taskbar (sampled row by row from the empty desktop): a deep
// blue sky paling toward the horizon, heaped cumulus and leaning cirrus, a far
// blue ridge on the right, and the green hill. Its crest is lit from the left,
// the slope just past the crest lies in shadow, and the meadow darkens to a
// furrow near the foot. It covers the window as XP's "Stretch" did a wide
// screen: kept in proportion, cropped at the sides and held to the bottom.

// Cumulus puffs, each a circle (middle across, down, radius), heaped where the
// screenshot has them. Each heap has a pale blue underside.
const PUFFS = [
  // top left
  '40 8 14', '62 16 18', '92 10 22', '118 22 16', '140 14 18', '160 30 10', '178 24 8',
  // top right
  '630 14 12', '652 26 16', '676 18 18', '700 36 20', '726 28 22', '752 44 18', '778 30 20', '798 52 16',
  // the little heap left of middle
  '176 133 7', '192 130 9', '210 136 10', '232 132 12', '250 146 7',
  // the middle heap and its trailing edge
  '368 222 12', '388 214 16', '410 222 18', '432 230 12', '452 242 8', '470 248 7',
  '520 246 10', '536 236 14', '552 244 12', '566 252 7',
  // the right heaps
  '566 194 10', '584 186 14', '604 182 16', '626 192 12', '644 204 8',
  '592 244 12', '614 232 18', '640 226 20', '664 238 18', '690 248 12', '712 256 7',
  '724 152 9', '742 144 13', '764 150 12', '786 158 9',
]
// Flat, leaning clouds: middle across, down, half width, half height, tilt in degrees.
const WISPS = [
  // the cirrus sweeping up from the middle
  '400 40 90 8 30',
  '440 85 70 6 36',
  '470 110 40 4 40',
  // the small streaks on the left
  '120 210 62 10 14',
  '150 228 36 5 10',
  // the low bank along the horizon
  '260 307 46 5 0',
  '500 282 80 4 4',
  '520 316 60 8 2',
  '640 326 80 9 -2',
  '760 330 60 8 0',
]
const UNDERSIDE_DROP = 4
const puff = (line: string, drop = 0): string => {
  const [cx, cy, r] = line.split(' ').map(Number)
  return `<circle cx="${cx}" cy="${(cy ?? 0) + drop}" r="${r}"/>`
}
const wisp = (line: string): string => {
  const [cx, cy, rx, ry, tilt] = line.split(' ')
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${tilt} ${cx} ${cy})"/>`
}
const CLOUDS =
  `<g fill="#ffffff" opacity="0.75" filter="url(#soft)">${WISPS.map(wisp).join('')}</g>` +
  `<g fill="#bccff2" filter="url(#puff)">${PUFFS.map(line => puff(line, UNDERSIDE_DROP)).join('')}</g>` +
  `<g fill="#ffffff" filter="url(#puff)">${PUFFS.map(line => puff(line)).join('')}</g>`

// The hill's outline, through the crest points sampled every 40 pixels.
const HILL = 'M0 334C60 322 140 315 200 315C280 316 420 330 560 349C660 364 740 376 800 384V570H0Z'
// The shadow just past the crest, thickest in the middle right.
const RIDGE_SHADOW = 'M260 317C420 330 560 349 800 384V418C700 406 600 392 520 382C430 368 340 342 260 322Z'

export const BLISS =
  '<pattern id="bliss" width="1" height="1" viewBox="0 0 800 570" preserveAspectRatio="xMidYMax slice">' +
  '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#2d63e6"/><stop offset="0.2" stop-color="#3973f0"/>' +
  '<stop offset="0.45" stop-color="#5a8cf3"/><stop offset="0.6" stop-color="#9cc5f1"/>' +
  '</linearGradient>' +
  '<radialGradient id="haze" cx="0.05" cy="0.5" r="0.55">' +
  '<stop offset="0" stop-color="#a8ccf4" stop-opacity="0.6"/><stop offset="1" stop-color="#a8ccf4" stop-opacity="0"/>' +
  '</radialGradient>' +
  '<linearGradient id="far" x1="0" y1="354" x2="0" y2="380" gradientUnits="userSpaceOnUse">' +
  '<stop offset="0" stop-color="#7a8bd0"/><stop offset="1" stop-color="#3e488a"/>' +
  '</linearGradient>' +
  // Darker toward the foot, and sooner on the left than the right.
  '<linearGradient id="hill" x1="400" y1="316" x2="388" y2="570" gradientUnits="userSpaceOnUse">' +
  '<stop offset="0" stop-color="#84aa22"/><stop offset="0.33" stop-color="#77a018"/>' +
  '<stop offset="0.45" stop-color="#6a9220"/><stop offset="0.56" stop-color="#58791a"/>' +
  '<stop offset="0.66" stop-color="#42591a"/><stop offset="0.74" stop-color="#2f3c18"/>' +
  '<stop offset="0.8" stop-color="#384c16"/><stop offset="1" stop-color="#344910"/>' +
  '</linearGradient>' +
  `<clipPath id="on-hill"><path d="${HILL}"/></clipPath>` +
  '<filter id="soft" x="-0.5" y="-1" width="2" height="3"><feGaussianBlur stdDeviation="6"/></filter>' +
  '<filter id="blur" x="-0.2" y="-0.5" width="1.4" height="2"><feGaussianBlur stdDeviation="8"/></filter>' +
  '<filter id="puff" x="-0.1" y="-0.2" width="1.2" height="1.4"><feGaussianBlur stdDeviation="3.5"/></filter>' +
  '<rect width="800" height="570" fill="url(#sky)"/>' +
  '<rect width="800" height="570" fill="url(#haze)"/>' +
  CLOUDS +
  '<path d="M660 372C700 362 735 352 760 354C782 356 794 360 800 362V400H660Z" fill="url(#far)"/>' +
  `<path d="${HILL}" fill="url(#hill)"/>` +
  // The shadow is blurred, then kept to the hill so none of it darkens the sky.
  `<g clip-path="url(#on-hill)"><path d="${RIDGE_SHADOW}" fill="#2c4420" opacity="0.85" filter="url(#blur)"/></g>` +
  '<path d="M0 503C200 499 500 492 800 484" fill="none" stroke="#2a2418" stroke-width="3" opacity="0.7" filter="url(#puff)"/>' +
  '</pattern>'
