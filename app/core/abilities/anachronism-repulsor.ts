import { Ability } from "../../types/enum/Ability"
import { AttackType } from "../../types/enum/Game"
import { Synergy } from "../../types/enum/Synergy"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class AnachronismRepulsorStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [10, 10, 10, 20][pokemon.stars - 1] ?? 20
    const duration = 2000

    let protectedCount = 0
    board.forEach((x: number, y: number, ally: PokemonEntity | undefined) => {
      if (
        ally &&
        ally.team === pokemon.team &&
        (ally === pokemon || [...pokemon.types].some((type) => ally.types.has(type)))
      ) {
        protectedCount++
      }
    })
    const baseDamage = damage * protectedCount

    board.forEach((x: number, y: number, ally: PokemonEntity | undefined) => {
      if (
        ally &&
        ally.team === pokemon.team &&
        (ally === pokemon || [...pokemon.types].some((type) => ally.types.has(type)))
      ) {
        board.getAdjacentCells(ally.positionX, ally.positionY).forEach((cell) => {
          if (cell.value && cell.value.team !== ally.team) {
            const isFossilOrAquatic =
              cell.value.types.has(Synergy.AQUATIC) ||
              cell.value.types.has(Synergy.FOSSIL)
            const attackType = isFossilOrAquatic
              ? AttackType.TRUE
              : AttackType.SPECIAL
            cell.value.handleSpecialDamage(
              baseDamage,
              board,
              attackType,
              ally,
              crit
            )
          }
        })

        ally.status.triggerProtect(duration)
        ally.broadcastAbility({
          skill: Ability.ANACHRONISM_REPULSOR,
          positionX: ally.positionX,
          positionY: ally.positionY
        })
      }
    })
  }
}
