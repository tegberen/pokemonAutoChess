import PokemonFactory from "../../models/pokemon-factory"
import { Pkm } from "../../types/enum/Pokemon"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class DefendOrderStrategy extends AbilityStrategy {
  requiresTarget = false
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)

    const combee = PokemonFactory.createPokemonFromName(
      Pkm.COMBEE,
      pokemon.player
    )
    const coord = pokemon.state.getNearestAvailablePlaceCoordinates(
      pokemon,
      board
    )
    if (coord) {
      if (pokemon.player) pokemon.player.pokemonsPlayed.add(Pkm.COMBEE)
      pokemon.simulation.addPokemon(
        combee,
        coord.x,
        coord.y,
        pokemon.team,
        true
      )
    }

    const shield = [5, 10, 20, 40][pokemon.stars - 1] ?? 40
    let nbCombeeAllies = 0
    board.forEach((x, y, p) => {
      if (p && p.team === pokemon.team && p.name === Pkm.COMBEE) {
        p.addShield(shield, pokemon, 1, crit)
        nbCombeeAllies++
        pokemon.broadcastAbility({
          skill: "DEFEND_ORDER",
          positionX: x,
          positionY: y
        })
      }
    })

    pokemon.addShield(shield + nbCombeeAllies * shield, pokemon, 1, crit)
  }
}
