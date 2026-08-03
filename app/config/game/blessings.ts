import {
  Blessing,
  BLESSING_SELECTION_STAGES,
  BlessingTier
} from "../../types/enum/Blessing"
import { randomWeighted, shuffleArray } from "../../utils/random"
import { SynergyTiersThresholds } from "../../config"
import { Synergy } from "../../types/enum/Synergy"
import type Player from "../../models/colyseus-models/player"

export type BlessingFamily = "BADGE" | "CREST" | "CROWN"

export interface BlessingDefinition {
  tier: BlessingTier
  availableAtStages: number[]
  icon: string
  grantsPokemonImmediately: boolean
  isAvailable?: (player: Player, stage: number) => boolean
  family?: BlessingFamily
}

export const BLESSING_MAX_OPTIONS_PER_FAMILY = 2

export const BLESSING_SYNERGY_GATED_STAGE = 12

export function isSynergyActiveForPlayer(player: Player, synergy: Synergy) {
  const threshold = SynergyTiersThresholds[synergy]?.[0]
  return (
    threshold !== undefined && (player.synergies.get(synergy) ?? 0) >= threshold
  )
}

const isSynergyBlessingAvailable =
  (synergy: Synergy) => (player: Player, stage: number) =>
    stage < BLESSING_SYNERGY_GATED_STAGE ||
    isSynergyActiveForPlayer(player, synergy)

const isFloraBlessingAvailable = (player: Player, stage: number) =>
  stage < BLESSING_SYNERGY_GATED_STAGE ||
  isSynergyActiveForPlayer(player, Synergy.FLORA)

export const CrownBlessingBySynergy: { [synergy in Synergy]?: Blessing } = {
  [Synergy.NORMAL]: Blessing.NORMAL_CROWN_BLESSING,
  [Synergy.FLYING]: Blessing.FLYING_CROWN_BLESSING,
  [Synergy.FIELD]: Blessing.FIELD_CROWN_BLESSING,
  [Synergy.DARK]: Blessing.DARK_CROWN_BLESSING,
  [Synergy.GROUND]: Blessing.GROUND_CROWN_BLESSING,
  [Synergy.PSYCHIC]: Blessing.PSYCHIC_CROWN_BLESSING,
  [Synergy.GRASS]: Blessing.GRASS_CROWN_BLESSING,
  [Synergy.BUG]: Blessing.BUG_CROWN_BLESSING,
  [Synergy.WATER]: Blessing.WATER_CROWN_BLESSING,
  [Synergy.AQUATIC]: Blessing.AQUATIC_CROWN_BLESSING,
  [Synergy.POISON]: Blessing.POISON_CROWN_BLESSING,
  [Synergy.FAIRY]: Blessing.FAIRY_CROWN_BLESSING,
  [Synergy.FIGHTING]: Blessing.FIGHTING_CROWN_BLESSING,
  [Synergy.FIRE]: Blessing.FIRE_CROWN_BLESSING,
  [Synergy.GHOST]: Blessing.GHOST_CROWN_BLESSING,
  [Synergy.ROCK]: Blessing.ROCK_CROWN_BLESSING,
  [Synergy.MONSTER]: Blessing.MONSTER_CROWN_BLESSING,
  [Synergy.AMORPHOUS]: Blessing.AMORPHOUS_CROWN_BLESSING,
  [Synergy.WILD]: Blessing.WILD_CROWN_BLESSING,
  [Synergy.SOUND]: Blessing.SOUND_CROWN_BLESSING,
  [Synergy.FLORA]: Blessing.FLORA_CROWN_BLESSING,
  [Synergy.STEEL]: Blessing.STEEL_CROWN_BLESSING,
  [Synergy.ELECTRIC]: Blessing.ELECTRIC_CROWN_BLESSING,
  [Synergy.ICE]: Blessing.ICE_CROWN_BLESSING,
  [Synergy.HUMAN]: Blessing.HUMAN_CROWN_BLESSING,
  [Synergy.DRAGON]: Blessing.DRAGON_CROWN_BLESSING,
  [Synergy.LIGHT]: Blessing.LIGHT_CROWN_BLESSING,
  [Synergy.GOURMET]: Blessing.GOURMET_CROWN_BLESSING,
  [Synergy.FOSSIL]: Blessing.FOSSIL_CROWN_BLESSING,
  [Synergy.ARTIFICIAL]: Blessing.ARTIFICIAL_CROWN_BLESSING
}

