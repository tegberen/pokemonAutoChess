import PokemonFactory from "../../models/pokemon-factory"
import { Pkm } from "../../types/enum/Pokemon"
import { min } from "../../utils/number"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class PeckStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)
    const spearow = PokemonFactory.createPokemonFromName(
      Pkm.SPEAROW,
      pokemon.player
    )
    const coord = pokemon.simulation.getClosestFreeCellToPokemonEntity(pokemon)
    if (!coord) return
    const entity = pokemon.simulation.addPokemon(
      spearow,
      coord.x,
      coord.y,
      pokemon.team,
      true
    )
    const hpRatio = [0.5, 1][pokemon.stars - 1] ?? 1
    const scale =
      hpRatio * (1 + pokemon.ap / 100) * (crit ? pokemon.critPower : 1)
    entity.maxHP = min(1)(Math.round(entity.maxHP * scale))
    entity.hp = entity.maxHP
  }
}
