// The original Xbox dashboard (2001), as its own screenshot shows it. Every
// color here was read pixel by pixel from that screenshot, and the plates' cut
// corners come from Cypher's BoxX skin, which studied the same dashboard
// (sources and sampled pixels: README.md beside this file). No logo is drawn:
// the big glowing orb that carries the Xbox mark is left out.
import type { CardArt } from '../../kit'

// ---- ground ----

const BASE = '#082d01' // the dashboard's green-black between grid lines
const GRID = '#1d4415' // a line of the wireframe, as faint as the screenshot's

// The wireframe the menu floats in: rings round a centre left of the middle,
// where the orb sits, and spokes out from it, over a glow that falls off to
// near black at the edges. Drawn on a 16:9 canvas that covers the window,
// cropped at the sides and centred. The rings flatten to 0.62 of their width,
// the spokes leave the centre every 22 to 25 degrees.
const RINGS =
  '<ellipse cx="520" cy="380" rx="120" ry="74"/><ellipse cx="520" cy="380" rx="230" ry="143"/>' +
  '<ellipse cx="520" cy="380" rx="350" ry="217"/><ellipse cx="520" cy="380" rx="480" ry="298"/>' +
  '<ellipse cx="520" cy="380" rx="620" ry="384"/><ellipse cx="520" cy="380" rx="780" ry="484"/>' +
  '<ellipse cx="520" cy="380" rx="950" ry="589"/>'
const SPOKES =
  '<path d="M520 380L1170 -729M520 380L1864 -454M520 380L2282 -62M520 380L2420 380M520 380L2282 822' +
  'M520 380L1864 1214M520 380L1170 1489M520 380L-130 1489M520 380L-824 1214M520 380L-1242 822' +
  'M520 380L-1380 380M520 380L-1242 -62M520 380L-824 -454M520 380L-130 -729"/>'

export const DASHBOARD =
  '<radialGradient id="glow" cx="0.33" cy="0.42" r="0.85">' +
  `<stop offset="0" stop-color="#103a08"/><stop offset="0.45" stop-color="${BASE}"/><stop offset="1" stop-color="#031400"/>` +
  '</radialGradient>' +
  '<pattern id="dash" width="1" height="1" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">' +
  '<rect width="1600" height="900" fill="url(#glow)"/>' +
  `<g fill="none" stroke="${GRID}" stroke-width="1.5" opacity="0.8">${RINGS}${SPOKES}</g>` +
  '</pattern>'

// A menu item's bullet (beside MEMORY, MUSIC, SETTINGS): a glowing yellow-green
// core inside a dark ring and a bright rim, sampled down its middle.
export const BULLET =
  '<radialGradient id="bullet" cx="0.5" cy="0.45" r="0.5">' +
  '<stop offset="0" stop-color="#fffd6e"/><stop offset="0.45" stop-color="#e7fa63"/>' +
  '<stop offset="0.65" stop-color="#acce43"/><stop offset="0.8" stop-color="#5a920d"/>' +
  '<stop offset="0.9" stop-color="#598b04"/><stop offset="1" stop-color="#8ac750"/>' +
  '</radialGradient>'

// ---- plates ----

const SQUARE = { shape: 'cut', size: 0 } as const
// The upper right is sliced 8 pixels each way, the lower left 6.
const UPPER_CUT = 8
const LOWER_CUT = 6
// The lit plate's glow and the resting plate's dark foot, in pixels.
const FOOT = 2

// A plate's cut corners: the upper right and the lower left are sliced off,
// the other two meet square, so every plate leans the same way.
const CORNERS: CardArt['corners'] = {
  tl: SQUARE,
  tr: { shape: 'cut', size: UPPER_CUT },
  br: SQUARE,
  bl: { shape: 'cut', size: LOWER_CUT },
}

/** A menu plate at rest (MEMORY): dark green glass, a lit line along its top and a dark foot. */
export const PLATE: CardArt = {
  face: '#0c4903',
  edge: '#3f6a1c',
  weight: 1,
  corners: CORNERS,
  lit: '#3a6a28',
  shade: { color: '#062500', height: FOOT },
  mode: 'dark',
}

/** The chosen plate (MUSIC): lit yellow-green, a bright line above and a glow at its foot. */
export const CHOSEN: CardArt = {
  face: '#93ac09',
  edge: '#c4e528',
  weight: 1,
  corners: CORNERS,
  lit: '#edff68',
  shade: { color: '#adcc30', height: FOOT },
  mode: 'dark',
}

/** An empty plate: the ground showing through a rim, for the quieter tool rows. */
export const HOLLOW: CardArt = {
  face: BASE,
  edge: '#5f822a',
  weight: 1,
  corners: CORNERS,
  mode: 'dark',
}

/** The words on the chosen plate. */
export const ON_CHOSEN = '#1b3000'

// ---- spinner ----

// A bullet with a spark circling it on the wireframe's orbit, once a second.
// Still for a person who asked for less motion.
const ORBIT_WIDTH = 30
const ORBIT_HEIGHT = 20
export const ORBIT_SIZE = { width: ORBIT_WIDTH, height: ORBIT_HEIGHT }
export const ORBIT =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ORBIT_WIDTH}" height="${ORBIT_HEIGHT}" viewBox="0 0 ${ORBIT_WIDTH} ${ORBIT_HEIGHT}">` +
  // Desktop draws a moving picture in a frame of its own; one in the other mode
  // than the page it sits on gets a white backdrop, so the drawing names its mode.
  '<style>:root{color-scheme:dark}' +
  '@media (prefers-reduced-motion: no-preference){.spark{animation:orbit 1s linear infinite}}' +
  '@keyframes orbit{to{transform:rotate(360deg)}}' +
  '.spark{transform-origin:15px 10px;transform-box:view-box}' +
  '</style>' +
  `<defs>${BULLET}</defs>` +
  '<ellipse cx="15" cy="10" rx="13" ry="8" fill="none" stroke="#3f6a1c"/>' +
  '<circle cx="15" cy="10" r="5" fill="url(#bullet)"/>' +
  // The spark rides a circle and the group squashes it to the orbit's ellipse.
  '<g transform="translate(15 10) scale(1 0.615) translate(-15 -10)">' +
  '<g class="spark"><circle cx="28" cy="10" r="1.8" fill="#edff68"/></g>' +
  '</g>' +
  '</svg>'
