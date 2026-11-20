// Which of Claude's rows a kit redraws, and when. Pure, so the rules are tested
// without a session; register.tsx hooks the sites and asks here.
import type { PartName, SkinKit } from './kit'
import { kitFor } from './registry'

/** The render sites a kit may redraw, and the part that draws each. */
export const SKIN_SITES = {
  AssistantMessage: 'assistant',
  UserMessage: 'user',
  ToolUse: 'tool',
  ToolGroup: 'toolGroup',
  Spinner: 'spinner',
} as const satisfies Record<string, PartName>

export type SkinSite = keyof typeof SKIN_SITES

// Rows on the person's side that the person did not write: a task's notice,
// a schedule, another session or agent, a channel. Everything else on that side
// is theirs (Desktop stamps its own prompts in ways the terminal does not).
const NOT_THEIRS: readonly string[] = ['task-notification', 'scheduled-trigger', 'peer', 'peer-send-message', 'projects-relay', 'channel']

/** What a skinned row is drawn from: the surface, the look's state and the site's props. */
export type SkinAsk = {
  surface: string
  /** The look is on and this module set it. */
  looking: boolean
  /** The skin the look wears. */
  worn: string | null
  site: SkinSite
  props: Record<string, unknown>
}

/**
 * The kit that redraws this row, or undefined to leave Claude's own drawing.
 * Desktop only, and a prompt only when the person wrote it. A row drawn in
 * full is skinned too: Desktop has no ctrl+o and marks every row so, and a part
 * keeps the row's whole content inside its art.
 */
export function kitForRow(ask: SkinAsk): SkinKit | undefined {
  if (ask.surface !== 'desktop' || !ask.looking) return undefined
  const kit = kitFor(ask.worn)
  if (!kit?.parts[SKIN_SITES[ask.site]]) return undefined
  if (ask.site === 'UserMessage') {
    const origin = ask.props.origin as { kind?: unknown } | undefined
    const kind = typeof origin?.kind === 'string' ? origin.kind : ''
    if (NOT_THEIRS.includes(kind) || ask.props.from !== undefined || ask.props.task !== undefined) return undefined
  }
  return kit
}
