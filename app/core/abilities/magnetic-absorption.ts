import { AttackType } from "../../types/enum/Game"
import { clamp } from "../../utils/number"
import { OrientationArray, OrientationVector } from "../../utils/orientation"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class MagneticAbsorptionStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [80, 80, 80, 120][pokemon.stars - 1] ?? 120

    // User gains +1 range
    pokemon.range += 1

    // Move user 1 tile away from target
    const orientation = board.orientation(
      pokemon.positionX,
      pokemon.positionY,
      target.positionX,
      target.positionY,
      pokemon,
      target
    )
    const oppositeOrientation = OrientationArray[(OrientationArray.indexOf(orientation) + 4) % 8]
    const vector = OrientationVector[oppositeOrientation]
    const retreatX = clamp(pokemon.positionX + vector[0], 0, board.columns - 1)
    const retreatY = clamp(pokemon.positionY + vector[1], 0, board.rows - 1)
    if (!board.getEntityOnCell(retreatX, retreatY)) {
      pokemon.moveTo(retreatX, retreatY, board, false)
    }

    // Reduce target range or deal damage if already at 1
    if (target.range <= 1) {
      target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
      target.status.triggerLocked(2000, target)
    } else {
      target.range -= 1
    }

    // Reduce adjacent enemy ranges or deal damage if already at 1
    board.getAdjacentCells(target.positionX, target.positionY).forEach((cell) => {
      if (cell.value && cell.value.team !== pokemon.team && cell.value !== target) {
        if (cell.value.range <= 1) {
          cell.value.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
          cell.value.status.triggerLocked(2000, target)
        } else {
          cell.value.range -= 1
        }
      }
    })

  }
}
