import {
  Blessings,
  getBlessingSynergy
} from "../../../../../config/game/blessings"
import { Blessing } from "../../../../../types/enum/Blessing"
import { Synergy } from "../../../../../types/enum/Synergy"

const LABELS: Partial<Record<Blessing, string>> = {
  [Blessing.HEATRANS_SONG]: "HEAT",
  [Blessing.RAYQUAZAS_SONG]: "RAY",
  [Blessing.MEWS_SONG]: "MEW",
  [Blessing.GROUDONS_SONG]: "GROU",
  [Blessing.ARTICUNOS_SONG]: "ARTI",
  [Blessing.GIRATINAS_SONG]: "GIRA",
  [Blessing.KYOGRES_SONG]: "KYO",
  [Blessing.WOBBUFFETS_SILVER_PRIZE]: "S",
  [Blessing.WOBBUFFETS_GOLD_PRIZE]: "G",
  [Blessing.FREE_COUPON]: "FREE",
  [Blessing.CROAGUNKS_AID]: "AID",
  [Blessing.GOLDEN_TICKET]: "GOLD",
  [Blessing.QUEST_EVOLVE]: "EVO",
  [Blessing.QUEST_DESTROY]: "KO",
  [Blessing.QUEST_LEVEL_UP]: "LVL",
  [Blessing.QUEST_DIVERSIFY]: "DIV",
  [Blessing.QUEST_PROSPER]: "GOLD",
  [Blessing.BAG_OF_SWEETS]: "BAG",
  [Blessing.SWEET_SUBSCRIPTION]: "SUB",
  [Blessing.MORE_EQUAL_THAN_OTHERS]: "EQ",
  [Blessing.NUGGET]: "NUG",
  [Blessing.BERRY_POUCH]: "POUCH",
  [Blessing.MANIFESTATION_AP]: "AP",
  [Blessing.MANIFESTATION_AD]: "AD"
}

const NUMBERED_FAMILIES = new Set([
  "ITEMFINDER",
  "CINCCINOS_GIFTS",
  "SURGE",
  "DRILL",
  "SINGULARITY",
  "SHATTER",
  "MAGIC_SHIELD",
  "BRUTE_SHIELD",
  "SYNCHRONISED_SPEED",
  "GEAR_SHIELD",
  "REGIONAL_TREASURES",
  "TREASURE_HUNT",
  "MIX_AND_MATCH",
  "POTENTIAL_ENERGY",
  "ADDITIONAL_RETHINK"
])

export function getBlessingShortLabel(blessing: Blessing): string | undefined {
  if (LABELS[blessing]) return LABELS[blessing]
  const match = blessing.match(/^(.*)_(I|II|III)$/)
  return match && NUMBERED_FAMILIES.has(match[1]) ? match[2] : undefined
}

export function compareBlessingsBySynergy(a: Blessing, b: Blessing): number {
  const synergyOrder = Object.values(Synergy)
  const aSynergy = getBlessingSynergy(a)
  const bSynergy = getBlessingSynergy(b)
  const aFamily = Blessings[a].family ? 0 : 1
  const bFamily = Blessings[b].family ? 0 : 1
  if (aFamily !== bFamily) return aFamily - bFamily
  const aIndex = aSynergy ? synergyOrder.indexOf(aSynergy) : synergyOrder.length
  const bIndex = bSynergy ? synergyOrder.indexOf(bSynergy) : synergyOrder.length
  if (aIndex !== bIndex) return aIndex - bIndex

  const numberedPart = (blessing: Blessing) => {
    const match = blessing.match(/^(.*)_(I|II|III)$/)
    if (!match || !NUMBERED_FAMILIES.has(match[1])) return undefined
    return { family: match[1], numeral: match[2] }
  }
  const numeralOrder = { I: 1, II: 2, III: 3 }
  const aNumbered = numberedPart(a)
  const bNumbered = numberedPart(b)
  if (aNumbered && bNumbered) {
    const numeralComparison =
      numeralOrder[aNumbered.numeral] - numeralOrder[bNumbered.numeral]
    return numeralComparison || aNumbered.family.localeCompare(bNumbered.family)
  }
  if (aNumbered) return -1
  if (bNumbered) return 1
  return 0
}
