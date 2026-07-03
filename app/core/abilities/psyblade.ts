import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class PsybladeStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const percent = [0.3, 0.3, 0.3, 0.6][pokemon.stars - 1] ?? 0.6
    const damage = Math.round(pokemon.maxHP * percent)

    const cells = board.getCellsInFront(pokemon, target, 1)
    cells.forEach((cell) => {
      if (cell.value && cell.value.team !== pokemon.team) {
        const { takenDamage } = cell.value.handleSpecialDamage(
          damage,
          board,
          AttackType.SPECIAL,
          pokemon,
          crit
        )
        if (pokemon.status.grassField) {
          pokemon.handleHeal(0.3 * takenDamage, pokemon, 0, false)
        }
      }
    })

    if (pokemon.status.psychicField) {
      pokemon.addPP(Math.round(0.03 * pokemon.maxHP), pokemon, 0, false)
    }

  }
}
