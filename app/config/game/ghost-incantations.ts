export enum IncantationKind {
  HEXING = "HEXING",
  RITUAL = "RITUAL",
  FATED = "FATED"
}

export enum HexingTarget {
  HIGHEST_DEFENSES = "HIGHEST_DEFENSES",
  HIGHEST_AP = "HIGHEST_AP",
  HIGHEST_ATK = "HIGHEST_ATK",
  HIGHEST_SPEED = "HIGHEST_SPEED"
}

export enum HexingEffect {
  STAT = "STAT",
  LUCK = "LUCK",
  MAX_HP = "MAX_HP",
  MAX_PP = "MAX_PP",
  GOLD_ON_KO = "GOLD_ON_KO",
  CRIT_POWER_ON_KO = "CRIT_POWER_ON_KO"
}

export enum HexingStatus {
  FLINCH = "FLINCH",
  ARMOR_BREAK = "ARMOR_BREAK",
  FATIGUE = "FATIGUE",
  PARALYSIS = "PARALYSIS"
}

export enum RitualTrigger {
  GHOST_CASTS = "GHOST_CASTS",
  GHOST_ATTACKS = "GHOST_ATTACKS",
  GHOST_KOD = "GHOST_KOD",
  ENEMY_KOD = "ENEMY_KOD"
}

export enum RitualEffect {
  GHOST_LUCK = "GHOST_LUCK",
  ENEMY_LUCK_LOSS = "ENEMY_LUCK_LOSS",
  SILENCE = "SILENCE",
  GHOST_SPEED = "GHOST_SPEED",
  GHOST_PP = "GHOST_PP",
  GHOST_MAX_HP = "GHOST_MAX_HP"
}

export enum RitualBonus {
  GOLD_EVERY = "GOLD_EVERY",
  PERMANENT_HP = "PERMANENT_HP",
  PERMANENT_PP = "PERMANENT_PP",
  PERMANENT_SPEED = "PERMANENT_SPEED"
}

export enum FatedHexing {
  TWO_TARGETS = "TWO_TARGETS",
  DOOM = "DOOM",
  REAP = "REAP",
  PLAGUE = "PLAGUE"
}

export enum FatedRitual {
  ECHO = "ECHO",
  DOUBLE_REWARDS = "DOUBLE_REWARDS",
  RESURRECT = "RESURRECT",
  SPAWN_GHOST = "SPAWN_GHOST"
}

export const INCANTATION_OPTIONS_SHOWN = 3
export const INCANTATION_STATUS_DURATION = 30000
export const RITUAL_ATTACKS_PER_TRIGGER = 8
export const FATED_DOOM_DELAY = 8000
export const INCANTATION_ANIMATION_DELAY = 500
export const FATED_PLAGUE_SPREAD_MS = 700
export const FATED_ECHO_CHANCE = 25
export const RITUAL_PERMANENT_STAT_CAP = 0.5
export const FATED_SPAWN_RARITY_WEIGHTS = { COMMON: 50, UNCOMMON: 30, RARE: 20 }

export const GHOST_INCANTATION_SLOTS: {
  ghostLevel: number
  kind: IncantationKind
}[] = [
  { ghostLevel: 2, kind: IncantationKind.HEXING },
  { ghostLevel: 4, kind: IncantationKind.HEXING },
  { ghostLevel: 6, kind: IncantationKind.RITUAL },
  { ghostLevel: 8, kind: IncantationKind.FATED }
]

export function getHexingStrength(ghostLevel: number) {
  return ghostLevel >= 8 ? 2 : ghostLevel >= 6 ? 1 : 0
}

export function getRitualStrength(ghostLevel: number) {
  return ghostLevel >= 8 ? 1 : 0
}

export function getIncantationStrength(
  kind: IncantationKind,
  ghostLevel: number
) {
  if (kind === IncantationKind.HEXING) return getHexingStrength(ghostLevel)
  if (kind === IncantationKind.RITUAL) return getRitualStrength(ghostLevel)
  return 0
}

export const HEXING_STAT_LOSS_VALUES: {
  [target in HexingTarget]: { values: number[]; isPercent: boolean }
} = {
  [HexingTarget.HIGHEST_DEFENSES]: { values: [6, 9, 12], isPercent: false },
  [HexingTarget.HIGHEST_AP]: { values: [20, 40, 60], isPercent: false },
  [HexingTarget.HIGHEST_ATK]: { values: [10, 20, 30], isPercent: true },
  [HexingTarget.HIGHEST_SPEED]: { values: [15, 30, 45], isPercent: false }
}

export const HEXING_EFFECT_VALUES: {
  [loss in Exclude<HexingEffect, HexingEffect.STAT>]: number[]
} = {
  [HexingEffect.GOLD_ON_KO]: [1, 2, 3],
  [HexingEffect.CRIT_POWER_ON_KO]: [10, 20, 30],
  [HexingEffect.LUCK]: [10, 20, 30],
  [HexingEffect.MAX_PP]: [10, 20, 30],
  [HexingEffect.MAX_HP]: [10, 15, 20]
}

type ByRitualTrigger<T> = { [trigger in RitualTrigger]: T }
type RitualValues = ByRitualTrigger<number[]>

