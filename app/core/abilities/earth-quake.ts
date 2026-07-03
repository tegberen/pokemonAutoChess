import { Ability } from "../../types/enum/Ability"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class EarthQuakeStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [25, 50, 100, 200][pokemon.stars - 1] ?? 200
    const range = [1, 2, 3][pokemon.stars - 1] ?? 3
    board
      .getCellsInRadius(pokemon.positionX, pokemon.positionY, range, false)
      .forEach((cell) => {
        if (cell.value) {
          cell.value.handleSpecialDamage(
            damage,
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
        }
      })
    pokemon.broadcastAbility({ skill: `${Ability.EARTH_QUAKE}_${pokemon.stars}` })
  }
}
