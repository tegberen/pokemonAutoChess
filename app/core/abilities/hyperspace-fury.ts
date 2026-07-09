import { chance } from "../../utils/random"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class HyperspaceFuryStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    crit = chance(pokemon.critChance / 100, pokemon) // can crit by default with increased crit chance
    super.process(pokemon, board, target, crit, true)
    const baseHits = [6, 6, 6, 6, 12][pokemon.stars - 1] ?? 12
    const nbHits = Math.round(
      baseHits * (1 + pokemon.ap / 100) * (crit ? pokemon.critPower : 1)
    )
    for (let i = 0; i < nbHits; i++) {
      target.addDefense(-1, pokemon, 0, false)
      target.addSpecialDefense(-1, pokemon, 0, false)
      target.handleSpecialDamage(
        20,
        board,
        AttackType.SPECIAL,
        pokemon,
        false,
        false
      )
    }
    pokemon.broadcastAbility({
      targetX: target.positionX,
      targetY: target.positionY,
      orientation: nbHits // use orientation field for the number of hits
    })
  }
}
