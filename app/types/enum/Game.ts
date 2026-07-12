export enum Rarity {
  COMMON = "COMMON",
  UNCOMMON = "UNCOMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  ULTRA = "ULTRA",
  UNIQUE = "UNIQUE",
  LEGENDARY = "LEGENDARY",
  HATCH = "HATCH",
  SPECIAL = "SPECIAL"
}

export enum GameMode {
  CUSTOM_LOBBY = "CUSTOM_LOBBY",
  CLASSIC = "CLASSIC",
  RANKED = "RANKED",
  SCRIBBLE = "SCRIBBLE",
  TOURNAMENT = "TOURNAMENT",
  DOUBLE_UP = "DOUBLE_UP"
}

export enum GamePhaseState {
  PICK,
  FIGHT,
  TOWN
}

export enum PokemonActionState {
  IDLE = "Idle",
  ATTACK = "Attack",
  ABILITY = "Ability",
  WALK = "Walk",
  EXPLORING = "Exploring",
  SLEEP = "Sleep",
  HOP = "Hop",
  HURT = "Hurt",
  EMOTE = "Emote",
  EAT = "Eat",
  FISH = "Fish",
  BLOSSOM = "Blossom",
  NEST = "Nest",
  TRAINING = "Training"
}

export enum Orientation {
  DOWN = "0",
  DOWNRIGHT = "1",
  RIGHT = "2",
  UPRIGHT = "3",
  UP = "4",
  UPLEFT = "5",
  LEFT = "6",
  DOWNLEFT = "7"
}

export const OrientationFlip: { [key in Orientation]: Orientation } = {
  [Orientation.DOWN]: Orientation.UP,
  [Orientation.DOWNLEFT]: Orientation.UPLEFT,
  [Orientation.LEFT]: Orientation.LEFT,
  [Orientation.UPLEFT]: Orientation.DOWNLEFT,
  [Orientation.UP]: Orientation.DOWN,
  [Orientation.UPRIGHT]: Orientation.DOWNRIGHT,
  [Orientation.RIGHT]: Orientation.RIGHT,
  [Orientation.DOWNRIGHT]: Orientation.UPRIGHT
}

export const OrientationKnockback: { [key in Orientation]: Orientation[] } = {
  [Orientation.DOWN]: [
    Orientation.DOWN,
    Orientation.DOWNRIGHT,
    Orientation.DOWNLEFT
  ],
  [Orientation.DOWNLEFT]: [
    Orientation.DOWNLEFT,
    Orientation.DOWN,
    Orientation.LEFT
  ],
  [Orientation.LEFT]: [
    Orientation.LEFT,
    Orientation.DOWNLEFT,
    Orientation.UPLEFT
  ],
  [Orientation.UPLEFT]: [Orientation.UPLEFT, Orientation.LEFT, Orientation.UP],
  [Orientation.UP]: [Orientation.UP, Orientation.UPLEFT, Orientation.UPRIGHT],
  [Orientation.UPRIGHT]: [
    Orientation.UPRIGHT,
    Orientation.UP,
    Orientation.RIGHT
  ],
  [Orientation.RIGHT]: [
    Orientation.RIGHT,
    Orientation.UPRIGHT,
    Orientation.DOWNRIGHT
  ],
  [Orientation.DOWNRIGHT]: [
    Orientation.DOWNRIGHT,
    Orientation.RIGHT,
    Orientation.DOWN
  ]
}

export enum AttackType {
  PHYSICAL,
  SPECIAL,
  TRUE
}

export enum HealType {
  SHIELD,
  HEAL
}

export enum BattleResult {
  WIN = "WIN",
  DEFEAT = "DEFEAT",
  DRAW = "DRAW"
}

export enum BotDifficulty {
  BEGINNER,
  EASY,
  MEDIUM,
  HARD,
  EXTREME,
  CUSTOM,
  REGULAR,
  UNREALISTIC,
  NEWBIE,
  SHINY,
  MASTER
}

export enum PokemonTint {
  NORMAL = "Normal",
  SHINY = "Shiny"
}

export enum SpriteType {
  ANIM = "Anim",
  SHADOW = "Shadow"
}

export enum Stat {
  ATK = "ATK",
  SPEED = "SPEED",
  DEF = "DEF",
  SPE_DEF = "SPE_DEF",
  HP = "HP",
  RANGE = "RANGE",
  PP = "PP",
  MAX_PP = "MAX_PP",
  CRIT_CHANCE = "CRIT_CHANCE",
  CRIT_POWER = "CRIT_POWER",
  AP = "AP",
  SHIELD = "SHIELD",
  LUCK = "LUCK"
}

export enum Damage {
  PHYSICAL = "PHYSICAL",
  SPECIAL = "SPECIAL",
  TRUE = "TRUE"
}

// JUGGERNAUT: each shop feed-copy is one of these colored variants; feeding
// grants HP plus the color's stat (see amounts below)
export const JuggernautFeedStats: Stat[] = [
  Stat.HP,
  Stat.ATK,
  Stat.DEF,
  Stat.SPE_DEF,
  Stat.SPEED,
  Stat.AP,
  Stat.CRIT_CHANCE,
  Stat.CRIT_POWER
]

export const JuggernautStatColor: Partial<Record<Stat, string>> = {
  [Stat.HP]: "#43a047", // green
  [Stat.ATK]: "#c62828", // dark red
  [Stat.DEF]: "#1565c0", // dark blue
  [Stat.SPE_DEF]: "#ab47bc", // purple
  [Stat.SPEED]: "#fb8c00", // orange
  [Stat.AP]: "#6a1b9a", // dark purple
  [Stat.CRIT_CHANCE]: "#90a4ae", // grey
  [Stat.CRIT_POWER]: "#fdd835" // gold
}

// every feed grants this much HP so the sprite always grows; non-green copies
// add their color's stat on top, green grants the bigger HP amount instead
export const JUGGERNAUT_BASE_HP_BONUS = 50
export const JuggernautStatFlatAmount: Partial<Record<Stat, number>> = {
  [Stat.HP]: 100, // green
  [Stat.ATK]: 5,
  [Stat.DEF]: 5,
  [Stat.SPE_DEF]: 5,
  [Stat.SPEED]: 10,
  [Stat.AP]: 10,
  [Stat.CRIT_CHANCE]: 10,
  [Stat.CRIT_POWER]: 10
}

export enum Team {
  BLUE_TEAM = 0,
  RED_TEAM = 1
}
