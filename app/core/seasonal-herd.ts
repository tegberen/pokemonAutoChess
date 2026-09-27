import type Player from "../models/colyseus-models/player"
import PokemonFactory from "../models/pokemon-factory"
import type GameState from "../rooms/states/game-state"
import {
  SEASONAL_HERD_DEERLINGS,
  SEASONAL_HERD_SEASON_SYNERGIES,
  SEASONAL_HERD_SYNERGY_TO_UNLOCK_NEXT
} from "../types/enum/Blessing"
import { getBenchSize, getFirstAvailablePositionInBench } from "../utils/board"

export function unlockNextSeasonalHerdDeerling(
  player: Player,
  state: GameState
) {
  const unlocked = player.seasonalHerdUnlockedDeerlings
  const latest = unlocked.at(-1)
  if (!latest || unlocked.length >= SEASONAL_HERD_DEERLINGS.length) return
  const latestSeasonIndex = SEASONAL_HERD_DEERLINGS.indexOf(latest)
  const latestSeasonSynergy = SEASONAL_HERD_SEASON_SYNERGIES[latestSeasonIndex]
  if (
    (player.synergies.get(latestSeasonSynergy) ?? 0) <
    SEASONAL_HERD_SYNERGY_TO_UNLOCK_NEXT
  ) {
    return
  }

  // a full bench leaves it locked, so the next round tries again
  const freeBenchX = getFirstAvailablePositionInBench(
    player.board,
    getBenchSize(player.blessings)
  )
  if (freeBenchX === null) return

  const nextDeerling =
    SEASONAL_HERD_DEERLINGS[
      (latestSeasonIndex + 1) % SEASONAL_HERD_DEERLINGS.length
    ]
  const deerling = PokemonFactory.createPokemonFromName(nextDeerling, player)
  deerling.positionX = freeBenchX
  deerling.positionY = 0
  player.board.set(deerling.id, deerling)
  deerling.onAcquired(player)
  unlocked.push(nextDeerling)
  state.shop.addAdditionalPokemon(nextDeerling, state, true)
  player.updateSynergies()
}
