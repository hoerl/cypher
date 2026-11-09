// What Cypher keeps across sessions in Claude's store: the theme, nothing
// more. Your name and account come from the server; your credential stays in
// the keychain, held by the helper. Shared by register.tsx (which stores it)
// and the pane's Client (session.ts, which produces it).
export const themes = ['terminal', 'green', 'blue', 'amber', 'pink'] as const
export type Theme = (typeof themes)[number]
export type Profile = { theme: Theme }

const known: readonly string[] = themes

// A value from the store or from the Client is data, not a promise. A profile
// an older version stored (theme, nick, identity) still yields its theme.
export function isProfile(value: unknown): value is Profile {
  const theme = (value as { theme?: unknown } | null | undefined)?.theme
  return typeof theme === 'string' && known.includes(theme)
}
