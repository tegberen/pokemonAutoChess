import { memo, useDeferredValue, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Blessings } from "../../../../../config/game/blessings"
import { type Blessing, BlessingTier } from "../../../../../types/enum/Blessing"
import {
  fetchWishReport,
  type IWishReport,
  type IWishReportMode,
  type IWishReportRow
} from "../../../models/wish-report"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { BlessingHistoryTooltip } from "../profile/game-history"
import { SearchInput } from "../search-input/search-input"
import { BlessingIcon } from "../synergy/blessing-tooltip-card"
import { WishScatter } from "./wish-scatter"
import "./wish-report.css"

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true

const TIERS = [BlessingTier.SILVER, BlessingTier.GOLD, BlessingTier.PRISMATIC]

const WISH_TOOLTIP_ID = "wish-report-tooltip"

const TierColor: { [tier in BlessingTier]: string } = {
  [BlessingTier.SILVER]: "var(--color-fg-secondary)",
  [BlessingTier.GOLD]: "var(--color-fg-gold)",
  [BlessingTier.PRISMATIC]: "var(--color-rarity-epic)"
}

const OfferedWishes = (Object.keys(Blessings) as Blessing[]).filter(
  (blessing) => Blessings[blessing].availableAtStages.length > 0
)

type SortKey = "averagePlace" | "pickRate" | "firstRate"
type View = "table" | "chart"
type ReportMode = "duo" | "solo"

const COLUMNS: { label: string; sortKey?: SortKey }[] = [
  { label: "Wish" },
  { label: "Count" },
  { label: "Pick rate", sortKey: "pickRate" },
  { label: "Top", sortKey: "averagePlace" },
  { label: "Winrate", sortKey: "firstRate" }
]

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function jumpToTier(tier: BlessingTier) {
  document.getElementById(`wish-report-${tier}`)?.scrollIntoView({
    behavior: REDUCED_MOTION ? "auto" : "smooth",
    block: "start"
  })
}

export function WishReport() {
  const { t } = useTranslation()
  const [report, setReport] = useState<IWishReport | null>(null)
  const [error, setError] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("averagePlace")
  const [view, setView] = useState<View>("table")
  const [reportMode, setReportMode] = useState<ReportMode>("duo")
  const [chartTier, setChartTier] = useState(BlessingTier.SILVER)
  const [query, setQuery] = useState("")
  // typing stays responsive while the long tables catch up
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    fetchWishReport()
      .then(setReport)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <div id="wish-report">
      <header>
        <select
          value={view}
          onChange={(e) => setView(e.target.value as View)}
        >
          <option value="table">Table</option>
          <option value="chart">Chart</option>
        </select>
        <select
          value={reportMode}
          onChange={(e) => setReportMode(e.target.value as ReportMode)}
        >
          <option value="duo">Duo</option>
          <option value="solo">Solo</option>
        </select>
        {view === "table" && (
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="averagePlace">
              {t("rank")} {t("by_average_place")}
            </option>
            <option value="pickRate">
              {t("rank")} {t("by_popularity")}
            </option>
            <option value="firstRate">
              {t("rank")} {t("by_winrate")}
            </option>
          </select>
        )}
        <nav className="wish-report-tiers">
          {TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              className={cc(
                "bubbly wiki-blessings-tier-shortcut",
                tier.toLowerCase(),
                { unselected: view === "chart" && tier !== chartTier }
              )}
              onClick={() =>
                view === "chart" ? setChartTier(tier) : jumpToTier(tier)
              }
            >
              {t(`blessing_tier.${tier}`)}
            </button>
          ))}
        </nav>
        {report && (
          <span className="wish-report-count">
            {report[reportMode].games} games, {report[reportMode].players}{" "}
            players
          </span>
        )}
        <SearchInput value={query} onChange={setQuery} />
      </header>

      <div className="wish-report-body">
        {error && <p className="error">{error}</p>}
        {!report && !error && <p>Loading</p>}
        {report && (
          <WishTables
            mode={report[reportMode]}
            places={reportMode === "duo" ? 4 : 8}
            view={view}
            chartTier={chartTier}
            sortKey={sortKey}
            query={deferredQuery}
          />
        )}
        {report && (
          <ul className="wish-report-notes">
            <li>
              <b>Pick rate</b>: the share of all picks in its tier that went
              to this Wish
            </li>
            <li>
              <b>Winrate</b>: how often players with this Wish finished 1st
            </li>
            <li>
              <b>Top</b>: the average place of players with this Wish, all
              their places added up and divided by Count
            </li>
          </ul>
        )}
      </div>
      <BlessingHistoryTooltip id={WISH_TOOLTIP_ID} />
    </div>
  )
}

