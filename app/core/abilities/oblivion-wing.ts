import { AttackType } from "../../types/enum/Game"
import { type Board, effectInLine } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class OblivionWingStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const corner = board.getTeleportationCell(
      pokemon.positionX,
      pokemon.positionY,
      pokemon.team
    )
    if (corner) {
      const targetX = target.positionX
      const targetY = target.positionY
      pokemon.moveTo(corner.x, corner.y, board, false)
      pokemon.range = pokemon.baseRange + 10 // increase range
      pokemon.commands.push(
        new DelayedCommand(() => {
          pokemon.range = pokemon.baseRange
        }, 3000)
      )
      pokemon.commands.push(
        new DelayedCommand(() => {
          pokemon.broadcastAbility({
            positionX: corner.x,
            positionY: corner.y,
            targetX: targetX,
            targetY: targetY
          })
          let totalDamage = 0
          effectInLine(board, pokemon, { positionX: targetX, positionY: targetY } as PokemonEntity, (cell) => {
            if (cell.value != null && cell.value.team !== pokemon.team) {
              const { takenDamage } = cell.value.handleSpecialDamage(
                100,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit
              )
              totalDamage += takenDamage
            }
          })
          if (totalDamage > 0) {
            pokemon.handleHeal(Math.round(0.75 * totalDamage), pokemon, 0, false)
          }
        }, 550)
      )
    }
  }
}
