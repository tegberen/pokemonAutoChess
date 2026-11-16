import { BotDifficulty } from "../../types/enum/Game"

export type BotEloRange = { min?: number; max?: number }

// min inclusive, max exclusive
export const BOT_DIFFICULTY_ELO: Partial<Record<BotDifficulty, BotEloRange>> =
  {
    [BotDifficulty.EASY]: { max: 1150 },
    [BotDifficulty.HARD]: { min: 1150, max: 1450 },
    [BotDifficulty.EXTREME]: { min: 1450 }
  }

export const BOT_DIFFICULTY_CHOICES = [
  BotDifficulty.EASY,
  BotDifficulty.HARD,
  BotDifficulty.EXTREME
]

export const DEFAULT_BOT_DIFFICULTY = BotDifficulty.HARD

export function getBotEloRange(difficulty: BotDifficulty): BotEloRange {
  return (
    BOT_DIFFICULTY_ELO[difficulty] ??
    BOT_DIFFICULTY_ELO[DEFAULT_BOT_DIFFICULTY] ??
    {}
  )
}

export function isEloInRange(elo: number, range: BotEloRange) {
  return (
    (range.min === undefined || elo >= range.min) &&
    (range.max === undefined || elo < range.max)
  )
}

export function distanceToEloRange(elo: number, range: BotEloRange) {
  if (range.min !== undefined && elo < range.min) return range.min - elo
  if (range.max !== undefined && elo >= range.max) return elo - range.max + 1
  return 0
}
