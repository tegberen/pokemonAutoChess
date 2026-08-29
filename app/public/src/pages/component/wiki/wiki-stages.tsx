import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AdditionalPicksStages,
  TownEncountersByStage
} from "../../../../../config"
import { getAdditionalsTier1 } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../../../../../models/precomputed/precomputed-rarity"
import { Emotion } from "../../../../../types"
import {
  CraftableItemsNoScarves,
  type Item,
  ItemComponentsNoScarf
} from "../../../../../types/enum/Item"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { entries } from "../../../../../utils/object"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { addIconsToDescription } from "../../utils/descriptions"
import { GamePokemonDetailTooltip } from "../game/game-pokemon-detail"
import PokemonPortrait from "../pokemon-portrait"
import {
  generateStageInfo,
  StageLegend,
  StagePath,
  type StageInfo,
  type StageType
} from "../stage-path/stage-path"
import "./wiki-stages.css"

export default function WikiStages() {
  const { t } = useTranslation()
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [highlightedType, setHighlightedType] = useState<StageType | null>(null)

  const allStages = generateStageInfo(t)
  const selectedStageInfo =
    selectedStage !== null
      ? allStages.find((s) => s.level === selectedStage)
      : null

  return (
    <div id="wiki-stages">
      <div className="wiki-stage-path-container my-box">
        <div className="stage-header">
          <h2>{t("stages")}</h2>
          <StageLegend
            highlightedType={highlightedType}
            onHighlightType={setHighlightedType}
          />
        </div>
        <StagePath
          stages={allStages}
          selectedStage={selectedStage}
          highlightedType={highlightedType}
          onSelect={(level) =>
            setSelectedStage(selectedStage === level ? null : level)
          }
        />
      </div>

      {selectedStageInfo && <StageDetail stageInfo={selectedStageInfo} />}
    </div>
  )
}

