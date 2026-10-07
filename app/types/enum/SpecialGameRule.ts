import { Passive } from "./Passive"
import { Pkm } from "./Pokemon"
import { type TownEncounter, TownEncounters } from "./TownEncounter"

export enum SpecialGameRule {
  PLAY_TEST = "PLAY_TEST",
  EVERYONE_IS_HERE = "EVERYONE_IS_HERE",
  UNIQUE_STARTER = "UNIQUE_STARTER",
  OMELETTE_COOK = "OMELETTE_COOK",
  DITTO_PARTY = "DITTO_PARTY",
  GOTTA_CATCH_EM_ALL = "GOTTA_CATCH_EM_ALL",
  TECHNOLOGIC = "TECHNOLOGIC",
  CROWDED = "CROWDED",
  FREE_MARKET = "FREE_MARKET",
  SHINY_HUNTER = "SHINY_HUNTER",
  DO_IT_ALL_YOURSELF = "DO_IT_ALL_YOURSELF",
  FIRST_PARTNER = "FIRST_PARTNER",
  SLAMINGO = "SLAMINGO",
  BLOOD_MONEY = "BLOOD_MONEY",
  TOWN_FESTIVAL = "TOWN_FESTIVAL",
  HIGH_ROLLER = "HIGH_ROLLER",
  REGIONAL_SPECIALTIES = "REGIONAL_SPECIALTIES",
  GO_BIG_OR_GO_HOME = "GO_BIG_OR_GO_HOME",
  FAMILY_OUTING = "FAMILY_OUTING",
  UNOWN_SPELL = "UNOWN_SPELL",
  CHOSEN_ONES = "CHOSEN_ONES",
  HALLOWEEN = "HALLOWEEN",
  KAIJU_BATTLE = "KAIJU_BATTLE",
  AVATAR = "AVATAR",
  LIGHT_SHOW = "LIGHT_SHOW",
  SMEARGLE_PACK = "SMEARGLE_PACK",
  JUGGERNAUT = "JUGGERNAUT",
  OVERTIME = "OVERTIME",
  SIX_PACK = "SIX_PACK",
  EVOLUTION_LAB = "EVOLUTION_LAB",
  BAZAAR = "BAZAAR",
  QUEST_BOARD = "QUEST_BOARD",
  MISFITS = "MISFITS",
  MEGA_EVOLUTION = "MEGA_EVOLUTION"
}

export const RulesWithAllPokemonsAvailable: SpecialGameRule[] = [
  SpecialGameRule.EVERYONE_IS_HERE,
  SpecialGameRule.EVOLUTION_LAB
]

export const BAZAAR_SHOP_INTERVAL = 8
export const CHIMECHO_CAROUSEL_STAGE = 4
export const MISFITS_EXCLUDED_ENCOUNTERS: TownEncounter[] = [
  TownEncounters.ELECTIVIRE,
  TownEncounters.KECLEON,
  TownEncounters.SABLEYE
]

// Megas only appear through the Key Stone, except Mega Rayquaza, which keeps
// its Green Orb evolution in every game
export function isMegaEvolutionLocked(evolution: Pkm): boolean {
  return evolution.startsWith("MEGA_") && evolution !== Pkm.MEGA_RAYQUAZA
}

// passives whose only purpose is reaching a Mega Evolution
const MEGA_STACK_PASSIVES: Passive[] = [
  Passive.LATI_MEGA,
  Passive.DRAMPA_MEGA,
  Passive.ZYGARDE_MEGA,
  Passive.FLOETTE_ETERNAL,
  Passive.MANECTRIC,
  Passive.BANETTE,
  Passive.LUCARIO,
  Passive.ALTARIA,
  Passive.LOPUNNY,
  Passive.STEELIX,
  Passive.CAMERUPT,
  Passive.MEDICHAM,
  Passive.GARDEVOIR,
  Passive.GALLADE,
  Passive.TYRANITAR,
  Passive.GENGAR,
  Passive.ALAKAZAM,
  Passive.SLOWBRO,
  Passive.FERALIGATR,
  Passive.CHARIZARD,
  Passive.ZERAORA,
  Passive.DARKRAI,
  Passive.MAWILE,
  Passive.ABSOL,
  Passive.MEWTWO,
  Passive.DIANCIE,
  Passive.AERODACTYL,
  Passive.HOUNDOOM,
  Passive.SABLEYE,
  Passive.SKARMORY_PRE,
  Passive.DRAGALGE,
  Passive.EELEKTROSS,
  Passive.EXCADRILL
]

export function isMegaStackPassiveHidden(
  passive: Passive,
  evolution: Pkm | null
): boolean {
  return (
    MEGA_STACK_PASSIVES.includes(passive) &&
    isMegaEvolutionLocked(evolution ?? Pkm.DEFAULT)
  )
}
