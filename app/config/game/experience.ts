// Player experience gains based on rank
export const ExpPlace = [700, 400, 350, 300, 250, 200, 200, 200]

export const ExpThreshold = 1000

export const MAX_LEVEL = 9

export const WELCOME_BUNDLE_BOOSTERS = 10
export const WELCOME_BUNDLE_WONDER_PICKS = 1

export const SHINY_WONDER_PICK_LEVEL_STEP = 100

export function getShinyWonderPickMilestones(level: number) {
  return Math.max(0, Math.floor(level / SHINY_WONDER_PICK_LEVEL_STEP))
}

// Experience required to move from level n to level n+1
export const XP_PER_PURCHASE = 4

export const ExpTable: { [key: number]: number } = Object.freeze({
  1: 0,
  2: 2,
  3: 6,
  4: 10,
  5: 22,
  6: 34,
  7: 52,
  8: 72,
  9: 72,
  10: 255
})
