import { reverseMap } from "../../utils/map"
import { EffectEnum } from "./Effect"
import { Passive } from "./Passive"
import { Synergy } from "./Synergy"

export enum Weather {
  WINDY = "WINDY",
  NIGHT = "NIGHT",
  SANDSTORM = "SANDSTORM",
  ZENITH = "ZENITH",
  RAIN = "RAIN",
  SMOG = "SMOG",
  MISTY = "MISTY",
  DROUGHT = "DROUGHT",
  MURKY = "MURKY",
  BLOODMOON = "BLOODMOON",
  STORM = "STORM",
  SNOW = "SNOW",
  NEUTRAL = "NEUTRAL",
  MAGNET_STORM = "MAGNET_STORM",
  PLAGUE = "PLAGUE",
  ECLIPSE = "ECLIPSE",
  FLOOD = "FLOOD",
  ELDER_STORM = "ELDER_STORM",
  DISTORTION = "DISTORTION",
  METEOR_SHOWER = "METEOR_SHOWER",
  CLOUDY = "CLOUDY",
  TERRAIN = "TERRAIN",
  "BLOSSOM" = "BLOSSOM"
}

export const WeatherEffects: ReadonlyMap<Weather, EffectEnum> = new Map([
  [Weather.WINDY, EffectEnum.WINDY],
  [Weather.SNOW, EffectEnum.SNOW],
  [Weather.SMOG, EffectEnum.SMOG],
  [Weather.NIGHT, EffectEnum.NIGHT],
  [Weather.MISTY, EffectEnum.MISTY],
  [Weather.MURKY, EffectEnum.MURKY],
  [Weather.DROUGHT, EffectEnum.DROUGHT],
  [Weather.RAIN, EffectEnum.RAIN],
  [Weather.ZENITH, EffectEnum.ZENITH],
  [Weather.SANDSTORM, EffectEnum.SANDSTORM],
  [Weather.BLOODMOON, EffectEnum.BLOODMOON],
  [Weather.STORM, EffectEnum.STORM],
  [Weather.MAGNET_STORM, EffectEnum.MAGNET_STORM],
  [Weather.PLAGUE, EffectEnum.PLAGUE],
  [Weather.ECLIPSE, EffectEnum.ECLIPSE],
  [Weather.FLOOD, EffectEnum.FLOOD],
  [Weather.ELDER_STORM, EffectEnum.ELDER_STORM],
  [Weather.DISTORTION, EffectEnum.DISTORTION],
  [Weather.METEOR_SHOWER, EffectEnum.METEOR_SHOWER],
  [Weather.CLOUDY, EffectEnum.CLOUDY],
  [Weather.TERRAIN, EffectEnum.TERRAIN],
  [Weather.BLOSSOM, EffectEnum.BLOSSOM]
])

export const PassivesAssociatedToWeather: Map<Weather, Passive[]> = new Map([
  [Weather.RAIN, [Passive.RAIN]],
  [Weather.DROUGHT, [Passive.DROUGHT]],
  [Weather.ZENITH, [Passive.ZENITH]],
  [Weather.SANDSTORM, [Passive.SANDSTORM]],
  [Weather.MISTY, [Passive.MISTY]],
  [Weather.SNOW, [Passive.SNOW]],
  [Weather.STORM, [Passive.STORM]],
  [Weather.NIGHT, [Passive.NIGHT]],
  [Weather.WINDY, [Passive.WINDY]],
  [Weather.NEUTRAL, [Passive.AIRLOCK]],
  [Weather.MAGNET_STORM, [Passive.MAGNET_STORM]],
  [Weather.MURKY, [Passive.MURKY]],
  [Weather.FLOOD, [Passive.FLOOD]],
  [Weather.ELDER_STORM, [Passive.ELDER_STORM]],
  [Weather.DISTORTION, [Passive.DISTORTION]],
  [Weather.METEOR_SHOWER, [Passive.METEOR_SHOWER]],
  [Weather.CLOUDY, [Passive.CLOUDY]],
  [Weather.BLOSSOM, [Passive.BLOSSOM]]
])

export const WeatherAssociatedToSynergy: Map<Synergy, Weather> = new Map([
  [Synergy.GRASS, Weather.ZENITH],
  [Synergy.FIRE, Weather.DROUGHT],
  [Synergy.WATER, Weather.RAIN],
  [Synergy.GROUND, Weather.SANDSTORM],
  [Synergy.FAIRY, Weather.MISTY],
  [Synergy.ICE, Weather.SNOW],
  [Synergy.ELECTRIC, Weather.STORM],
  [Synergy.DARK, Weather.NIGHT],
  [Synergy.FLYING, Weather.WINDY],
  [Synergy.WILD, Weather.BLOODMOON],
  [Synergy.POISON, Weather.SMOG],
  [Synergy.GHOST, Weather.MURKY],
  [Synergy.NORMAL, Weather.NEUTRAL],
  [Synergy.STEEL, Weather.MAGNET_STORM],
  [Synergy.BUG, Weather.PLAGUE],
  [Synergy.PSYCHIC, Weather.ECLIPSE],
  [Synergy.AQUATIC, Weather.FLOOD],
  [Synergy.DRAGON, Weather.ELDER_STORM],
  [Synergy.ARTIFICIAL, Weather.DISTORTION],
  [Synergy.FOSSIL, Weather.METEOR_SHOWER],
  [Synergy.AMORPHOUS, Weather.CLOUDY],
  [Synergy.FIELD, Weather.TERRAIN],
  [Synergy.FLORA, Weather.BLOSSOM]
])

export const SynergyAssociatedToWeather = reverseMap(WeatherAssociatedToSynergy)
