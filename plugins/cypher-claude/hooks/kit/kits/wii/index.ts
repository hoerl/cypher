// The Wii kit: Claude Desktop as the Wii Menu. Everything sits on the menu's
// ruled grey. Claude speaks in white channel tiles, your words are the tile the
// pointer rests on (outlined in cyan), tool rows are the menu's pill buttons,
// the spinner is a ring of cyan beads, and people online in Cypher are the
// round console buttons. Desktop's own panels take the colour of the menu's bar.
import type { SkinKit } from '../../kit'
import { balloonFrame, cardFrame, framed } from '../../kit'
import { BAR, BEADS, BEADS_SIZE, CYAN, INK, PILL, POINTED, ROUND, RULED, TILE } from './art'

const tile = cardFrame(TILE)
const pointed = cardFrame(POINTED)
const pill = balloonFrame(PILL)

// Room inside a tile, in Desktop's units: two columns clear the rounded
// corner, a quarter line above and below the words.
const TILE_COLUMNS = 2
const QUARTER_LINE = 0.5
const TILE_PAD = { x: TILE_COLUMNS, y: QUARTER_LINE }
const PILL_PAD = { x: 1, y: 0 }
// Your words keep clear of the left side, so Claude's column shows beside a long prompt.
const YOUR_INDENT = 12
// Space between rows, in half-rows.
const ROW_GAP = 1
const ROUND_RADIUS = 5

export const WII: SkinKit = {
  id: 'wii',
  mode: 'light',
  palette: {
    label: 'Cypher Wii',
    roles: { accent: CYAN, danger: '#b3261e', success: '#3a9a2c', warning: '#c27c0e', pro: '#6d4f94' },
    light: {
      gray: {
        anchors: {
          // Desktop's ramp runs darkest first: the bar, the ruled grey, a tile's white.
          'surface-0': BAR,
          'surface-1': '#f2f2f2',
          'surface-2': '#ffffff',
          'text-primary': INK,
          'text-secondary': INK,
          'text-muted': '#6e7173',
        },
      },
    },
    only: 'light',
  },
  ground: { defs: RULED, fill: 'url(#ruled)' },
  dot: { defs: ROUND, fill: 'url(#round)', stroke: CYAN, radius: ROUND_RADIUS },
  glass: { blur: 0, tint: BAR, opacity: 1 },
  parts: {
    assistant: (el, _props, engine) =>
      el.Box({ marginY: ROW_GAP, flexDirection: 'column', children: [framed(el, tile, engine, TILE_PAD)] }),
    // A prompt with no words (a picture alone) keeps Claude's own row.
    user: (el, props, engine) => {
      const text = typeof props.text === 'string' ? props.text.trim() : ''
      if (!text) return engine
      return el.Box({
        marginY: ROW_GAP,
        paddingLeft: YOUR_INDENT,
        flexDirection: 'column',
        alignItems: 'flex-end',
        children: [framed(el, pointed, el.Text({ color: INK, children: [String(props.text)] }), TILE_PAD)],
      })
    },
    tool: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, pill, engine, PILL_PAD)] }),
    toolGroup: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, pill, engine, PILL_PAD)] }),
    spinner: (el, _props, engine) =>
      el.Box({
        alignItems: 'center',
        columnGap: 1,
        children: [el.Svg({ source: BEADS, alt: 'working', isInteractive: true, ...BEADS_SIZE }), engine],
      }),
  },
}
