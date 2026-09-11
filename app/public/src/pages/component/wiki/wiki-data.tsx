import { Fragment, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  ARCEUS_RATE,
  DITTO_RATE,
  ExpPlace,
  ExpTable,
  FishRarityProbability,
  KECLEON_RATE,
  MAX_LEVEL,
  PoolSize,
  RarityColor,
  RarityProbabilityPerLevel
} from "../../../../../config"
import {
  BLESSING_TIER_CHANCES_AFTER,
  BLESSING_TIER_CHANCES_FIRST
} from "../../../../../config/game/blessings"
import { BlessingTier } from "../../../../../types/enum/Blessing"
import { Rarity } from "../../../../../types/enum/Game"
import { FishingRods } from "../../../../../types/enum/Item"
import { getRankLabel } from "../../../../../types/strings/Strings"
import { addIconsToDescription } from "../../utils/descriptions"
import { WikiLetterDelivery } from "./wiki-letter-delivery"

const blessingTiers = [
  BlessingTier.SILVER,
  BlessingTier.GOLD,
  BlessingTier.PRISMATIC
]

const BlessingTierColor: { [tier in BlessingTier]: string } = {
  [BlessingTier.SILVER]: "var(--color-fg-secondary)",
  [BlessingTier.GOLD]: "var(--color-fg-gold)",
  [BlessingTier.PRISMATIC]: "var(--color-rarity-epic)"
}

const ranks = [1, 2, 3, 4, 5, 6, 7, 8]

function DataEntry(props: {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="my-box wiki-data-entry">
      <h3>{props.title}</h3>
      {props.description && <p>{props.description}</p>}
      {props.children}
    </section>
  )
}

function TierOdds(props: { tier: BlessingTier; chance: string }) {
  const { t } = useTranslation()
  return (
    <span style={{ color: BlessingTierColor[props.tier] }}>
      <b>{props.chance}</b>{" "}
      <span className="wiki-data-tier-name">
        {t(`blessing_tier.${props.tier}`)}
      </span>
    </span>
  )
}

