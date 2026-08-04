import {
  Blessing,
  SOUL_DRAIN_FRAGMENTS_ON_KILL,
  SOUL_DRAIN_HEAL
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class HexStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [20, 40, 60, 120] [pokemon.stars - 1] ?? 120
    const { death } = target.handleSpecialDamage(
      target.status.hasNegativeStatus() ? damage * 2 : damage,
      board,
      AttackType.SPECIAL,
      pokemon,
      crit
    )

    if (!pokemon.heroBlessings?.has(Blessing.SOUL_DRAIN)) return

    const nbFragments = death ? SOUL_DRAIN_FRAGMENTS_ON_KILL : 1
    const totalHeal = SOUL_DRAIN_HEAL * nbFragments
    for (let i = 0; i < nbFragments; i++) {
      pokemon.broadcastAbility({
        skill: "GHOST_RANGE",
        positionX: target.positionX,
        positionY: target.positionY,
        targetX: pokemon.positionX,
        targetY: pokemon.positionY,
        delay: i
      })
    }

    // the fragments travel back to the caster, healing every ally on the way
    board
      .getCellsBetween(
        target.positionX,
        target.positionY,
        pokemon.positionX,
        pokemon.positionY
      )
      .forEach((cell) => {
        if (cell.value && cell.value.team === pokemon.team) {
          cell.value.handleHeal(totalHeal, pokemon, 1, crit)
        }
      })
  }
}
