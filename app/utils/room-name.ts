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
