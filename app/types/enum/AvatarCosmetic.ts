import { Blessing } from "./Blessing"

export const AVATAR_COSMETIC_IDS = [
  "none",
  "confetti-trail",
  "fire-trail",
  "flower-trail",
  "electric-trail",
  "water-trail"
] as const

export type AvatarCosmeticId = (typeof AVATAR_COSMETIC_IDS)[number]

export const AVATAR_COSMETIC_BLESSINGS: Record<
  Exclude<AvatarCosmeticId, "none">,
  Blessing
> = {
  "fire-trail": Blessing.BURNING_SHARDS,
  "water-trail": Blessing.TIDAL_SURGE,
  "flower-trail": Blessing.AMAZING_GARDENING,
  "confetti-trail": Blessing.SHOW_OFF,
  "electric-trail": Blessing.CHARGING_UP
}

export function isAvatarCosmeticId(value: unknown): value is AvatarCosmeticId {
  return AVATAR_COSMETIC_IDS.includes(value as AvatarCosmeticId)
}
