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

const THEMED_SYNERGIES: Partial<Record<Blessing, Synergy>> = {
  [Blessing.CRYSTAL_MUTATION]: Synergy.ROCK,
  [Blessing.MACHINE_RESIDUE]: Synergy.ARTIFICIAL,
  [Blessing.ARCANE_METALS]: Synergy.STEEL,
  [Blessing.CURSE_OF_TWO]: Synergy.GHOST,
  [Blessing.FIND_A_LOST_WAND]: Synergy.FAIRY,
  [Blessing.ABNORMALITY]: Synergy.NORMAL,
  [Blessing.ROCKY_BEGINNINGS]: Synergy.ROCK,
  [Blessing.GEM_RUSH]: Synergy.GROUND,
  [Blessing.GARDENING]: Synergy.FLORA,
  [Blessing.FAST_FOOD_DELIVERY]: Synergy.GOURMET,
  [Blessing.WILD_SUBSCRIPTION]: Synergy.WILD,
  [Blessing.REPLICATOR]: Synergy.ARTIFICIAL,
  [Blessing.AMAZING_GARDENING]: Synergy.FLORA,
  [Blessing.BLOSSOM_FESTIVAL]: Synergy.FLORA,
  [Blessing.SELECTIVE_GENETICS]: Synergy.BABY,
  [Blessing.CHEFS_GREED]: Synergy.GOURMET,
  [Blessing.BERRY_BREAKFAST]: Synergy.GRASS,
  [Blessing.DIGGING_EQUIPMENT]: Synergy.GROUND,
  [Blessing.CRYSTAL_CLUSTERS]: Synergy.ROCK,
  [Blessing.BERSERKER_HORDES]: Synergy.WILD,
  [Blessing.ECHO_CHAMBER]: Synergy.SOUND,
  [Blessing.LANGUAGE_BARRIER]: Synergy.PSYCHIC,
  [Blessing.MOVE_TUTOR]: Synergy.HUMAN,
  [Blessing.ZAP]: Synergy.ELECTRIC,
  [Blessing.SEEING_TRIPLE]: Synergy.BUG,
  [Blessing.SACRIFICE]: Synergy.MONSTER,
  [Blessing.DRAGON_KING]: Synergy.DRAGON,
  [Blessing.ASCENSION]: Synergy.LIGHT,
  [Blessing.SHARE_THE_SPOTLIGHT]: Synergy.LIGHT,
  [Blessing.SLIPSTREAM]: Synergy.FLYING,
  [Blessing.BIG_PECKS]: Synergy.FLYING,
  [Blessing.SHAPELESS_SYNERGIES]: Synergy.AMORPHOUS,
  [Blessing.WRAPPED_UP]: Synergy.NORMAL,
  [Blessing.BRACE_FOR_IMPACT]: Synergy.FIGHTING,
  [Blessing.FROST_BARRIER]: Synergy.ICE,
  [Blessing.SECOND_WIND]: Synergy.FIELD,
  [Blessing.RESURGENCE]: Synergy.FOSSIL,
  [Blessing.TIDAL_SURGE]: Synergy.AQUATIC,
  [Blessing.MONSTER_KING]: Synergy.MONSTER,
  [Blessing.ADOPTION]: Synergy.BABY,
  [Blessing.RAINBOW_DROPLET]: Synergy.AMORPHOUS,
  [Blessing.ARCHEOLOGY]: Synergy.FOSSIL,
  [Blessing.LIMIT_BREAKER]: Synergy.DRAGON,
  [Blessing.CHAMPIONS_MASK]: Synergy.FIGHTING,
  [Blessing.AUTO_CRAFTING]: Synergy.ARTIFICIAL,
  [Blessing.CENTER_STAGE]: Synergy.SOUND,
  [Blessing.HIEROGLYPHS]: Synergy.PSYCHIC,
  [Blessing.FURIOUS_FABRIC]: Synergy.NORMAL,
  [Blessing.GEM_HARVEST]: Synergy.ROCK,
  [Blessing.MAGNETOSPHERE]: Synergy.STEEL,
  [Blessing.MYSTOGAN]: Synergy.FAIRY,
  [Blessing.FESTIVE_PICNIC]: Synergy.GOURMET,
  [Blessing.ICY_REFLECTION]: Synergy.ICE,
  [Blessing.BULL_LEAPING]: Synergy.FIELD,
  [Blessing.OVERLOAD]: Synergy.ELECTRIC,
  [Blessing.FOGBOUND_LAKE]: Synergy.BUG,
  [Blessing.TIDAL_GUARDIAN]: Synergy.AQUATIC,
  [Blessing.GRUDGE]: Synergy.GHOST,
  [Blessing.SOUL_BLAZE]: Synergy.FIRE,
  [Blessing.FERTILE_SOIL]: Synergy.GROUND,
  [Blessing.DEEP_WOUNDS]: Synergy.DARK,
  [Blessing.FAST_DELIVERY]: Synergy.FLYING,
  [Blessing.MOLECULAR_CORROSION]: Synergy.POISON,
  [Blessing.UNISON]: Synergy.HUMAN,
  [Blessing.BERRY_GROWTH]: Synergy.GRASS,
  [Blessing.WATER_FOUNTAIN]: Synergy.WATER,
  [Blessing.ATLANTEAN_MAGIC]: Synergy.WATER,
  [Blessing.HEX_MANIAC]: Synergy.GHOST,
  [Blessing.ABSOLUTE_DARKNESS]: Synergy.DARK,
  [Blessing.TOXIC_BURST]: Synergy.POISON,
  [Blessing.EXHAUSTING_FLAME]: Synergy.FIRE,
  [Blessing.ETERNAL_RAGE]: Synergy.WILD
}

export function getBlessingShortLabel(blessing: Blessing): string | undefined {
  if (LABELS[blessing]) return LABELS[blessing]
  const match = blessing.match(/^(.*)_(I|II|III)$/)
  return match && NUMBERED_FAMILIES.has(match[1]) ? match[2] : undefined
}

export function getBlessingSynergy(blessing: Blessing): Synergy | undefined {
  if (THEMED_SYNERGIES[blessing]) return THEMED_SYNERGIES[blessing]
  const suffix = blessing.match(/_(BADGE|CREST|CROWN)_BLESSING$/)
  if (!suffix) return undefined
  const synergy = blessing.slice(0, -suffix[0].length) as Synergy
  return Object.values(Synergy).includes(synergy) ? synergy : undefined
}

export function compareBlessingsBySynergy(a: Blessing, b: Blessing): number {
  const synergyOrder = Object.values(Synergy)
  const aSynergy = getBlessingSynergy(a)
  const bSynergy = getBlessingSynergy(b)
  const aFamily = /_(BADGE|CREST|CROWN)_BLESSING$/.test(a) ? 0 : 1
  const bFamily = /_(BADGE|CREST|CROWN)_BLESSING$/.test(b) ? 0 : 1
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