type TierRow = IWishReportRow & { searchName: string }

function WishTables({
  mode,
  places,
  view,
  chartTier,
  sortKey,
  query
}: {
  mode: IWishReportMode
  places: number
  view: View
  chartTier: BlessingTier
  sortKey: SortKey
  query: string
}) {
  const { t } = useTranslation()

  // built once per mode and sort, so a search only filters
  const rowsByTier = useMemo(() => {
    const searchName = (blessing: Blessing) =>
      t(`blessing.${blessing}.name`).toLowerCase()
    const sorted = [...mode.rows].sort((a, b) =>
      sortKey === "averagePlace"
        ? a.averagePlace - b.averagePlace
        : b[sortKey] - a[sortKey]
    )
    const picked = new Set(sorted.map((row) => row.blessing))
    return TIERS.map((tier) => {
      const pickedRows: TierRow[] = sorted
        .filter((row) => Blessings[row.blessing].tier === tier)
        .map((row) => ({ ...row, searchName: searchName(row.blessing) }))
      // never picked, so they trail their tier whatever the sort
      const unpickedRows: TierRow[] = OfferedWishes.filter(
        (blessing) =>
          Blessings[blessing].tier === tier && !picked.has(blessing)
      )
        .map((blessing) => ({
          blessing,
          picks: 0,
          pickRate: 0,
          averagePlace: Number.NaN,
          firstRate: Number.NaN,
          searchName: searchName(blessing)
        }))
        .sort((a, b) => (a.searchName < b.searchName ? -1 : 1))
      return { tier, rows: [...pickedRows, ...unpickedRows] }
    })
  }, [mode, sortKey, t])

  if (mode.games === 0) return <p>No data available</p>

  const search = query.trim().toLowerCase()
  const matching = (rows: TierRow[]) =>
    search === ""
      ? rows
      : rows.filter((row) => row.searchName.includes(search))

  if (view === "chart") {
    // a Wish nobody picked has no place to plot
    const chartRows = matching(
      rowsByTier.find(({ tier }) => tier === chartTier)?.rows ?? []
    ).filter((row) => row.picks > 0)
    return chartRows.length > 0 ? (
      <WishScatter rows={chartRows} places={places} />
    ) : (
      <p>No data available</p>
    )
  }

  return (
    <>
      {rowsByTier.map(({ tier, rows }) => {
        const tierRows = matching(rows)
        if (tierRows.length === 0) return null
        return (
          <section key={tier} id={`wish-report-${tier}`}>
            <h3 style={{ color: TierColor[tier] }}>
              {t(`blessing_tier.${tier}`)}
            </h3>
            <table>
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.label}
                      className={cc({ sorted: column.sortKey === sortKey })}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tierRows.map((row) => (
                  <WishRow key={row.blessing} row={row} sortKey={sortKey} />
                ))}
              </tbody>
            </table>
          </section>
        )
      })}
    </>
  )
}

const WishRow = memo(function WishRow({
  row,
  sortKey
}: {
  row: IWishReportRow
  sortKey: SortKey
}) {
  const { t } = useTranslation()
  const isPicked = row.picks > 0
  return (
    <tr>
      <td>
        <span
          className="wish-report-name"
          data-tooltip-id={WISH_TOOLTIP_ID}
          data-tooltip-content={row.blessing}
        >
          <BlessingIcon blessing={row.blessing} />
          <span>
            {addIconsToDescription(t(`blessing.${row.blessing}.name`))}
          </span>
        </span>
      </td>
      <td>{row.picks}</td>
      <td className={cc({ sorted: sortKey === "pickRate" })}>
        {percent(row.pickRate)}
      </td>
      <td className={cc({ sorted: sortKey === "averagePlace" })}>
        {isPicked ? row.averagePlace.toFixed(2) : "–"}
      </td>
      <td className={cc({ sorted: sortKey === "firstRate" })}>
        {isPicked ? percent(row.firstRate) : "–"}
      </td>
    </tr>
  )
})