export default function WikiData() {
  const { t } = useTranslation()
  const rarities = [
    Rarity.COMMON,
    Rarity.UNCOMMON,
    Rarity.RARE,
    Rarity.EPIC,
    Rarity.ULTRA
  ]
  const rarities_with_special = rarities.concat([Rarity.SPECIAL])
  const percentage = new Intl.NumberFormat(navigator.language, {
    style: "percent",
    maximumSignificantDigits: 2
  })
  // the joint wish odds land on values like 26.25%, which rounding would blur
  const chance = new Intl.NumberFormat(navigator.language, {
    style: "percent",
    maximumFractionDigits: 2
  })

  return (
    <div id="wiki-data">
      <p className="wiki-data-intro">{t("wiki.data.data_description")}</p>

      <h2>{t("wiki.data.group_shop")}</h2>
      <div className="wiki-data-list">
        <DataEntry
          title={t("wiki.data.tiers_by_level_title")}
          description={t("wiki.data.tiers_by_level_description")}
        >
          <table id="wiki-data-tiers-by-level">
            <thead>
              <tr>
                <th>{t("level")}</th>
                <th>{t("wiki.data.xp")}</th>
                {rarities.map((r, i) => (
                  <th key={r} style={{ color: RarityColor[rarities[i]] }}>
                    {t(`rarity.${r}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(RarityProbabilityPerLevel).map(
                ([level, odds]) => (
                  <tr key={level}>
                    <td>{level}</td>
                    <td>
                      {Number(level) >= MAX_LEVEL ? "—" : ExpTable[level]}
                    </td>
                    {Object.entries(odds).map(([rarity, probability], i) => (
                      <td key={rarity} style={{ color: RarityColor[rarities[i]] }}>
                        {percentage.format(probability)}
                      </td>
                    ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </DataEntry>

        <DataEntry
          title={t("wiki.data.pool_size_per_category")}
          description={t("wiki.data.pool_size_per_category_description")}
        >
          <table id="wiki-data-pool-size-per-category">
            <thead>
              <tr>
                {rarities.map((r, i) => (
                  <th
                    key={r}
                    style={{ color: RarityColor[rarities[i]] }}
                    colSpan={2}
                  >
                    {t(`rarity.${r}`)}
                  </th>
                ))}
              </tr>
              <tr>
                {rarities.map((r) => (
                  <Fragment key={r}>
                    <th>
                      <img src="assets/ui/star_empty.svg" height="16"></img>
                      <img src="assets/ui/star_empty.svg" height="16"></img>
                    </th>
                    <th>
                      <img src="assets/ui/star_empty.svg" height="16"></img>
                      <img src="assets/ui/star_empty.svg" height="16"></img>
                      <img src="assets/ui/star_empty.svg" height="16"></img>
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {rarities.map((r, i) => (
                  <Fragment key={r}>
                    <td style={{ color: RarityColor[rarities[i]] }}>
                      {PoolSize[r][1]}
                    </td>
                    <td style={{ color: RarityColor[rarities[i]] }}>
                      {PoolSize[r][2]}
                    </td>
                  </Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </DataEntry>
      </div>

      <h2>{t("wiki.data.group_draws")}</h2>
      <div className="wiki-data-list">
        <DataEntry
          title={t("wiki.data.fishing_rarity_rate")}
          description={t("wiki.data.fishing_rarity_rate_description")}
        >
          <table id="wiki-data-fishing-rarity-rate">
            <thead>
              <tr>
                <th></th>
                {rarities_with_special.map((r, i) => (
                  <th
                    key={r}
                    style={{ color: RarityColor[rarities_with_special[i]] }}
                  >
                    {t(`rarity.${r}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...FishingRods].reverse().map((rod) => (
                <tr key={rod}>
                  <td>{t(`item.${rod}`)}</td>
                  {rarities_with_special.map((r, i) => (
                    <td
                      key={r}
                      style={{ color: RarityColor[rarities_with_special[i]] }}
                    >
                      {percentage.format(FishRarityProbability[rod][r] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </DataEntry>

        <section className="my-box wiki-data-entry">
          <WikiLetterDelivery heading="h3" />
        </section>

        <DataEntry
          title={t("wiki.data.wish_tier_odds")}
          description={t("wiki.data.wish_tier_odds_description")}
        >
          <table id="wiki-data-wish-tier-odds">
            <thead>
              <tr>
                <th>{t("wiki.data.wish_first")}</th>
                <th>{t("wiki.data.wish_second")}</th>
                <th>{t("wiki.data.wish_chance")}</th>
              </tr>
            </thead>
            <tbody>
              {blessingTiers.flatMap((first) =>
                blessingTiers.map((second, index) => (
                  <tr key={`${first}-${second}`}>
                    {index === 0 && (
                      <td
                        rowSpan={blessingTiers.length}
                        className={`wiki-tier-cell-${first.toLowerCase()}`}
                      >
                        <TierOdds
                          tier={first}
                          chance={percentage.format(
                            BLESSING_TIER_CHANCES_FIRST[first]
                          )}
                        />
                      </td>
                    )}
                    <td className={`wiki-tier-cell-${second.toLowerCase()}`}>
                      <TierOdds
                        tier={second}
                        chance={percentage.format(
                          BLESSING_TIER_CHANCES_AFTER[first][second]
                        )}
                      />
                    </td>
                    <td>
                      {chance.format(
                        BLESSING_TIER_CHANCES_FIRST[first] *
                          BLESSING_TIER_CHANCES_AFTER[first][second]
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataEntry>

        <DataEntry title={t("wiki.data.special_pokemons_rate")}>
          <table id="wiki-data-special-pokemons-rate">
            <tbody>
              <tr>
                <td>{t("wiki.data.ditto_rate")}</td>
                <td>{percentage.format(DITTO_RATE)}</td>
              </tr>
              <tr>
                <td>{t("wiki.data.kecleon_rate")}</td>
                <td>{percentage.format(KECLEON_RATE)}</td>
              </tr>
              <tr>
                <td>{t("wiki.data.arceus_rate")}</td>
                <td>{percentage.format(ARCEUS_RATE)}</td>
              </tr>
            </tbody>
          </table>
        </DataEntry>
      </div>

      <h2>{t("wiki.data.group_progression")}</h2>
      <div className="wiki-data-list">
        <DataEntry
          title={t("wiki.data.experience_by_rank")}
          description={t("wiki.data.experience_by_rank_description")}
        >
          <table id="wiki-data-experience-by-rank">
            <thead>
              <tr>
                <th>{t("rank")}</th>
                {ranks.map((rank) => (
                  <th key={rank}>{getRankLabel(rank)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("wiki.data.experience")}</td>
                {ranks.map((rank, i) => (
                  <td key={rank}>{ExpPlace[i]}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </DataEntry>
      </div>

      <h2>{t("wiki.data.group_formulas")}</h2>
      <div className="wiki-data-list wiki-data-list-pair">
        <DataEntry
          title={addIconsToDescription(t("wiki.data.defense_calculation"))}
        >
          <p>
            {addIconsToDescription(
              t("wiki.data.defense_calculation_description")
            )}
          </p>
          <p className="wiki-data-formula">
            {t("wiki.data.defense_calculation_formula")}
          </p>
          <p className="wiki-data-example">
            {t("wiki.data.defense_calculation_note")}
          </p>
        </DataEntry>

        <DataEntry
          title={addIconsToDescription(t("wiki.data.speed_calculation"))}
        >
          <p>
            {addIconsToDescription(t("wiki.data.speed_calculation_description"))}
          </p>
          <p className="wiki-data-formula">
            {t("wiki.data.speed_calculation_formula")}
          </p>
          <p className="wiki-data-example">
            {addIconsToDescription(t("wiki.data.speed_calculation_example"))}
          </p>
        </DataEntry>

        <DataEntry title={addIconsToDescription(t("wiki.data.luck_title"))}>
          <p>{addIconsToDescription(t("wiki.data.luck_description"))}</p>
          <p className="wiki-data-formula">
            {t("wiki.data.luck_formula")}
          </p>
          <p className="wiki-data-example">
            {addIconsToDescription(t("wiki.data.luck_example"))}
          </p>
        </DataEntry>

        <DataEntry title={t("wiki.data.round_damage_calculation")}>
          <p>{t("wiki.data.round_damage_calculation_description")}</p>
          <p className="wiki-data-formula">
            {t("wiki.data.round_damage_calculation_formula")}
          </p>
          <p className="wiki-data-example">
            {t("wiki.data.round_damage_calculation_note")}
          </p>
        </DataEntry>
      </div>
    </div>
  )
}
