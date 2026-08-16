import { SynergyTiersThresholds } from "../../config"
import type Player from "../../models/colyseus-models/player"
import {
  BLESSING_SELECTION_STAGES,
  Blessing,
  BlessingTier,
  GREEDY_WISH_PRISMATIC_GOLD
} from "../../types/enum/Blessing"
import { DungeonPMDO } from "../../types/enum/Dungeon"
import { Rarity } from "../../types/enum/Game"
import { SpecialGameRule } from "../../types/enum/SpecialGameRule"
import { Synergy } from "../../types/enum/Synergy"
import { randomWeighted, shuffleArray } from "../../utils/random"
import { isWishFestivalFinale } from "./events"

export type BlessingFamily = "BADGE" | "CREST" | "CROWN"

export interface BlessingDefinition {
  tier: BlessingTier
  availableAtStages: number[]
  icon: string
  grantsPokemonImmediately: boolean
  synergy?: Synergy
  isAvailable?: (player: Player, stage: number) => boolean
  family?: BlessingFamily
}

/* Ponds are drawn with the region's own water tiles, so WATER_FOUNTAIN only
   works in regions whose water slot is painted as actual water. Picking it
   travels the player here, and every later region change is redirected here */
export const WATER_FOUNTAIN_REGIONS: DungeonPMDO[] = [
  DungeonPMDO.AmpPlains,
  DungeonPMDO.AppleWoods,
  DungeonPMDO.BeachCave,
  DungeonPMDO.BrineCave,
  DungeonPMDO.CraggyCoast,
  DungeonPMDO.CrystalCave1,
  DungeonPMDO.CrystalCrossing,
  DungeonPMDO.DeepLimestoneCavern,
  DungeonPMDO.DeepSealedRuin,
  DungeonPMDO.DesertRegion,
  DungeonPMDO.DrenchedBluff,
  DungeonPMDO.ElectricMaze,
  DungeonPMDO.FarAmpPlains,
  DungeonPMDO.FinalMaze2,
  DungeonPMDO.FoggyForest,
  DungeonPMDO.ForestPath,
  DungeonPMDO.FrostyForest,
  DungeonPMDO.GrassMaze,
  DungeonPMDO.GreatCanyon,
  DungeonPMDO.HiddenHighland,
  DungeonPMDO.HiddenLand,
  DungeonPMDO.HowlingForest1,
  DungeonPMDO.IceAegisCave,
  DungeonPMDO.JoyousTower,
  DungeonPMDO.LapisCave,
  DungeonPMDO.LightningField,
  DungeonPMDO.LimestoneCavern,
  DungeonPMDO.LushPrairie,
  DungeonPMDO.MeteorCave,
  DungeonPMDO.MiracleSea,
  DungeonPMDO.MtSteel2,
  DungeonPMDO.MtTravail,
  DungeonPMDO.NorthernDesert1,
  DungeonPMDO.NorthwindField,
  DungeonPMDO.PurityForest2,
  DungeonPMDO.PurityForest7,
  DungeonPMDO.RescueTeamMaze,
  DungeonPMDO.RockPathTDS,
  DungeonPMDO.SkyTower,
  DungeonPMDO.SouthernJungle,
  DungeonPMDO.StormySea1,
  DungeonPMDO.StormySea2,
  DungeonPMDO.TinyMeadow,
  DungeonPMDO.TinyWoods,
  DungeonPMDO.WaterMaze
]

export const BLESSING_MAX_OPTIONS_PER_FAMILY = 2
export const BLESSING_MAX_SYNERGY_OPTIONS_BEFORE_GATE = 3
export const BLESSING_MAX_SYNERGY_OPTIONS_AFTER_GATE = 2

// The gate: from this stage on, a synergy blessing needs that synergy active
export const BLESSING_SYNERGY_GATED_STAGE = 12

export function isSynergyActiveForPlayer(
  player: Pick<Player, "synergies">,
  synergy: Synergy
) {
  const threshold = SynergyTiersThresholds[synergy]?.[0]
  return (
    threshold !== undefined && (player.synergies.get(synergy) ?? 0) >= threshold
  )
}

function isSynergyRequirementMet(
  definition: BlessingDefinition,
  player: Player,
  stage: number
) {
  if (definition.synergy === undefined) return true
  return (
    stage < BLESSING_SYNERGY_GATED_STAGE ||
    isSynergyActiveForPlayer(player, definition.synergy)
  )
}

const areBlessingVariantsAvailable =
  (...variants: Blessing[]) =>
  (player: Player) =>
    variants.every((variant) => !player.blessings?.includes(variant))

// CRYSTAL_MUTATION awakens a rock unique, so it is pointless without one
const hasRockUnique = (player: Player) =>
  [...player.board.values()].some(
    (pokemon) =>
      pokemon.types.has(Synergy.ROCK) && pokemon.rarity === Rarity.UNIQUE
  )

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
        synergy,
        family
      }
    ])
  ) as { [blessing in Blessing]: BlessingDefinition }
}

