import { useState } from "react"
import { useTranslation } from "react-i18next"
import { type PlacesType, Tooltip } from "react-tooltip"
import { SynergyTiersThresholds } from "../../../../../config"
import { Blessings } from "../../../../../config/game/blessings"
import { DEPTH } from "../../../game/depths"
import { selectSpectatedPlayer, useAppSelector } from "../../../hooks"
import { countWildsThreeStarsOrMore } from "../../../../../models/shop"
import {
  AURORA_BOREALIS_DAMAGE_REDUCTION,
  AURORA_BOREALIS_DAMAGE_REDUCTION_IN_SNOW_OR_NIGHT,
  AURORA_BOREALIS_REDUCTION_PER_ACTIVE_SYNERGY,
  Blessing
} from "../../../../../types/enum/Blessing"
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
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const synergies = useAppSelector((state) => state.game.synergiesSpectated)
  const nbThreeStarWilds = spectatedPlayer
    ? countWildsThreeStarsOrMore(spectatedPlayer.board)
    : 0
  const nbActiveSynergies = synergies.filter(
    ([synergy, value]) => value >= SynergyTiersThresholds[synergy][0]
  ).length
  const auroraBorealisReduction = Math.round(
    (AURORA_BOREALIS_DAMAGE_REDUCTION +
      nbActiveSynergies * AURORA_BOREALIS_REDUCTION_PER_ACTIVE_SYNERGY) *
      100
  )
  const auroraBorealisReductionInSnowOrNight = Math.round(
    (AURORA_BOREALIS_DAMAGE_REDUCTION_IN_SNOW_OR_NIGHT +
      nbActiveSynergies * AURORA_BOREALIS_REDUCTION_PER_ACTIVE_SYNERGY) *
      100
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
            {blessing === Blessing.AURORA_BOREALIS && (
              <p className="blessing-panel-live-value">
                {addIconsToDescription(
                  `${nbActiveSynergies} active synergies: −${auroraBorealisReduction}% damage taken, −${auroraBorealisReductionInSnowOrNight}% in SNOW or NIGHT`
                )}
              </p>
            )}
            {blessing === Blessing.BERSERKER_HORDES && (
              <p className="blessing-panel-live-value">
                {addIconsToDescription(
                  `${nbThreeStarWilds} WILD at 3 STAR or more: −${nbThreeStarWilds} GOLD`
                )}
              </p>
            )}
          </Tooltip>
        </div>
      ))}
    </div>
  )
}
