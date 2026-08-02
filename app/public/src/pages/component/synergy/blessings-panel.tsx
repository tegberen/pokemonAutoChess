import { useState } from "react"
import { useTranslation } from "react-i18next"
import { type PlacesType, Tooltip } from "react-tooltip"
import { Blessings } from "../../../../../config/game/blessings"
import { DEPTH } from "../../../game/depths"
import { useAppSelector } from "../../../hooks"
import { addIconsToDescription } from "../../utils/descriptions"
import "./blessings-panel.css"

export default function BlessingsPanel() {
  const { t } = useTranslation()
  const [tooltipPlace, setTooltipPlace] = useState<PlacesType>("left")
  const playerIdSpectated = useAppSelector(
    (state) => state.game.playerIdSpectated
  )
  const blessings = useAppSelector(
    (state) => state.game.blessingsByPlayerId[playerIdSpectated] ?? []
  )

  if (blessings.length === 0) {
    return <p className="blessings-panel-empty">{t("no_blessing_yet")}</p>
  }

  return (
    <div className="blessings-panel">
      {blessings.map((blessing, index) => (
        <div key={`${blessing}-${index}`}>
          <img
            src={`/assets/blessings/${Blessings[blessing].icon}.svg`}
            alt={t(`blessing.${blessing}.name`)}
            className={`blessing-panel-icon blessing-tier-${Blessings[
              blessing
            ].tier.toLowerCase()}`}
            data-tooltip-id={`blessing-${blessing}-${index}`}
            onMouseEnter={(event) => {
              const { left, width } = event.currentTarget.getBoundingClientRect()
              setTooltipPlace(
                left + width / 2 < window.innerWidth / 2 ? "right" : "left"
              )
            }}
          />
          <Tooltip
            id={`blessing-${blessing}-${index}`}
            className="custom-theme-tooltip blessing-panel-tooltip"
            place={tooltipPlace}
            style={{ zIndex: DEPTH.TOOLTIP }}
          >
            <h3>{t(`blessing.${blessing}.name`)}</h3>
            <p>
              {addIconsToDescription(t(`blessing.${blessing}.description`))}
            </p>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}
