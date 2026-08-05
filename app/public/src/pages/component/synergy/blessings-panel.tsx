import { useState } from "react"
import ReactDOM from "react-dom"
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
  MIX_AND_MATCH_I_FIELD_CAP,
  MIX_AND_MATCH_II_FIELD_CAP,
  BLESSING_QUEST_TARGETS,
  Blessing
} from "../../../../../types/enum/Blessing"
import { Rarity } from "../../../../../types/enum/Game"
import { cc } from "../../utils/jsx"
import { addIconsToDescription } from "../../utils/descriptions"
import "./blessings-panel.css"

export default function BlessingsPanel(props: { recentOnly?: boolean }) {
  const { t } = useTranslation()
  const [tooltipPlace, setTooltipPlace] = useState<PlacesType>("left")
  const playerIdSpectated = useAppSelector(
    (state) => state.game.playerIdSpectated
  )
  const blessings = useAppSelector(
    (state) => state.game.blessingsByPlayerId[playerIdSpectated] ?? []
  )
  // defaulted outside the selector: returning a fresh {} would change identity
  // on every call and re-render forever
  const questProgressByPlayer = useAppSelector(
    (state) => state.game.blessingQuestProgressByPlayerId[playerIdSpectated]
  )
  const questProgress = questProgressByPlayer ?? {}
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const synergies = useAppSelector((state) => state.game.synergiesSpectated)
  const nbThreeStarWilds = spectatedPlayer
    ? countWildsThreeStarsOrMore(spectatedPlayer.board)
    : 0
  const nbFieldedUniques = spectatedPlayer
    ? [...spectatedPlayer.board.values()].filter(
        (pokemon) =>
          pokemon.positionY !== 0 && pokemon.rarity === Rarity.UNIQUE
      ).length
    : 0
  const uniqueFieldCap = blessings.includes(Blessing.MIX_AND_MATCH_II)
    ? MIX_AND_MATCH_II_FIELD_CAP
    : blessings.includes(Blessing.MIX_AND_MATCH_I)
      ? MIX_AND_MATCH_I_FIELD_CAP
      : null
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

  if (blessings.length === 0 && !props.recentOnly) {
    return <p className="blessings-panel-empty">{t("no_blessing_yet")}</p>
  }

  const displayedBlessings = props.recentOnly
    ? blessings.slice(-2).reverse()
    : blessings

  return (
    <div className={cc("blessings-panel", { "blessings-panel-recent": !!props.recentOnly })}>
      {displayedBlessings.map((blessing, index) => (
        <div key={`${blessing}-${index}`} className="blessing-panel-slot">
          <img
            src={`/assets/blessings/${Blessings[blessing].icon}.svg`}
            alt={t(`blessing.${blessing}.name`)}
            className={`blessing-panel-icon blessing-tier-${Blessings[
              blessing
            ].tier.toLowerCase()}`}
            data-tooltip-id={`${props.recentOnly ? "recent-" : ""}blessing-${blessing}-${index}`}
            onMouseEnter={(event) => {
              const { left, width } = event.currentTarget.getBoundingClientRect()
              setTooltipPlace(
                left + width / 2 < window.innerWidth / 2 ? "right" : "left"
              )
            }}
          />
          {uniqueFieldCap !== null &&
            (blessing === Blessing.MIX_AND_MATCH_I ||
              blessing === Blessing.MIX_AND_MATCH_II) && (
              <span
                className={cc("blessing-panel-counter", {
                  full: nbFieldedUniques >= uniqueFieldCap
                })}
              >
                {nbFieldedUniques}/{uniqueFieldCap}
              </span>
            )}
          {BLESSING_QUEST_TARGETS[blessing] && (
            <span
              className={cc("blessing-panel-counter", {
                full:
                  (questProgress[blessing] ?? 0) >=
                  BLESSING_QUEST_TARGETS[blessing]!.target
              })}
            >
              {(questProgress[blessing] ?? 0).toFixed(
                BLESSING_QUEST_TARGETS[blessing]!.decimals ?? 0
              )}
              /{BLESSING_QUEST_TARGETS[blessing]!.target}
            </span>
          )}
          {/* portalled out of the panel, or the Effects window clips it */}
          {ReactDOM.createPortal(
            <Tooltip
              id={`${props.recentOnly ? "recent-" : ""}blessing-${blessing}-${index}`}
              className="custom-theme-tooltip blessing-panel-tooltip"
              place={tooltipPlace}
              style={{ zIndex: DEPTH.TOOLTIP }}
            >
              <div className={`wiki-blessing-body blessing-panel-tooltip-card blessing-tier-${Blessings[blessing].tier.toLowerCase()}`}>
                <img
                  src={`/assets/blessings/${Blessings[blessing].icon}.svg`}
                  alt=""
                />
                <div>
                  <h3>{t(`blessing.${blessing}.name`)}</h3>
                  <p>{addIconsToDescription(t(`blessing.${blessing}.description`))}</p>
                  {blessing === Blessing.AURORA_BOREALIS && <p className="blessing-panel-live-value">{addIconsToDescription(`${nbActiveSynergies} active synergies: −${auroraBorealisReduction}% damage taken, −${auroraBorealisReductionInSnowOrNight}% in SNOW or NIGHT`)}</p>}
                  {blessing === Blessing.BERSERKER_HORDES && <p className="blessing-panel-live-value">{addIconsToDescription(`${nbThreeStarWilds} WILD at 3 STAR or more: −${nbThreeStarWilds} GOLD`)}</p>}
                </div>
              </div>
            </Tooltip>,
            document.body
          )}
        </div>
      ))}
    </div>
  )
}
