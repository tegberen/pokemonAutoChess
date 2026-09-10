import { Rarity } from "../../types/enum/Game"
import { Pkm } from "../../types/enum/Pokemon"
import type { TownEncounter } from "../../types/enum/TownEncounter"
import { randomBetween, randomWeighted } from "../../utils/random"

export const TownEncounterSellPrice: { [encounter in TownEncounter]?: number } =
  {
    [Pkm.CHANSEY]: 7,
    [Pkm.KECLEON]: 10,
    [Pkm.KANGASKHAN]: 10,
    [Pkm.ELECTIVIRE]: 10
  }

export const TownEncountersByStage: {
  [stageLevel: number]: { [encounter in TownEncounter]?: number }
} = {
  4: {
    [Pkm.WIGGLYTUFF]: 1 / 20,
    [Pkm.CHANSEY]: 1 / 20,
    [Pkm.MEOWTH]: 1 / 20,
    [Pkm.DUSKULL]: 1 / 20,
    [Pkm.CINCCINO]: 1 / 20,
    [Pkm.MAROWAK]: 1 / 20,
    [Pkm.MAKUHITA]: 1 / 20,
    [Pkm.MAGNEZONE]: 1 / 40,
    [Pkm.LAPRAS]: 1 / 20,
    [Pkm.CASTFORM]: 1 / 20,
    [Pkm.CHIMECHO]: 1 / 10,
    [Pkm.BIDOOF]: 1 / 20
  },
  12: {
    [Pkm.KANGASKHAN]: 1 / 20,
    [Pkm.WOBBUFFET]: 1 / 20,
    [Pkm.KECLEON]: 1 / 20,
    [Pkm.ELECTIVIRE]: 1 / 20,
    [Pkm.XATU]: 1 / 20,
    [Pkm.CINCCINO]: 1 / 20,
    [Pkm.MAROWAK]: 1 / 20,
    [Pkm.SABLEYE]: 1 / 20,
    [Pkm.MAKUHITA]: 1 / 20,
    [Pkm.CELEBI]: 1 / 40,
    [Pkm.CASTFORM]: 1 / 20
  },
  17: {
    [Pkm.WOBBUFFET]: 1 / 20,
    [Pkm.CROAGUNK]: 1 / 20,
    [Pkm.ELECTIVIRE]: 1 / 20,
    [Pkm.LUDICOLO]: 1 / 20,
    [Pkm.XATU]: 1 / 20,
    [Pkm.MAROWAK]: 1 / 20,
    [Pkm.SABLEYE]: 1 / 20,
    [Pkm.MAKUHITA]: 1 / 20,
    [Pkm.LAPRAS]: 1 / 20,
    [Pkm.CASTFORM]: 1 / 20
  },
  22: {
    [Pkm.KECLEON]: 1 / 20,
    [Pkm.ELECTIVIRE]: 1 / 20,
    [Pkm.LUDICOLO]: 1 / 20,
    [Pkm.MAROWAK]: 1 / 20,
    [Pkm.SPINDA]: 1 / 20,
    [Pkm.REGIROCK]: 1 / 20,
    [Pkm.MUNCHLAX]: 1 / 20,
    [Pkm.WOBBUFFET]: 1 / 20,
    [Pkm.KINGAMBIT]: 1 / 20
  },
  27: {
    [Pkm.ELECTIVIRE]: 1 / 20,
    [Pkm.LUDICOLO]: 1 / 20,
    [Pkm.MAROWAK]: 1 / 20,
    [Pkm.SPINDA]: 1 / 20,
    [Pkm.REGIROCK]: 1 / 20,
    [Pkm.MUNCHLAX]: 1 / 20,
    [Pkm.WOBBUFFET]: 1 / 20
  },
  34: {
    [Pkm.ELECTIVIRE]: 1 / 20,
    [Pkm.LUDICOLO]: 1 / 20,
    [Pkm.MAROWAK]: 1 / 20,
    [Pkm.SPINDA]: 1 / 20,
    [Pkm.REGIROCK]: 1 / 20,
    [Pkm.MUNCHLAX]: 1 / 20
  }
}

/* Chimecho recruits a Pokemon onto every floating item for the rest of the run.
   From stage 12 to 22 a couple of slots are dealt one rarity above the rest. */
const CarouselPokemonRarityByStage: {
  [stageLevel: number]: { base: Rarity; upgraded?: Rarity }
} = {
  4: { base: Rarity.COMMON },
  12: { base: Rarity.UNCOMMON, upgraded: Rarity.RARE },
  17: { base: Rarity.RARE, upgraded: Rarity.EPIC },
  22: { base: Rarity.EPIC, upgraded: Rarity.ULTRA },
  27: { base: Rarity.ULTRA },
  34: { base: Rarity.ULTRA }
}

export function getCarouselPokemonRarities(
  stageLevel: number,
  nbSlots: number
): Rarity[] {
  const { base, upgraded }: { base: Rarity; upgraded?: Rarity } =
    CarouselPokemonRarityByStage[stageLevel] ?? { base: Rarity.ULTRA }
  const rarities: Rarity[] = new Array(nbSlots).fill(base)
  /* the two upgraded slots go to opposite ends of the ring, so reaching one
     puts a player as far as the carousel allows from taking the other */
  if (upgraded && nbSlots >= 2) {
    const first = randomBetween(0, nbSlots - 1)
    rarities[first] = upgraded
    rarities[(first + Math.floor(nbSlots / 2)) % nbSlots] = upgraded
  }
  return rarities
}

export const OUTLAW_GOLD_REWARD = 10

export const TREASURE_BOX_LIFE_THRESHOLD = 40
export type TreasureBoxReward =
  | "gold"
  | "mushrooms"
  | "sweets"
  | "componentsAndTickets"
  | "itemComponents"
  | "craftableItems"
  | "goldBow"

export function getTreasureBoxReward(): TreasureBoxReward {
  return (
    randomWeighted<TreasureBoxReward>({
      gold: 0.2,
      mushrooms: 0.1,
      sweets: 0.1,
      itemComponents: 0.1,
      componentsAndTickets: 0.1,
      craftableItems: 0.15,
      goldBow: 0.05
    }) ?? "itemComponents"
  )
}
