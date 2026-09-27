import {
  Blessing,
  WINDY_SANDS_HEAL_RATIO,
  WINDY_SANDS_RADIUS
} from "../types/enum/Blessing"
import type { Board } from "./board"
import type { PokemonEntity } from "./pokemon-entity"

// kept apart from sand-tomb.ts: the Sandstorm tick in pokemon-state needs it,
// and it must not import an ability file
export function healWindySandsFromSandstorm(
  hurtEnemy: PokemonEntity,
  sandstormDamageTaken: number,
  board: Board
) {
  if (sandstormDamageTaken <= 0) return
  board
    .getCellsInRadius(
      hurtEnemy.positionX,
      hurtEnemy.positionY,
      WINDY_SANDS_RADIUS,
      false
    )
    .forEach((cell) => {
      const hippopotas = cell.value
      if (
        hippopotas &&
        hippopotas.team !== hurtEnemy.team &&
        hippopotas.hp > 0 &&
        hippopotas.heroBlessings?.has(Blessing.WINDY_SANDS)
      ) {
        hippopotas.handleHeal(
          sandstormDamageTaken * WINDY_SANDS_HEAL_RATIO,
          hippopotas,
          0,
          false
        )
      }
    })
}