export const Blessings: { [blessing in Blessing]: BlessingDefinition } = {
  ...synergyFamilyDefinitions("BADGE", BlessingTier.SILVER, "rank_one"),
  ...synergyFamilyDefinitions("CREST", BlessingTier.GOLD, "rank_two"),
  ...synergyFamilyDefinitions("CROWN", BlessingTier.PRISMATIC, "rank_three"),
  [Blessing.WOBBUFFETS_GOLD_PRIZE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "ticket",
    grantsPokemonImmediately: false
  },
  [Blessing.HARD_COMMIT]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "hard_commit",
    grantsPokemonImmediately: false
  },
  [Blessing.REGIONAL_TREASURES]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "regional_treasure",
    grantsPokemonImmediately: false
  },
  [Blessing.REGIONAL_TREASURES_II]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "regional_treasure",
    grantsPokemonImmediately: true
  },
  [Blessing.SYNARCH]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [12],
    icon: "synarch",
    grantsPokemonImmediately: false
  },
  [Blessing.FLEXIBILITY]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "flexible",
    grantsPokemonImmediately: false
  },
  [Blessing.RAINBOW_HOUR]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "rainbow_star",
    grantsPokemonImmediately: false
  },
  [Blessing.MANIFESTATION_AP]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "crystal_ball",
    grantsPokemonImmediately: true
  },
  [Blessing.MANIFESTATION_AD]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "crystal_ball",
    grantsPokemonImmediately: true
  },
  [Blessing.MIX_AND_MATCH_I]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "mix_match",
    grantsPokemonImmediately: true,
    /* filters the candidate rather than shrinking the pool, so a selection can
       still always fill 3 options */
    isAvailable: (player: Player) =>
      !player.blessings?.includes(Blessing.MIX_AND_MATCH_II)
  },
  [Blessing.MIX_AND_MATCH_II]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [12],
    icon: "mix_match",
    grantsPokemonImmediately: true
  },
  [Blessing.WAITING_GAME]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "waiting_game",
    grantsPokemonImmediately: false
  },
  [Blessing.PRISMATIC_REROLL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "slot_mashine",
    grantsPokemonImmediately: false
  },
  [Blessing.LUNCH_MONEY]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "lunch_money",
    grantsPokemonImmediately: false
  },
  [Blessing.CALCULATED_LOSS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "calculator",
    grantsPokemonImmediately: false
  },
  [Blessing.A_NEW_FRIEND]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "new_friend",
    grantsPokemonImmediately: true
  },
  [Blessing.BP_REWARDS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "bp_rewards",
    grantsPokemonImmediately: false
  },
  [Blessing.GREEDY_WISH]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "greedy_wish",
    grantsPokemonImmediately: false
  },
  [Blessing.CALLED_SHOT]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "called_shot",
    grantsPokemonImmediately: false,
    isAvailable: (player: Player) => player.streak <= 4
  },
  [Blessing.VAMPIRIC]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "vampiric",
    grantsPokemonImmediately: false
  },
  [Blessing.PROTECT_THE_WEAK]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "protect_the_weak",
    grantsPokemonImmediately: false
  },
  [Blessing.STURDY]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "sturdy",
    grantsPokemonImmediately: false
  },
  [Blessing.ALL_FOR_ONE]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [12],
    icon: "all_for_one",
    grantsPokemonImmediately: false
  },
  [Blessing.RAINBOW_KEY]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [12],
    icon: "rainbow_key",
    grantsPokemonImmediately: false
  },
  [Blessing.PLUSHIFY]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "plushify",
    grantsPokemonImmediately: false
  },
  [Blessing.SUPPORTIVE_SOUL]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "supportive_soul",
    grantsPokemonImmediately: false
  },
  [Blessing.LANCES_ACE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "lances_ace",
    grantsPokemonImmediately: false
  },
  [Blessing.PANIC_BUTTON]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "panic_button",
    grantsPokemonImmediately: true
  },
  [Blessing.HAIL_TO_THE_KING]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "hail_to_the_king",
    grantsPokemonImmediately: false
  },
  [Blessing.TRASH_TO_TREASURE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "trash_to_treasure",
    grantsPokemonImmediately: true
  },
  [Blessing.CHARGING_MY_BUG]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "car_battery",
    grantsPokemonImmediately: true
  },
  [Blessing.NEUROFORCE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "neuroforce",
    grantsPokemonImmediately: false
  },
  [Blessing.SINNOHS_COOLEST]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "starly_goggles",
    grantsPokemonImmediately: true
  },
  [Blessing.SWEET_TREATS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "sweet_treats",
    grantsPokemonImmediately: false
  },
  [Blessing.YOU_FORGOT_SOMETHING]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "bugle_call",
    grantsPokemonImmediately: false
  },
  [Blessing.THINK_FAST]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [12],
    icon: "infinity",
    grantsPokemonImmediately: false
  },
  [Blessing.WISE_SPENDING]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "ink_swirl",
    grantsPokemonImmediately: false
  },
  [Blessing.BIRTHDAY_PRESENT]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "stork_delivery",
    grantsPokemonImmediately: false
  },
  [Blessing.UP_IS_UP]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "caduceus",
    grantsPokemonImmediately: false
  },
  [Blessing.DROP_RATES]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "drop_rates",
    grantsPokemonImmediately: false
  },
  [Blessing.MORE_EQUAL_THAN_OTHERS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "cash",
    grantsPokemonImmediately: false
  },
  [Blessing.CLIMBING_THE_LADDER]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "book_aura",
    grantsPokemonImmediately: false
  },
  [Blessing.FREE_COUPON]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "ticket",
    grantsPokemonImmediately: false
  },
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
    grantsPokemonImmediately: true,
    synergy: Synergy.ELECTRIC
  },
  [Blessing.BURNING_SHARDS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "burning_shards",
    grantsPokemonImmediately: true,
    synergy: Synergy.FIRE
  },
  [Blessing.LASTING_EFFECTS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "lasting_effects",
    grantsPokemonImmediately: false
  },
  [Blessing.RIPPLING_EFFECTS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "rippling_effects",
    grantsPokemonImmediately: false
  },
  [Blessing.EXPLOIT]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "exploit",
    grantsPokemonImmediately: false
  },
  [Blessing.GUARD_FORMATION]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "guard_formation",
    grantsPokemonImmediately: false
  },
  [Blessing.BRAVE_FORMATION]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "brave_formation",
    grantsPokemonImmediately: false
  },
  [Blessing.TOUGH_FORMATION]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "tough_formation",
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
    icon: "bag_of_sweets",
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
    availableAtStages: [12],
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
    icon: "coin_pile",
    grantsPokemonImmediately: false
  },
  [Blessing.INSTANT_HYPER_ROLL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "instant_hyperoll",
    grantsPokemonImmediately: true
  },
  [Blessing.CINCCINOS_GIFTS_III]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "cinccino_bow",
    grantsPokemonImmediately: false
  },
  [Blessing.CINCCINOS_GIFTS_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "cinccino_bow",
    grantsPokemonImmediately: false
  },
  [Blessing.CINCCINOS_GIFTS_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "cinccino_bow",
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
    icon: "legendary_gambit",
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
    tier: BlessingTier.SILVER,
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
    tier: BlessingTier.SILVER,
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
    availableAtStages: [12],
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
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "ghost_spectre",
    grantsPokemonImmediately: false,
    synergy: Synergy.GHOST
  },
  [Blessing.ARCANE_METALS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "magnet_blast",
    grantsPokemonImmediately: true,
    synergy: Synergy.STEEL
  },
  [Blessing.VITAMINS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [12],
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
    availableAtStages: [12],
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
    synergy: Synergy.FLORA
  },
  [Blessing.DOUBLE_WINDFALL]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "double_windfall",
    grantsPokemonImmediately: true,
    synergy: Synergy.FLORA
  },
  [Blessing.AMAZING_GARDENING]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "water_tank",
    grantsPokemonImmediately: true,
    synergy: Synergy.FLORA
  },
  [Blessing.FLYTRAP]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "flytrap",
    grantsPokemonImmediately: true,
    synergy: Synergy.FLORA
  },
  [Blessing.MEGA_SOL]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "mega_sol",
    grantsPokemonImmediately: true,
    synergy: Synergy.FLORA
  },
  [Blessing.SPORE_CLOUDS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "spore_clouds",
    grantsPokemonImmediately: true,
    synergy: Synergy.FLORA
  },
  [Blessing.BLOSSOM_FESTIVAL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "flower_pot",
    grantsPokemonImmediately: false,
    synergy: Synergy.FLORA
  },
  [Blessing.NOT_THE_BEES]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "beehive",
    grantsPokemonImmediately: false,
    synergy: Synergy.FLORA
  },
  [Blessing.BABY_OPENER]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "nest_eggs",
    grantsPokemonImmediately: true
  },
  [Blessing.SELECTIVE_GENETICS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "dna_string",
    grantsPokemonImmediately: true,
    synergy: Synergy.BABY
  },
  [Blessing.REPLICATOR]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "computer_fan",
    grantsPokemonImmediately: true,
    synergy: Synergy.ARTIFICIAL
  },
  [Blessing.FIND_A_LOST_WAND]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "wizard_staff",
    grantsPokemonImmediately: true,
    synergy: Synergy.FAIRY,
    /* pointless before the FAIRY 2 wand choice has actually been resolved:
       there is no "wand not offered" until the roll has been made and picked */
    isAvailable: (player) =>
      isSynergyActiveForPlayer(player, Synergy.FAIRY) &&
      player.fairyWands.length > 0 &&
      player.choices.some((choice) => choice.type === "wand") === false
  },
  [Blessing.FAST_FOOD_DELIVERY]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "fridge",
    grantsPokemonImmediately: true,
    synergy: Synergy.GOURMET
  },
  [Blessing.CHEFS_GREED]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "ladle",
    grantsPokemonImmediately: true,
    synergy: Synergy.GOURMET
  },
  [Blessing.BERRY_BREAKFAST]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "berry_breakfast",
    grantsPokemonImmediately: true,
    synergy: Synergy.GRASS
  },
  [Blessing.GEM_RUSH]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "gold_mine",
    grantsPokemonImmediately: false,
    synergy: Synergy.GROUND
  },
  [Blessing.DIGGING_EQUIPMENT]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "dig_hole",
    grantsPokemonImmediately: true,
    synergy: Synergy.GROUND
  },
  [Blessing.CRYSTAL_MUTATION]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "crystal_growth",
    grantsPokemonImmediately: false,
    synergy: Synergy.ROCK,
    isAvailable: hasRockUnique
  },
  [Blessing.CRYSTAL_CLUSTERS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "crystal_shrine",
    grantsPokemonImmediately: true,
    synergy: Synergy.ROCK
  },
  [Blessing.BERSERKER_HORDES]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "berserker_hordes",
    grantsPokemonImmediately: false,
    synergy: Synergy.WILD
  },
  [Blessing.ECHO_CHAMBER]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "echo_chamber",
    grantsPokemonImmediately: true,
    synergy: Synergy.SOUND
  },
  [Blessing.LANGUAGE_BARRIER]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "omega",
    grantsPokemonImmediately: true,
    synergy: Synergy.PSYCHIC
  },
  [Blessing.MOVE_TUTOR]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "move_tutor",
    grantsPokemonImmediately: false,
    synergy: Synergy.HUMAN
  },
  [Blessing.ZAP]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "lightning_zap",
    grantsPokemonImmediately: true,
    synergy: Synergy.ELECTRIC
  },
  [Blessing.SEEING_TRIPLE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "triforce",
    grantsPokemonImmediately: true,
    synergy: Synergy.BUG
  },
  [Blessing.SACRIFICE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "sacrifice",
    grantsPokemonImmediately: true,
    synergy: Synergy.MONSTER
  },
  [Blessing.DRAGON_KING]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "dragon_king",
    grantsPokemonImmediately: true,
    synergy: Synergy.DRAGON
  },
  [Blessing.ASCENSION]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "ascension_angel",
    grantsPokemonImmediately: true,
    synergy: Synergy.LIGHT
  },
  [Blessing.SHARE_THE_SPOTLIGHT]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "double_light",
    grantsPokemonImmediately: false,
    synergy: Synergy.LIGHT
  },
  [Blessing.SLIPSTREAM]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "slipstream_wing",
    grantsPokemonImmediately: true,
    synergy: Synergy.FLYING
  },
  [Blessing.BIG_PECKS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "big_peck_letter",
    grantsPokemonImmediately: true,
    synergy: Synergy.FLYING
  },
  [Blessing.SHAPELESS_SYNERGIES]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "shapeless",
    grantsPokemonImmediately: true,
    synergy: Synergy.AMORPHOUS
  },
  [Blessing.ABNORMALITY]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "spread_shield",
    grantsPokemonImmediately: true,
    synergy: Synergy.NORMAL
  },
  [Blessing.WRAPPED_UP]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "up_shield",
    grantsPokemonImmediately: true,
    synergy: Synergy.NORMAL
  },
  [Blessing.BRACE_FOR_IMPACT]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "leather_vest",
    grantsPokemonImmediately: true,
    synergy: Synergy.FIGHTING
  },
  [Blessing.FROST_BARRIER]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "frost_barrier",
    grantsPokemonImmediately: true,
    synergy: Synergy.ICE
  },
  [Blessing.SECOND_WIND]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "second_wind",
    grantsPokemonImmediately: true,
    synergy: Synergy.FIELD
  },
  [Blessing.FIRST_WIND]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "first_wind",
    grantsPokemonImmediately: false
  },
  [Blessing.RESURGENCE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "resurgence",
    grantsPokemonImmediately: true,
    synergy: Synergy.FOSSIL
  },
  [Blessing.POLLUTED_SEA]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "polluted_sea",
    grantsPokemonImmediately: false,
    synergy: Synergy.AQUATIC
  },
  [Blessing.TIDAL_SURGE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "trident",
    grantsPokemonImmediately: false,
    synergy: Synergy.AQUATIC
  },
  [Blessing.MONSTER_KING]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "monster_king",
    grantsPokemonImmediately: false,
    synergy: Synergy.MONSTER
  },
  [Blessing.ADOPTION]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "adoption",
    grantsPokemonImmediately: false,
    synergy: Synergy.BABY
  },
  [Blessing.RAINBOW_DROPLET]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "rainbow_droplet",
    grantsPokemonImmediately: false,
    synergy: Synergy.AMORPHOUS
  },
  [Blessing.ARCHEOLOGY]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "archeology",
    grantsPokemonImmediately: false,
    synergy: Synergy.FOSSIL
  },
  [Blessing.LIMIT_BREAKER]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "limit_breaker",
    grantsPokemonImmediately: false,
    synergy: Synergy.DRAGON
  },
  [Blessing.CHAMPIONS_MASK]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "champions_mask",
    grantsPokemonImmediately: false,
    synergy: Synergy.FIGHTING
  },
  [Blessing.AUTO_CRAFTING]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "auto_crafting",
    grantsPokemonImmediately: false,
    synergy: Synergy.ARTIFICIAL
  },
  [Blessing.CENTER_STAGE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "center_stage",
    grantsPokemonImmediately: false,
    synergy: Synergy.SOUND
  },
  [Blessing.HIEROGLYPHS]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "hieroglyphs",
    grantsPokemonImmediately: false,
    synergy: Synergy.PSYCHIC
  },
  [Blessing.FURIOUS_FABRIC]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "furious_fabric",
    grantsPokemonImmediately: false,
    synergy: Synergy.NORMAL
  },
  [Blessing.GEM_HARVEST]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "gem_harvest",
    grantsPokemonImmediately: false,
    synergy: Synergy.ROCK
  },
  [Blessing.MAGNETOSPHERE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "magneto_sphere",
    grantsPokemonImmediately: false,
    synergy: Synergy.STEEL
  },
  [Blessing.MYSTOGAN]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "mystogan",
    grantsPokemonImmediately: false,
    synergy: Synergy.FAIRY
  },
  [Blessing.SHOW_OFF]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "show_off",
    grantsPokemonImmediately: false
  },
  [Blessing.FESTIVE_PICNIC]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "festive_picnic",
    grantsPokemonImmediately: false,
    synergy: Synergy.GOURMET
  },
  [Blessing.ICY_REFLECTION]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "icy_reflection",
    grantsPokemonImmediately: false,
    synergy: Synergy.ICE
  },
  [Blessing.BULL_LEAPING]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "bull_leaping",
    grantsPokemonImmediately: false,
    synergy: Synergy.FIELD
  },
  [Blessing.OVERLOAD]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "overload",
    grantsPokemonImmediately: false,
    synergy: Synergy.ELECTRIC
  },
  [Blessing.FOGBOUND_LAKE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "fogbound_lake",
    grantsPokemonImmediately: false,
    synergy: Synergy.BUG
  },
  [Blessing.TIDAL_GUARDIAN]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "tidal_guardian",
    grantsPokemonImmediately: false,
    synergy: Synergy.AQUATIC
  },
  [Blessing.GRUDGE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "grudge",
    grantsPokemonImmediately: false,
    synergy: Synergy.GHOST
  },
  [Blessing.SOUL_BLAZE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "soul_blaze",
    grantsPokemonImmediately: false,
    synergy: Synergy.FIRE
  },
  [Blessing.FERTILE_SOIL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "fertile_soil",
    grantsPokemonImmediately: false,
    synergy: Synergy.GROUND
  },
  [Blessing.DEEP_WOUNDS]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "deep_wounds",
    grantsPokemonImmediately: false,
    synergy: Synergy.DARK
  },
  [Blessing.FAST_DELIVERY]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "fast_delivery",
    grantsPokemonImmediately: false,
    synergy: Synergy.FLYING
  },
  [Blessing.MOLECULAR_CORROSION]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "molecular_corrosion",
    grantsPokemonImmediately: false,
    synergy: Synergy.POISON
  },
  [Blessing.UNISON]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "unison",
    grantsPokemonImmediately: false,
    synergy: Synergy.HUMAN
  },
  [Blessing.BERRY_GROWTH]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "berry_growth",
    grantsPokemonImmediately: false,
    synergy: Synergy.GRASS
  },
  [Blessing.WATER_FOUNTAIN]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "water_fountain",
    grantsPokemonImmediately: false,
    synergy: Synergy.WATER,
    isAvailable: (player) =>
      player.specialGameRule !== SpecialGameRule.LIGHT_SHOW
  },
  [Blessing.ATLANTEAN_MAGIC]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "water_magic",
    grantsPokemonImmediately: true,
    synergy: Synergy.WATER
  },
  [Blessing.STAR_CROSSED_SEAS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "sea",
    grantsPokemonImmediately: false,
    synergy: Synergy.AMORPHOUS
  },
  [Blessing.HEX_MANIAC]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "hex_maniac",
    grantsPokemonImmediately: true,
    synergy: Synergy.GHOST
  },
  [Blessing.ABSOLUTE_DARKNESS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "absolute_darkness",
    grantsPokemonImmediately: true,
    synergy: Synergy.DARK
  },
  [Blessing.TOXIC_BURST]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "toxic_burst",
    grantsPokemonImmediately: true,
    synergy: Synergy.POISON
  },
  [Blessing.EXHAUSTING_FLAME]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "exhausting_flame",
    grantsPokemonImmediately: true,
    synergy: Synergy.FIRE
  },
  [Blessing.ETERNAL_RAGE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "eternal_rage",
    grantsPokemonImmediately: true,
    synergy: Synergy.WILD
  },
  [Blessing.WILD_SUBSCRIPTION]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "wild_subscription",
    grantsPokemonImmediately: false,
    synergy: Synergy.WILD
  },
  [Blessing.CHOSEN_ONES]: {
    tier: BlessingTier.PRISMATIC,
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
  [Blessing.ADDITIONAL_RETHINK_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "backward_time",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_EVOLVE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "tied_scroll",
    grantsPokemonImmediately: true
  },
  [Blessing.QUEST_DESTROY]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "tied_scroll",
    grantsPokemonImmediately: true
  },
  [Blessing.QUEST_LEVEL_UP]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "tied_scroll",
    grantsPokemonImmediately: true
  },
  [Blessing.QUEST_DIVERSIFY]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "tied_scroll",
    grantsPokemonImmediately: true
  },
  [Blessing.QUEST_PROSPER]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "tied_scroll",
    grantsPokemonImmediately: true
  },
  [Blessing.QUEST_INDECISION]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "indecision_quest",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_CRIT]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [5],
    icon: "crit_quest",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_ABSORB]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "absorb_quest",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_REVIVE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "revive_quest",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_PILLAGE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "pillage_quest",
    grantsPokemonImmediately: false
  },
  [Blessing.QUEST_EVOLVE_II]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "evolve_two_quest",
    grantsPokemonImmediately: true
  },
  [Blessing.IMPENDING_DOOM]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "impending_doom",
    grantsPokemonImmediately: true
  },
  [Blessing.SYNCHRONICITY]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "synchronicity",
    grantsPokemonImmediately: false
  },
  [Blessing.STARTER_CHOICE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "starter_choice",
    grantsPokemonImmediately: true
  },
  [Blessing.SINGULARITY_I]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "singular_ring",
    grantsPokemonImmediately: false
  },
  [Blessing.SINGULARITY_II]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "singular_ring",
    grantsPokemonImmediately: false
  },
  [Blessing.CURSE_OF_CORAL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [12],
    icon: "coral",
    grantsPokemonImmediately: true
  },
  [Blessing.TEMPLE_OF_LANGUAGE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4, 12],
    icon: "shiny_omega",
    grantsPokemonImmediately: false
  },
  [Blessing.TREASURE_TRAIL]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "mole",
    grantsPokemonImmediately: false
  },
  [Blessing.TRAINING_MONTAGE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "training_montage",
    grantsPokemonImmediately: false
  },
  [Blessing.ALL_FOURS]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [12],
    icon: "all_four",
    grantsPokemonImmediately: false
  },
  [Blessing.BEING_OF_KNOWLEDGE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [12],
    icon: "egypt_eye",
    grantsPokemonImmediately: true
  },
  [Blessing.HYPER_HYPER_ROLL]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [12],
    icon: "hyper_hyper_roll",
    grantsPokemonImmediately: false
  },
  [Blessing.BEAUTY_CONTEST]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "beauty_contest",
    grantsPokemonImmediately: false,
    synergy: Synergy.WATER
  },
  [Blessing.QUICK_CLAW]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4, 12],
    icon: "claw",
    grantsPokemonImmediately: false
  },
  [Blessing.COLOUR_CHANGE]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [4],
    icon: "colour_change",
    grantsPokemonImmediately: false
  },
  [Blessing.AZURE_FLUTE]: {
    tier: BlessingTier.SILVER,
    availableAtStages: [12],
    icon: "azure_flute",
    grantsPokemonImmediately: false
  },
  [Blessing.SAFARI_ENCOUNTER]: {
    tier: BlessingTier.SILVER,
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
  [Blessing.OLIVE_GARDEN]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "olive_garden",
    grantsPokemonImmediately: true
  },
  [Blessing.ORBITAL_STRIKE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "orbital_strike",
    grantsPokemonImmediately: true
  },
  [Blessing.ROOSTING_FLOCK]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "roosting_flock",
    grantsPokemonImmediately: true
  },
  [Blessing.SHELL_ARMOR_BLESSING]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "turtle_shell",
    grantsPokemonImmediately: true
  },
  [Blessing.SOUL_DRAIN]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "soul_drain",
    grantsPokemonImmediately: true
  },
  [Blessing.FLOWER_QUEEN]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "flower_queen",
    grantsPokemonImmediately: true
  },
  [Blessing.LEAF_TORNADO]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "leaf_tornado",
    grantsPokemonImmediately: true
  },
  [Blessing.MARIACHI_MAYHEM]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "mariachi_mayhem",
    grantsPokemonImmediately: true
  },
  [Blessing.ICEBREAKER]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "ice_breaker",
    grantsPokemonImmediately: true
  },
  [Blessing.RAMPAGE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "rampage",
    grantsPokemonImmediately: true
  },
  [Blessing.AXE_BLAST]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "axe_blast",
    grantsPokemonImmediately: true
  },
  [Blessing.SNIFFER_DOG]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "sniffer_dog",
    grantsPokemonImmediately: true
  },
  [Blessing.JESTER]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "jester",
    grantsPokemonImmediately: true
  },
  [Blessing.TOXIC_RESONANCE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "toxic_resonance",
    grantsPokemonImmediately: true
  },
  [Blessing.GRAND_IGNITION]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "grand_ignition",
    grantsPokemonImmediately: true
  },
  [Blessing.VALOR]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [4],
    icon: "valor",
    grantsPokemonImmediately: true
  },
  [Blessing.COLONY]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "colony",
    grantsPokemonImmediately: true
  },
  [Blessing.SAND_BUDDIES]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [4],
    icon: "sand_buddies",
    grantsPokemonImmediately: true
  },
  [Blessing.FROST_BURST]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "frost_burst",
    grantsPokemonImmediately: true
  },
  [Blessing.AURORA_BOREALIS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "aurora_borealis",
    grantsPokemonImmediately: true
  },
  [Blessing.RADIANCE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "radiance",
    grantsPokemonImmediately: true
  },
  [Blessing.PACK_ATTACK]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "pack_attack",
    grantsPokemonImmediately: true
  },
  [Blessing.MORTAR_SHELLS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "mortar_shells",
    grantsPokemonImmediately: true
  },
  [Blessing.ICE_SPEAR]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "ice_spear",
    grantsPokemonImmediately: true
  },
  [Blessing.FROST_GEAR]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "frost_gear",
    grantsPokemonImmediately: true
  },
  [Blessing.SHUTTLE_BUS]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "shuttle_bus",
    grantsPokemonImmediately: true
  },
  [Blessing.PLUNDER]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "plunder",
    grantsPokemonImmediately: true
  },
  [Blessing.EMERALD_ORB]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "emerald_orb",
    grantsPokemonImmediately: false
  },
  [Blessing.SAPPHIRE_ORB]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "sapphire_orb",
    grantsPokemonImmediately: false
  },
  [Blessing.RUBY_ORB]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "ruby_orb",
    grantsPokemonImmediately: false
  },
  [Blessing.BURNING_FORCE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "burning_force",
    grantsPokemonImmediately: false
  },
  [Blessing.SPIKY_GUARD]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "spiky_guard",
    grantsPokemonImmediately: false
  },
  [Blessing.DRILL_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "drill",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.DRILL_I,
      Blessing.DRILL_II
    )
  },
  [Blessing.DRILL_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "drill",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.DRILL_I,
      Blessing.DRILL_II
    )
  },
  [Blessing.SHATTER_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "shatter",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.SHATTER_I,
      Blessing.SHATTER_II
    )
  },
  [Blessing.SHATTER_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "shatter",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.SHATTER_I,
      Blessing.SHATTER_II
    )
  },
  [Blessing.SURGE_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "surge",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.SURGE_I,
      Blessing.SURGE_II
    )
  },
  [Blessing.SURGE_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "surge",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.SURGE_I,
      Blessing.SURGE_II
    )
  },
  [Blessing.CRITICAL_RUSH_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "critical_rush",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.CRITICAL_RUSH_I,
      Blessing.CRITICAL_RUSH_II
    )
  },
  [Blessing.CRITICAL_RUSH_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "critical_rush",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.CRITICAL_RUSH_I,
      Blessing.CRITICAL_RUSH_II
    )
  },
  [Blessing.CRITICAL_PATH_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "critical_path",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.CRITICAL_PATH_I,
      Blessing.CRITICAL_PATH_II
    )
  },
  [Blessing.CRITICAL_PATH_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "critical_path",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.CRITICAL_PATH_I,
      Blessing.CRITICAL_PATH_II
    )
  },
  [Blessing.PULSE_SHIELD_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "pulse_shield",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.PULSE_SHIELD_I,
      Blessing.PULSE_SHIELD_II
    )
  },
  [Blessing.PULSE_SHIELD_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "pulse_shield",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.PULSE_SHIELD_I,
      Blessing.PULSE_SHIELD_II
    )
  },
  [Blessing.MINIMALIST_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "minimalist",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.MINIMALIST_I,
      Blessing.MINIMALIST_II
    )
  },
  [Blessing.MINIMALIST_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "minimalist",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.MINIMALIST_I,
      Blessing.MINIMALIST_II
    )
  },
  [Blessing.GEAR_SHIELD_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "gear_shield",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.GEAR_SHIELD_I,
      Blessing.GEAR_SHIELD_II
    )
  },
  [Blessing.GEAR_SHIELD_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "gear_shield",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.GEAR_SHIELD_I,
      Blessing.GEAR_SHIELD_II
    )
  },
  [Blessing.MAGIC_SHIELD_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "magic_shield",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.MAGIC_SHIELD_I,
      Blessing.MAGIC_SHIELD_II
    )
  },
  [Blessing.MAGIC_SHIELD_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "magic_shield",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.MAGIC_SHIELD_I,
      Blessing.MAGIC_SHIELD_II
    )
  },
  [Blessing.BRUTE_SHIELD_I]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "brute_shield",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.BRUTE_SHIELD_I,
      Blessing.BRUTE_SHIELD_II
    )
  },
  [Blessing.BRUTE_SHIELD_II]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "brute_shield",
    grantsPokemonImmediately: false,
    isAvailable: areBlessingVariantsAvailable(
      Blessing.BRUTE_SHIELD_I,
      Blessing.BRUTE_SHIELD_II
    )
  },
  [Blessing.STAR_GUARD]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "star_guard",
    grantsPokemonImmediately: false
  },
  [Blessing.MACHINE_RESIDUE]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "machine_residue",
    grantsPokemonImmediately: true,
    synergy: Synergy.ARTIFICIAL
  },
  [Blessing.CALCULATED_OFFENCE]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "calculated_offence",
    grantsPokemonImmediately: false
  },
  [Blessing.ROBIN_GEMS]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "robin_gems",
    grantsPokemonImmediately: false
  },
  [Blessing.LUCKY_DICE_BLESSING]: {
    tier: BlessingTier.GOLD,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "lucky_dice_wand",
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
    icon: "egg",
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
    grantsPokemonImmediately: true,
    synergy: Synergy.ROCK
  },
  [Blessing.BABYLESS]: {
    tier: BlessingTier.PRISMATIC,
    availableAtStages: [12],
    icon: "wing_cloak",
    grantsPokemonImmediately: false
  },
  [Blessing.HEATRANS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.RAYQUAZAS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.MEWS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.GROUDONS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.ARTICUNOS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.GIRATINAS_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "instrument",
    grantsPokemonImmediately: false
  },
  [Blessing.KYOGRES_SONG]: {
    tier: BlessingTier.GOLD,
    availableAtStages: [12],
    icon: "instrument",
    grantsPokemonImmediately: false
  }
}

