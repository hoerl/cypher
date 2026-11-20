// The Pink Sparkle kit: Claude Desktop in Cypher's pink-core skin. Everything
// sits on blush scattered with sparkles. Claude speaks on the chat log's cream
// paper panel, your words are the magenta candy button, tool rows are the pink
// candy buttons, the spinner is three sparkles twinkling in turn, and people
// online in Cypher are candy gems. Desktop's own panels wear the windows'
// enamel frame.
import type { SkinKit } from '../../kit'
import { balloonFrame, cardFrame, framed } from '../../kit'
import { BLUSH, CANDY, FRAME, GEM, INK, MAGENTA, MAGENTA_CANDY, PANEL, PAPER, PLUM, SPARKLES, TWINKLE, TWINKLE_SIZE } from './art'

const panel = cardFrame(PANEL)
const candy = balloonFrame(CANDY)
const yours = balloonFrame(MAGENTA_CANDY)

// Room inside a frame, in Desktop's units: columns across, half-rows down.
const PANEL_COLUMNS = 2
const QUARTER_LINE = 0.5
const PANEL_PAD = { x: PANEL_COLUMNS, y: QUARTER_LINE }
const CANDY_PAD = { x: 1, y: 0 }
// Your words keep clear of the left side, so Claude's column shows beside a long prompt.
const YOUR_INDENT = 12
// Space between rows, in half-rows.
const ROW_GAP = 1
const GEM_RADIUS = 4
const WHITE = '#ffffff'

export const PINK_SPARKLE: SkinKit = {
  id: 'pink-sparkle',
  mode: 'light',
  palette: {
    label: 'Cypher Pink Sparkle',
    roles: { accent: MAGENTA, danger: '#a12239', success: '#3f8a2e', warning: '#b8610e', pro: '#7a3fa0' },
    light: {
      gray: {
        anchors: {
          'surface-0': BLUSH,
          'surface-1': '#ffe6f0',
          'surface-2': PAPER,
          'text-primary': INK,
          'text-secondary': INK,
          'text-muted': '#824060',
        },
      },
    },
    only: 'light',
  },
  ground: { defs: SPARKLES, fill: 'url(#sparkle)' },
  dot: { defs: GEM, fill: 'url(#gem)', stroke: PLUM, radius: GEM_RADIUS },
  glass: { blur: 0, tint: FRAME, opacity: 1 },
  parts: {
    assistant: (el, _props, engine) =>
      el.Box({ marginY: ROW_GAP, flexDirection: 'column', children: [framed(el, panel, engine, PANEL_PAD)] }),
    // A prompt with no words (a picture alone) keeps Claude's own row.
    user: (el, props, engine) => {
      const text = typeof props.text === 'string' ? props.text.trim() : ''
      if (!text) return engine
      return el.Box({
        marginY: ROW_GAP,
        paddingLeft: YOUR_INDENT,
        flexDirection: 'column',
        alignItems: 'flex-end',
        children: [framed(el, yours, el.Text({ color: WHITE, children: [String(props.text)] }), CANDY_PAD)],
      })
    },
    tool: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, candy, engine, CANDY_PAD)] }),
    toolGroup: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, candy, engine, CANDY_PAD)] }),
    spinner: (el, _props, engine) =>
      el.Box({
        alignItems: 'center',
        columnGap: 1,
        children: [el.Svg({ source: TWINKLE, alt: 'working', isInteractive: true, ...TWINKLE_SIZE }), engine],
      }),
  },
}
