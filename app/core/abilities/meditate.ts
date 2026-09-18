import { Blessing } from "../../types/enum/Blessing"
import { Weather } from "../../types/enum/Weather"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

class MeditateStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)
    const hasThirdEye =
      pokemon.simulation.weather === Weather.ZEN_ZONE &&
      pokemon.player?.blessings?.includes(Blessing.THIRD_EYE) === true
    const buff = hasThirdEye ? 2 : 1
    pokemon.addAttack(buff * pokemon.baseAtk, pokemon, 1, crit)
  }
}

export const meditateStrategy = new MeditateStrategy()
