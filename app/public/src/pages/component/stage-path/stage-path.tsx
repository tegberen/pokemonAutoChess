import type { TFunction } from "i18next"
import React from "react"
import { useTranslation } from "react-i18next"
import {
  AdditionalPicksStages,
  ArmoryAssistStages,
  ItemCarouselStages,
  PortalCarouselStages
} from "../../../../../config"
import { type PVEStage, PVEStages } from "../../../../../models/pve-stages"
import { BLESSING_SELECTION_STAGES } from "../../../../../types/enum/Blessing"
import { Emotion } from "../../../../../types"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { cc } from "../../utils/jsx"
import "./stage-path.css"

const LAST_STAGE = 40

export type StageType =
  | "pve"
  | "carousel"
  | "additional"
  | "portal"
  | "battle"
  | "gift"
  | "wish"

const GIFT_ICON = "/assets/blessings/shopping_bag.svg"
const WISH_ICON = "/assets/ui/game_modes/wishes_icon.svg"

export type StageInfo = {
  level: number
  icon: string
  title?: string
  type: StageType
  stageData?: PVEStage
}

// Wishes and Double Up gifts depend on the game, so only the wiki lists them
export function generateStageInfo(
  t: TFunction,
  withOptionalStages = false
): StageInfo[] {
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

    // offered in the pick phase, after the carousel and before the fight
    if (withOptionalStages && BLESSING_SELECTION_STAGES.includes(level)) {
      stages.push({ level, icon: WISH_ICON, type: "wish" })
    }
    if (withOptionalStages && ArmoryAssistStages.includes(level)) {
      stages.push({ level, icon: GIFT_ICON, type: "gift" })
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
  onHighlightType,
  withOptionalStages = false
}: {
  highlightedType: StageType | null
  onHighlightType: (type: StageType | null) => void
  withOptionalStages?: boolean
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
    { type: "battle", icon: "/assets/ui/battle.svg", alt: "Battle" },
    ...(withOptionalStages
      ? [
          { type: "wish" as const, icon: WISH_ICON, alt: "Wish" },
          { type: "gift" as const, icon: GIFT_ICON, alt: "Double Up gift" }
        ]
      : [])
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
  onClick?: () => void
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
      onClick={onClick}
      title={`${t("stage")} ${stage.level}: ${label}`}
    >
      <img src={stage.icon} alt={stage.title} />
      <span className="stage-number">{stage.level}</span>
    </div>
  )
}

// selected by position, since a carousel and a gift can share a stage number
export function StagePath({
  stages,
  selectedIndex = null,
  highlightedType = null,
  zoneByStage,
  onSelect
}: {
  stages: StageInfo[]
  selectedIndex?: number | null
  highlightedType?: StageType | null
  zoneByStage?: Record<number, string>
  onSelect?: (index: number) => void
}) {
  const lastLevel = stages[stages.length - 1]?.level ?? 0
  return (
    <div className="stage-path">
      {stages.map((stage, index) => (
        <React.Fragment key={`stage-${stage.level}-${index}`}>
          <StageIcon
            stage={stage}
            selected={selectedIndex === index}
            highlighted={highlightedType === stage.type}
            zone={zoneByStage?.[stage.level]}
            dimmed={
              zoneByStage != null && zoneByStage[stage.level] === undefined
            }
            onClick={onSelect ? () => onSelect(index) : undefined}
          />
          {stage.level < lastLevel && (
            <span className="stage-connector">―</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
