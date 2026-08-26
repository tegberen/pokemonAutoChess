import { AVATAR_WALK_SPEED_SCALE } from "../config"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import type { Pkm } from "../types/enum/Pokemon"

export function getPlayerAvatarWalkSpeed(name: Pkm | string): number {
  const baseSpeed = getPokemonData(name as Pkm).speed
  return AVATAR_WALK_SPEED_SCALE * (0.05 + Math.pow(baseSpeed / 75, 1.5))
}
