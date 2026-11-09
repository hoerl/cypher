// The one interface between the helper (helper/cypher-helper.mjs, built from
// src/cli/pane-helper.ts) and this mod. The helper holds the connection and the
// credential; the mod holds none of it and only relays.
//
//   helper → mod   one JSON Event per line on the helper's stdout
//   mod → helper   POST /intent over the helper's private Unix socket, with
//                  the token from its `ready` event; answers a Reply
//
// Plain types and hand-written checks: a hooks module has no npm packages, and
// everything that crosses a process boundary is checked before it is used.
export const PROTOCOL = 1

export type Identity = 'guest' | 'account' | 'human'
export type Connection = 'connecting' | 'connected' | 'reconnecting' | 'closed'

export type Person = { id: string; name: string; verified: boolean; muted: boolean }
export type RoomInfo = { id: string; topic: string; count: number; human: boolean }
export type Message = {
  id: string
  author: string
  verified: boolean
  own: boolean
  text: string
  at: number
}
// One QR row as runs of black and white cells (src/cli/qr.ts's QrRun).
export type QrRun = { text: string; foreground: 'black' | 'white'; background: 'black' | 'white' }
export type Invitation = { kind: 'signin' | 'verify'; url: string; code: string | null; qr: QrRun[][] }

// Everything the pane draws that the server decides.
export type RoomView = {
  connection: Connection
  notice: string
  busy: boolean
  self: { name: string; identity: Identity; needsName: boolean } | null
  roomId: string | null
  rooms: RoomInfo[]
  locked: number
  // The people in your room, you not among them.
  people: Person[]
  // Your room's messages, oldest first, the muted left out.
  messages: Message[]
  invitation: Invitation | null
}

export type Event =
  | { v: typeof PROTOCOL; type: 'ready'; socket: string; token: string }
  | { v: typeof PROTOCOL; type: 'view'; view: RoomView }
  | { v: typeof PROTOCOL; type: 'fatal'; message: string }

export type Intent =
  | { type: 'say'; text: string }
  | { type: 'command'; text: string }
  | { type: 'join'; roomId: string }
  | { type: 'mute'; memberId: string }
  | { type: 'signin' }
  | { type: 'verify' }
  | { type: 'cancel' }
  | { type: 'open' }
  | { type: 'signout' }

// `ok`: whatever was asked happened (a sent message reached the room).
export type Reply = { ok: boolean }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string'

const BARE = new Set(['signin', 'verify', 'cancel', 'open', 'signout'])
const TEXT = new Set(['say', 'command'])

export function isIntent(value: unknown): value is Intent {
  if (!isRecord(value) || !isString(value.type)) return false
  if (BARE.has(value.type)) return true
  if (TEXT.has(value.type)) return isString(value.text)
  if (value.type === 'join') return isString(value.roomId)
  if (value.type === 'mute') return isString(value.memberId)
  return false
}

// The shape of an event; the view's own fields come from our own helper,
// whose source sits beside this file, so only its top level is checked.
export function isEvent(value: unknown): value is Event {
  if (!isRecord(value) || value.v !== PROTOCOL) return false
  if (value.type === 'ready') return isString(value.socket) && isString(value.token)
  if (value.type === 'view') return isRecord(value.view) && Array.isArray(value.view.messages)
  return value.type === 'fatal' && isString(value.message)
}
