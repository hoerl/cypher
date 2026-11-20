// The Windows 95 kit: Claude Desktop as Windows 95. Claude speaks in a window
// captioned with its name, words on the gray face as a dialog shows them (a
// sunken white field is where 95 asks you to type, so it is not used for
// reading). Your words are the navy selection; tool rows are push buttons; the
// spinner is Setup's copying bar. Everything sits on the teal desktop, the
// composer's band and title bar included, and people online in Cypher are
// checked radio buttons.
import type { SkinKit } from '../../kit'
import { bevelFrame, framed } from '../../kit'
import { BAR_SIZE, BUTTON, FACE, NAVY, RADIO, RADIO_SIZE, SELECTION, SETUP_BAR, TEAL, WINDOW } from './art'

const window95 = bevelFrame(WINDOW)
const selection = bevelFrame(SELECTION)
const button = bevelFrame(BUTTON)

// Room inside a frame, in Desktop's units: columns across, half-rows down.
// The window's own frame holds the caption flush; the words get a column of
// room at the sides and a quarter line above and below, as a dialog's face does.
const FLUSH = { x: 0, y: 0 }
const FACE_HALF_ROWS = 0.5
const CAPTION = 'Claude'
const SELECTION_PAD = { x: 1, y: 0 }
const BUTTON_PAD = { x: 1, y: 0 }
// Your words keep clear of the left side, so Claude's column shows beside a long prompt.
const YOUR_INDENT = 12
// Space between rows, in half-rows.
const ROW_GAP = 1
const WHITE = '#ffffff'
const HALF = 2

export const WIN95: SkinKit = {
  id: '95',
  mode: 'light',
  palette: {
    label: 'Cypher 95',
    // Windows' own sixteen colors, the ones Cypher's 95 skin uses.
    roles: { accent: '#000080', danger: '#a12219', success: '#008000', warning: '#808000', pro: '#800080' },
    light: {
      gray: {
        anchors: {
          'surface-0': FACE,
          'surface-1': FACE,
          'surface-2': WHITE,
          'text-primary': '#000000',
          'text-secondary': '#000000',
          // Desktop's own rows lie on the teal, where black reads and a gray does not.
          'text-muted': '#1f1f1f',
        },
      },
    },
    only: 'light',
  },
  ground: { defs: '', fill: TEAL },
  dot: { defs: RADIO, fill: 'url(#radio)', radius: RADIO_SIZE / HALF },
  // Desktop's own panels go solid teal, unblurred, so the composer sits on the
  // desktop itself rather than on a gray band with teal showing round its edges.
  glass: { blur: 0, tint: TEAL, opacity: 1 },
  parts: {
    // The caption opens a reply; the blocks after a tool call carry on in captionless panes.
    assistant: (el, props, engine) => {
      const caption = el.Box({
        backgroundColor: NAVY,
        paddingX: 1,
        children: [el.Text({ color: WHITE, weight: 'bold', children: [CAPTION] })],
      })
      const words = el.Box({ flexDirection: 'column', paddingX: 1, paddingY: FACE_HALF_ROWS, children: [engine] })
      const opens = props.isFirstOfReply !== false
      const inside = el.Box({ flexDirection: 'column', children: opens ? [caption, words] : [words] })
      return el.Box({ marginY: ROW_GAP, flexDirection: 'column', children: [framed(el, window95, inside, FLUSH)] })
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
        children: [framed(el, selection, el.Text({ color: WHITE, children: [String(props.text)] }), SELECTION_PAD)],
      })
    },
    tool: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, button, engine, BUTTON_PAD)] }),
    toolGroup: (el, _props, engine) =>
      el.Box({ flexDirection: 'column', alignItems: 'flex-start', children: [framed(el, button, engine, BUTTON_PAD)] }),
    spinner: (el, _props, engine) =>
      el.Box({
        alignItems: 'center',
        columnGap: 1,
        children: [el.Svg({ source: SETUP_BAR, alt: 'working', isInteractive: true, ...BAR_SIZE }), engine],
      }),
  },
}
