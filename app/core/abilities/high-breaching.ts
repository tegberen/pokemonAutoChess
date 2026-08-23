import {
  HIGH_BREACHING_CRASH_DELAY,
  HIGH_BREACHING_CRASH_RANGE,
  HIGH_BREACHING_LEAP_EVERY
} from "../../types/enum/Blessing"
import { AttackType, Team } from "../../types/enum/Game"
import { OrientationVector } from "../../utils/orientation"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

function washOffBoard(
  enemy: PokemonEntity,
  caster: PokemonEntity,
  board: Board,
  crit: boolean
) {
  if (
    !enemy.canBeMoved ||
    enemy.status.resurrection ||
    enemy.status.magicBounce ||
    enemy.status.protect
  )
    return
  enemy.cooldown = 9999
  const { death } = enemy.handleSpecialDamage(
    9999,
    board,
    AttackType.TRUE,
    caster,
    crit
  )
  if (!death) {
    caster.state.triggerDeath(enemy, caster, board, AttackType.TRUE)
  }
}

export class HighBreachingStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)
    const shield = [15, 30, 60][pokemon.stars - 1] ?? 60
    const splashDamage = [10, 20, 40][pokemon.stars - 1] ?? 40

    pokemon.addShield(shield, pokemon, 1, crit)
    board
      .getAdjacentCells(pokemon.positionX, pokemon.positionY)
      .forEach((cell) => {
        if (cell.value && cell.value.team !== pokemon.team) {
          cell.value.handleSpecialDamage(
            splashDamage,
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
        }
      })

    // count.ult was incremented by super.process, and resets with the entity
    if (pokemon.count.ult % HIGH_BREACHING_LEAP_EVERY !== 0) return

    const opponentTeam =
      pokemon.team === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM
    const landing = pokemon.state.getMostSurroundedCoordinateAvailablePlace(
      opponentTeam,
      board
    )
    if (!landing) return

    pokemon.skydiveTo(landing.x, landing.y, board)
    pokemon.commands.push(
      new DelayedCommand(() => {
        pokemon.broadcastAbility({
          skill: "HIGH_BREACHING_CRASH",
          positionX: landing.x,
          positionY: landing.y,
          targetX: landing.x,
          targetY: landing.y
        })
        const crashDamage = [60, 120, 240][pokemon.stars - 1] ?? 240
        board
          .getCellsInRange(landing.x, landing.y, HIGH_BREACHING_CRASH_RANGE, false)
          .forEach((cell) => {
            const enemy = cell.value
            if (!enemy || enemy.team === pokemon.team) return
            enemy.handleSpecialDamage(
              crashDamage,
              board,
              AttackType.SPECIAL,
              pokemon,
              crit
            )
            if (enemy.hp <= 0) return

            const orientation = board.orientation(
              landing.x,
              landing.y,
              enemy.positionX,
              enemy.positionY,
              pokemon,
              undefined
            )
            const [dx, dy] = OrientationVector[orientation]
            const destinationX = enemy.positionX + dx
            const destinationY = enemy.positionY + dy
            if (!board.isOnBoard(destinationX, destinationY)) {
              washOffBoard(enemy, pokemon, board, crit)
            } else if (!board.getEntityOnCell(destinationX, destinationY)) {
              enemy.moveTo(destinationX, destinationY, board, true)
              enemy.resetCooldown(500)
            }
          })
      }, HIGH_BREACHING_CRASH_DELAY)
    )
  }
}
