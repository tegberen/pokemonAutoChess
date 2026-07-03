import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class RisingVoltageStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    let damage = [30, 60, 120, 240][pokemon.stars - 1] ?? 240

    // double damage if target already has electric field
    if (target.status.electricField) {
      damage *= 2
    }

    target.handleSpecialDamage(
      damage,
      board,
      AttackType.SPECIAL,
      pokemon,
      crit,
      true
    )

    // gain electric field
    pokemon.status.electricField = true

    // spread to all adjacent pokemon, allies and enemies
    board
      .getAdjacentCells(pokemon.positionX, pokemon.positionY)
      .map((cell) => cell.value)
      .filter((e): e is PokemonEntity => e != null)
      .forEach((e) => {
        e.status.electricField = true
      })
  }
}