function StageDetail({ stageInfo }: { stageInfo: StageInfo }) {
  const { t } = useTranslation()

  if (!stageInfo) return null

  const itemDetail = (item: Item) => (
    <img
      key={item}
      className="item"
      src={`assets/item/${item}.png`}
      alt={t(`item.${item}`)}
      title={t(`item.${item}`)}
      data-tooltip-id="item-detail-tooltip"
      data-tooltip-content={item}
    />
  )

  const pokemonDetail = (pkm: Pkm) => (
    <PokemonPortrait
      portrait={{
        index: PkmIndex[pkm],
        emotion: Emotion.NORMAL,
        shiny: false
      }}
      data-tooltip-id="game-pokemon-detail-tooltip"
      data-tooltip-content={pkm}
    />
  )

  return (
    <div className="stage-detail my-box">
      <header className="stage-detail-header">
        <div className="stage-detail-info">
          <h3>
            {t("stage")} {stageInfo.level} - {t(`stage_type.${stageInfo.type}`)}
            {stageInfo.title ? " : " : null}
            {stageInfo.title}
          </h3>
        </div>
        <div className="stage-detail-icon">
          <img src={stageInfo.icon} alt={stageInfo.title} />
        </div>
      </header>

      {stageInfo.type === "pve" && stageInfo.stageData && (
        <div className="pve-stage-details">
          <div className="stage-board">
            <h4>{t("wiki.stages.enemy_team")}:</h4>
            <table>
              <thead>
                <tr>
                  <th>{t("wiki.stages.pokemon")}</th>
                  {stageInfo.stageData.marowakItems && (
                    <th>{t("wiki.stages.marowak_items")}</th>
                  )}
                  {stageInfo.stageData.statBoosts && (
                    <th>{t("wiki.stages.stat_boosts")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {stageInfo.stageData.board.map(([pkm, x, y], index) => (
                  <tr key={index}>
                    <td className="pokemon-cell">
                      {pokemonDetail(pkm)}
                      <span>{t(`pkm.${pkm}`)}</span>
                    </td>
                    {stageInfo.stageData!.marowakItems && (
                      <td className="items-cell">
                        {stageInfo.stageData!.marowakItems[index]?.map(
                          (item) => (
                            <React.Fragment key={item}>
                              {itemDetail(item)}
                            </React.Fragment>
                          )
                        )}
                      </td>
                    )}
                    {stageInfo.stageData!.statBoosts && (
                      <td className="boosts-cell">
                        {entries(stageInfo.stageData!.statBoosts).map(
                          ([stat, boost]) => (
                            <div
                              key={stat}
                              className="boost-item"
                              title={t(`stat.${stat}`)}
                            >
                              <img
                                src={`assets/icons/${stat}.png`}
                                alt={stat}
                              />
                              <span>+{boost as number}</span>
                            </div>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stageInfo.stageData.rewards && (
            <div className="stage-rewards">
              <h4>{t("wiki.stages.rewards")}</h4>
              <ul>
                {stageInfo.stageData.rewards.map((item) => (
                  <li key={item}>{itemDetail(item)}</li>
                ))}
              </ul>
            </div>
          )}

          {stageInfo.stageData.shinyChance && (
            <div className="stage-shiny">
              <h4>
                {t("wiki.stages.shiny_chance")}:{" "}
                <span>
                  {(stageInfo.stageData.shinyChance * 100).toFixed(2)}%
                </span>
              </h4>
              {stageInfo.level === 1 ? (
                <p>
                  {addIconsToDescription(
                    t("wiki.stages.shiny_magikarp_description")
                  )}
                </p>
              ) : stageInfo.level === 9 ? (
                <p>
                  {addIconsToDescription(
                    t("wiki.stages.shiny_gyarados_description")
                  )}
                </p>
              ) : (
                <p>
                  {addIconsToDescription(
                    t("wiki.stages.shiny_pve_description")
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {stageInfo.type === "carousel" && (
        <div className="carousel-stage-details">
          <p>{t("wiki.stages.carousel_description")}</p>

          <h4>{t("wiki.stages.item_pool")}</h4>
          <div className="stage-rewards">
            <ul className="">
              {(stageInfo.level >= 20
                ? CraftableItemsNoScarves
                : ItemComponentsNoScarf
              ).map((item) => (
                <li key={item}>{itemDetail(item)}</li>
              ))}
            </ul>
          </div>

          <h4>{t("wiki.stages.town_encounters")}</h4>
          <div className="town-encounters">
            {TownEncountersByStage[stageInfo.level] && (
              <ul>
                {Object.entries(TownEncountersByStage[stageInfo.level]).map(
                  ([pkm, chance]) => (
                    <li key={pkm} className="town-encounter">
                      {pokemonDetail(pkm as Pkm)}
                      <span>{(chance * 100).toFixed(1)}%</span>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {stageInfo.type === "portal" && (
        <div className="portal-stage-details">
          <p>{t("wiki.stages.portal_description_1")}</p>
          <p>{t("wiki.stages.portal_description_2")}</p>
          <p>{t("wiki.stages.portal_description_3")}</p>
        </div>
      )}

      {stageInfo.type === "additional" && (
        <div className="additional-stage-details">
          <p>{t("wiki.stages.additional_description")}</p>
          <h4>{t("additional_picks")}</h4>
          <ul>
            {getAdditionalsTier1(
              stageInfo.level === AdditionalPicksStages[0]
                ? PRECOMPUTED_POKEMONS_PER_RARITY.UNCOMMON
                : stageInfo.level === AdditionalPicksStages[1]
                  ? PRECOMPUTED_POKEMONS_PER_RARITY.RARE
                  : stageInfo.level === AdditionalPicksStages[2]
                    ? PRECOMPUTED_POKEMONS_PER_RARITY.EPIC
                    : []
            ).map((pkm) => (
              <li key={pkm}>{pokemonDetail(pkm)}</li>
            ))}
          </ul>
        </div>
      )}

      {stageInfo.type === "battle" && (
        <div className="battle-stage-details">
          <p>{t("wiki.stages.battle_description")}</p>
        </div>
      )}

      <ItemDetailTooltip />
      <GamePokemonDetailTooltip origin="wiki" />
    </div>
  )
}
