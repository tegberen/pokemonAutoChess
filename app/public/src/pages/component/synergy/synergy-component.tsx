import { useTranslation } from "react-i18next"
import { SynergyTiersThresholds } from "../../../../../config"
import { GameMode } from "../../../../../types/enum/Game"
import { Synergy } from "../../../../../types/enum/Synergy"
import { selectSpectatedPlayer, useAppSelector } from "../../../hooks"
import { getGameScene } from "../../game"
import { cc } from "../../utils/jsx"
import SynergyIcon from "../icons/synergy-icon"

export default function SynergyComponent(props: {
  type: Synergy
  value: number
  index: number
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const { t } = useTranslation()
  const thresholdReached =
    SynergyTiersThresholds[props.type].filter((n) => n <= props.value).at(-1) ??
    0
  const isActive = thresholdReached > 0

  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const gameMode = useAppSelector((state) => state.game.gameMode)
  const highlightSynergy = (type: Synergy) => {
    const scene = getGameScene()
    if (!scene) return
    if (!spectatedPlayer?.board?.forEach) return
    spectatedPlayer.board.forEach((p) => {
      if (p.types.has(type)) {
        const sprite = scene.board?.pokemons.get(p.id)?.sprite
        if (sprite) {
          scene.setHovered(sprite, 4)
        }
      }
    })
  }

  const removeHighlightSynergy = (type: Synergy) => {
    const scene = getGameScene()
    if (!scene) return
    if (!spectatedPlayer?.board?.forEach) return
    spectatedPlayer?.board.forEach((p) => {
      if (p.types.has(type)) {
        const sprite = scene.board?.pokemons.get(p.id)?.sprite
        if (sprite) {
          scene.clearHovered(sprite)
        }
      }
    })
  }

  return (
    <div
      className={cc("synergy-row", { active: isActive })}
      data-tooltip-id="detail-synergy"
      onMouseEnter={() => {
        highlightSynergy(props.type)
        props.onMouseEnter()
      }}
      onMouseLeave={() => {
        removeHighlightSynergy(props.type)
        props.onMouseLeave()
      }}
    >
      <SynergyIcon type={props.type} />
      <span className="synergy-row-count">{props.value}</span>
      <div className="synergy-row-info">
        <div className="synergy-row-tiers">
          {SynergyTiersThresholds[props.type]
            .filter(
              // In Double Up, the Baby synergy caps at its second tier (Baby 5),
              // so hide the unreachable third threshold (Baby 7 / Golden Eggs)
              (threshold) =>
                !(
                  gameMode === GameMode.DOUBLE_UP &&
                  props.type === Synergy.BABY &&
                  threshold > SynergyTiersThresholds[Synergy.BABY][1]
                )
            )
            .map((tier) => (
              <span
                key={tier}
                className={cc({
                  current: thresholdReached === tier,
                  reached: props.value >= tier
                })}
              >
                {tier}
              </span>
            ))}
        </div>
        <p className="synergy-row-name">{t(`synergy.${props.type}`)}</p>
      </div>
    </div>
  )
}
