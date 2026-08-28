import type { AvatarCosmeticId } from "../../../types/enum/AvatarCosmetic"

export type { AvatarCosmeticId } from "../../../types/enum/AvatarCosmetic"

export type AvatarTrail = "confetti" | "fire" | "flowers" | "electric" | "water"

export interface AvatarCosmetic {
  id: AvatarCosmeticId
  name: string
  description: string
  trail?: AvatarTrail
  emissionIntervalMs?: number
}

export const AVATAR_COSMETICS: readonly AvatarCosmetic[] = [
  {
    id: "none",
    name: "Classic",
    description: "No movement effect."
  },
  {
    id: "confetti-trail",
    name: "Confetti Trail",
    description: "A colorful celebration follows every step.",
    trail: "confetti",
    emissionIntervalMs: 85
  },
  {
    id: "fire-trail",
    name: "Fire Trail",
    description: "Short-lived embers burn behind the avatar.",
    trail: "fire",
    emissionIntervalMs: 90
  },
  {
    id: "flower-trail",
    name: "Flower Trail",
    description: "Small blossoms scatter along the path.",
    trail: "flowers",
    emissionIntervalMs: 100
  },
  {
    id: "electric-trail",
    name: "Voltage Trail",
    description: "Crackling sparks and voltage arcs snap across the ground.",
    trail: "electric",
    emissionIntervalMs: 55
  },
  {
    id: "water-trail",
    name: "Surf Trail",
    description: "Ride a foaming wave with sparkling bubbles in your wake.",
    trail: "water",
    emissionIntervalMs: 90
  }
]

const COSMETICS_BY_ID = new Map(
  AVATAR_COSMETICS.map((cosmetic) => [cosmetic.id, cosmetic])
)

export function getAvatarCosmetic(id: string): AvatarCosmetic {
  return COSMETICS_BY_ID.get(id as AvatarCosmeticId) ?? AVATAR_COSMETICS[0]
}