const EARLY_BLESSING_TIER_CHANCES: { [tier in BlessingTier]: number } = {
  [BlessingTier.SILVER]: 0.3,
  [BlessingTier.GOLD]: 0.6,
  [BlessingTier.PRISMATIC]: 0.1
}

const LATE_BLESSING_TIER_CHANCES: { [tier in BlessingTier]: number } = {
  [BlessingTier.SILVER]: 0.15,
  [BlessingTier.GOLD]: 0.65,
  [BlessingTier.PRISMATIC]: 0.2
}

const WISH_FESTIVAL_FINALE_TIER_CHANCES: {
  [stage: number]: { [tier in BlessingTier]: number }
} = {
  4: {
    [BlessingTier.SILVER]: 0.1,
    [BlessingTier.GOLD]: 0.2,
    [BlessingTier.PRISMATIC]: 0.7
  },
  12: {
    [BlessingTier.SILVER]: 0.1,
    [BlessingTier.GOLD]: 0.5,
    [BlessingTier.PRISMATIC]: 0.4
  }
}

export const BlessingTierChanceByStage: {
  [stage: number]: { [tier in BlessingTier]: number }
} = {
  4: EARLY_BLESSING_TIER_CHANCES,
  12: LATE_BLESSING_TIER_CHANCES
}

