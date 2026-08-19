import {
  AVATAR_ROAM_MAX_X,
  AVATAR_ROAM_MAX_Y,
  AVATAR_ROAM_MIN_X,
  AVATAR_ROAM_MIN_Y,
  AVATAR_SPAWN_BLUE_Y,
  AVATAR_SPAWN_RED_Y,
  AVATAR_SPAWN_X,
  AVATAR_TEAMMATE_OFFSET_CELLS,
  AVATAR_WALK_SPEED_CELLS_PER_SECOND
} from "../config"
import { PokemonAvatarModel } from "../models/colyseus-models/pokemon-avatar"
import type GameState from "../rooms/states/game-state"
import {
  GamePhaseState,
  Orientation,
  PokemonActionState
} from "../types/enum/Game"
import { clamp } from "../utils/number"
import { getOrientation } from "../utils/orientation"

/**
 * One avatar per player, walked around for fun through the pick phase and
 * fights alike. Purely cosmetic, so nothing here is validated beyond keeping it
 * on the map, and the client is free to predict its own.
 *
 * Positions are board cells, the space transformEntityCoordinates works in, so
 * a cell means the same place in both phases and on both players' screens.
 */
export function spawnPlayerAvatar(state: GameState, playerId: string) {
  const player = state.players.get(playerId)
  if (!player || state.playerAvatars.has(playerId)) return
  state.playerAvatars.set(
    playerId,
    new PokemonAvatarModel(
      playerId,
      player.avatar,
      AVATAR_SPAWN_X,
      AVATAR_SPAWN_BLUE_Y,
      0
    )
  )
  const avatar = state.playerAvatars.get(playerId)
  if (avatar) avatar.orientation = Orientation.UP
}

export function removePlayerAvatar(state: GameState, playerId: string) {
  state.playerAvatars.delete(playerId)
}

export function setPlayerAvatarTarget(
  state: GameState,
  playerId: string,
  x: number,
  y: number
) {
  const avatar = state.playerAvatars.get(playerId)
  if (!avatar) return
  avatar.targetX = clamp(x, AVATAR_ROAM_MIN_X, AVATAR_ROAM_MAX_X)
  avatar.targetY = clamp(y, AVATAR_ROAM_MIN_Y, AVATAR_ROAM_MAX_Y)
}

/**
 * Put every avatar back on the near side of its owner's screen.
 *
 * A fight mirrors the board for the red side, so the cell that reads as "in
 * front of me" during the pick phase reads as "behind the enemy" once a player
 * is red. Re-anchoring each phase change is what keeps everyone nearest their
 * own camera, at the cost of returning to the spawn between rounds.
 */
export function anchorPlayerAvatars(state: GameState) {
  state.playerAvatars.forEach((_, playerId) =>
    anchorPlayerAvatar(state, playerId)
  )
}

export function anchorPlayerAvatar(state: GameState, playerId: string) {
  const avatar = state.playerAvatars.get(playerId)
  if (avatar) {
    const player = state.players.get(playerId)
    /* the fight this player is in, not any fight they appear in: a ghost copy
       is the red side of someone else's match while its owner is blue in their
       own. Outside a fight there are no sides at all */
    const simulation =
      player && state.phase === GamePhaseState.FIGHT
        ? state.simulations.get(player.simulationId)
        : undefined

    const isRedSide = simulation?.redPlayerId === playerId
    /* Double Up pairs share the blue side of a pve round */
    const partnerId = simulation?.bluePartnerPlayerId
    const offset =
      partnerId && !isRedSide
        ? playerId === partnerId
          ? AVATAR_TEAMMATE_OFFSET_CELLS
          : -AVATAR_TEAMMATE_OFFSET_CELLS
        : 0

    avatar.x = avatar.targetX = AVATAR_SPAWN_X + offset
    avatar.y = avatar.targetY = isRedSide
      ? AVATAR_SPAWN_RED_Y
      : AVATAR_SPAWN_BLUE_Y
    avatar.action = PokemonActionState.IDLE
    /* face up your own screen, which means facing the opponent. Orientation is
       stored unmirrored and flipped when drawn, so the red side has to store the
       opposite of what it wants to see */
    avatar.orientation = isRedSide ? Orientation.DOWN : Orientation.UP
    /* tells the client this was a placement, not a step. It cannot infer that
       from the distance: a Double Up offset is smaller than ordinary lag */
    avatar.anchorCount = (avatar.anchorCount + 1) % 256
  }
}

/* the client predicts its own avatar with this exact integration, so the two
   agree without any correction traffic */
export function updatePlayerAvatars(state: GameState, dt: number) {
  if (
    state.phase !== GamePhaseState.PICK &&
    state.phase !== GamePhaseState.FIGHT
  )
    return

  const step = (AVATAR_WALK_SPEED_CELLS_PER_SECOND * dt) / 1000
  state.playerAvatars.forEach((avatar) => {
    const dx = avatar.targetX - avatar.x
    const dy = avatar.targetY - avatar.y
    const distance = Math.hypot(dx, dy)

    if (distance <= step) {
      avatar.x = avatar.targetX
      avatar.y = avatar.targetY
      if (avatar.action !== PokemonActionState.IDLE) {
        avatar.action = PokemonActionState.IDLE
      }
      return
    }

    avatar.x += (dx / distance) * step
    avatar.y += (dy / distance) * step
    avatar.action = PokemonActionState.WALK
    /* cells count upwards, getOrientation reads screen space where y grows
       downwards. The carousel negates the same way */
    avatar.orientation = getOrientation(0, 0, dx, -dy)
  })
}
