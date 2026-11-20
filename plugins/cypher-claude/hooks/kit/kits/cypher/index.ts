// The Webmaster kit: Claude Desktop as Cypher's black terminal skin. Everything
// sits on black. Claude speaks in a card titled CLAUDE in capitals over a
// one-pixel rule, your words are the inverted line (white, words black, in the
// monospaced face), tool rows are outlined buttons, the spinner is SRCL's block
// loader, and people online in Cypher are plain white dots.
import type { SkinKit } from '../../kit'
import { bevelFrame, framed } from '../../kit'
import { BLACK, BLOCK, BLOCK_SIZE, BUTTON, CARD, INVERSE, MUTED, PANEL, RULE, WHITE } from './art'

const card = bevelFrame(CARD)
const inverse = bevelFrame(INVERSE)
const button = bevelFrame(BUTTON)

// The card's own line holds the title and the rule flush; the words get a
// column of room at the sides and a quarter line above and below.
const FLUSH = { x: 0, y: 0 }
const QUARTER_LINE = 0.5
const ONE_COLUMN = { x: 1, y: 0 }
const TITLE = 'CLAUDE'
// Your words keep clear of the left side, so Claude's column shows beside a long prompt.
const YOUR_INDENT = 12
// Space between rows, in half-rows.
const ROW_GAP = 1
const RULE_HEIGHT = 1
const DOT_RADIUS = 3

export const WEBMASTER: SkinKit = {
  id: 'cypher',
  mode: 'dark',
  palette: {
    label: 'Cypher Webmaster',
    roles: { accent: WHITE, danger: '#ff8080', success: '#7ee08a', warning: '#ffd166', pro: '#c9a7ff' },
    dark: {
      gray: {
        anchors: {
          'surface-0': BLACK,
          'surface-1': PANEL,
          'surface-2': '#141414',
          'text-primary': WHITE,
          'text-secondary': WHITE,
          'text-muted': MUTED,
        },
      },
    },
    only: 'dark',
  },
  ground: { defs: '', fill: BLACK },
  dot: { defs: '', fill: WHITE, radius: DOT_RADIUS },
  glass: { blur: 0, tint: BLACK, opacity: 1 },
  parts: {
    // The title opens a reply; the blocks after a tool call carry on in untitled cards.
    assistant: (el, props, engine) => {
      const { Box, Svg, Text } = el
      const title = Box({ paddingX: 1, children: [Text({ color: WHITE, mono: true, children: [TITLE] })] })
      const rule = Svg({ source: RULE, alt: '', height: RULE_HEIGHT })
      const words = Box({ flexDirection: 'column', paddingX: 1, paddingY: QUARTER_LINE, children: [engine] })
      const opens = props.isFirstOfReply !== false
      const inside = Box({ flexDirection: 'column', children: opens ? [title, rule, words] : [words] })
      return Box({ marginY: ROW_GAP, flexDirection: 'column', children: [framed(el, card, inside, FLUSH)] })
    },
    // A prompt with no words (a picture alone) keeps Claude's own row.
    user: (el, props, engine) => {
      const text = typeof props.text === 'string' ? props.text.trim() : ''
      if (!text) return engine
      return el.Box({
        marginY: ROW_GAP,
        paddingLeft: YOUR_INDENT,
        flexDirection: 'column',
        alignItems: 'flex-end',
        children: [framed(el, inverse, el.Text({ color: BLACK, mono: true, children: [String(props.text)] }), ONE_COLUMN)],
      })
    },
    tool: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, button, engine, ONE_COLUMN)] }),
    toolGroup: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, button, engine, ONE_COLUMN)] }),
    spinner: (el, _props, engine) =>
      el.Box({
        alignItems: 'center',
        columnGap: 1,
        children: [el.Svg({ source: BLOCK, alt: 'working', isInteractive: true, ...BLOCK_SIZE }), engine],
      }),
  },
}
