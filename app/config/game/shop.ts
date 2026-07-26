import { Rarity } from "../../types/enum/Game"
import { SpecialGameRule } from "../../types/enum/SpecialGameRule"

export const SHOP_SIZE = 6

export function getShopSize(
  specialGameRule?: SpecialGameRule | null,
  stageLevel = 0
): number {
  if (specialGameRule === SpecialGameRule.EVOLUTION_LAB) {
    if (stageLevel < 10) return 3
    if (stageLevel < 20) return 4
    if (stageLevel < 30) return 5
    return SHOP_SIZE
  }
  return SHOP_SIZE
}

export const REROLL_COST = 1

export function getRerollCost(
  specialGameRule?: SpecialGameRule | null,
  stageLevel = 0
): number {
  if (specialGameRule === SpecialGameRule.EVOLUTION_LAB) {
    if (stageLevel < 10) return 5
    if (stageLevel < 20) return 4
    if (stageLevel < 30) return 3
    return 2
  }
  return REROLL_COST
}

export const EVOLUTION_LAB_REWARD_COMPONENTS = 3
export const EVOLUTION_LAB_REWARD_REROLLS = 2
export const EVOLUTION_LAB_REWARD_EXP = 12
export const EVOLUTION_LAB_REWARD_GOLD = 8

export const EvolutionLabRewardKinds = [
  "gem",
  "components",
  "gold",
  "rerolls",
  "exp"
] as const
export type EvolutionLabRewardKind = (typeof EvolutionLabRewardKinds)[number]
export const EVOLUTION_LAB_REWARD_OPTIONS = 2

export const NB_STARTERS = 3
export const NB_UNIQUE_PROPOSITIONS = 6

export const RarityHpCost: { [key in Rarity]: number } = Object.freeze({
  [Rarity.COMMON]: 1,
  [Rarity.UNCOMMON]: 1,
  [Rarity.RARE]: 2,
  [Rarity.EPIC]: 2,
  [Rarity.ULTRA]: 3,
  [Rarity.UNIQUE]: 3,
  [Rarity.LEGENDARY]: 3,
  [Rarity.SPECIAL]: 1,
  [Rarity.HATCH]: 4
})

// used to evaluate unit value, even if some categories are not found in shop
export const RarityCost: { [key in Rarity]: number } = Object.freeze({
  [Rarity.SPECIAL]: 0, // many edgecases with custom buy/sell prices
  [Rarity.COMMON]: 1,
  [Rarity.UNCOMMON]: 2,
  [Rarity.RARE]: 3,
  [Rarity.EPIC]: 4,
  [Rarity.ULTRA]: 5,
  [Rarity.HATCH]: 9,
  [Rarity.UNIQUE]: 10,
  [Rarity.LEGENDARY]: 20
})

export const RarityColor: { [key in Rarity]: string } = {
  [Rarity.COMMON]: "var(--color-rarity-common)",
  [Rarity.UNCOMMON]: "var(--color-rarity-uncommon)",
  [Rarity.RARE]: "var(--color-rarity-rare)",
  [Rarity.EPIC]: "var(--color-rarity-epic)",
  [Rarity.ULTRA]: "var(--color-rarity-ultra)",
  [Rarity.UNIQUE]: "var(--color-rarity-unique)",
  [Rarity.LEGENDARY]: "var(--color-rarity-legendary)",
  [Rarity.SPECIAL]: "var(--color-rarity-special)",
  [Rarity.HATCH]: "var(--color-rarity-hatch)"
}

export const BoosterRarityProbability: { [key in Rarity]: number } = {
  [Rarity.COMMON]: 0.12,
  [Rarity.UNCOMMON]: 0.2,
  [Rarity.RARE]: 0.2,
  [Rarity.EPIC]: 0.18,
  [Rarity.ULTRA]: 0.04,
  [Rarity.UNIQUE]: 0.1,
  [Rarity.LEGENDARY]: 0.06,
  [Rarity.HATCH]: 0.05,
  [Rarity.SPECIAL]: 0.05
}

export const RarityProbabilityPerLevel: { [key: number]: number[] } = {
  1: [1, 0, 0, 0, 0],
  2: [1, 0, 0, 0, 0],
  3: [0.7, 0.3, 0, 0, 0],
  4: [0.5, 0.4, 0.1, 0, 0],
  5: [0.36, 0.42, 0.2, 0.02, 0],
  6: [0.25, 0.4, 0.3, 0.05, 0],
  7: [0.16, 0.33, 0.35, 0.15, 0.01],
  8: [0.11, 0.27, 0.35, 0.22, 0.05],
  9: [0.05, 0.2, 0.35, 0.3, 0.1],
  10: [0.05, 0.2, 0.3, 0.3, 0.15]
}

/* Special Pokemon rates */
export const DITTO_RATE = 0.005
export const MIN_STAGE_FOR_DITTO = 6
export const EEVEE_RATE = 1 / 20
// JUGGERNAUT: per-slot chance for a shop slot to be a 1-star champion copy
export const JUGGERNAUT_COPY_RATE = 0.05
export const KECLEON_RATE = 1 / 400
export const ARCEUS_RATE = 1 / 400
export const UNOWN_PSY3_NB_SHOPS_INTERVAL = 5
export const UNOWN_PSY5_NB_SHOPS_INTERVAL = 3
export const UNOWN_PSY7_NB_SHOPS_INTERVAL = 10
export const FALINKS_TROOPER_RATE = 4 / 100
export const REMORAID_RATE = 1 / 3

export const PVE_WILD_CHANCE = 5 / 100

export const INCENSE_CHANCE = 5 / 100
export const HONEY_CHANCE = 5 / 100
export const REPEAT_BALL_LEGENDARY_CAP = 120
export const REPEAT_BALL_UNIQUE_CAP = 80
export const REPEAT_BALL_UNIQUE_INTERVAL = 10

export const HIGH_ROLLER_CHANCE = 2 / 100

/* sell prices */
export const SellPrices = {
  EGG: 2,
  SHINY_EGG: 10,
  DITTO: 5,
  EEVEE: 1,
  FALINKS_TROOPER: 3,
  MELTAN: 0,
  MAGIKARP: 0,
  GYARADOS: 10,
  FEEBAS: 1,
  MILOTIC: 10,
  WISHIWASHI: 3,
  WISHIWASHI_SCHOOL: 10,
  REMORAID: 2,
  OCTILLERY: 7,
  UNOWN: 1,
  HATCH: [3, 4, 5],
  UNIQUE: 10,
  UNIQUE_DUO: 6,
  LEGENDARY: 20,
  LEGENDARY_DUO: 10
}

export const BuyPrices = {
  DITTO: 5,
  FALINKS_TROOPER: 3,
  MELTAN: 0,
  UNOWN: 1
}
