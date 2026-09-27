import type Player from "../models/colyseus-models/player"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import { Blessing } from "../types/enum/Blessing"
import { Pkm } from "../types/enum/Pokemon"
import { isOnBench } from "../utils/board"
import { schemaValues } from "../utils/schemas"
import { getStrongestUnitOfFamily } from "./unit-score"

// the Onix line member Crystal Guardian empowers, picked among fielded units
// like a hero champion, since crystallisation only charges on the board
export function isCrystalGuardian(pokemon: Pokemon, player: Player): boolean {
  if (!player.blessings?.includes(Blessing.CRYSTAL_GUARDIAN)) return false
  const fielded = schemaValues(player.board).filter((unit) => !isOnBench(unit))
  return getStrongestUnitOfFamily(fielded, Pkm.ONIX)?.id === pokemon.id
}
