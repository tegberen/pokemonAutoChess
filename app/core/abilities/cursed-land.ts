import { AttackType } from "../../types/enum/Game"
import { pickRandomIn } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class CursedLandStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const apBonus = [25, 25, 25, 50][pokemon.stars - 1] ?? 50
    const damage = [0.5, 0.5, 0.5, 0.75][pokemon.stars - 1] ?? 0.75

    const silenceDuration = Math.round(
      2000 * (1 + pokemon.ap / 100) * (crit ? pokemon.critPower : 1)
    )

    const roll = pickRandomIn([0, 1])

    board.getCellsInRadius(pokemon.positionX, pokemon.positionY, 2, false)
      .forEach((cell) => {
        if (!cell.value) return
        const entity = cell.value

        if (entity.team === pokemon.team) {
          entity.addAbilityPower(apBonus, pokemon, 1, crit)
          return
        }

        if (roll === 0) {
          entity.handleSpecialDamage(
            Math.ceil(entity.maxHP*damage),
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
        } else {
          entity.status.triggerSilence(silenceDuration, entity, pokemon)
        }
      })
  }
}
