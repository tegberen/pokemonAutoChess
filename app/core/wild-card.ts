import { getAltFormForPlayer, PkmsWithAltForms } from "../config"
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
import type { Rarity } from "../types/enum/Game"
import type { Pkm } from "../types/enum/Pokemon"
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
  const lines = PRECOMPUTED_POKEMONS_PER_RARITY[getWildCardRarity(state)]
  const candidates: Pkm[] = [
    ...getRegularsTier1(lines),
    ...getAdditionalsTier1(lines)
  ]
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
