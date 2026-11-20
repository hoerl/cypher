// A skin kit: everything one Cypher skin needs to draw Claude Desktop as the
// interface it is named after. The palette and scene go to `$.theme.set`; the
// parts redraw the conversation's rows. A kit is data and SVG strings only, so
// adding a skin is a folder under kits/ and one line in registry.ts.
//
// Every drawing here is vector: Desktop loads no pictures or fonts from a mod.
// Message text never goes into an SVG; it stays in Claude's own drawing (a
// reply) or a Text (a prompt), so nothing a person wrote is baked into art.
import type { ElementTable, RenderElement, ThemeBackdropGlass } from 'claude-code'

import type { makeColors } from '../make-colors.js'

/** What `makeColors` takes: a palette's few colors. */
export type MakeColorsInput = Parameters<typeof makeColors>[0]

export type Mode = 'light' | 'dark'

export type DesktopTable = ElementTable<'desktop'>

/** Which of Claude's rows a kit may redraw. */
export type PartName = 'assistant' | 'user' | 'tool' | 'toolGroup' | 'spinner'

/**
 * Draws one row. `props` is the site's own (`e.props`), and `engine` is
 * Claude's drawing of the row (`await next(e)`), which a part wraps rather than
 * replaces wherever Claude's drawing carries something of its own (a reply's
 * copy buttons, a tool row's result).
 */
export type PartDraw = (el: DesktopTable, props: Record<string, unknown>, engine: RenderElement) => RenderElement

export type SkinKit = {
  /** The Cypher web skin's id: `aqua`. */
  id: string
  mode: Mode
  palette: MakeColorsInput
  /**
   * What lies behind the conversation: SVG `<defs>` content and the paint the
   * whole window is filled with (`url(#id)` of a pattern in `defs`, or a color).
   */
  ground: { defs: string; fill: string }
  /**
   * How one person online in Cypher is drawn, in the line of dots look.ts lays
   * out and moves: `defs` and a fill as above, an optional rim and a radius.
   */
  dot: { defs: string; fill: string; stroke?: string; radius?: number }
  /**
   * How Desktop paints its own panels (the composer's band, the title bar) over
   * the ground. Absent, they stay as they are.
   */
  glass?: ThemeBackdropGlass
  parts: Partial<Record<PartName, PartDraw>>
}

// ---- svg rules ----

export const SVG_LIMIT = 131_072

/**
 * Why Desktop would refuse or mangle an SVG, as lines; none means it passes.
 * Desktop drops an `<image>`, and a comment with `--` or `<` inside, or a bare
 * `&`, can leave a scene undrawn (look.md, "A moving scene").
 */
// The text inside each `<!-- … -->`, found without a pattern.
const OPEN = '<!--'
const CLOSE = '-->'
function commentBodies(svg: string, from = svg.indexOf(OPEN)): string[] {
  if (from === -1) return []
  const end = svg.indexOf(CLOSE, from + OPEN.length)
  if (end === -1) return []
  return [svg.slice(from + OPEN.length, end), ...commentBodies(svg, svg.indexOf(OPEN, end + CLOSE.length))]
}

