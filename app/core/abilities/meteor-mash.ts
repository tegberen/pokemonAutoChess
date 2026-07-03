import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class MeteorMashStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const nbHits = [1, 2, 4, 8][pokemon.stars - 1] ?? 8
    const attackBoost = pokemon.status.psychicField ? 4 : 2
    const damage = pokemon.atk
    for (let n = 0; n < nbHits; n++) {
      const cells = board.getAdjacentCells(target.positionX, target.positionY, true)
      cells.forEach((cell) => {
        if (cell.value && cell.value.team !== pokemon.team) {
          cell.value.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
        }
      })
      pokemon.addAttack(attackBoost, pokemon, 1, crit)
    }
  }
}
