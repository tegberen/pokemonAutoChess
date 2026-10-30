import type { Emotion, PkmWithCustom } from "."

export type Booster = BoosterCard[]
export type BoosterCard = PkmWithCustom & {
  shiny: boolean
  emotion: Emotion
  new: boolean
}
export type SeasonBoosterCard = BoosterCard & {
  unlockedEmotions: Emotion[]
  holo?: boolean
}
