import { AttackType } from "../../types/enum/Game"
import { type Board, effectInLine } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class TripleArrowsStrategy extends AbilityStrategy {
  canCritByDefault = true
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [10, 20, 40, 80][pokemon.stars - 1] ?? 80

    for (let i = 0; i < 3; i++) {
      effectInLine(board, pokemon, target, (cell) => {
        if (cell.value != null && cell.value.team !== pokemon.team) {
          cell.value.handleSpecialDamage(
            damage,
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
          cell.value.addDefense(-2, pokemon, 0, false)
          cell.value.status.triggerFlinch(1000, cell.value, pokemon)
        }
      })
    }
  }
}
