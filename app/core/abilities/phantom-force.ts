import { Ability } from "../../types/enum/Ability"
import { AttackType, Damage, Team } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class PhantomForceStrategy extends AbilityStrategy {
  canCritByDefault = true
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)

    const silenceDuration = 2000
    board.forEach((x: number, y: number, enemy: PokemonEntity | undefined) => {
      if (enemy && enemy.team !== pokemon.team) {
        enemy.status.triggerSilence(silenceDuration, enemy)
      }
    })

    const opponentTeam =
      pokemon.team === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM
    const mostSurroundedCoordinate =
      pokemon.state.getMostSurroundedCoordinateAvailablePlace(opponentTeam, board)
    if (mostSurroundedCoordinate) {
      pokemon.broadcastAbility({
        skill: Ability.NIGHTMARE,
        positionX: pokemon.positionX,
        positionY: pokemon.positionY
      })
      pokemon.status.vanishing = true
      pokemon.commands.push(
        new DelayedCommand(() => {
          pokemon.moveTo(
            mostSurroundedCoordinate.x,
            mostSurroundedCoordinate.y,
            board,
            false
          )
          pokemon.status.vanishing = false
          pokemon.resetCooldown(666) //cooldown, so its not invincible
          pokemon.broadcastAbility({
            positionX: mostSurroundedCoordinate.x,
            positionY: mostSurroundedCoordinate.y,
            targetX: mostSurroundedCoordinate.x,
            targetY: mostSurroundedCoordinate.y
          })
          const cells = board.getAdjacentCells(
            mostSurroundedCoordinate.x,
            mostSurroundedCoordinate.y
          )
          cells.forEach((cell) => {
            if (cell.value && cell.value.team !== pokemon.team) {
              const isVulnerable =
                cell.value.status.silence || cell.value.status.fatigue
              const damageBase = [10,20,40,60,80][pokemon.stars - 1] ?? 80
              const damage = isVulnerable ? (2* damageBase) : damageBase
              cell.value.handleSpecialDamage(
                damage,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit
              )
            }
          })
        }, 1000)
      )
    }
  }
}
