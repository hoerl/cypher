// The Aqua kit: Claude Desktop as Mac OS X Aqua with iChat AV. Claude speaks in
// Graphite balloons on the left, you in Aqua blue on the right, on Jaguar's
// pinstripes; tool rows sit in white gel capsules and the spinner is Aqua's
// barber pole. People online in Cypher are iChat's green "Available" orbs.
import type { SkinKit } from '../../kit'
import { balloonFrame, framed } from '../../kit'
import { BARBER_POLE, CAPSULE, CLAUDE_BALLOON, ORB, ORB_RIM, PINSTRIPE, POLE_SIZE, YOUR_BALLOON } from './art'

const claude = balloonFrame(CLAUDE_BALLOON)
const yours = balloonFrame(YOUR_BALLOON)
const capsule = balloonFrame(CAPSULE)

// Room inside a balloon, in Desktop's units: columns across, half-rows down.
const BALLOON_COLUMNS = 2
// A quarter line above and below the words: as in iChat, the gel spans the line.
const BALLOON_HALF_ROWS = 0.5
const BALLOON_PAD = { x: BALLOON_COLUMNS, y: BALLOON_HALF_ROWS }
const CAPSULE_PAD = { x: 1, y: 0 }
// Your balloon keeps clear of the left side, as iChat's did, so short prompts
// sit right and long ones still leave Claude's column visible beside them.
const YOUR_INDENT = 12
// Space between rows, in half-rows.
const ROW_GAP = 1
// An orb is a little larger than a plain dot, so its gel reads.
const ORB_RADIUS = 4

export const AQUA: SkinKit = {
  id: 'aqua',
  mode: 'light',
  palette: {
    label: 'Cypher aqua',
    roles: { accent: '#3875d7', danger: '#c4271b', success: '#4f9a24', warning: '#c27c0e', pro: '#6d4f94' },
    light: {
      gray: {
        anchors: {
          'surface-0': '#ececec',
          'surface-1': '#f3f3f3',
          'surface-2': '#fafafa',
          'text-primary': '#000000',
          'text-secondary': '#000000',
          'text-muted': '#616161',
        },
      },
    },
    only: 'light',
  },
  ground: { defs: PINSTRIPE, fill: 'url(#pin)' },
  dot: { defs: ORB, fill: 'url(#orb)', stroke: ORB_RIM, radius: ORB_RADIUS },
  parts: {
    assistant: (el, _props, engine) =>
      el.Box({ marginY: ROW_GAP, flexDirection: 'column', children: [framed(el, claude, engine, BALLOON_PAD)] }),
    // A prompt with no words (a picture alone) keeps Claude's own row.
    user: (el, props, engine) => {
      const text = typeof props.text === 'string' ? props.text.trim() : ''
      if (!text) return engine
      return el.Box({
        marginY: ROW_GAP,
        paddingLeft: YOUR_INDENT,
        flexDirection: 'column',
        alignItems: 'flex-end',
        children: [framed(el, yours, el.Text({ children: [String(props.text)] }), BALLOON_PAD)],
      })
    },
    tool: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, capsule, engine, CAPSULE_PAD)] }),
    toolGroup: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, capsule, engine, CAPSULE_PAD)] }),
    spinner: (el, _props, engine) =>
      el.Box({
        alignItems: 'center',
        columnGap: 1,
        children: [el.Svg({ source: BARBER_POLE, alt: 'working', isInteractive: true, ...POLE_SIZE }), engine],
      }),
  },
}