export const SYNERGIES_WITH_BLESSINGS = Object.values(Synergy).filter(
  (synergy) => synergy !== Synergy.BABY
)

function synergyFamilyDefinitions(
  family: BlessingFamily,
  tier: BlessingTier,
  icon: string
) {
  return Object.fromEntries(
    SYNERGIES_WITH_BLESSINGS.map((synergy) => [
      `${synergy}_${family}_BLESSING`,
      {
        tier,
        availableAtStages: BLESSING_SELECTION_STAGES,
        icon,
        grantsPokemonImmediately: true,
        family,
        isAvailable: (player: Player, stage: number) =>
          stage < BLESSING_SYNERGY_GATED_STAGE ||
          isSynergyActiveForPlayer(player, synergy)
      }
    ])
  ) as { [blessing in Blessing]: BlessingDefinition }
}

export const Blessings: { [blessing in Blessing]: BlessingDefinition } = {
  ...synergyFamilyDefinitions("BADGE", BlessingTier.SILVER, "rank_one"),
  ...synergyFamilyDefinitions("CREST", BlessingTier.GOLD, "rank_two"),
  ...synergyFamilyDefinitions("CROWN", BlessingTier.PRISMATIC, "rank_three"),
  [Blessing.QUEST_REROLL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "reroll_quest",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_GROW]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "grow_quest",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_SHINE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "shine_quest",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_EPIC]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "epic_ultra_quest",
    grantsPokemonImmediately: true
  },
  [Blessing.QUEST_EXPAND]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "expand_quest",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_ASCEND]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "ascend_quest",
    grantsPokemonImmediately: true
  },
  [Blessing.CHARGING_UP]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "charging_up",
    grantsPokemonImmediately: false
  },
  [Blessing.BURNING_SHARDS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "burning_shards",
    grantsPokemonImmediately: false
  },
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
  [Blessing.GIMMIGHOULS_TREASURE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "treasure_chest",
    grantsPokemonImmediately: false
  },
  [Blessing.INSTANT_HYPER_ROLL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
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
  },
  [Blessing.FORECAST]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "kite",
    grantsPokemonImmediately: false
  },
  [Blessing.WEATHER_INSTITUTE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "windmill_house",
    grantsPokemonImmediately: false
  },
  [Blessing.BEEKEEPING]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "honey_comb",
    grantsPokemonImmediately: false
  },
  [Blessing.CURSE_OF_TWO]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "ghost_spectre",
    grantsPokemonImmediately: true,
    isAvailable: (player, stage) =>
      stage < BLESSING_SYNERGY_GATED_STAGE ||
      isSynergyActiveForPlayer(player, Synergy.GHOST)
  },
  [Blessing.ARCANE_METALS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "magnet_blast",
    grantsPokemonImmediately: true,
    isAvailable: (player, stage) =>
      stage < BLESSING_SYNERGY_GATED_STAGE ||
      isSynergyActiveForPlayer(player, Synergy.STEEL)
  },
  [Blessing.VITAMINS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "vitamin_bottle",
    grantsPokemonImmediately: false
  },
  [Blessing.DRAGON_FANG]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "dragon_orb",
    grantsPokemonImmediately: false
  },
  [Blessing.QUIET_STRENGTH]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "yin_yang",
    grantsPokemonImmediately: false
  },
  [Blessing.MISFORTUNE]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "broken_bone",
    grantsPokemonImmediately: false
  },
  [Blessing.SYNCHRONISED_SPEED_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "metronome",
    grantsPokemonImmediately: false
  },
  [Blessing.SYNCHRONISED_SPEED_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "metronome",
    grantsPokemonImmediately: false
  },
  [Blessing.POTENTIAL_ENERGY_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "star_energy_swirl",
    grantsPokemonImmediately: false
  },
  [Blessing.POTENTIAL_ENERGY_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "star_energy_swirl",
    grantsPokemonImmediately: false
  },
  [Blessing.RIVALRY]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "rival_arrows",
    grantsPokemonImmediately: false
  },
  [Blessing.SHINY_SAFEGUARD]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "shiny_shield",
    grantsPokemonImmediately: false
  },
  [Blessing.CONTEMPT]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "dripping_star",
    grantsPokemonImmediately: false
  },
  [Blessing.MISFITS]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "freedom_dove",
    grantsPokemonImmediately: false
  },
  [Blessing.GARDENING]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "watering_can",
    grantsPokemonImmediately: true,
    isAvailable: isFloraBlessingAvailable
  },
  [Blessing.DOUBLE_WINDFALL]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "double_windfall",
    grantsPokemonImmediately: true,
    isAvailable: isFloraBlessingAvailable
  },
  [Blessing.AMAZING_GARDENING]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "water_tank",
    grantsPokemonImmediately: true,
    isAvailable: isFloraBlessingAvailable
  },
  [Blessing.FLYTRAP]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "flytrap",
    grantsPokemonImmediately: true,
    isAvailable: isFloraBlessingAvailable
  },
  [Blessing.MEGA_SOL]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "mega_sol",
    grantsPokemonImmediately: true,
    isAvailable: isFloraBlessingAvailable
  },
  [Blessing.SPORE_CLOUDS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "spore_clouds",
    grantsPokemonImmediately: true,
    isAvailable: isFloraBlessingAvailable
  },
  [Blessing.BLOSSOM_FESTIVAL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "flower_pot",
    grantsPokemonImmediately: false,
    isAvailable: isFloraBlessingAvailable
  },
  [Blessing.NOT_THE_BEES]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "beehive",
    grantsPokemonImmediately: true,
    isAvailable: isFloraBlessingAvailable
  },
  [Blessing.POLLUTED_SEA]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "polluted_sea",
    grantsPokemonImmediately: false,
    isAvailable: isSynergyBlessingAvailable(Synergy.AQUATIC)
  },
  [Blessing.TIDAL_SURGE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "trident",
    grantsPokemonImmediately: true,
    isAvailable: isSynergyBlessingAvailable(Synergy.AQUATIC)
  },
  [Blessing.ATLANTEAN_MAGIC]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "water_magic",
    grantsPokemonImmediately: true,
    isAvailable: isSynergyBlessingAvailable(Synergy.WATER)
  },
  [Blessing.STAR_CROSSED_SEAS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "sea",
    grantsPokemonImmediately: false,
    isAvailable: isSynergyBlessingAvailable(Synergy.AMORPHOUS)
  },
  [Blessing.HEX_MANIAC]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "hex_maniac",
    grantsPokemonImmediately: true,
    isAvailable: isSynergyBlessingAvailable(Synergy.GHOST)
  },
  [Blessing.ABSOLUTE_DARKNESS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "absolute_darkness",
    grantsPokemonImmediately: true,
    isAvailable: isSynergyBlessingAvailable(Synergy.DARK)
  },
  [Blessing.TOXIC_BURST]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "toxic_burst",
    grantsPokemonImmediately: true,
    isAvailable: isSynergyBlessingAvailable(Synergy.POISON)
  },
  [Blessing.EXHAUSTING_FLAME]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "exhausting_flame",
    grantsPokemonImmediately: true,
    isAvailable: isSynergyBlessingAvailable(Synergy.FIRE)
  },
  [Blessing.ETERNAL_RAGE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "eternal_rage",
    grantsPokemonImmediately: true,
    isAvailable: isSynergyBlessingAvailable(Synergy.WILD)
  },
  [Blessing.WILD_SUBSCRIPTION]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "wild_subscription",
    grantsPokemonImmediately: false
  },
  [Blessing.CHOSEN_ONES]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "bat_mask",
    grantsPokemonImmediately: false
  },
  [Blessing.ADDITIONAL_RETHINK_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "backward_time",
    grantsPokemonImmediately: false
  },
  [Blessing.SAFARI_ENCOUNTER]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "high_grass",
    grantsPokemonImmediately: true
  },
  [Blessing.GYARODOS_TRES_QUATRO]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "fishing_pole",
    grantsPokemonImmediately: false
  },
  [Blessing.POTION]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [12],
    icon: "health_increase",
    grantsPokemonImmediately: false
  },
  [Blessing.POCKET_DAYCARE]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "wing_cloak",
    grantsPokemonImmediately: true
  },
  [Blessing.TRANSFORM]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "transform",
    grantsPokemonImmediately: true
  },
  [Blessing.TAXES]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "robber_hand",
    grantsPokemonImmediately: false
  },
  [Blessing.ROCKY_BEGINNINGS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "rock",
    grantsPokemonImmediately: true
  },
  [Blessing.BABYLESS]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [12],
    icon: "wing_cloak",
    grantsPokemonImmediately: false
  },
  [Blessing.HEATRANS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.RAYQUAZAS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.MEWS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.GROUDONS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.ARTICUNOS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.GIRATINAS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.KYOGRES_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "instrument",
    grantsPokemonImmediately: false
  }
}

