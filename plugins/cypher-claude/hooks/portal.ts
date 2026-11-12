// The desktop app can draw the room's own window: the Cypher connector's app,
// which only a tool call of the model's opens. So `/cypher` there sends the
// model a prompt that asks for that call, and the text pane stays the
// terminal's. With no connector in the session, the person is told to add it.
// Shared by register.tsx and its tests.

export type Listed = { name: string; description: string; mcp: boolean }

// The connector's launch tool, under whatever name the session gives its server.
const TOOL_END = '__open_portal'
// How the tool describes itself where it opens the app. Where it cannot draw
// one, it says to run /cypher, and asking for it would go round in a circle.
const APP_SAYS = 'inside Claude'

export function portalTool(tools: readonly Listed[]): string | null {
  const found = tools.find(tool => tool.mcp && tool.name.endsWith(TOOL_END) && tool.description.includes(APP_SAYS))
  return found?.name ?? null
}

// Sent in the person's name, and read by them: the tool is named the way the
// model can find it under any server name, and nothing else is asked.
const ASK = 'Open Cypher with its open_portal tool'

export function portalAsk(invite: string | null): string {
  return invite ? `${ASK}, joining ${invite}.` : `${ASK}.`
}

// A prompt of the mod's waits for the running turn to end.
export const PORTAL_WAITS = 'cypher opens when claude finishes this turn'

// The desktop app with no connector: there is no window to open, and no pane.
export const NO_CONNECTOR = 'cypher here needs the Cypher connector · add it in Settings → Connectors'
