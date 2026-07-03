import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class PrimalRoarStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)
    const speedBonus = [4, 8, 10, 20][pokemon.stars - 1] ?? 20
    const atkBonus = [4, 8, 10, 20][pokemon.stars - 1] ?? 20
    pokemon.addAttack(atkBonus, pokemon, 1, crit)
    pokemon.addSpeed(speedBonus, pokemon, 1, crit)
    const rageDuration = pokemon.count.ult * 1000
    board.cells
      .filter<PokemonEntity>(
        (cell): cell is PokemonEntity =>
          cell !== undefined &&
          cell.team === pokemon.team &&
          cell.hp > 0
      )
      .forEach((ally) => {
        ally.status.triggerRage(1000 + rageDuration, ally)
      })
  }
}