const EARLY_BLESSING_TIER_CHANCES: { [tier in BlessingTier]: number } = {
  [BlessingTier.SILVER]: 0.6,
  [BlessingTier.GOLD]: 0.3,
  [BlessingTier.PRISMATIC]: 0.1
}

const LATE_BLESSING_TIER_CHANCES: { [tier in BlessingTier]: number } = {
  [BlessingTier.SILVER]: 0.35,
  [BlessingTier.GOLD]: 0.45,
  [BlessingTier.PRISMATIC]: 0.2
}

export const BlessingTierChanceByStage: {
  [stage: number]: { [tier in BlessingTier]: number }
} = {
  4: EARLY_BLESSING_TIER_CHANCES,
  12: LATE_BLESSING_TIER_CHANCES
}

export function rollBlessingTierForStage(stage: number): BlessingTier {
  const tierChances = BLESSING_TEST_MODE
    ? tierChancesForBlessingsUnderTest()
    : (BlessingTierChanceByStage[stage] ?? EARLY_BLESSING_TIER_CHANCES)
  return randomWeighted(tierChances) ?? BlessingTier.SILVER
}

function tierChancesForBlessingsUnderTest(): {
  [tier in BlessingTier]: number
} {
  const chances = {
    [BlessingTier.SILVER]: 0,
    [BlessingTier.GOLD]: 0,
    [BlessingTier.PRISMATIC]: 0
  }
  BLESSINGS_UNDER_TEST.forEach((blessing) => {
    chances[Blessings[blessing].tier] = 1
  })
  return chances
}

