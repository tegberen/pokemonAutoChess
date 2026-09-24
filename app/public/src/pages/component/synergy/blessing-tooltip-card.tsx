import type React from "react"
import { useTranslation } from "react-i18next"
import { Blessings } from "../../../../../config/game/blessings"
import type { Blessing } from "../../../../../types/enum/Blessing"
import { addIconsToDescription } from "../../utils/descriptions"
import { BlessingDescription } from "./blessing-description"
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
  if (!Blessings[blessing]) {
    return (
      <img
        src="/assets/icons/blessing_stats.svg"
        alt="Removed Wish"
        title="Removed Wish"
        className={`blessing-panel-icon blessing-removed ${className ?? ""}`}
      />
    )
  }
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

/* the stage line shown under a blessing description in the pickers and tier list */
export function BlessingStages(props: { blessing: Blessing }) {
  return (
    <p className="tier-list-blessing-stages">
      {Blessings[props.blessing].availableAtStages
        .map((stage) => `Stage ${stage}`)
        .join(" / ")}
    </p>
  )
}

/* children slot in below the description for live in-game values */
export function BlessingTooltipCard(props: {
  blessing: Blessing
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  const { blessing } = props
  if (!Blessings[blessing]) return null
  return (
    <div
      className={`wiki-blessing-body blessing-panel-tooltip-card ${blessingTierClass(blessing)}`}
    >
      <img src={`/assets/blessings/${Blessings[blessing].icon}.svg`} alt="" />
      <div>
        <h3>
          <span>{addIconsToDescription(t(`blessing.${blessing}.name`))}</span>
        </h3>
        <BlessingDescription blessing={blessing} />
        {props.children}
      </div>
    </div>
  )
}
