import type React from "react"
import { useTranslation } from "react-i18next"
import { Blessings } from "../../../../../config/game/blessings"
import type { Blessing } from "../../../../../types/enum/Blessing"
import { addIconsToDescription } from "../../utils/descriptions"
import "./blessings-panel.css"

export function blessingTierClass(blessing: Blessing) {
  return `blessing-tier-${Blessings[blessing].tier.toLowerCase()}`
}

export function BlessingIcon(props: {
  blessing: Blessing
  tooltipId?: string
  className?: string
  onMouseEnter?: React.MouseEventHandler<HTMLImageElement>
}) {
  const { blessing, tooltipId, className, onMouseEnter } = props
  const { t } = useTranslation()
  return (
    <img
      src={`/assets/blessings/${Blessings[blessing].icon}.svg`}
      alt={t(`blessing.${blessing}.name`)}
      className={`blessing-panel-icon ${blessingTierClass(blessing)} ${className ?? ""}`}
      data-tooltip-id={tooltipId}
      data-tooltip-content={blessing}
      onMouseEnter={onMouseEnter}
    />
  )
}

/* children slot in below the description for live in-game values */
export function BlessingTooltipCard(props: {
  blessing: Blessing
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  const { blessing } = props
  return (
    <div
      className={`wiki-blessing-body blessing-panel-tooltip-card ${blessingTierClass(blessing)}`}
    >
      <img src={`/assets/blessings/${Blessings[blessing].icon}.svg`} alt="" />
      <div>
        <h3>{t(`blessing.${blessing}.name`)}</h3>
        <p>{addIconsToDescription(t(`blessing.${blessing}.description`))}</p>
        {props.children}
      </div>
    </div>
  )
}