/* Test mode: propose only the blessings being worked on, at every selection
   stage, ignoring their availableAtStages. Tier odds are derived from the list
   so a tier with nothing in it is never rolled. Set to false to ship. */
export const BLESSING_TEST_MODE: boolean = false

const BLESSINGS_UNDER_TEST: Blessing[] = [
  Blessing.HEX_MANIAC,
  Blessing.ABSOLUTE_DARKNESS,
  Blessing.TOXIC_BURST,
  Blessing.EXHAUSTING_FLAME,
  Blessing.ETERNAL_RAGE
]

function countBlessingsOfFamily(blessings: Blessing[], family?: string) {
  if (!family) return 0
  return blessings.filter((blessing) => Blessings[blessing].family === family)
    .length
}

export function isFamilyCapReached(
  alreadyProposed: Blessing[],
  candidate: Blessing
) {
  const { family } = Blessings[candidate]
  if (!family) return false
  return (
    countBlessingsOfFamily(alreadyProposed, family) >=
    BLESSING_MAX_OPTIONS_PER_FAMILY
  )
}

export function drawBlessingOptions(
  pool: Blessing[],
  amount: number,
  alreadyProposed: Blessing[] = []
): Blessing[] {
  const remaining = shuffleArray([...pool])
  const drawn: Blessing[] = []
  while (drawn.length < amount && remaining.length > 0) {
    const candidate = remaining.pop()!
    if (isFamilyCapReached([...alreadyProposed, ...drawn], candidate)) continue
    drawn.push(candidate)
  }
  return drawn
}

export function getBlessingsAvailable(
  tier: BlessingTier,
  stage: number,
  player: Player
): Blessing[] {
  return (Object.keys(Blessings) as Blessing[]).filter((blessing) => {
    const definition = Blessings[blessing]
    return (
      definition.tier === tier &&
      (BLESSING_TEST_MODE === false ||
        BLESSINGS_UNDER_TEST.includes(blessing)) &&
      (BLESSING_TEST_MODE || definition.availableAtStages.includes(stage)) &&
      (definition.isAvailable?.(player, stage) ?? true)
    )
  })
}
