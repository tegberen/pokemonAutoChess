import { Blessing } from "../types/enum/Blessing"
import type { Board } from "./board"
import type { PokemonEntity } from "./pokemon-entity"

export function isPurrfectPlanGlameow(
  candidate: PokemonEntity,
  confused: PokemonEntity
) {
  return (
    candidate.team !== confused.team &&
    candidate.heroBlessings.has(Blessing.PURRFECT_PLAN)
  )
}

export function isFacingFieldedPurrfectPlanGlameow(
  confused: PokemonEntity,
  board: Board
) {
  return board.cells.some(
    (unit) =>
      unit !== undefined && unit.hp > 0 && isPurrfectPlanGlameow(unit, confused)
  )
}
