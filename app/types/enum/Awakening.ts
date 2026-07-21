import { Synergy } from "./Synergy"

export const ROCK_AWAKENING_TIER = 4

export enum Awakening {
  NONE = "NONE",
  HEAT_ROCK = "HEAT_ROCK",
  SUN_STONE = "SUN_STONE",
  DAMP_ROCK = "DAMP_ROCK",
  ICY_ROCK = "ICY_ROCK",
  SMOOTH_ROCK = "SMOOTH_ROCK",
  BLACK_AUGURITE = "BLACK_AUGURITE",
  FLOAT_STONE = "FLOAT_STONE",
  ELECTRIC_QUARTZ = "ELECTRIC_QUARTZ",
  MIST_STONE = "MIST_STONE",
  BLOOD_STONE = "BLOOD_STONE",
  SMELLY_CLAY = "SMELLY_CLAY",
  ODD_KEYSTONE = "ODD_KEYSTONE",
  METAL_ALLOY = "METAL_ALLOY",
  STICKY_GLOB = "STICKY_GLOB",
  ECLIPSE_STONE = "ECLIPSE_STONE",
  PEARL_STONE = "PEARL_STONE",
  ELDER_CRYSTAL = "ELDER_CRYSTAL",
  DISTORTION_SLATE = "DISTORTION_SLATE",
  FOSSIL_FRAGMENT = "FOSSIL_FRAGMENT",
  CLOUD_ORB = "CLOUD_ORB",
  PEAT_BLOCK = "PEAT_BLOCK",
  BLOSSOM_SHARD = "BLOSSOM_SHARD"
}

export const AwakeningTypes: Partial<Record<Awakening, Synergy>> = {
  [Awakening.SUN_STONE]: Synergy.GRASS,
  [Awakening.HEAT_ROCK]: Synergy.FIRE,
  [Awakening.DAMP_ROCK]: Synergy.WATER,
  [Awakening.ICY_ROCK]: Synergy.ICE,
  [Awakening.SMOOTH_ROCK]: Synergy.GROUND,
  [Awakening.BLACK_AUGURITE]: Synergy.DARK,
  [Awakening.FLOAT_STONE]: Synergy.FLYING,
  [Awakening.ELECTRIC_QUARTZ]: Synergy.ELECTRIC,
  [Awakening.MIST_STONE]: Synergy.FAIRY,
  [Awakening.BLOOD_STONE]: Synergy.WILD,
  [Awakening.SMELLY_CLAY]: Synergy.POISON,
  [Awakening.ODD_KEYSTONE]: Synergy.GHOST,
  [Awakening.METAL_ALLOY]: Synergy.STEEL,
  [Awakening.STICKY_GLOB]: Synergy.BUG,
  [Awakening.ECLIPSE_STONE]: Synergy.PSYCHIC,
  [Awakening.PEARL_STONE]: Synergy.AQUATIC,
  [Awakening.ELDER_CRYSTAL]: Synergy.DRAGON,
  [Awakening.DISTORTION_SLATE]: Synergy.ARTIFICIAL,
  [Awakening.FOSSIL_FRAGMENT]: Synergy.FOSSIL,
  [Awakening.CLOUD_ORB]: Synergy.AMORPHOUS,
  [Awakening.PEAT_BLOCK]: Synergy.FIELD,
  [Awakening.BLOSSOM_SHARD]: Synergy.FLORA
}
