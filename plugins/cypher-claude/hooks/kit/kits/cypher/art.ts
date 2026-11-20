// Webmaster: Cypher's own black terminal skin, after Sacred Computer's SRCL
// components (MIT). Its values are the skin's, from src/app/skins/cypher.css:
// square corners, one-pixel lines, character-cell spacing, white on black.
import type { BevelArt } from '../../kit'
import { svg } from '../../kit'

export const BLACK = '#000000'
export const PANEL = '#080808' // a card's and the log's face
export const EDGE = '#3a3a3a' // every line
export const WHITE = '#ffffff'
export const MUTED = '#a8a8a8'

const line = (color: string): { lit: string; shade: string } => ({ lit: color, shade: color })

/** A card (the chat log): the panel face inside a one-pixel line. */
export const CARD: BevelArt = { face: PANEL, rings: [line(EDGE)], mode: 'dark' }

/** The chosen line of a list, and the default button: white, its words black. */
export const INVERSE: BevelArt = { face: WHITE, rings: [line(WHITE)], mode: 'dark' }

/** A button: black inside a one-pixel line. */
export const BUTTON: BevelArt = { face: BLACK, rings: [line(EDGE)], mode: 'dark' }

// The line under a card's title, drawn wider than any card and cropped to it.
const RULE_WIDTH = 4000
export const RULE = svg(RULE_WIDTH, 1, `<rect width="${RULE_WIDTH}" height="1" fill="${EDGE}"/>`, 'dark')

// ---- spinner ----

// SRCL's block loader: a character cell in four quarters, one lit and
// stepping round them clockwise. Still for a person who asked for less motion.
const CELL = 14
export const BLOCK_SIZE = { width: CELL, height: CELL }
export const BLOCK =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="${CELL}" viewBox="0 0 14 14" shape-rendering="crispEdges">` +
  '<style>:root{color-scheme:dark}' +
  '@media (prefers-reduced-motion: no-preference){.lit{animation:step 0.6s steps(4) infinite}}' +
  '@keyframes step{to{transform:rotate(360deg)}}' +
  '.lit{transform-origin:7px 7px;transform-box:view-box}' +
  '</style>' +
  `<rect width="14" height="14" fill="${EDGE}"/>` +
  `<rect class="lit" width="7" height="7" fill="${WHITE}"/>` +
  '</svg>'
