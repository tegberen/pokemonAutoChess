import { AttackType } from "../../types/enum/Game"
import { type Board, effectInLine } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class PrecipiceBladesStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [25, 50, 100, 120, 240][pokemon.stars - 1] ?? 240
    effectInLine(board, pokemon, target, (cell) => {
      if (cell.x === pokemon.positionX && cell.y === pokemon.positionY) return
      pokemon.broadcastAbility({ positionX: cell.x, positionY: cell.y })
      if (cell.value == null || cell.value.team === pokemon.team) return
      cell.value.handleSpecialDamage(
        damage,
        board,
        AttackType.SPECIAL,
        pokemon,
        crit
      )
    })
  }
}
