import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class BehemothBashStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const baseDamage = [30, 60, 90, 120, 240][pokemon.stars - 1] ?? 240
    const damage = baseDamage + 2 * pokemon.def
    target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)

    const orientation = board.orientation(
      pokemon.positionX,
      pokemon.positionY,
      target.positionX,
      target.positionY,
      pokemon,
      undefined
    )

    const destination = board.getKnockBackPlace(
      target.positionX,
      target.positionY,
      orientation
    )

    if (destination) {
      pokemon.moveTo(destination.x, destination.y, board, false)
    }
  }
}
