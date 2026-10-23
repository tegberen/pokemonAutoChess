import { AttackType, Team } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class SmashingWingStrategy extends AbilityStrategy {
  requireTarget = false
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const damage = [15, 30, 60, 120][pokemon.stars - 1] ?? 120


    const mostSurroundedCoordinate =
      pokemon.state.getMostSurroundedCoordinateAvailablePlace(
        pokemon.team === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM,
        board
      )

    if (mostSurroundedCoordinate) {
      pokemon.moveTo(mostSurroundedCoordinate.x, mostSurroundedCoordinate.y, board, false)
      pokemon.commands.push(
        new DelayedCommand(() => {
          pokemon.broadcastAbility({
            positionX: pokemon.positionX,
            positionY: pokemon.positionY
          })
          board.getAdjacentCells(pokemon.positionX, pokemon.positionY).forEach((cell) => {
            if (cell.value && cell.value.team !== pokemon.team) {
              cell.value.handleSpecialDamage(
                damage,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit
              )
              cell.value.addAbilityPower(-20, pokemon, 0, false)
            }
          })
        }, 300)
      )
    }
  }
}
