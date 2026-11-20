// Aqua, as Mac OS X 10.2 to 10.4 drew it, with iChat AV's balloons. Every
// value here was measured from screenshots of the originals (sources and the
// sampled pixels: README.md beside this file). No logo or icon is drawn.
import type { BalloonArt } from '../../kit'

// ---- ground ----

// Jaguar's pinstripes: a 4-point period, two rows white and two rows grey.
export const PINSTRIPE =
  '<pattern id="pin" width="4" height="4" patternUnits="userSpaceOnUse">' +
  '<rect width="4" height="2" fill="#ffffff"/><rect y="2" width="4" height="2" fill="#ececec"/>' +
  '</pattern>'

// iChat's "Available" gem: a green gel orb with a dark rim, a bright cap of
// light at the top and a glow at the bottom (sampled from Tiger's buddy list).
export const ORB =
  '<linearGradient id="orb" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#c1e9ae"/><stop offset="0.35" stop-color="#74c535"/>' +
  '<stop offset="0.7" stop-color="#85da00"/><stop offset="1" stop-color="#b7f448"/>' +
  '</linearGradient>'
export const ORB_RIM = '#3a6b3a'

// ---- balloons ----

// iChat's Graphite balloon (Tiger, 1x): a 19-point gel whose upper half darkens
// to a hard step at the middle and whose lower half glows back up to near white.
const GRAPHITE = {
  head:
    '<stop offset="0" stop-color="#d7dadd"/><stop offset="0.3" stop-color="#d1d6d9"/>' +
    '<stop offset="0.55" stop-color="#bcc3ca"/><stop offset="0.75" stop-color="#b6bfc6"/>' +
    '<stop offset="0.76" stop-color="#a7b1ba"/><stop offset="1" stop-color="#afb9c2"/>',
  body: '#afb9c2',
  sole:
    '<stop offset="0" stop-color="#afb9c2"/><stop offset="0.3" stop-color="#bdc5ce"/>' +
    '<stop offset="0.65" stop-color="#d2dbe5"/><stop offset="1" stop-color="#ebf5fd"/>',
  edge: '#7c868e',
  edgeBottom: '#7c7c7c',
  shadow: '#d7d7d7',
}

// Aqua's blue gel (Tiger's popup stepper): pale at the top, a hard step to a
// clear blue at the middle, glowing to cyan-white at the bottom.
const AQUA_BLUE = {
  head:
    '<stop offset="0" stop-color="#dde1f4"/><stop offset="0.3" stop-color="#bed4ef"/>' +
    '<stop offset="0.6" stop-color="#9ac1ea"/><stop offset="0.8" stop-color="#91b9e5"/>' +
    '<stop offset="0.81" stop-color="#64a8f2"/><stop offset="1" stop-color="#6bb0f6"/>',
  body: '#73b7fd',
  sole:
    '<stop offset="0" stop-color="#73b7fd"/><stop offset="0.35" stop-color="#90cdfa"/>' +
    '<stop offset="0.7" stop-color="#a9e6ff"/><stop offset="1" stop-color="#bbffff"/>',
  edge: '#3d6a9e',
  edgeBottom: '#4d6f92',
  shadow: '#c5c5c5',
}

// Aqua's white push button ("Set Font…"), for the tool rows.
const WHITE_GEL = {
  head:
    '<stop offset="0" stop-color="#f9f9f9"/><stop offset="0.5" stop-color="#f1f1f1"/>' +
    '<stop offset="1" stop-color="#ececec"/>',
  body: '#ececec',
  sole: '<stop offset="0" stop-color="#ececec"/><stop offset="0.5" stop-color="#f3f3f3"/><stop offset="1" stop-color="#ffffff"/>',
  edge: '#8a8a8a',
  edgeBottom: '#6a6a6a',
  shadow: '#dddddd',
}

const BALLOON_RADIUS = 12
const BALLOON_FOOT = 14
const TAIL = 8
// An Aqua push button is a pill: its ends are half its height.
const CAPSULE_RADIUS = 11
const CAPSULE_FOOT = 12

