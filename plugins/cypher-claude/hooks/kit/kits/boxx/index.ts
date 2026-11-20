// The BoxX kit: Claude Desktop as the original Xbox dashboard. Everything floats
// on the green wireframe. Claude speaks on the dashboard's dark glass plates,
// your words are the lit yellow-green plate the cursor rests on, tool rows are
// empty plates, the spinner is a menu bullet with a spark circling it, and
// people online in Cypher are the menu's glowing bullets.
import type { SkinKit } from '../../kit'
import { cardFrame, framed } from '../../kit'
import { BULLET, CHOSEN, DASHBOARD, HOLLOW, ON_CHOSEN, ORBIT, ORBIT_SIZE, PLATE } from './art'

const plate = cardFrame(PLATE)
const chosen = cardFrame(CHOSEN)
const hollow = cardFrame(HOLLOW)

// Room inside a plate, in Desktop's units: columns across, half-rows down.
// Two columns clear the 8-pixel cut; a quarter line above and below the words.
const CLEAR_CUT = 2
const QUARTER_LINE = 0.5
const PLATE_PAD = { x: CLEAR_CUT, y: QUARTER_LINE }
const CHOSEN_PAD = { x: CLEAR_CUT, y: 0 }
const HOLLOW_PAD = { x: 1, y: 0 }
// Your words keep clear of the left side, so Claude's column shows beside a long prompt.
const YOUR_INDENT = 12
// Space between rows, in half-rows.
const ROW_GAP = 1
const BULLET_RADIUS = 5
const PANEL = '#081a06'

export const BOXX: SkinKit = {
  id: 'boxx',
  mode: 'dark',
  palette: {
    label: 'Cypher boxx',
    // The lit plate's yellow-green; the rest as Cypher's BoxX skin has them.
    roles: { accent: '#b6e526', danger: '#ffb1a1', success: '#8bc531', warning: '#e5c726', pro: '#b9a6ff' },
    dark: {
      gray: {
        anchors: {
          'surface-0': PANEL,
          'surface-1': '#0c2a07',
          'surface-2': '#123409',
          'text-primary': '#d9eea1',
          'text-secondary': '#d9eea1',
          'text-muted': '#a1c06c',
        },
      },
    },
    only: 'dark',
  },
  ground: { defs: DASHBOARD, fill: 'url(#dash)' },
  dot: { defs: BULLET, fill: 'url(#bullet)', radius: BULLET_RADIUS },
  // Desktop's own panels (the composer's band, the title bar) are the
  // dashboard's darkest glass, solid, so the wireframe stays behind the words.
  glass: { blur: 0, tint: PANEL, opacity: 1 },
  parts: {
    assistant: (el, _props, engine) =>
      el.Box({ marginY: ROW_GAP, flexDirection: 'column', children: [framed(el, plate, engine, PLATE_PAD)] }),
    // A prompt with no words (a picture alone) keeps Claude's own row.
    user: (el, props, engine) => {
      const text = typeof props.text === 'string' ? props.text.trim() : ''
      if (!text) return engine
      return el.Box({
        marginY: ROW_GAP,
        paddingLeft: YOUR_INDENT,
        flexDirection: 'column',
        alignItems: 'flex-end',
        children: [framed(el, chosen, el.Text({ color: ON_CHOSEN, children: [String(props.text)] }), CHOSEN_PAD)],
      })
    },
    tool: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, hollow, engine, HOLLOW_PAD)] }),
    toolGroup: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, hollow, engine, HOLLOW_PAD)] }),
    spinner: (el, _props, engine) =>
      el.Box({
        alignItems: 'center',
        columnGap: 1,
        children: [el.Svg({ source: ORBIT, alt: 'working', isInteractive: true, ...ORBIT_SIZE }), engine],
      }),
  },
}
