// One palette per Cypher theme (model.mjs's `themes`). Every skin paints the
// pane's background and sets every foreground: a pane can sit on a dark
// surface while the terminal's default text is dark too, so a skin that left
// either to the terminal could draw black on black.
//
// Depth comes from three background steps, not borders: `background` for the
// pane, `hover` one step up under the pointer, `raised` one more for what is
// chosen (the active tab, the selected row, the composer).
export type Skin = {
  accent: string // brand, active tab, prompt, ✓
  self: string // your own name, set apart from everyone else's
  text: string // ordinary text and other people's names
  dim: string // meta lines and hints
  background: string // the pane's body
  hover: string // a row or tab under the pointer
  raised: string // the active tab, the selected row, the composer
}

const TERMINAL: Skin = {
  accent: '#ffffff',
  self: '#f5c26b',
  text: '#d4d4d4',
  dim: '#808080',
  background: '#0c0c0c',
  hover: '#171717',
  raised: '#232323',
}

const SKINS: Record<string, Skin> = {
  terminal: TERMINAL,
  green: {
    accent: '#39ff7a',
    self: '#eef27a',
    text: '#c6f6d3',
    dim: '#4e8c60',
    background: '#04130a',
    hover: '#0a2213',
    raised: '#10321d',
  },
  blue: {
    accent: '#5aa9ff',
    self: '#ffcf70',
    text: '#cfe0ff',
    dim: '#5a6f96',
    background: '#060d1d',
    hover: '#0d1830',
    raised: '#152443',
  },
  amber: {
    accent: '#ffb000',
    self: '#7fd4ff',
    text: '#ffdcaa',
    dim: '#8f6b37',
    background: '#140c02',
    hover: '#22160a',
    raised: '#322110',
  },
  pink: {
    accent: '#ff5fb7',
    self: '#9be7ff',
    text: '#ffd3ec',
    dim: '#96537c',
    background: '#190612',
    hover: '#280d1e',
    raised: '#3a142c',
  },
}

export function skinFor(theme: string | undefined): Skin {
  return SKINS[theme ?? ''] ?? TERMINAL
}
