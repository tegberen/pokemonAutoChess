import {
  Blessing,
  BLESSING_SELECTION_STAGES,
  BlessingTier
} from "../../types/enum/Blessing"
import { randomWeighted } from "../../utils/random"

export interface BlessingDefinition {
  tier: BlessingTier
  availableAtStages: number[]
  icon: string
  grantsPokemonImmediately: boolean
}

export const Blessings: { [blessing in Blessing]: BlessingDefinition } = {
  [Blessing.PEARL]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "pearl",
    grantsPokemonImmediately: false
  },
  [Blessing.CROAGUNKS_AID]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "ticket",
    grantsPokemonImmediately: false
  },
  [Blessing.BAG_OF_SWEETS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "sweets",
    grantsPokemonImmediately: false
  },
  [Blessing.WOBBUFFETS_SILVER_PRIZE]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "ticket",
    grantsPokemonImmediately: false
  },
  [Blessing.TREASURE_HUNT_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "gems",
    grantsPokemonImmediately: false
  },
  [Blessing.STARTER_PACK]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "gift_box",
    grantsPokemonImmediately: true
  },
  [Blessing.NUGGET]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "cash",
    grantsPokemonImmediately: false
  },
  [Blessing.GOLDEN_TICKET]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "ticket",
    grantsPokemonImmediately: false
  },
  [Blessing.TREASURE_HUNT_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "gems",
    grantsPokemonImmediately: false
  },
  // TEMPORARY stages for testing, revert to [4]
  [Blessing.GIMMIGHOULS_TREASURE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "treasure_chest",
    grantsPokemonImmediately: false
  },
  // TEMPORARY stages for testing, revert to [4]
  [Blessing.INSTANT_HYPER_ROLL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "slot_mashine",
    grantsPokemonImmediately: true
  },
  [Blessing.CINCCINOS_GIFTS_III]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "gift_box",
    grantsPokemonImmediately: false
  },
  [Blessing.CINCCINOS_GIFTS_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "gift_box",
    grantsPokemonImmediately: false
  },
  [Blessing.CINCCINOS_GIFTS_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "gift_box",
    grantsPokemonImmediately: false
  },
  [Blessing.RELIC_FRAGMENT]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "compass",
    grantsPokemonImmediately: false
  },
  [Blessing.ITEMFINDER_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "item_detector",
    grantsPokemonImmediately: false
  },
  [Blessing.ITEMFINDER_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "item_detector",
    grantsPokemonImmediately: false
  },
  [Blessing.ITEMFINDER_III]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "item_detector",
    grantsPokemonImmediately: false
  },
  [Blessing.LEGENDARY_GAMBIT]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "book_aura",
    grantsPokemonImmediately: false
  },
  [Blessing.DEEP_INVESTMENTS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "money_safe",
    grantsPokemonImmediately: false
  },
  [Blessing.BERRY_POUCH]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "berries_bowl",
    grantsPokemonImmediately: false
  },
  [Blessing.SCHOOL_BUS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "fish_school",
    grantsPokemonImmediately: true
  },
  [Blessing.BANANA_BUSINESS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "banana_bundle",
    grantsPokemonImmediately: false
  },
  [Blessing.SWEET_SUBSCRIPTION]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "sweets",
    grantsPokemonImmediately: false
  },
  [Blessing.MUNCHLAX_DELIVERY]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "basket",
    grantsPokemonImmediately: false
  }
}

// TEMPORARY equal odds for testing, revert to 0.6/0.3/0.1 and 0.35/0.45/0.2
const EARLY_BLESSING_TIER_CHANCES: { [tier in BlessingTier]: number } = {
  [BlessingTier.SILVER]: 1,
  [BlessingTier.GOLD]: 1,
  [BlessingTier.PRISMATIC]: 1
}

const LATE_BLESSING_TIER_CHANCES: { [tier in BlessingTier]: number } = {
  [BlessingTier.SILVER]: 1,
  [BlessingTier.GOLD]: 1,
  [BlessingTier.PRISMATIC]: 1
}

export const BlessingTierChanceByStage: {
  [stage: number]: { [tier in BlessingTier]: number }
} = {
  4: EARLY_BLESSING_TIER_CHANCES,
  12: LATE_BLESSING_TIER_CHANCES
}

export function rollBlessingTierForStage(stage: number): BlessingTier {
  const tierChances =
    BlessingTierChanceByStage[stage] ?? EARLY_BLESSING_TIER_CHANCES
  return randomWeighted(tierChances) ?? BlessingTier.SILVER
}

export function getBlessingsAvailable(
  tier: BlessingTier,
  stage: number
): Blessing[] {
  return (Object.keys(Blessings) as Blessing[]).filter((blessing) => {
    const definition = Blessings[blessing]
    return (
      definition.tier === tier && definition.availableAtStages.includes(stage)
    )
  })
}
