import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class SurprisingHandStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)

    const adjacentAllies = board
      .getAdjacentCells(pokemon.positionX, pokemon.positionY)
      .filter((cell) => cell.value && cell.value.team === pokemon.team && cell.value !== pokemon)
      .map((cell) => cell.value!)

    target.items.forEach((item) => {
      if (pokemon.items.size < 3) {
        pokemon.addItem(item)
      } else {
        const ally = adjacentAllies.find((a) => a.items.size < 3)
        if (ally) ally.addItem(item)
      }
    })
  }
}
