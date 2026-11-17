// The Cypher web app's built-in skins, by id: the nine color roles of each, as
// src/app/skins/model.ts has them. Copied here because a hooks module cannot
// import app code; tests/claude-look.test.ts fails when the two differ.
export type WebSkin = {
  surface: string
  panel: string
  text: string
  muted: string
  accent: string
  onAccent: string
  border: string
  link: string
  danger: string
}

export const WEB_SKINS: Readonly<Record<string, WebSkin>> = {
  aqua: { surface: '#f0f0f0', panel: '#ffffff', text: '#000000', muted: '#7f7f7f', accent: '#3875d7', onAccent: '#ffffff', border: '#9a9a9a', link: '#0000ee', danger: '#a12219' },
  '95': { surface: '#c0c0c0', panel: '#ffffff', text: '#000000', muted: '#505050', accent: '#000080', onAccent: '#ffffff', border: '#808080', link: '#000080', danger: '#a12219' },
  boxx: { surface: '#102508', panel: '#081a06', text: '#d9eea1', muted: '#a1c06c', accent: '#b6e526', onAccent: '#203300', border: '#628829', link: '#b9f356', danger: '#ffb1a1' },
  cypher: { surface: '#000000', panel: '#080808', text: '#ffffff', muted: '#a8a8a8', accent: '#ffffff', onAccent: '#000000', border: '#3a3a3a', link: '#ffffff', danger: '#ff8080' },
  'pink-sparkle': { surface: '#ffd7e8', panel: '#fff8fc', text: '#502238', muted: '#824060', accent: '#ad1769', onAccent: '#ffffff', border: '#71324f', link: '#9b125c', danger: '#a12239' },
  wii: { surface: '#f2f2f2', panel: '#ffffff', text: '#383e3f', muted: '#6e7173', accent: '#34beed', onAccent: '#10323f', border: '#b4b4b4', link: '#0078a8', danger: '#b3261e' },
  msn: { surface: '#d7e4f5', panel: '#ffffff', text: '#000000', muted: '#5b6470', accent: '#316ac5', onAccent: '#ffffff', border: '#586170', link: '#0046d5', danger: '#b3261e' },
}
