// The Messenger kit: Claude Desktop as Windows XP, the system Messenger ran on.
// Everything sits on Bliss. Claude speaks in a Luna window captioned with its
// name, words on the window's face; your words are the blue selection; tool
// rows are XP push buttons; the spinner is Setup's stepping green squares; and
// people online in Cypher are Setup's finished-step bullets.
import type { RenderElement } from 'claude-code'

import type { DesktopTable, SkinKit } from '../../kit'
import { balloonFrame, bevelFrame, framed, svg } from '../../kit'
import { BLISS, BULLET, BUTTON, CHOSEN, FACE, PANE, SELECTION, SETUP_SQUARES, SQUARES_SIZE, TITLE, TITLE_HEIGHT, WINDOW } from './art'

const luna = bevelFrame(WINDOW)
const pane = bevelFrame(PANE)
const chosen = bevelFrame(CHOSEN)
const button = balloonFrame(BUTTON)

// Room inside a frame, in Desktop's units: columns across, half-rows down.
// The words get a column at the sides and a quarter line above and below.
const FACE_HALF_ROWS = 0.5
const FACE_PAD = { x: 1, y: FACE_HALF_ROWS }
const SELECTION_PAD = { x: 1, y: 0 }
const BUTTON_PAD = { x: 1, y: 0 }
const CAPTION = 'Claude'
// Your words keep clear of the left side, so Claude's column shows beside a long prompt.
const YOUR_INDENT = 12
// Space between rows, in half-rows.
const ROW_GAP = 1
const WHITE = '#ffffff'
// A bullet is 16 pixels across in Setup; here a little smaller, as faint as the other kits' dots.
const BULLET_RADIUS = 7

/**
 * The title bar: its rounded ends and stretching middle in a layer, and the
 * caption over them, held to the bar's 29 pixels by an empty picture.
 */
function titleBar(el: DesktopTable): RenderElement {
  const { Box, Svg, Text } = el
  const art = Box({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    children: [
      Svg({ source: TITLE.left.source, alt: '', width: TITLE.left.width, height: TITLE_HEIGHT }),
      Box({ flexGrow: 1, minWidth: 0, children: [Svg({ source: TITLE.middle, alt: '', height: TITLE_HEIGHT })] }),
      Svg({ source: TITLE.right.source, alt: '', width: TITLE.right.width, height: TITLE_HEIGHT }),
    ],
  })
  const strut = Svg({ source: svg(1, TITLE_HEIGHT, ''), alt: '', width: 1, height: TITLE_HEIGHT })
  const lift = Box({ position: 'absolute', display: 'none' })
  const caption = Box({
    alignItems: 'center',
    paddingX: 1,
    children: [lift, strut, Text({ color: WHITE, weight: 'bold', children: [CAPTION] })],
  })
  return Box({ flexDirection: 'column', children: [art, caption] })
}

export const MSN_XP: SkinKit = {
  id: 'msn',
  mode: 'light',
  palette: {
    label: 'Cypher Messenger',
    // Luna's selection blue; the rest as Cypher's Messenger skin has them.
    roles: { accent: SELECTION, danger: '#b3261e', success: '#2b8a1f', warning: '#c27c0e', pro: '#6d4f94' },
    light: {
      gray: {
        anchors: {
          'surface-0': FACE,
          'surface-1': FACE,
          'surface-2': WHITE,
          'text-primary': '#000000',
          'text-secondary': '#000000',
          // Desktop's own rows lie on Bliss, where black reads and a gray does not.
          'text-muted': '#1f1f1f',
        },
      },
    },
    only: 'light',
  },
  ground: { defs: BLISS, fill: 'url(#bliss)' },
  dot: { defs: BULLET, fill: 'url(#bullet)', radius: BULLET_RADIUS },
  // Desktop's own panels (the composer's band, the title bar) take the window
  // face, solid and unblurred, as an XP window's toolbars do.
  glass: { blur: 0, tint: FACE, opacity: 1 },
  parts: {
    // The title bar opens a reply; the blocks after a tool call carry on in panes without one.
    assistant: (el, props, engine) => {
      const words = el.Box({ flexDirection: 'column', children: [engine] })
      const opens = props.isFirstOfReply !== false
      const body = opens
        ? el.Box({ flexDirection: 'column', children: [titleBar(el), framed(el, luna, words, FACE_PAD)] })
        : framed(el, pane, words, FACE_PAD)
      return el.Box({ marginY: ROW_GAP, flexDirection: 'column', children: [body] })
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
        children: [framed(el, chosen, el.Text({ color: WHITE, children: [String(props.text)] }), SELECTION_PAD)],
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
        children: [el.Svg({ source: SETUP_SQUARES, alt: 'working', isInteractive: true, ...SQUARES_SIZE }), engine],
      }),
  },
}
