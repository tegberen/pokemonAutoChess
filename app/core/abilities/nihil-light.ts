import { AttackType } from "../../types/enum/Game"
import { max, min } from "../../utils/number"
import { type Board, effectInLine } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class NihilLightStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damageBase = [10,20,40,80,160][pokemon.stars - 1] ?? 160
    let distanceFromTarget = 0
    effectInLine(board, pokemon, target, (cell) => {
      if (cell.value != null && cell.value.team !== pokemon.team) {
        const enemy = cell.value
        const damage = Math.max(16, damageBase - distanceFromTarget * 16)

        enemy.handleSpecialDamage(damage, board, AttackType.TRUE, pokemon, crit)

        if (enemy.hp > enemy.baseHP) {
          enemy.maxHP = enemy.baseHP
          enemy.hp = Math.min(enemy.hp, enemy.baseHP)
        }

        distanceFromTarget++
      }
    })
  }
}
