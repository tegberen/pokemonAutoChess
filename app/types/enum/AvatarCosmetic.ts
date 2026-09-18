import { Title } from "../index"
import { Blessing } from "./Blessing"

export const AVATAR_COSMETIC_IDS = [
  "none",
  "confetti-trail",
  "fire-trail",
  "flower-trail",
  "electric-trail",
  "water-trail",
  "dragon-king-trail",
  "slipstream-trail"
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
  "electric-trail": Blessing.CHARGING_UP,
  "dragon-king-trail": Blessing.LIMIT_BREAKER,
  "slipstream-trail": Blessing.SLIPSTREAM
}

export const AVATAR_COSMETIC_TITLES: Partial<
  Record<Exclude<AvatarCosmeticId, "none">, Title>
> = {
  "confetti-trail": Title.SHOW_OFF
}

// the trails shipped after players had already earned these titles, so the
// title stands in for the win that would have unlocked the trail
export function getUnlockedAvatarCosmetics(
  profile?: {
    unlockedAvatarCosmetics?: AvatarCosmeticId[]
    titles?: Title[]
  } | null
): Set<AvatarCosmeticId> {
  const unlocked = new Set(profile?.unlockedAvatarCosmetics ?? [])
  Object.entries(AVATAR_COSMETIC_TITLES).forEach(([cosmetic, title]) => {
    if (title && profile?.titles?.includes(title)) {
      unlocked.add(cosmetic as AvatarCosmeticId)
    }
  })
  return unlocked
}

export function isAvatarCosmeticId(value: unknown): value is AvatarCosmeticId {
  return AVATAR_COSMETIC_IDS.includes(value as AvatarCosmeticId)
}
