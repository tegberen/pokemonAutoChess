import {
  SHADOW_PUNCH_FLIGHT_MS,
  SHADOW_PUNCH_LAUNCH_MS,
  SHADOW_PUNCH_WINDUP_MS
} from "../../config/game/abilities"
import { EffectEnum } from "../../types/enum/Effect"
import { AttackType, Team } from "../../types/enum/Game"
import { distanceC, distanceM } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

const FIST_DAMAGE = [40, 80, 160, 320]

type Cell = { x: number; y: number }

function isOnTeamSide(board: Board, y: number, team: Team) {
  return team === Team.BLUE_TEAM ? y < board.rows / 2 : y >= board.rows / 2
}

function getCatapultLanding(
  board: Board,
  lane: Cell[],
  from: Cell,
  team: Team
) {
  let landing: (Cell & { distance: number }) | null = null
  board.forEach((x, y, entity) => {
    if (entity || !isOnTeamSide(board, y, team)) return
    if (lane.some((cell) => cell.x === x && cell.y === y)) return
    const distance = distanceM(x, y, from.x, from.y)
    if (!landing || distance > landing.distance) landing = { x, y, distance }
  })
  return landing as (Cell & { distance: number }) | null
}

function getPunchLane(board: Board, from: Cell, to: Cell, team: Team) {
  const stepX = Math.sign(to.x - from.x)
  const stepY =
    stepX === 0 && to.y === from.y
      ? team === Team.RED_TEAM
        ? 1
        : -1
      : Math.sign(to.y - from.y)
  const lane: Cell[] = []
  for (
    let x = to.x + stepX, y = to.y + stepY;
    board.isOnBoard(x, y);
    x += stepX, y += stepY
  ) {
    lane.push({ x, y })
  }
  return lane
}

export class ShadowPunchStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    if (!target) return
    const fistDamage = FIST_DAMAGE[pokemon.stars - 1] ?? 320
    const shooter = { x: pokemon.positionX, y: pokemon.positionY }

    pokemon.commands.push(
      new DelayedCommand(() => {
        if (target.hp <= 0) return
        const start = { x: target.positionX, y: target.positionY }
        const lane = getPunchLane(board, shooter, start, target.team)
        target.handleSpecialDamage(
          fistDamage,
          board,
          AttackType.SPECIAL,
          pokemon,
          crit
        )

        for (const cell of lane) {
          const blocker = board.getEntityOnCell(cell.x, cell.y)
          if (!blocker || blocker.team !== target.team) continue
          blocker.handleSpecialDamage(
            Math.round(fistDamage / 2),
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
          const landing = getCatapultLanding(board, lane, cell, blocker.team)
          if (blocker.hp > 0 && blocker.canBeMoved && landing) {
            blocker.broadcastAbility({
              skill: "SHADOW_PUNCH_CATAPULT",
              positionX: cell.x,
              positionY: cell.y,
              targetX: landing.x,
              targetY: landing.y
            })
            blocker.moveTo(landing.x, landing.y, board, true)
          }
        }

        let targetLanding: Cell | null = null
        for (const cell of lane) {
          if (board.getEntityOnCell(cell.x, cell.y)) break
          targetLanding = cell
        }
        if (target.hp > 0 && target.canBeMoved && targetLanding) {
          pokemon.broadcastAbility({
            skill: "SHADOW_PUNCH_LAUNCH",
            positionX: start.x,
            positionY: start.y,
            targetX: targetLanding.x,
            targetY: targetLanding.y
          })
          target.moveTo(targetLanding.x, targetLanding.y, board, true)
        }

        pokemon.commands.push(
          new DelayedCommand(() => {
            if (pokemon.hp <= 0 || target.hp <= 0) return
            pokemon.effects.add(EffectEnum.SHADOW_PUNCH_NEXT_ATTACK)
            const cellNextToTarget =
              pokemon.simulation.getClosestFreeCellToPokemonEntity(
                target,
                pokemon.team
              )
            if (
              cellNextToTarget &&
              distanceC(
                cellNextToTarget.x,
                cellNextToTarget.y,
                target.positionX,
                target.positionY
              ) <= pokemon.range
            ) {
              const { x, y } = cellNextToTarget
              pokemon.moveTo(x, y, board, false)
              pokemon.toAttackingState()
              pokemon.setTarget(target)
              pokemon.resetCooldown(1000)
            }
          }, SHADOW_PUNCH_LAUNCH_MS)
        )
      }, SHADOW_PUNCH_WINDUP_MS + SHADOW_PUNCH_FLIGHT_MS)
    )
  }
}