export function rollBlessingTierForStage(
  stage: number,
  blessingsUnderTest: Blessing[] = []
): BlessingTier {
  /* sandbox mode wants the real odds across the whole set, so only the
     under-test list derives its own */
  const baseTierChances =
    blessingsUnderTest.length > 0 && !BLESSING_SANDBOX_MODE
      ? tierChancesForBlessingsUnderTest(blessingsUnderTest)
      : (BlessingTierChanceByStage[stage] ?? EARLY_BLESSING_TIER_CHANCES)
  const tierChances =
    isWishFestivalFinale() &&
    (blessingsUnderTest.length === 0 || BLESSING_SANDBOX_MODE)
      ? (WISH_FESTIVAL_FINALE_TIER_CHANCES[stage] ?? baseTierChances)
      : baseTierChances
  return randomWeighted(tierChances) ?? BlessingTier.SILVER
}

/* the tier a pending wish would upgrade to, without spending it */
export function peekGreedyWishTier(
  player: Player,
  tier: BlessingTier
): BlessingTier {
  if (!player.greedyWishPending) return tier
  if (tier === BlessingTier.SILVER) return BlessingTier.GOLD
  return BlessingTier.PRISMATIC
}

/* called once the selection is certain to be offered, so a wish is never spent
   on a tier that turns out to have nothing left to propose */
