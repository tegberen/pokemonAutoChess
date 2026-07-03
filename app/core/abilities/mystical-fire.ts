import { Ability } from "../../types/enum/Ability"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class MysticalFireStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)

    const cells = board.getAdjacentCells(
      target.positionX,
      target.positionY,
      true
    )
    const burnDuration = Math.round(
      ([1000, 2000, 3000, 6000][pokemon.stars - 1] ?? 6000) *
        (1 + pokemon.ap / 100) *
        (crit ? pokemon.critPower : 1)
    )

    cells.forEach((cell) => {
      if (!cell.value || cell.value.team === pokemon.team) return
      const enemy = cell.value

      for (let i = 0; i < 4; i++) {
        enemy.handleSpecialDamage(pokemon.atk * 0.3, board, AttackType.SPECIAL, pokemon, crit)
        enemy.addAbilityPower(-3, pokemon, 1, crit)
        if (enemy.ap < 0) {
          enemy.status.triggerBurn(burnDuration, enemy, pokemon)
        }
      }
    })

    pokemon.broadcastAbility({ skill: Ability.MYSTICAL_FIRE })
  }
}
