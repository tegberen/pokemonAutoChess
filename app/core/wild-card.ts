import { getAltFormForPlayer, PkmsWithAltForms, UniquePool } from "../config"
import {
  WILD_CARD_CANDIDATES,
  WILD_CARD_RARITIES
} from "../config/game/wild-card"
import type Player from "../models/colyseus-models/player"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import {
  getAdditionalsTier1,
  getRegularsTier1
} from "../models/precomputed/precomputed-pokemon-data"
import {
  PRECOMPUTED_POKEMONS_PER_RARITY
} from "../models/precomputed/precomputed-rarity"
import type GameState from "../rooms/states/game-state"
import { Rarity } from "../types/enum/Game"
import { type Pkm, PkmDuos } from "../types/enum/Pokemon"
import { pickNRandomIn } from "../utils/random"

// deterministic per lobby, so every player draws from the same rarity
export function getWildCardRarity(state: GameState): Rarity {
  const hash = Array.from(state.preparationId).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  )
  return WILD_CARD_RARITIES[hash % WILD_CARD_RARITIES.length]
}

export function pickWildCardCandidates(player: Player, state: GameState) {
  const rarity = getWildCardRarity(state)
  const lines = PRECOMPUTED_POKEMONS_PER_RARITY[rarity]
  // Uniques are single-stage, so they come from the carousel's own list
  const candidates: Pkm[] =
    rarity === Rarity.UNIQUE
      ? UniquePool.filter((pkm): pkm is Pkm => !(pkm in PkmDuos))
      : [...getRegularsTier1(lines), ...getAdditionalsTier1(lines)]
  return pickNRandomIn(candidates, WILD_CARD_CANDIDATES).map((pkm) =>
    PkmsWithAltForms.includes(pkm) ? getAltFormForPlayer(pkm, player) : pkm
  )
}

// free and locked on the board, like Supportive Soul's Substitute, but it
// keeps its items free to change
export function makeWildCardLeader(pokemon: Pokemon) {
  pokemon.wildCardLeader = true
  pokemon.canBeBenched = false
}
