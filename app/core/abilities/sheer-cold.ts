import {
  Blessing,
  FROST_BURST_EXECUTE_CHANCE_RATIO,
  FROST_BURST_SPLASH_RATIO
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import { Synergy } from "../../types/enum/Synergy"
import { min } from "../../utils/number"
import { chance } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

function sheerColdExecuteChance(
  pokemon: PokemonEntity,
  target: PokemonEntity
): number {
  if (target.types.has(Synergy.ICE)) return 0
  if (target.status.freeze) return 1
  return (
    ([0.1, 0.2, 0.3, 0.6][pokemon.stars - 1] ?? 0.6) *
    (1 + min(0)((pokemon.hp - target.hp) / target.hp))
  )
}

export class SheerColdStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const baseDamage = [50, 100, 200, 400][pokemon.stars - 1] ?? 400
    const executed = chance(sheerColdExecuteChance(pokemon, target), pokemon)
    const { death, takenDamage } = target.handleSpecialDamage(
      executed ? 9999 : baseDamage,
      board,
      AttackType.SPECIAL,
      pokemon,
      crit,
      true
    )

    if (!death || !pokemon.heroBlessings?.has(Blessing.FROST_BURST)) return

    // splash KOs deliberately do not splash again: the effect cannot chain
    board
      .getAdjacentCells(target.positionX, target.positionY)
      .map((cell) => cell.value)
      .filter(
        (enemy): enemy is PokemonEntity =>
          enemy != null && enemy.team !== pokemon.team && enemy.hp > 0
      )
      .forEach((enemy) => {
        const splashExecuted = chance(
          sheerColdExecuteChance(pokemon, enemy) *
            FROST_BURST_EXECUTE_CHANCE_RATIO,
          pokemon
        )
        enemy.handleSpecialDamage(
          splashExecuted
            ? 9999
            : Math.round(takenDamage * FROST_BURST_SPLASH_RATIO),
          board,
          AttackType.SPECIAL,
          pokemon,
          crit,
          true
        )
      })
  }
}
