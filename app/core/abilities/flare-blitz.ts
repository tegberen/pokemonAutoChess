import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class FlareBlitzStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const damage = ([1,2,3,4,5][pokemon.stars - 1] ?? 5) * pokemon.atk

    pokemon.moveTo(target.positionX, target.positionY, board, false)
    pokemon.broadcastAbility({
      positionX: pokemon.positionX,
      positionY: pokemon.positionY,
      delay: 350
    })
    board.getAdjacentCells(pokemon.positionX, pokemon.positionY).forEach((cell) => {
      if (cell.value && cell.value.team !== pokemon.team) {
        cell.value.handleSpecialDamage(damage, board, AttackType.PHYSICAL, pokemon, crit)
      }
    })
    pokemon.status.triggerBurn(3000, pokemon, pokemon)
  }
}