export function svgProblems(svg: string): string[] {
  const problems: string[] = []
  if (svg.length > SVG_LIMIT) problems.push(`${svg.length} characters, over ${SVG_LIMIT}`)
  if (svg.includes('<image')) problems.push('holds an <image>')
  if (!svg.trimStart().startsWith('<svg')) problems.push('does not start with <svg')
  // A bare ampersand: an `&` that starts no entity.
  // Matches "a & b"; rejects "&amp;" and "&#38;".
  // https://regex101.com/?regex=%26(%3F!%5Ba-zA-Z%5D%2B%3B%7C%23%5Cd%2B%3B)&testString=a%20%26%20b%20%26amp%3B
  if (/&(?![a-zA-Z]+;|#\d+;)/.test(svg)) problems.push('holds a bare &')
  if (commentBodies(svg).some(body => body.includes('--') || body.includes('<'))) {
    problems.push('a comment holds -- or <')
  }
  return problems
}

// ---- balloons ----
//
// A balloon of any size is nine pieces, as the originals were: four corners
// fixed both ways, four edges that stretch one way, and a middle that
// stretches both. Each piece is its own SVG drawn with preserveAspectRatio
// "none", so a stretch never bends a corner, and its edge lines keep one pixel
// with vector-effect non-scaling-stroke.
//
// Desktop draws a Box as a flex row and an Svg as an <img> with max-width 100%
// and height auto (read from Desktop's renderer and its stylesheet). So a piece
// that stretches sideways sits in a Box that grows and may shrink (minWidth 0),
// and a piece that stretches downward is drawn tall and clipped by its row.

/** One balloon's art, in CSS pixels. */
export type BalloonArt = {
  /** Corner radius; also the top cap's height. */
  radius: number
  /** The bottom cap's height, the shadow under the body included. */
  foot: number
  /** How far a tail reaches past the body's side; 0 for none. */
  tail: number
  /** The tail's side, when it has one. */
  side: 'left' | 'right'
  /** `<stop>`s for the top cap, offset 0 at the top edge and 1 where the middle starts. */
  head: string
  /** The middle's flat color. */
  body: string
  /** `<stop>`s for the bottom cap, offset 0 where the middle ends and 1 at the body's bottom edge. */
  sole: string
  edge: string
  edgeBottom: string
  /** The soft line under the body, or none. */
  shadow?: string
}

/** The nine pieces, by place: t(op), m(iddle), b(ottom) and l(eft), c(enter), r(ight). */
export type Slices = Record<'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br', string>

// Hides the art where Desktop shows the other mode: a light kit's art would put
// Claude's light text on light gel, a dark kit's its dark text on dark glass.
// The rows then draw as Claude's own.
const hidesIn = (mode: Mode): string =>
  `<style>@media (prefers-color-scheme: ${mode === 'light' ? 'dark' : 'light'}){svg>*{display:none}}</style>`

/**
 * One piece of a kit's art, `width` by `height` CSS pixels, showing the part of
 * its drawing inside `box` (a viewBox), hidden where Desktop shows the other mode.
 */
export const view = (width: number, height: number, box: string, inner: string, mode: Mode = 'light'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${box}" preserveAspectRatio="none">${hidesIn(mode)}${inner}</svg>`

/** One piece of a kit's art, `width` by `height` CSS pixels, hidden where Desktop shows the other mode. */
export const svg = (width: number, height: number, inner: string, mode: Mode = 'light'): string =>
  view(width, height, `0 0 ${width} ${height}`, inner, mode)

// A one-pixel line is drawn on the half pixel so it lands on one row of pixels.
const HALF = 0.5
// The tail's sweep, as fractions: how far down the side it keeps straight
// before bending out, and where along its reach it flattens into the point.
const SWEEP_HOLD = 0.6
const SWEEP_FLAT = 0.55

const fine = 'vector-effect="non-scaling-stroke" shape-rendering="crispEdges"'

// How tall a middle piece is drawn (the engine's largest Svg), and how many are
// stacked: together taller than any reply, clipped by their row.
const TALL = 4096
const STACK = 4

// Desktop crops an image to fill its box (object-fit: cover), so a piece is
// never drawn at one shape and shown at another: a strip that runs sideways is
// drawn wider than any balloon, the same all along, and cropped to its slot;
// one that runs downward is drawn at its own width and the stack's height.
const STRETCH = 4000

/**
 * The nine SVGs of a balloon. The side with the tail is `tail` wider, the body
 * starting that far in; the tail curls out from the body's lower corner.
 */
export function balloonSlices(art: BalloonArt): Slices {
  const r = art.radius
  const foot = art.foot
  const shade = art.shadow ? 1 : 0
  const base = foot - shade // the body's bottom edge, within the foot
  const tailLeft = art.side === 'left' ? art.tail : 0
  const tailRight = art.side === 'right' ? art.tail : 0
  const head = `<linearGradient id="h" x1="0" y1="0" x2="0" y2="1">${art.head}</linearGradient>`
  const sole = `<linearGradient id="s" x1="0" y1="0" x2="0" y2="${base}" gradientUnits="userSpaceOnUse">${art.sole}</linearGradient>`
  const shadowLine = (width: number): string =>
    art.shadow ? `<line x1="0" y1="${foot - HALF}" x2="${width}" y2="${foot - HALF}" stroke="${art.shadow}" ${fine}/>` : ''
  // The shadow under a corner follows its outline one point lower, so it never
  // shows past the curve or the tail's point.
  const shadowOf = (outline: string): string =>
    art.shadow ? `<path d="${outline}" transform="translate(0 ${shade})" fill="none" stroke="${art.shadow}"/>` : ''

  // Corners, drawn for the left side and mirrored for the right.
  const topCorner = (inset: number): string => {
    const w = inset + r
    return svg(
      w,
      r,
      `<defs>${head}</defs>` +
        `<path d="M${inset} ${r}A${r} ${r} 0 0 1 ${w} 0V${r}Z" fill="url(#h)"/>` +
        `<path d="M${inset + HALF} ${r}A${r - HALF} ${r - HALF} 0 0 1 ${w} ${HALF}" fill="none" stroke="${art.edge}"/>`,
    )
  }
  const bottomCorner = (inset: number, withTail: boolean): string => {
    const w = inset + r
    const curve = Math.min(r, base)
    // The body's lower corner, then, with a tail, a hook from the side that
    // meets the bottom edge out past the body.
    const body = `<path d="M${inset} 0V${base - curve}A${curve} ${curve} 0 0 0 ${inset + curve} ${base}H${w}V0Z" fill="url(#s)"/>`
    const outline = `M${inset + HALF} 0V${base - curve}A${curve - HALF} ${curve - HALF} 0 0 0 ${inset + curve} ${base - HALF}H${w}`
    const edge = `<path d="${outline}" fill="none" stroke="${art.edgeBottom}"/>`
    if (!withTail) return svg(w, foot, `<defs>${sole}</defs>${shadowOf(outline)}${body}${edge}`)
    // iChat's tail: the side runs straight down into the foot, then sweeps out
    // into a point level with the bottom edge, which runs straight on from it.
    const side = inset + HALF
    const sweep = `C${side} ${base * SWEEP_HOLD} ${inset * SWEEP_FLAT} ${base - HALF} ${HALF} ${base - HALF}`
    const tailFill = `<path d="M${inset} 0${sweep}H${w}V0Z" fill="url(#s)"/>`
    const tailOutline = `M${side} 0${sweep}H${w}`
    const tailEdge = `<path d="${tailOutline}" fill="none" stroke="${art.edgeBottom}"/>`
    return svg(w, foot, `<defs>${sole}</defs>${shadowOf(tailOutline)}${tailFill}${tailEdge}`)
  }
  // Flips a piece left to right: everything after the root tag goes in a mirrored group.
  const mirror = (piece: string, width: number): string => {
    const open = piece.indexOf('>') + 1
    const close = piece.lastIndexOf('</svg>')
    return `${piece.slice(0, open)}<g transform="translate(${width} 0) scale(-1 1)">${piece.slice(open, close)}</g></svg>`
  }

  const leftTop = topCorner(tailLeft)
  const rightTop = mirror(topCorner(tailRight), tailRight + r)
  const leftBottom = bottomCorner(tailLeft, tailLeft > 0)
  const rightBottom = mirror(bottomCorner(tailRight, tailRight > 0), tailRight + r)

  const sideStrip = (inset: number, flip: boolean): string => {
    const w = inset + r
    const piece = svg(w, TALL, `<rect x="${inset}" width="${r}" height="${TALL}" fill="${art.body}"/><line x1="${inset + HALF}" y1="0" x2="${inset + HALF}" y2="${TALL}" stroke="${art.edge}" ${fine}/>`)
    return flip ? mirror(piece, w) : piece
  }

  return {
    tl: leftTop,
    tc: svg(
      STRETCH,
      r,
      `<defs>${head}</defs><rect width="${STRETCH}" height="${r}" fill="url(#h)"/><line x1="0" y1="${HALF}" x2="${STRETCH}" y2="${HALF}" stroke="${art.edge}" ${fine}/>`,
    ),
    tr: rightTop,
    ml: sideStrip(tailLeft, false),
    mc: svg(STRETCH, TALL, `<rect width="${STRETCH}" height="${TALL}" fill="${art.body}"/>`),
    mr: sideStrip(tailRight, true),
    bl: leftBottom,
    bc: svg(
      STRETCH,
      foot,
      `<defs>${sole}</defs><rect width="${STRETCH}" height="${base}" fill="url(#s)"/>` +
        `<line x1="0" y1="${base - HALF}" x2="${STRETCH}" y2="${base - HALF}" stroke="${art.edgeBottom}" ${fine}/>${shadowLine(STRETCH)}`,
    ),
    br: rightBottom,
  }
}

/**
 * A frame's nine pieces and their sizes in CSS pixels: the top row's height,
 * the bottom row's, and the side columns' widths. `reach` is a column of extra
 * room inside a side that a tail widens, so the content keeps clear of it.
 * `inset` is how many pixels the content keeps off every edge: a bevel's rings,
 * which Desktop's units (columns, half-lines) cannot measure out exactly.
 */
export type Frame = {
  slices: Slices
  top: number
  bottom: number
  left: number
  right: number
  reach: { left: number; right: number }
  inset: number
}

/** A balloon's frame: its corners are as tall as its radius, and the tail widens its side. */
export function balloonFrame(art: BalloonArt): Frame {
  const tailLeft = art.side === 'left' ? art.tail : 0
  const tailRight = art.side === 'right' ? art.tail : 0
  return {
    slices: balloonSlices(art),
    top: art.radius,
    bottom: art.foot,
    left: tailLeft + art.radius,
    right: tailRight + art.radius,
    reach: { left: tailLeft > 0 ? 1 : 0, right: tailRight > 0 ? 1 : 0 },
    inset: 0,
  }
}

/**
 * A square frame of one-pixel rings around a flat face, as Windows draws its
 * bevels. Rings go outermost first; each has the color of its top and left
 * sides (`lit`) and of its bottom and right (`shade`).
 */
export type BevelArt = {
  face: string
  rings: readonly { lit: string; shade: string }[]
  /**
   * The top is left open: the side rings run straight up to the top edge and
   * no ring crosses it, for a frame whose top is something else's (a title bar).
   */
  openTop?: boolean
  /** The mode the art shows in; light when absent. */
  mode?: Mode
}

// Far larger than any frame: corners are cut from a frame this big.
const BEVEL_SPAN = 100_000

/**
 * The nine pieces of a bevel. Each pixel takes the ring it lies on; as GDI draws
 * an edge, the bottom and right lines run the full length, so they own the
 * top-right and bottom-left corner pixels.
 */
export function bevelFrame(art: BevelArt): Frame {
  const n = art.rings.length
  const far = BEVEL_SPAN - 1
  const mode = art.mode ?? 'light'
  const color = (x: number, y: number): string => {
    const k = art.openTop ? Math.min(x, far - x, far - y) : Math.min(x, y, far - x, far - y)
    const ring = art.rings[k]
    if (!ring) return art.face
    return x === far - k || y === far - k ? ring.shade : ring.lit
  }
  const dot = (x: number, y: number, fill: string): string =>
    `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}" shape-rendering="crispEdges"/>`
  // An n-by-n corner, its pixels read from the big frame at an offset.
  const corner = (dx: number, dy: number): string =>
    svg(n, n, Array.from({ length: n * n }, (_, i) => dot(i % n, Math.floor(i / n), color(dx + (i % n), dy + Math.floor(i / n)))).join(''), mode)
  const across = (height: number, fill: (j: number) => string): string =>
    svg(STRETCH, height, Array.from({ length: height }, (_, j) => `<rect y="${j}" width="${STRETCH}" height="1" fill="${fill(j)}" shape-rendering="crispEdges"/>`).join(''), mode)
  const down = (width: number, fill: (i: number) => string): string =>
    svg(width, TALL, Array.from({ length: width }, (_, i) => `<rect x="${i}" width="1" height="${TALL}" fill="${fill(i)}" shape-rendering="crispEdges"/>`).join(''), mode)
  const edge = BEVEL_SPAN - n
  const ringAt = (k: number): { lit: string; shade: string } => art.rings[k] ?? { lit: art.face, shade: art.face }
  return {
    slices: {
      tl: corner(0, 0),
      tc: across(n, j => (art.openTop ? art.face : ringAt(j).lit)),
      tr: corner(edge, 0),
      ml: down(n, i => ringAt(i).lit),
      mc: svg(STRETCH, TALL, `<rect width="${STRETCH}" height="${TALL}" fill="${art.face}"/>`, mode),
      mr: down(n, i => ringAt(n - 1 - i).shade),
      bl: corner(0, edge),
      bc: across(n, j => ringAt(n - 1 - j).shade),
      br: corner(edge, edge),
    },
    top: n,
    bottom: n,
    left: n,
    right: n,
    reach: { left: 0, right: 0 },
    inset: n,
  }
}

// ---- cards ----
//
// A card is a face inside an edge of any weight, its corners each rounded or
// cut straight across: the Xbox's angled plates, the Wii's channel tiles, a
// candy window. The whole card is drawn once, small, and each of the nine
// pieces is a window onto that one drawing, so corners, edges and middle can
// never disagree.

/** A corner, `size` pixels each way: rounded to that radius, or cut straight across. */
export type Corner = { shape: 'round' | 'cut'; size: number }

export type CardArt = {
  face: string
  edge: string
  /** The edge's width in pixels. */
  weight: number
  corners: Record<'tl' | 'tr' | 'br' | 'bl', Corner>
  /** A one-pixel line of light just inside the top edge, as a lit bevel has. */
  lit?: string
  /** A band of shade just inside the bottom edge. */
  shade?: { color: string; height: number }
  /** A hard shadow under the card: its outline again, this many pixels lower. */
  drop?: { color: string; height: number }
  /** The mode the art shows in; light when absent. */
  mode?: Mode
}

// How much a cut corner's legs shorten for each pixel the outline moves in:
// a 45-degree cut moved in by k meets the sides k(2 - √2) nearer the corner.
const BOTH_SIDES = 2
const CUT_SHRINK = BOTH_SIDES - Math.SQRT2

/** The card's outline, moved `inset` pixels in from a square `span` pixels across. */
function cardOutline(corners: CardArt['corners'], inset: number, span: number): string {
  const lo = inset
  const hi = span - inset
  const leg = (c: Corner): number => Math.max(0, c.shape === 'round' ? c.size - inset : c.size - inset * CUT_SHRINK)
  const turn = (c: Corner, x: number, y: number): string =>
    c.shape === 'round' && leg(c) > 0 ? `A${leg(c)} ${leg(c)} 0 0 1 ${x} ${y}` : `L${x} ${y}`
  const { tl, tr, br, bl } = corners
  return (
    `M${lo} ${lo + leg(tl)}${turn(tl, lo + leg(tl), lo)}H${hi - leg(tr)}${turn(tr, hi, lo + leg(tr))}` +
    `V${hi - leg(br)}${turn(br, hi - leg(br), hi)}H${lo + leg(bl)}${turn(bl, lo, hi - leg(bl))}Z`
  )
}

/**
 * A card's frame. Its corner cells are as big as its largest corner (and never
 * smaller than the edge and the lines inside it); the bottom row also holds
 * the drop shadow.
 */
export function cardFrame(art: CardArt): Frame {
  const mode = art.mode ?? 'light'
  const litHeight = art.lit ? 1 : 0
  const shadeHeight = art.shade?.height ?? 0
  const drop = art.drop?.height ?? 0
  const sizes = Object.values(art.corners).map(c => c.size)
  const n = Math.max(...sizes, art.weight + litHeight + shadeHeight)
  // The card is drawn n + 1 + n across and down: the corners, and one pixel of
  // straight edge and face between them that the edge and middle pieces stretch.
  const span = n + 1 + n
  const outer = cardOutline(art.corners, 0, span)
  const inner = cardOutline(art.corners, art.weight, span)
  const shift = (d: string, dy: number): string => `<path d="${d}" transform="translate(0 ${dy})"`
  const drawing =
    `<defs><clipPath id="in"><path d="${inner}"/></clipPath><clipPath id="low">${shift(inner, litHeight)}/></clipPath></defs>` +
    (art.drop ? `${shift(outer, drop)} fill="${art.drop.color}"/>` : '') +
    `<path d="${outer}" fill="${art.edge}"/>` +
    (art.lit ? `<path d="${inner}" fill="${art.lit}"/>` : '') +
    (art.shade ? `<g clip-path="url(#in)">${shift(inner, litHeight)} fill="${art.shade.color}"/></g>` : '') +
    // The face: the inside, less the lit line above and the shade below.
    `<g clip-path="url(#low)">${shift(inner, -shadeHeight)} fill="${art.face}"/></g>`
  const far = n + 1
  const foot = n + drop
  const piece = (width: number, height: number, x: number, y: number, w: number, h: number): string =>
    view(width, height, `${x} ${y} ${w} ${h}`, drawing, mode)
  return {
    slices: {
      tl: piece(n, n, 0, 0, n, n),
      tc: piece(STRETCH, n, n, 0, 1, n),
      tr: piece(n, n, far, 0, n, n),
      ml: piece(n, TALL, 0, n, n, 1),
      mc: piece(STRETCH, TALL, n, n, 1, 1),
      mr: piece(n, TALL, far, n, n, 1),
      bl: piece(n, foot, 0, far, n, foot),
      bc: piece(STRETCH, foot, n, far, 1, foot),
      br: piece(n, foot, far, far, n, foot),
    },
    top: n,
    bottom: foot,
    left: n,
    right: n,
    reach: { left: 0, right: 0 },
    inset: 0,
  }
}

/**
 * `content` in a frame: the nine pieces in a layer under it, and the content
 * above them. `pad` is the room between the frame and the content, in
 * Desktop's units (columns across, half-rows down).
 */
export function framed(el: DesktopTable, frame: Frame, content: RenderElement, pad: { x: number; y: number }): RenderElement {
  const { Box, Svg } = el
  const { slices } = frame
  const alt = 'frame'
  const piece = (source: string, size: { width?: number; height?: number }): RenderElement =>
    Svg({ source, alt, ...size })
  const grow = (child: RenderElement): RenderElement => Box({ flexGrow: 1, minWidth: 0, children: [child] })
  // A middle piece as a column of tall copies, so a reply of any length is covered.
  // A side column never shrinks: the wide middle strip would squeeze it to nothing.
  const tall = (source: string, width?: number): RenderElement =>
    Box({
      flexDirection: 'column',
      ...(width === undefined ? {} : { flexShrink: 0 }),
      children: Array.from({ length: STACK }, () => piece(source, { width, height: TALL })),
    })
  const art9 = Box({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    children: [
      Box({ children: [piece(slices.tl, { width: frame.left, height: frame.top }), grow(piece(slices.tc, { height: frame.top })), piece(slices.tr, { width: frame.right, height: frame.top })] }),
      // Desktop's stylesheet gives every <img> height:auto, so a row cannot
      // stretch a piece downward. The middle pieces are drawn far taller than
      // any reply instead, in a row that clips them to whatever height it has.
      Box({
        flexGrow: 1,
        overflow: 'hidden',
        children: [tall(slices.ml, frame.left), grow(tall(slices.mc)), tall(slices.mr, frame.right)],
      }),
      Box({ children: [piece(slices.bl, { width: frame.left, height: frame.bottom }), grow(piece(slices.bc, { height: frame.bottom })), piece(slices.br, { width: frame.right, height: frame.bottom })] }),
    ],
  })
  // An absolute child makes Desktop give its Box position:relative, which is
  // what lifts the content above the art drawn before it. Drawn nowhere.
  const lift = Box({ position: 'absolute', display: 'none' })
  // The boxes above Claude's own drawing hold only spacing and direction: the
  // engine refuses its drawing under a Box with other props (a minWidth, say).
  const inside = Box({
    flexDirection: 'column',
    paddingLeft: pad.x + frame.reach.left,
    paddingRight: pad.x + frame.reach.right,
    paddingY: pad.y,
    children: [lift, content],
  })
  if (frame.inset === 0) return Box({ flexDirection: 'column', children: [art9, inside] })
  // Exact pixels of room on every side, held by empty pictures, so a caption or
  // a face meets the rings flush instead of covering them.
  const gap = (width: number, height: number): RenderElement =>
    Svg({ source: svg(width, height, ''), alt: '', width, height })
  const i = frame.inset
  const row = Box({ children: [gap(i, 1), Box({ flexGrow: 1, flexDirection: 'column', children: [inside] }), gap(i, 1)] })
  return Box({ flexDirection: 'column', children: [art9, Box({ flexDirection: 'column', children: [gap(1, i), row, gap(1, i)] })] })
}
