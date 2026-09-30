import { Ability } from "../../types/enum/Ability"

// each Dragon Darts dart is thrown as the previous one lands, and hits on arrival
export const DRAGON_DARTS_DART_FLIGHT_MS = 200

// Mud Splash hits as the user lands from its hop
export const MUD_BUBBLE_HOP_MS = 300

// each Water Shuriken hits on arrival; the next one leaves a moment later
export const WATER_SHURIKEN_FLIGHT_MS = 260
export const WATER_SHURIKEN_STAGGER_MS = 110
export const WATER_SHURIKEN_GIANT_MS_PER_CELL = 70
// the giant shuriken is thrown after the user's hop
export const WATER_SHURIKEN_GIANT_WINDUP_MS = 300

export const InimitableAbilities: Ability[] = [
  Ability.ASSIST,
  Ability.AURA_WHEEL,
  Ability.ENCORE,
  Ability.HIDDEN_POWER_A,
  Ability.HIDDEN_POWER_B,
  Ability.HIDDEN_POWER_C,
  Ability.HIDDEN_POWER_D,
  Ability.HIDDEN_POWER_E,
  Ability.HIDDEN_POWER_EM,
  Ability.HIDDEN_POWER_F,
  Ability.HIDDEN_POWER_G,
  Ability.HIDDEN_POWER_H,
  Ability.HIDDEN_POWER_I,
  Ability.HIDDEN_POWER_J,
  Ability.HIDDEN_POWER_K,
  Ability.HIDDEN_POWER_L,
  Ability.HIDDEN_POWER_M,
  Ability.HIDDEN_POWER_N,
  Ability.HIDDEN_POWER_O,
  Ability.HIDDEN_POWER_P,
  Ability.HIDDEN_POWER_Q,
  Ability.HIDDEN_POWER_QM,
  Ability.HIDDEN_POWER_R,
  Ability.HIDDEN_POWER_S,
  Ability.HIDDEN_POWER_T,
  Ability.HIDDEN_POWER_U,
  Ability.HIDDEN_POWER_V,
  Ability.HIDDEN_POWER_W,
  Ability.HIDDEN_POWER_X,
  Ability.HIDDEN_POWER_Y,
  Ability.HIDDEN_POWER_Z,
  Ability.KNOWLEDGE_THIEF,
  Ability.MAGNET_PULL,
  Ability.METRONOME,
  Ability.MIMIC,
  Ability.SHADOW_FORCE,
  Ability.SKETCH,
  Ability.SKILL_SWAP,
  Ability.SWARM
]
