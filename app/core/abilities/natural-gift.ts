import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class NaturalGiftStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit, true)

    const lowestHealthAlly = (
      board.cells.filter(
        (cell) => cell && cell.team === pokemon.team
      ) as PokemonEntity[]
    ).sort((a, b) => a.hp / a.maxHP - b.hp / b.maxHP)[0]
    const heal = [20, 40, 80, 160][pokemon.stars - 1] ?? 160

    if (lowestHealthAlly) {
      lowestHealthAlly.handleHeal(heal, pokemon, 1, crit)
      lowestHealthAlly.status.triggerRuneProtect(
        pokemon.stars * 1000,
        lowestHealthAlly,
        pokemon
      )
      pokemon.broadcastAbility({
        targetX: lowestHealthAlly.positionX,
        targetY: lowestHealthAlly.positionY
      })
    }
  }
}