export function consumeGreedyWishTier(
  player: Player,
  tier: BlessingTier
): BlessingTier {
  if (!player.greedyWishPending) return tier
  const upgradedTier = peekGreedyWishTier(player, tier)
  player.greedyWishPending = false
  if (tier === BlessingTier.PRISMATIC) {
    player.addBlessingGold(GREEDY_WISH_PRISMATIC_GOLD)
  }
  return upgradedTier
}

function tierChancesForBlessingsUnderTest(blessingsUnderTest: Blessing[]): {
  [tier in BlessingTier]: number
} {
  const chances = {
    [BlessingTier.SILVER]: 0,
    [BlessingTier.GOLD]: 0,
    [BlessingTier.PRISMATIC]: 0
  }
  blessingsUnderTest.forEach((blessing) => {
    chances[Blessings[blessing].tier] = 1
  })
  return chances
}

export const BLESSING_SANDBOX_MODE: boolean = false

function isFamilyCapReached(alreadyDrawn: Blessing[], candidate: Blessing) {
  const { family } = Blessings[candidate]
  if (family === undefined) return false
  return (
    alreadyDrawn.filter((blessing) => Blessings[blessing].family === family)
      .length >= BLESSING_MAX_OPTIONS_PER_FAMILY
  )
}

export function getBlessingSynergy(blessing: Blessing): Synergy | undefined {
  return Blessings[blessing].synergy
}

