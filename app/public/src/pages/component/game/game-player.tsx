import { CircularProgressbarWithChildren } from "react-circular-progressbar"
import { Tooltip } from "react-tooltip"

import type { IPlayer } from "../../../../../types"
import { getAvatarSrc } from "../../../../../utils/avatar"
import { DEPTH } from "../../../game/depths"
import { useAppSelector } from "../../../hooks"
import { cc } from "../../utils/jsx"
import GamePlayerDetail from "./game-player-detail"

import "react-circular-progressbar/dist/styles.css"
import "./game-player.css"

// 3 stripes when certain, 2 when likely, 1 when only possible
function getNextOpponentStripes(chance: number): number {
  if (chance >= 1) return 3
  if (chance >= 0.5) return 2
  return 1
}

// one chevron per stripe, stacked from the bottom of the 10x14 viewBox
export function getNextOpponentStripesPath(stripes: number): string {
  return Array.from({ length: stripes }, (_, index) => {
    const bottomY = 13 - 4 * index
    return `M1 ${bottomY} L5 ${bottomY - 3.5} L9 ${bottomY}`
  }).join(" ")
}

export default function GamePlayer(props: {
  player: IPlayer
  click: (id: string) => void
  index: number
  teamColor?: string
  hideLife?: boolean
  nextOpponentChance?: number
}) {
  const spectatedPlayerId = useAppSelector(
    (state) => state.game.playerIdSpectated
  )
  const connectedPlayerId = useAppSelector((state) => state.network.uid)

  function playerClick() {
    if (spectatedPlayerId !== props.player.id) {
      props.click(props.player.id)
    }
  }

  return (
    <div className="game-player-wrapper">
      <div
        style={{
          top: `${1 + props.index * 12.5}%`,
          backgroundImage: `url('${getAvatarSrc(props.player.avatar)}')`,
          zIndex: DEPTH.PLAYER_ICON
        }}
        className={cc("game-player", {
          spectated: spectatedPlayerId === props.player.id,
          self: connectedPlayerId === props.player.id,
          dead: !props.hideLife && props.player.life <= 0
        })}
        onClick={playerClick}
        data-tooltip-id={"detail-" + props.player.id}
      >
        <CircularProgressbarWithChildren
          value={props.hideLife ? 100 : props.player.life}
          styles={{ path: { stroke: props.teamColor } }}
        />
        {!props.hideLife && (
          <div className="life-row">
            {props.nextOpponentChance !== undefined && (
              <span className="my-container next-opponent-tab">
                <svg
                  className="next-opponent-stripes"
                  viewBox="0 0 10 14"
                  aria-hidden="true"
                >
                  <path
                    d={getNextOpponentStripesPath(
                      getNextOpponentStripes(props.nextOpponentChance)
                    )}
                  />
                </svg>
              </span>
            )}
            <div className="my-container life-text">{props.player.life}</div>
          </div>
        )}
      </div>
      <Tooltip
        id={"detail-" + props.player.id}
        className="custom-theme-tooltip"
        place="left"
        data-tooltip-offset={{ left: 30, bottom: props.index === 0 ? 50 : 0 }}
        style={{ zIndex: DEPTH.TOOLTIP }}
      >
        <GamePlayerDetail player={props.player} hideLife={props.hideLife} />
      </Tooltip>
    </div>
  )
}
