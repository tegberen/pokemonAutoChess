import { Emotion } from "../../types/enum/Emotion"
import { Rarity } from "../../types/enum/Game"

export const DUST_PER_BOOSTER = 50
export const DUST_PER_SHINY = 250

export const EmotionCost: { [key in Emotion]: number } = {
  [Emotion.NORMAL]: 0,
  [Emotion.HAPPY]: 0,
  [Emotion.PAIN]: 0,
  [Emotion.ANGRY]: 0,
  [Emotion.WORRIED]: 0,
  [Emotion.SAD]: 0,
  [Emotion.CRYING]: 0,
  [Emotion.SHOUTING]: 0,
  [Emotion.TEARY_EYED]: 0,
  [Emotion.DETERMINED]: 0,
  [Emotion.JOYOUS]: 0,
  [Emotion.INSPIRED]: 0,
  [Emotion.SURPRISED]: 0,
  [Emotion.DIZZY]: 0,
  [Emotion.SPECIAL0]: 0,
  [Emotion.SPECIAL1]: 0,
  [Emotion.SIGH]: 0,
  [Emotion.STUNNED]: 0,
  [Emotion.SPECIAL2]: 0,
  [Emotion.SPECIAL3]: 0
}

export function getEmotionCost(emotion: Emotion, isShiny: boolean): number {
  return isShiny ? EmotionCost[emotion] * 3 : EmotionCost[emotion]
}

// should be proportional to rarity
export const BoosterPriceByRarity: { [key in Rarity]: number } = {
  [Rarity.COMMON]: 600,
  [Rarity.UNCOMMON]: 1000,
  [Rarity.RARE]: 1000,
  [Rarity.EPIC]: 900,
  [Rarity.ULTRA]: 300,
  [Rarity.UNIQUE]: 500,
  [Rarity.LEGENDARY]: 250,
  [Rarity.HATCH]: 300,
  [Rarity.SPECIAL]: 500 // special is a bit more expensive due to unowns farming
}
