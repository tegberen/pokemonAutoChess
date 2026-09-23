import {
  Blessing,
  STONE_SADDLE_EXECUTE_THRESHOLD
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import { calcAngleDegrees } from "../../utils/number"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class HeadlongRushStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const finalTargetDamage = [20, 40, 80, 160][pokemon.stars - 1] ?? 160
    const damageOnThePath = [10, 20, 30, 60][pokemon.stars - 1] ?? 60
    const farthestCoordinate =
      board.getFarthestTargetCoordinateAvailablePlace(pokemon)
    const farthestEnemy = farthestCoordinate?.target ?? target
    const targetsHit: Set<PokemonEntity> = new Set()

    const hitEnemy = (enemy: PokemonEntity, damage: number) => {
      targetsHit.add(enemy)
      enemy.handleSpecialDamage(
        damage,
        board,
        AttackType.SPECIAL,
        pokemon,
        crit
      )

      const executesWeakened = pokemon.heroBlessings?.has(
        Blessing.STONE_SADDLE
      )
      if (
        executesWeakened &&
        enemy.hp > 0 &&
        enemy.hp < STONE_SADDLE_EXECUTE_THRESHOLD * enemy.maxHP
      ) {
        enemy.handleSpecialDamage(
          9999,
          board,
          AttackType.TRUE,
          pokemon,
          false,
          false
        )
      }

      pokemon.addDefense(-1, pokemon, 0, false)
      pokemon.addSpecialDefense(-1, pokemon, 0, false)
    }

    if (farthestCoordinate) {
      pokemon.broadcastAbility({
        targetX: farthestCoordinate.x,
        targetY: farthestCoordinate.y
      })
      const cells = board.getCellsBetween(
        pokemon.positionX,
        pokemon.positionY,
        farthestCoordinate.x,
        farthestCoordinate.y
      )
      cells.forEach((cell) => {
        const enemy = cell.value
        if (
          !enemy ||
          enemy.team === pokemon.team ||
          enemy === farthestEnemy ||
          targetsHit.has(enemy)
        )
          return
        hitEnemy(enemy, damageOnThePath)
        if (enemy.hp <= 0) return

        // Push path enemies 1 tile to the side of the rush
        const rushAngle = calcAngleDegrees(
          farthestCoordinate.x - pokemon.positionX,
          farthestCoordinate.y - pokemon.positionY
        )
        const targetAngle = calcAngleDegrees(
          enemy.positionX - pokemon.positionX,
          enemy.positionY - pokemon.positionY
        )

        const dx =
          (rushAngle > 180 ? -1 : 1) * (targetAngle < rushAngle ? +1 : -1)

        const newX = cell.x + dx
        if (
          board.isOnBoard(newX, cell.y) &&
          board.getEntityOnCell(newX, cell.y) === undefined
        ) {
          enemy.moveTo(newX, cell.y, board, true)
          enemy.cooldown = 500
        }
      })

      pokemon.moveTo(farthestCoordinate.x, farthestCoordinate.y, board, false)
    }

    hitEnemy(farthestEnemy, finalTargetDamage)
  }
}
