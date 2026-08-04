import { Blessing } from "../../types/enum/Blessing"
import { Synergy } from "../../types/enum/Synergy"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

function roost(pokemon: PokemonEntity, board: Board, crit: boolean) {
  const shield = [20, 40, 80, 160][pokemon.stars - 1] ?? 160
  pokemon.flyAway(board, false)
  pokemon.status.triggerSleep(1000, pokemon)
  pokemon.addShield(shield, pokemon, 1, crit)
}

export class RoostStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)

    /* neighbours are collected before the caster roosts, since flying away
       moves it to another cell */
    const flyingNeighbours = pokemon.heroBlessings?.has(Blessing.ROOSTING_FLOCK)
      ? board
          .getAdjacentCells(pokemon.positionX, pokemon.positionY)
          .map((cell) => cell.value)
          .filter(
            (ally): ally is PokemonEntity =>
              ally != null &&
              ally.team === pokemon.team &&
              ally.hp > 0 &&
              ally.types.has(Synergy.FLYING)
          )
      : []

    roost(pokemon, board, crit)
    flyingNeighbours.forEach((ally) => roost(ally, board, crit))
  }
}
