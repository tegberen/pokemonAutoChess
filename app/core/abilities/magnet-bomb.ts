import { AttackType } from "../../types/enum/Game"
import { pickRandomIn } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class MagnetBombStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [15, 30, 60, 120][pokemon.stars - 1] ?? 120
    const centerDamage = [25, 50, 100, 200][pokemon.stars - 1] ?? 200
    const lockDuration = 1500

    target.handleSpecialDamage(
      centerDamage,
      board,
      AttackType.SPECIAL,
      pokemon,
      crit
    )
    target.status.triggerLocked(lockDuration, target)

    const cells = board.getAdjacentCells(
      target.positionX,
      target.positionY,
      false
    )
    cells.forEach((cell) => {
      if (cell.value && pokemon.team != cell.value.team) {
        cell.value.handleSpecialDamage(
          damage,
          board,
          AttackType.SPECIAL,
          pokemon,
          crit
        )
        cell.value.status.triggerLocked(lockDuration, cell.value)
      }
    })

    const mappingAttractCell = [
      {
        to: [target.positionX - 1, target.positionY],
        from: [[target.positionX - 2, target.positionY]]
      },
      {
        to: [target.positionX + 1, target.positionY],
        from: [[target.positionX + 2, target.positionY]]
      },
      {
        to: [target.positionX, target.positionY - 1],
        from: [[target.positionX, target.positionY - 2]]
      },
      {
        to: [target.positionX, target.positionY + 1],
        from: [[target.positionX, target.positionY + 2]]
      },
      {
        to: [target.positionX - 1, target.positionY - 1],
        from: [
          [target.positionX - 2, target.positionY - 1],
          [target.positionX - 2, target.positionY - 2],
          [target.positionX - 1, target.positionY - 2]
        ]
      },
      {
        to: [target.positionX + 1, target.positionY - 1],
        from: [
          [target.positionX + 2, target.positionY - 1],
          [target.positionX + 2, target.positionY - 2],
          [target.positionX + 1, target.positionY - 2]
        ]
      },
      {
        to: [target.positionX - 1, target.positionY + 1],
        from: [
          [target.positionX - 2, target.positionY + 1],
          [target.positionX - 2, target.positionY + 2],
          [target.positionX - 1, target.positionY + 2]
        ]
      },
      {
        to: [target.positionX + 1, target.positionY + 1],
        from: [
          [target.positionX + 2, target.positionY + 1],
          [target.positionX + 2, target.positionY + 2],
          [target.positionX + 1, target.positionY + 2]
        ]
      }
    ]

    mappingAttractCell.forEach((cell) => {
      const attractedEnemies = cell.from
        .map(([x, y]) => board.getEntityOnCell(x, y))
        .filter((enemy) => enemy && enemy.team === target.team)
      const [destX, destY] = cell.to
      if (
        attractedEnemies.length > 0 &&
        board.getEntityOnCell(destX, destY) === undefined
      ) {
        const attractedEnemy = pickRandomIn(attractedEnemies)!
        attractedEnemy.moveTo(destX, destY, board, true)
        attractedEnemy.status.triggerLocked(lockDuration, attractedEnemy)
      }
    })
  }
}
