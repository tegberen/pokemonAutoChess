import type { AvatarCosmeticId } from "../../../types/enum/AvatarCosmetic"

export type { AvatarCosmeticId } from "../../../types/enum/AvatarCosmetic"

export type AvatarTrail =
  | "confetti"
  | "fire"
  | "flowers"
  | "electric"
  | "water"
  | "dragonKing"
  | "slipstream"

export type AvatarCosmeticCategory = "none" | "trail" | "veil" | "movement"

export const AVATAR_COSMETIC_CATEGORY_NAMES: Record<
  AvatarCosmeticCategory,
  string
> = {
  none: "Default",
  trail: "Trails",
  veil: "Veils",
  movement: "Movement"
}

export interface AvatarCosmetic {
  id: AvatarCosmeticId
  name: string
  category: AvatarCosmeticCategory
  description: string
  trail?: AvatarTrail
  emissionIntervalMs?: number
  movement?: "teleport"
}

export const AVATAR_COSMETICS: readonly AvatarCosmetic[] = [
  {
    id: "none",
    name: "Classic",
    category: "none",
    description: "No movement effect."
  },
  {
    id: "confetti-trail",
    name: "Confetti Trail",
    category: "trail",
    description: "A colorful celebration follows every step.",
    trail: "confetti",
    emissionIntervalMs: 85
  },
  {
    id: "fire-trail",
    name: "Fire Trail",
    category: "trail",
    description: "Short-lived embers burn behind the avatar.",
    trail: "fire",
    emissionIntervalMs: 90
  },
  {
    id: "flower-trail",
    name: "Flower Trail",
    category: "trail",
    description: "Small blossoms scatter along the path.",
    trail: "flowers",
    emissionIntervalMs: 100
  },
  {
    id: "electric-trail",
    name: "Voltage Trail",
    category: "trail",
    description: "Crackling sparks and voltage arcs snap across the ground.",
    trail: "electric",
    emissionIntervalMs: 55
  },
  {
    id: "water-trail",
    name: "Surf Trail",
    category: "trail",
    description: "Ride a foaming wave with sparkling bubbles in your wake.",
    trail: "water",
    emissionIntervalMs: 90
  },
  {
    id: "dragon-king-trail",
    name: "Dragon Veil",
    category: "veil",
    description: "Awaken the celestial veil.",
    trail: "dragonKing",
    emissionIntervalMs: 160
  },
  {
    id: "slipstream-trail",
    name: "Wind Trail",
    category: "trail",
    description: "Soft tailwinds drift through your wake.",
    trail: "slipstream",
    emissionIntervalMs: 230
  },
  {
    id: "teleport",
    name: "Teleport",
    category: "movement",
    description: "Teleport straight to where you click instead of walking.",
    movement: "teleport"
  }
]

const COSMETICS_BY_ID = new Map(
  AVATAR_COSMETICS.map((cosmetic) => [cosmetic.id, cosmetic])
)

export function getAvatarCosmetic(id: string): AvatarCosmetic {
  return COSMETICS_BY_ID.get(id as AvatarCosmeticId) ?? AVATAR_COSMETICS[0]
}
