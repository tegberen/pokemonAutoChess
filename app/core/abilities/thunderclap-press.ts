import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class ThunderClapPressStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [15, 30, 60, 120][pokemon.stars - 1] ?? 120
    const duration = 3000

    const cells = board.getCellsBetween(
      pokemon.positionX,
      pokemon.positionY,
      target.positionX,
      target.positionY
    )

    const targetsHit: Set<PokemonEntity> = new Set()
    cells.forEach((cell) => {
      if (cell.value && cell.value.team !== pokemon.team) {
        targetsHit.add(cell.value)
      }
    })
    targetsHit.add(target)

    targetsHit.forEach((enemy) => {
      enemy.status.triggerParalysis(duration, enemy, pokemon)
      enemy.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
      const teleportationCell = board.getTeleportationCell(
        enemy.positionX,
        enemy.positionY,
        enemy.team
      )
      if (teleportationCell) {
        enemy.moveTo(teleportationCell.x, teleportationCell.y, board, true)
      }
    })
  }
}
