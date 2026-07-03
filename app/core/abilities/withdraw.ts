import { AttackType } from "../../types/enum/Game"
import { OrientationArray } from "../../utils/orientation"
import { type Board, effectInOrientation } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class WithdrawStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [10, 20, 40][pokemon.stars - 1] ?? 40

    OrientationArray.forEach((orientation) => {
      effectInOrientation(board, pokemon, orientation, (cell) => {
        if (cell.value && cell.value.team !== pokemon.team) {
          const destination = board.getKnockBackPlace(
            cell.value.positionX,
            cell.value.positionY,
            orientation
          )
          if (destination) {
            cell.value.moveTo(destination.x, destination.y, board, true)
            cell.value.cooldown = 500
          }
          cell.value.handleSpecialDamage(
            damage,
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
        }
      })
    })

    const boost = [2, 4, 8][pokemon.stars - 1] ?? 8
    pokemon.addDefense(boost, pokemon, 1, true)
  }
}
