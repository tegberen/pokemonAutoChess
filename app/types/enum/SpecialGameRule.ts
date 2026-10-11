import { Passive } from "./Passive"
import { Pkm } from "./Pokemon"
import { type TownEncounter, TownEncounters } from "./TownEncounter"

export enum SpecialGameRule {
  OMELETTE_COOK = "OMELETTE_COOK",
  TECHNOLOGIC = "TECHNOLOGIC",
  FREE_MARKET = "FREE_MARKET",
  SHINY_HUNTER = "SHINY_HUNTER",
  TOWN_FESTIVAL = "TOWN_FESTIVAL",
  FAMILY_OUTING = "FAMILY_OUTING",
  CHOSEN_ONES = "CHOSEN_ONES",
  AVATAR = "AVATAR",
  LIGHT_SHOW = "LIGHT_SHOW",
  SMEARGLE_PACK = "SMEARGLE_PACK",
  JUGGERNAUT = "JUGGERNAUT",
  SIX_PACK = "SIX_PACK",
  EVOLUTION_LAB = "EVOLUTION_LAB",
  BAZAAR = "BAZAAR",
  QUEST_BOARD = "QUEST_BOARD",
  MISFITS = "MISFITS",
  MEGA_EVOLUTION = "MEGA_EVOLUTION"
}

export const RulesWithAllPokemonsAvailable: SpecialGameRule[] = [
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
