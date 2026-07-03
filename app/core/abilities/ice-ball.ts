import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class IceBallStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const baseDamage = [10, 20, 40, 80][pokemon.stars - 1] ?? 80
    const multiplier = [0.5, 1, 2, 4][pokemon.stars - 1] ?? 4
    const speDefBoost = [10, 10, 20, 40][pokemon.stars - 1] ?? 40

    pokemon.addSpecialDefense(speDefBoost, pokemon, 0, false)
    target.handleSpecialDamage(
      baseDamage + multiplier * pokemon.speDef,
      board,
      AttackType.SPECIAL,
      pokemon,
      crit
    )
  }
}
