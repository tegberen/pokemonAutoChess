import { GoldenEggItems } from "../../config"
import type Player from "../../models/colyseus-models/player"
import type { Pokemon } from "../../models/colyseus-models/pokemon"
import { Item } from "../../types"
import { Blessing } from "../../types/enum/Blessing"
import { Pkm } from "../../types/enum/Pokemon"
import { pickRandomIn } from "../../utils/random"
import { EvolutionHandler } from "./evolution-handler"
import { getHatchTime } from "./hatch-time"

export class HatchEvolutionHandler extends EvolutionHandler {
  canEvolve(pokemon: Pokemon, player: Player): boolean {
    if (pokemon.items.has(Item.EVIOLITE)) return false
    if (!player.board.has(pokemon.id)) return false // egg has been sold in the meantime
    pokemon.stacksRequired = getHatchTime(pokemon, player)
    return pokemon.stacks >= pokemon.stacksRequired
  }

  evolve(pokemon: Pokemon, player: Player): Pokemon {
    pokemon.stacks = 0 // prevent trying to evolve twice in a row
    const pokemonEvolutionName = this.getEvolution(pokemon, player)
    const pokemonEvolved = player.transformPokemon(
      pokemon,
      pokemonEvolutionName
    )

    if (pokemonEvolved != null && pokemon.name === Pkm.EGG && pokemon.shiny) {
      /* SELECTIVE_GENETICS replaces the automatic drop with a choice of three,
         opened in EvolutionManager.afterEvolve */
      if (!player.blessings?.includes(Blessing.SELECTIVE_GENETICS)) {
        player.items.push(pickRandomIn(GoldenEggItems))
      }
    }

    return pokemonEvolved
  }
}
