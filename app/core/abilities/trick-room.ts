import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class TrickRoomStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    
    const damage = [50, 100, 200][pokemon.stars - 1] ?? 200
    
    if (target.speed >= pokemon.speed) {
      const speedReduction = Math.floor(target.speed / 2)
      target.addSpeed(-speedReduction, pokemon, 0, false)
      target.status.triggerFatigue(5000, target, pokemon)
      target.status.triggerBlinded(5000, target, pokemon)
    } else {
      target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
    }
    
    const cells = board.getAdjacentCells(
      target.positionX,
      target.positionY,
      false
    )
    cells.forEach((cell) => {
      if (cell && cell.value && cell.value.team !== pokemon.team) {
        if (cell.value.speed >= pokemon.speed) {
          const speedReduction = Math.floor(cell.value.speed / 2)
          cell.value.addSpeed(-speedReduction, pokemon, 0, false)
          target.status.triggerFatigue(5000, target, pokemon)
          target.status.triggerBlinded(5000, target, pokemon)
        } else {
          cell.value.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
        }
      }
    })
  }
}
