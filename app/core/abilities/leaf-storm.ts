import { Ability } from "../../types/enum/Ability"
import type { Board } from "../board"
import { LeafStorm } from "../leaf-storm"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class LeafStormStrategy extends AbilityStrategy {
  requiresTarget = false
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    pokemon.broadcastAbility({
      skill: Ability.LEAF_STORM,
      casterId: pokemon.id
    })
    pokemon.simulation.leafStorms.push(
      new LeafStorm(
        pokemon,
        pokemon.team,
        pokemon.positionX,
        pokemon.positionY,
        crit
      )
    )
  }
}
