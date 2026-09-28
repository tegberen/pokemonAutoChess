import { GameMode } from "../types/enum/Game"

export function getDefaultRoomName(gameMode: GameMode, whimsy = false) {
  switch (gameMode) {
    case GameMode.RANKED:
      return "Ranked Match"
    case GameMode.SCRIBBLE:
      return "Smeargle's Scribble"
    case GameMode.CLASSIC:
      return "Classic"
    case GameMode.DOUBLE_UP:
      return whimsy ? "Whimsy Weekend" : "Double Up"
    case GameMode.GUIDE:
      return "Guide"
    default:
      return "Custom Room"
  }
}

// a room's cards and header show its game mode unless the owner renamed it; a pinned
// Scribble rule renames it to the rule, which the mode label already says
export function hasCustomRoomName(
  name: string | undefined,
  gameMode: GameMode | undefined,
  modeLabel: string
) {
  if (!name || name === modeLabel) return false
  if (!gameMode) return true
  return (
    name !== getDefaultRoomName(gameMode, false) &&
    name !== getDefaultRoomName(gameMode, true)
  )
}
