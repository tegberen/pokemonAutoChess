import type Player from "../models/colyseus-models/player"
import type GameState from "../rooms/states/game-state"
import { GameMode } from "../types/enum/Game"

/* Double Up syncs both partners down to the lower of their two lives at the end
   of every round, so life given to one of them alone is clamped straight back
   off. Every heal of player life has to reach the partner as well. */
export function healPlayerLife(
  player: Player,
  amount: number,
  state: GameState
) {
  const heal = (target: Player) => {
    target.life = Math.min(target.maxLife, target.life + amount)
  }
  heal(player)
  if (state.gameMode === GameMode.DOUBLE_UP && player.doubleUpPartnerId) {
    const partner = state.players.get(player.doubleUpPartnerId)
    if (partner?.alive) heal(partner)
  }
}

/* Counterpart of healPlayerLife: a life cost willingly paid is paid by the duo,
   so it stays symmetric with the heals they also share. */
export function sacrificePlayerLife(
  player: Player,
  amount: number,
  state: GameState
) {
  const sacrifice = (target: Player) => {
    target.life = Math.max(1, target.life - amount)
  }
  sacrifice(player)
  if (state.gameMode === GameMode.DOUBLE_UP && player.doubleUpPartnerId) {
    const partner = state.players.get(player.doubleUpPartnerId)
    if (partner?.alive) sacrifice(partner)
  }
}
