import { AttackType } from "../../types/enum/Game"
import { chance } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class AxeBlastStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = Math.round(pokemon.atk * 3)
    const targets = board.cells.filter(
      (enemy): enemy is PokemonEntity =>
        enemy !== undefined &&
        enemy.team !== pokemon.team &&
        (enemy.id === target.id ||
          (Math.abs(enemy.positionX - target.positionX) === 1 &&
            Math.abs(enemy.positionY - target.positionY) === 1))
    )
    targets.forEach((enemy) =>
      enemy.handleSpecialDamage(
        damage,
        board,
        AttackType.SPECIAL,
        pokemon,
        crit
      )
    )
    if (
      target.hp > 0 &&
      chance(pokemon.axeBlastExecuteChance, pokemon)
    ) {
      target.handleSpecialDamage(
        9999,
        board,
        AttackType.TRUE,
        pokemon,
        false,
        false
      )
    }
  }
}
