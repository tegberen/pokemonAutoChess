import { AttackType, Team } from "../../types/enum/Game"
import { spacesBetween } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

const SLEEP_DURATION = 2000
const BASE_DAMAGE = 10
const DAMAGE_PER_TILE = 10
const POWDER_TRAVEL_TIME = 1000

export class SleepPowderStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit, true)
    const count = [1, 2, 3, 5][pokemon.stars - 1] ?? 5
    const enemiesBacklineFirst = board.cells
      .filter(
        (cell): cell is PokemonEntity =>
          cell != null && cell.team !== pokemon.team
      )
      .sort((a, b) =>
        a.team === Team.BLUE_TEAM
          ? a.positionY - b.positionY
          : b.positionY - a.positionY
      )

    enemiesBacklineFirst.slice(0, count).forEach((enemy) => {
      pokemon.broadcastAbility({
        targetX: enemy.positionX,
        targetY: enemy.positionY
      })
      pokemon.commands.push(
        new DelayedCommand(() => {
          if (enemy.hp <= 0 || enemy.team === pokemon.team) return
          const tilesBetween = spacesBetween(
            pokemon.positionX,
            pokemon.positionY,
            enemy.positionX,
            enemy.positionY
          )
          enemy.status.triggerSleep(SLEEP_DURATION, enemy)
          enemy.handleSpecialDamage(
            BASE_DAMAGE + DAMAGE_PER_TILE * tilesBetween,
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
        }, POWDER_TRAVEL_TIME)
      )
    })
  }
}
