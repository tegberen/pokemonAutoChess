import type { TFunction } from "i18next"
import React from "react"
import { useTranslation } from "react-i18next"
import {
  AdditionalPicksStages,
  ItemCarouselStages,
  PortalCarouselStages
} from "../../../../../config"
import { type PVEStage, PVEStages } from "../../../../../models/pve-stages"
import { Emotion } from "../../../../../types"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { cc } from "../../utils/jsx"
import "./stage-path.css"

const LAST_STAGE = 40

export type StageType = "pve" | "carousel" | "additional" | "portal" | "battle"

export type StageInfo = {
  level: number
  icon: string
  title?: string
  type: StageType
  stageData?: PVEStage
}

export function generateStageInfo(t: TFunction): StageInfo[] {
  const stages: StageInfo[] = []

  for (let level = 0; level <= LAST_STAGE; level++) {
    if (ItemCarouselStages.includes(level)) {
      stages.push({
        level,
        icon: "/assets/ui/carousel.svg",
        type: "carousel"
      })
    }

    if (PortalCarouselStages.includes(level)) {
      stages.push({
        level,
        icon: "/assets/ui/mythical.svg",
        title:
          level === 0
            ? t("wiki.stages.starter_pick")
            : level === 10
              ? t("unique_pick")
              : level === 20
                ? t("wiki.stages.legendary_pick")
                : undefined,
        type: "portal"
      })
    } else if (AdditionalPicksStages.includes(level)) {
      stages.push({
        level,
        icon: "/assets/ui/additional-pick.svg",
        type: "additional",
        title:
          level === AdditionalPicksStages[0]
            ? t("rarity.UNCOMMON")
            : level === AdditionalPicksStages[1]
              ? t("rarity.RARE")
              : level === AdditionalPicksStages[2]
                ? t("rarity.EPIC")
                : undefined
      })
    }

    const pveStage = PVEStages[level]
    if (pveStage) {
      stages.push({
        level,
        icon: getPortraitSrc(PkmIndex[pveStage.avatar], false, Emotion.NORMAL),
        title: t(pveStage.name),
        type: "pve",
        stageData: pveStage
      })
    } else if (level > 0) {
      stages.push({
        level,
        icon: "/assets/ui/battle.svg",
        type: "battle"
      })
    }
  }

  return stages
}

export function StageLegend({
  highlightedType,
  onHighlightType
}: {
  highlightedType: StageType | null
  onHighlightType: (type: StageType | null) => void
}) {
  const { t } = useTranslation()
  const legends: { type: StageType; icon: string; alt: string }[] = [
    {
      type: "pve",
      icon: getPortraitSrc(PkmIndex[Pkm.MAGIKARP], false, Emotion.NORMAL),
      alt: "PvE"
    },
    { type: "carousel", icon: "/assets/ui/carousel.svg", alt: "Carousel" },
    { type: "portal", icon: "/assets/ui/mythical.svg", alt: "Portal" },
    {
      type: "additional",
      icon: "/assets/ui/additional-pick.svg",
      alt: "Additional"
    },
    { type: "battle", icon: "/assets/ui/battle.svg", alt: "Battle" }
  ]

  return (
    <div className="stage-legend">
      {legends.map(({ type, icon, alt }) => (
        <div
          key={type}
          className={cc("legend-item", type)}
          onMouseEnter={() => onHighlightType(type)}
          onMouseLeave={() => onHighlightType(null)}
        >
          <img src={icon} alt={alt} />
          <span>{t(`stage_type.${type}`)}</span>
        </div>
      ))}
    </div>
  )
}

export function StageIcon({
  stage,
  selected = false,
  highlighted = false,
  dimmed = false,
  zone,
  onClick
}: {
  stage: StageInfo
  selected?: boolean
  highlighted?: boolean
  dimmed?: boolean
  zone?: string
  onClick?: (level: number) => void
}) {
  const { t } = useTranslation()
  const label = stage.title ?? t(`stage_type.${stage.type}`)
  return (
    <div
      className={cc("stage-path-item", stage.type, zone ? `zone-${zone}` : "", {
        selected,
        highlighted,
        dimmed,
        clickable: onClick != null
      })}
      onClick={onClick ? () => onClick(stage.level) : undefined}
      title={`${t("stage")} ${stage.level}: ${label}`}
    >
      <img src={stage.icon} alt={stage.title} />
      <span className="stage-number">{stage.level}</span>
    </div>
  )
}

export function StagePath({
  stages,
  selectedStage = null,
  highlightedType = null,
  zoneByStage,
  onSelect
}: {
  stages: StageInfo[]
  selectedStage?: number | null
  highlightedType?: StageType | null
  zoneByStage?: Record<number, string>
  onSelect?: (level: number) => void
}) {
  const lastLevel = stages[stages.length - 1]?.level ?? 0
  return (
    <div className="stage-path">
      {stages.map((stage, index) => (
        <React.Fragment key={`stage-${stage.level}-${index}`}>
          <StageIcon
            stage={stage}
            selected={selectedStage === stage.level}
            highlighted={highlightedType === stage.type}
            zone={zoneByStage?.[stage.level]}
            dimmed={
              zoneByStage != null && zoneByStage[stage.level] === undefined
            }
            onClick={onSelect}
          />
          {stage.level < lastLevel && (
            <span className="stage-connector">―</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
