// Every skin with a kit, by its Cypher web skin id. A new skin is a folder under
// kits/ and one line here; a skin with no line keeps colors and plain dots.
import type { SkinKit } from './kit'
import { AQUA } from './kits/aqua'
import { WIN95 } from './kits/95'
import { MSN_XP } from './kits/msn'
import { BOXX } from './kits/boxx'
import { WEBMASTER } from './kits/cypher'
import { PINK_SPARKLE } from './kits/pink-sparkle'
import { WII } from './kits/wii'

const KITS: Readonly<Record<string, SkinKit>> = {
  aqua: AQUA,
  '95': WIN95,
  msn: MSN_XP,
  boxx: BOXX,
  cypher: WEBMASTER,
  'pink-sparkle': PINK_SPARKLE,
  wii: WII,
}

/** The kit for a skin id, or undefined. An id is the account's own text, so one naming something every object has (`constructor`) is no skin. */
export function kitFor(skin: string | null | undefined): SkinKit | undefined {
  return typeof skin === 'string' && Object.hasOwn(KITS, skin) ? KITS[skin] : undefined
}

/** Every kit with its id, for checks over all of them. */
export function registeredKits(): [string, SkinKit][] {
  return Object.entries(KITS)
}
