import { Weather } from "../../types/enum/Weather"

export const ON_ATTACK_MANA = 5

export const ARMOR_FACTOR = 0.05

export const DEFAULT_SPEED = 50
export const DEFAULT_CRIT_CHANCE = 10
export const DEFAULT_CRIT_POWER = 2
export const BASE_PROJECTILE_SPEED = 3

export const WeatherThreshold: { [weather in Weather]: number } = {
  [Weather.MISTY]: 8,
  [Weather.NEUTRAL]: 8,
  [Weather.NIGHT]: 8,
  [Weather.BLOODMOON]: 8,
  [Weather.RAIN]: 8,
  [Weather.SANDSTORM]: 8,
  [Weather.SNOW]: 8,
  [Weather.STORM]: 8,
  [Weather.ZENITH]: 8,
  [Weather.DROUGHT]: 8,
  [Weather.WINDY]: 8,
  [Weather.SMOG]: 8,
  [Weather.MURKY]: 8,
  [Weather.MAGNET_STORM]: 8,
  [Weather.PLAGUE]: 8,
  [Weather.ECLIPSE]: 8,
  [Weather.FLOOD]: 8,
  [Weather.ELDER_STORM]: 8,
  [Weather.DISTORTION]: 8,
  [Weather.METEOR_SHOWER]: 8,
  [Weather.CLOUDY]: 8,
  [Weather.TERRAIN]: 8,
  [Weather.BLOSSOM]: 8,
  [Weather.ZEN_ZONE]: 8
}

export const FIGHTING_BLOCKS_PER_THROW = 10
export const FIGHTING_THROW_CRIT_CHANCE_PER_STAR = 10
export const FIGHTING_THROW_PARALYSIS_DURATION = 2000
export const FIGHTING_THROW_DARK_JUMP_DELAY = 800
export const ZEN_BALL_DEFENSE = 4
export const SWORDS_OF_JUSTICE_ZEN_ZONE_STAT_GAIN = 4
export const ZEN_BALL_AWAKENING_TRUE_DAMAGE_DEF_RATIO = 0.4
