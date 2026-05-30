import type CSS from "csstype"
import { useAppSelector } from "../../../hooks"
import GamePlayer from "./game-player"

const style: CSS.Properties = {
  position: "absolute",
  height: "100%",
  width: "70px",
  right: "0.5%",
  top: "4px"
}

export default function GamePlayers(props: { click: (id: string) => void }) {
  const players = useAppSelector((state) => state.game.players)
  const gameMode = useAppSelector((state) => state.game.gameMode)

  const DOUBLE_UP_TEAM_COLORS = ["#f9e07f", "#f4a7b9", "#a8e6e6", "#b8e6a0"]

const teamColorMap = new Map<string, string>()
let colorIndex = 0
;[...players]
  .sort((a, b) => a.doubleUpTeamId.localeCompare(b.doubleUpTeamId))
  .forEach((p) => {
    if (p.doubleUpTeamId && !teamColorMap.has(p.doubleUpTeamId)) {
      teamColorMap.set(p.doubleUpTeamId, DOUBLE_UP_TEAM_COLORS[colorIndex++ % DOUBLE_UP_TEAM_COLORS.length])
    }
  })

const sortedPlayers = [...players].sort((a, b) => {
    if (gameMode === "DOUBLE_UP") {
      if (a.doubleUpTeamId !== b.doubleUpTeamId) {
        return a.doubleUpTeamId.localeCompare(b.doubleUpTeamId)
      }
    }
    return a.rank - b.rank
  })

  return (
    <div style={style}>
      {sortedPlayers.map((p, i) => (
        <GamePlayer
          key={p.id}
          player={p}
          click={(id: string) => props.click(id)}
          index={i}
          teamColor={gameMode === "DOUBLE_UP" ? teamColorMap.get(p.doubleUpTeamId) : undefined}
        />
      ))}
    </div>
  )
}