function isSynergyRelatedBlessing(blessing: Blessing): boolean {
  return getBlessingSynergy(blessing) !== undefined
}

function isSynergyOptionCapReached(
  alreadyDrawn: Blessing[],
  candidate: Blessing,
  maxSynergyOptions: number
) {
  if (!isSynergyRelatedBlessing(candidate)) return false
  return (
    alreadyDrawn.filter(isSynergyRelatedBlessing).length >= maxSynergyOptions
  )
}

export function getMaxSynergyBlessingOptions(stage: number) {
  return stage >= BLESSING_SYNERGY_GATED_STAGE
    ? BLESSING_MAX_SYNERGY_OPTIONS_AFTER_GATE
    : BLESSING_MAX_SYNERGY_OPTIONS_BEFORE_GATE
}

export function drawBlessingOptions(
  pool: Blessing[],
  amount: number,
  maxSynergyOptions: number
): Blessing[] {
  const remaining = shuffleArray([...pool])
  const drawn: Blessing[] = []
  while (drawn.length < amount && remaining.length > 0) {
    const candidate = remaining.pop()!
    if (isFamilyCapReached(drawn, candidate)) continue
    if (isSynergyOptionCapReached(drawn, candidate, maxSynergyOptions)) continue
    drawn.push(candidate)
  }
  return drawn
}

export function getBlessingsAvailable(
  tier: BlessingTier,
  stage: number,
  player: Player,
  blessingsUnderTest: Blessing[] = []
): Blessing[] {
  const isTesting = blessingsUnderTest.length > 0
  return (Object.keys(Blessings) as Blessing[]).filter((blessing) => {
    const definition = Blessings[blessing]
    return (
      definition.tier === tier &&
      player.blessings?.includes(blessing) !== true &&
      (isTesting === false ||
        BLESSING_SANDBOX_MODE ||
        blessingsUnderTest.includes(blessing)) &&
      (isTesting ||
        BLESSING_SANDBOX_MODE ||
        definition.availableAtStages.includes(stage)) &&
      isSynergyRequirementMet(definition, player, stage) &&
      (definition.isAvailable?.(player, stage) ?? true)
    )
  })
}
