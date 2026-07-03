import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class FakeTearsStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [10, 20, 30, 60][pokemon.stars - 1] ?? 60
    const shred = [3, 6, 9, 18][pokemon.stars - 1] ?? 18
    board
      .getCellsInRadius(pokemon.positionX, pokemon.positionY, 5, true)
      .forEach((cell) => {
        if (cell.value && cell.value.team !== pokemon.team) {
          const enemy = cell.value
          if (enemy.status.armorReduction) {
            enemy.status.triggerArmorReduction(3000, enemy)
            enemy.addSpecialDefense(-shred, pokemon, 0, false)
          } else {
            enemy.status.triggerArmorReduction(3000, enemy)
          }
          pokemon.broadcastAbility({ positionX: cell.x, positionY: cell.y })
          enemy.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
        }
      })
  }
}