export const RITUAL_EFFECT_VALUES: {
  [effect in Exclude<RitualEffect, RitualEffect.SILENCE>]: RitualValues
} = {
  [RitualEffect.GHOST_LUCK]: {
    [RitualTrigger.GHOST_CASTS]: [2, 3],
    [RitualTrigger.GHOST_ATTACKS]: [2, 3],
    [RitualTrigger.GHOST_KOD]: [4, 8],
    [RitualTrigger.ENEMY_KOD]: [3, 5]
  },
  [RitualEffect.ENEMY_LUCK_LOSS]: {
    [RitualTrigger.GHOST_CASTS]: [2, 3],
    [RitualTrigger.GHOST_ATTACKS]: [2, 3],
    [RitualTrigger.GHOST_KOD]: [4, 8],
    [RitualTrigger.ENEMY_KOD]: [3, 5]
  },
  [RitualEffect.GHOST_SPEED]: {
    [RitualTrigger.GHOST_CASTS]: [4, 5],
    [RitualTrigger.GHOST_ATTACKS]: [6, 8],
    [RitualTrigger.GHOST_KOD]: [12, 20],
    [RitualTrigger.ENEMY_KOD]: [8, 15]
  },
  [RitualEffect.GHOST_PP]: {
    [RitualTrigger.GHOST_CASTS]: [4, 5],
    [RitualTrigger.GHOST_ATTACKS]: [6, 8],
    [RitualTrigger.GHOST_KOD]: [12, 20],
    [RitualTrigger.ENEMY_KOD]: [8, 15]
  },
  [RitualEffect.GHOST_MAX_HP]: {
    [RitualTrigger.GHOST_CASTS]: [5, 8],
    [RitualTrigger.GHOST_ATTACKS]: [8, 12],
    [RitualTrigger.GHOST_KOD]: [15, 25],
    [RitualTrigger.ENEMY_KOD]: [10, 20]
  }
}

// targets 0 means every enemy in the line behind the attack's target
export const RITUAL_SILENCE_VALUES: ByRitualTrigger<{
  targets: number[]
  seconds: number[]
}> = {
  [RitualTrigger.GHOST_CASTS]: { targets: [1, 2], seconds: [1, 2] },
  [RitualTrigger.GHOST_ATTACKS]: { targets: [0, 0], seconds: [2, 3] },
  [RitualTrigger.GHOST_KOD]: { targets: [2, 3], seconds: [2, 3] },
  [RitualTrigger.ENEMY_KOD]: { targets: [2, 3], seconds: [2, 3] }
}

// a counter, not a chance: LUCK the ritual itself grants would snowball a roll
export const RITUAL_GOLD_EVERY: ByRitualTrigger<number[]> = {
  [RitualTrigger.GHOST_CASTS]: [10, 5],
  [RitualTrigger.GHOST_ATTACKS]: [10, 5],
  [RitualTrigger.GHOST_KOD]: [6, 3],
  [RitualTrigger.ENEMY_KOD]: [8, 4]
}
export const RITUAL_GOLD_PAYOUT = 1

export const RITUAL_BONUS_VALUES: {
  [bonus in Exclude<RitualBonus, RitualBonus.GOLD_EVERY>]: RitualValues
} = {
  [RitualBonus.PERMANENT_HP]: {
    [RitualTrigger.GHOST_CASTS]: [1, 2],
    [RitualTrigger.GHOST_ATTACKS]: [2, 3],
    [RitualTrigger.GHOST_KOD]: [4, 6],
    [RitualTrigger.ENEMY_KOD]: [3, 5]
  },
  [RitualBonus.PERMANENT_PP]: {
    [RitualTrigger.GHOST_CASTS]: [1, 2],
    [RitualTrigger.GHOST_ATTACKS]: [1, 2],
    [RitualTrigger.GHOST_KOD]: [3, 5],
    [RitualTrigger.ENEMY_KOD]: [2, 3]
  },
  [RitualBonus.PERMANENT_SPEED]: {
    [RitualTrigger.GHOST_CASTS]: [1, 2],
    [RitualTrigger.GHOST_ATTACKS]: [1, 2],
    [RitualTrigger.GHOST_KOD]: [3, 5],
    [RitualTrigger.ENEMY_KOD]: [2, 3]
  }
}

export const FATED_RESURRECT_ACTIVATIONS: ByRitualTrigger<number> = {
  [RitualTrigger.GHOST_CASTS]: 15,
  [RitualTrigger.GHOST_ATTACKS]: 10,
  [RitualTrigger.GHOST_KOD]: 5,
  [RitualTrigger.ENEMY_KOD]: 6
}

export const FATED_SPAWN_GHOST_CHANCE: ByRitualTrigger<number> = {
  [RitualTrigger.GHOST_CASTS]: 8,
  [RitualTrigger.GHOST_ATTACKS]: 10,
  [RitualTrigger.GHOST_KOD]: 20,
  [RitualTrigger.ENEMY_KOD]: 15
}

export interface GhostIncantation {
  kind: IncantationKind
  cause: string
  effect: string
  bonus: string
}

export function encodeGhostIncantation(incantation: GhostIncantation) {
  return [
    incantation.kind,
    incantation.cause,
    incantation.effect,
    incantation.bonus
  ].join("|")
}

export function decodeGhostIncantation(encoded: string): GhostIncantation {
  const [kind, cause, effect, bonus] = encoded.split("|")
  return { kind: kind as IncantationKind, cause, effect, bonus: bonus ?? "" }
}

export const INCANTATION_COLUMNS: {
  [kind in IncantationKind]: string[][]
} = {
  [IncantationKind.HEXING]: [
    Object.values(HexingTarget),
    Object.values(HexingEffect),
    Object.values(HexingStatus)
  ],
  [IncantationKind.RITUAL]: [
    Object.values(RitualTrigger),
    Object.values(RitualEffect),
    Object.values(RitualBonus)
  ],
  [IncantationKind.FATED]: [
    Object.values(FatedHexing),
    Object.values(FatedRitual)
  ]
}
