import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import { selectSpectatedPlayer, useAppSelector } from "../../../hooks"
import { Life } from "../icons/life"

export function GameLifeInfo() {
  const { t } = useTranslation()
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const isFinale = useAppSelector((state) => state.game.finalistIds.length > 0)
  if (!spectatedPlayer || isFinale) return null
  return (
    <div id="game-life-info" className="my-container life information">
      <div data-tooltip-id="detail-life">
        <Tooltip id="detail-life" className="custom-theme-tooltip" place="top">
          <p className="help">{t("lose_game_hint")}</p>
        </Tooltip>
        <Life value={spectatedPlayer.life} />
      </div>
    </div>
  )
}