/** Claude's balloon: Graphite, on the left, its tail low on the left. */
export const CLAUDE_BALLOON: BalloonArt = {
  ...GRAPHITE,
  radius: BALLOON_RADIUS,
  foot: BALLOON_FOOT,
  tail: TAIL,
  side: 'left',
}

/** Your balloon: Aqua blue, on the right, its tail low on the right. */
export const YOUR_BALLOON: BalloonArt = {
  ...AQUA_BLUE,
  radius: BALLOON_RADIUS,
  foot: BALLOON_FOOT,
  tail: TAIL,
  side: 'right',
}

/** A tool row's capsule: Aqua's white gel button, no tail. */
export const CAPSULE: BalloonArt = {
  ...WHITE_GEL,
  radius: CAPSULE_RADIUS,
  foot: CAPSULE_FOOT,
  tail: 0,
  side: 'left',
}

// ---- spinner ----

// Aqua's indeterminate progress bar (Panther's installer, 1x): a square-ended
// 16-point gel track, crossed by diagonal bands of the blue fill's gel that
// slide sideways. Still for a person who asked for less motion.
const POLE_WIDTH = 128
const POLE_HEIGHT = 18 // the 16-point bar and its 2-point shadow
export const POLE_SIZE = { width: POLE_WIDTH, height: POLE_HEIGHT }
const TRACK_STOPS =
  '<stop offset="0" stop-color="#d2d2d2"/><stop offset="0.13" stop-color="#e3e3e3"/>' +
  '<stop offset="0.27" stop-color="#e7e7e7"/><stop offset="0.4" stop-color="#d9d9d9"/>' +
  '<stop offset="0.6" stop-color="#e9e9e9"/><stop offset="0.8" stop-color="#f4f4f4"/><stop offset="1" stop-color="#f8f8f8"/>'
const BLUE_STOPS =
  '<stop offset="0" stop-color="#598ad1"/><stop offset="0.2" stop-color="#91bae5"/>' +
  '<stop offset="0.33" stop-color="#83b2e5"/><stop offset="0.53" stop-color="#4793e8"/>' +
  '<stop offset="0.73" stop-color="#67b5ff"/><stop offset="1" stop-color="#82cdff"/>'
export const BARBER_POLE =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${POLE_WIDTH}" height="${POLE_HEIGHT}" viewBox="0 0 ${POLE_WIDTH} ${POLE_HEIGHT}">` +
  '<style>' +
  '@media (prefers-reduced-motion: no-preference){.bands{animation:slide 0.5s linear infinite}}' +
  '@keyframes slide{from{transform:translateX(0)}to{transform:translateX(16px)}}' +
  '</style>' +
  '<defs>' +
  `<linearGradient id="track" x1="0" y1="1" x2="0" y2="15" gradientUnits="userSpaceOnUse">${TRACK_STOPS}</linearGradient>` +
  `<linearGradient id="blue" x1="0" y1="1" x2="0" y2="15" gradientUnits="userSpaceOnUse">${BLUE_STOPS}</linearGradient>` +
  '<pattern id="band" width="16" height="16" patternUnits="userSpaceOnUse">' +
  '<path d="M0 16L8 0H16L8 16Z" fill="url(#blue)"/>' +
  '</pattern>' +
  '<clipPath id="inside"><rect x="1" y="1" width="126" height="14"/></clipPath>' +
  '</defs>' +
  '<rect x="1" y="1" width="126" height="14" fill="url(#track)"/>' +
  '<g clip-path="url(#inside)"><rect class="bands" x="-16" y="0" width="160" height="16" fill="url(#band)"/></g>' +
  '<path d="M0.5 15.5V0.5H127.5V15.5" fill="none" stroke="#a3a3a3"/>' +
  '<path d="M0.5 15.5H127.5" fill="none" stroke="#afafaf"/>' +
  '<path d="M0.5 16.5H127.5" fill="none" stroke="#c0c0c0"/>' +
  '<path d="M0.5 17.5H127.5" fill="none" stroke="#dbdbdb"/>' +
  '</svg>'
