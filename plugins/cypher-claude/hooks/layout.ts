// The pane's geometry in whole cells: text that fits, the tab strip at any
// width, and the hit map the pointer reads. Pure functions, no drawing:
// view.tsx draws what these decide.

// What a cell can be pressed for: a tab, a step to the next or previous tab
// (the narrow strip's ‹ ›), or a list row.
export type Target = { kind: 'tab' | 'step' | 'item'; index: number }
// One run of a row: its text, what pressing it does, whether it is chosen.
export type Segment = { text: string; target: Target | null; active?: boolean }
type Span = { from: number; to: number; target: Target }
// Where the last frame drew its targets, by row.
export type HitMap = Map<number, Span[]>

const HALF = 2
const ELLIPSIS = '…'

export const chars = (text: string) => Array.from(text)
export const width = (text: string) => chars(text).length
export const same = (a: Target | null, b: Target | null) => a?.kind === b?.kind && a?.index === b?.index

// Cut to `room` cells, ending in … when anything was cut. Never wraps.
export function clip(text: string, room: number): string {
  if (width(text) <= room) return text
  return room < 1 ? '' : chars(text).slice(0, room - 1).join('') + ELLIPSIS
}

// terminal.mjs's word wrap: break at the last space past half the width.
export function wrapped(text: string, room: number): string[] {
  const rest = chars(text)
  if (rest.length <= room) return [rest.join('')]
  const space = rest.slice(0, room + 1).lastIndexOf(' ')
  const end = space > room / HALF ? space : room
  const tail = rest.slice(end).join('')
  return [rest.slice(0, end).join(''), ...wrapped(tail.startsWith(' ') ? tail.slice(1) : tail, room)]
}

// The tabs as pills one cell apart when they fit in `room`, else the active
// one between ‹ and ›: one row that names where you are and what ←→ does.
export function tabStrip(labels: string[], active: number, room: number): Segment[] {
  const pills = labels.flatMap((label, index): Segment[] => [
    ...(index ? [{ text: ' ', target: null }] : []),
    { text: ` ${label} `, target: { kind: 'tab', index }, active: index === active },
  ])
  if (pills.reduce((sum, pill) => sum + width(pill.text), 0) <= room) return pills
  return [
    { text: '‹', target: { kind: 'step', index: -1 } },
    { text: ` ${clip(labels[active] ?? '', room - HALF * HALF)} `, target: null, active: true },
    { text: '›', target: { kind: 'step', index: 1 } },
  ]
}

// The pressable spans of a row of segments drawn from column `x`.
export function spansOf(segments: Segment[], x: number): Span[] {
  return segments.reduce<{ at: number; spans: Span[] }>(
    ({ at, spans }, { text, target }) => ({
      at: at + width(text),
      spans: target ? [...spans, { from: at, to: at + width(text), target }] : spans,
    }),
    { at: x, spans: [] },
  ).spans
}

export function targetAt(hits: HitMap, x: number, y: number): Target | null {
  return hits.get(y)?.find(span => x >= span.from && x < span.to)?.target ?? null
}
