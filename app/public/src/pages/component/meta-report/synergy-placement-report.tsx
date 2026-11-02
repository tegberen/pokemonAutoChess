import { Fragment, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  getHighestReachableSynergyTier
} from "../../../../../config/game/synergies"
import { GameMode } from "../../../../../types/enum/Game"
import type { Synergy } from "../../../../../types/enum/Synergy"
import {
  fetchSynergyReport,
  type ISynergyReport,
  type ISynergyReportMode,
  type ISynergyReportRow,
  type ISynergyReportStats
} from "../../../models/synergy-report"
import { cc } from "../../utils/jsx"
import { Checkbox } from "../checkbox/checkbox"
import SynergyIcon from "../icons/synergy-icon"
import { ReportScatter, type ScatterQuadrantLabels } from "./wish-scatter"
import "./synergy-placement-report.css"

// fewer boards than this and a row is mostly luck, so it is faded
const LOW_SAMPLE_BOARDS = 50
// within this distance of the middle place, a synergy counts as even
const EVEN_PLACE_MARGIN = 0.15
const COLOUR_CODED_STORAGE_KEY = "synergy-report-colour-coded"

const QUADRANT_LABELS: ScatterQuadrantLabels = {
  popularStrong: "Popular & strong",
  popularWeak: "Popular & weak",
  rareStrong: "Rare & strong",
  rareWeak: "Rare & weak"
}

type SortKey = "averagePlace" | "playRate"
type ReportMode = "duo" | "solo"
type TierView = "all" | "lowest" | "highest"
type ViewRow = ISynergyReportRow & { threshold?: number }
type ScatterRow = ViewRow & { picks: number }

function readColourCoded() {
  try {
    return localStorage.getItem(COLOUR_CODED_STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export function SynergyPlacementReport() {
  const { t } = useTranslation()
  const [report, setReport] = useState<ISynergyReport | null>(null)
  const [error, setError] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("averagePlace")
  const [reportMode, setReportMode] = useState<ReportMode>("duo")
  const [tierView, setTierView] = useState<TierView>("all")
  const [expanded, setExpanded] = useState<Set<Synergy>>(new Set())
  const [colourCoded, setColourCoded] = useState(readColourCoded)

  const toggleColourCoded = (checked: boolean) => {
    setColourCoded(checked)
    try {
      localStorage.setItem(COLOUR_CODED_STORAGE_KEY, String(checked))
    } catch {}
  }

  useEffect(() => {
    fetchSynergyReport()
      .then(setReport)
      .catch((err: Error) => setError(err.message))
  }, [])

  const toggleExpanded = (synergy: Synergy) =>
    setExpanded((previous) => {
      const next = new Set(previous)
      if (!next.delete(synergy)) next.add(synergy)
      return next
    })

  const openFromChart = (synergy: Synergy) => {
    setExpanded((previous) => new Set(previous).add(synergy))
    document
      .getElementById(`synergy-placement-${synergy}`)
      ?.scrollIntoView({ block: "center" })
  }

  return (
    <div
      id="synergy-placement-report"
      className={cc({ "colour-coded": colourCoded })}
    >
      <header>
        <select
          value={reportMode}
          onChange={(e) => setReportMode(e.target.value as ReportMode)}
        >
          <option value="duo">Duo</option>
          <option value="solo">Solo</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="averagePlace">
            {t("rank")} {t("by_average_place")}
          </option>
          <option value="playRate">
            {t("rank")} {t("by_popularity")}
          </option>
        </select>
        <select
          value={tierView}
          onChange={(e) => setTierView(e.target.value as TierView)}
        >
          <option value="all">All tiers</option>
          <option value="lowest">Min tier</option>
          <option value="highest">Max tier</option>
        </select>
        <Checkbox
          checked={colourCoded}
          onToggle={toggleColourCoded}
          label="Colours"
          isDark
        />
        {report && (
          <span className="synergy-placement-count">
            {report[reportMode].games} games, {report[reportMode].players}{" "}
            players
          </span>
        )}
      </header>

      <div className="synergy-placement-body">
        {error && <p className="error">{error}</p>}
        {!report && !error && <p>Loading</p>}
        {report && (
          <SynergyPlacementContent
            mode={report[reportMode]}
            gameMode={
              reportMode === "duo" ? GameMode.DOUBLE_UP : GameMode.CLASSIC
            }
            places={reportMode === "duo" ? 4 : 8}
            sortKey={sortKey}
            tierView={tierView}
            expanded={expanded}
            onToggle={toggleExpanded}
            onChartClick={openFromChart}
          />
        )}
        {report && (
          <ul className="synergy-placement-notes">
            <li>{t("pokemon_report_footer")}</li>
            <li>Balance changes show up slowly, and new comps not at all</li>
            <li>
              A board counts once for each active synergy, under the highest
              tier it reached. Click a row to see its tiers.
            </li>
            <li>
              <b>Min tier</b> / <b>Max tier</b>: only the boards that
              stopped at that tier
            </li>
            <li>
              <b>Play rate</b>: the share of boards with this synergy active
            </li>
            <li>
              <b>Top</b>: the average place of those boards
            </li>
            <li>
              <b>Winrate</b>: how often those boards finished 1st
            </li>
            <li>
              Faded rows have fewer than {LOW_SAMPLE_BOARDS} boards and are
              left out of the chart
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}

function SynergyPlacementContent({
  mode,
  gameMode,
  places,
  sortKey,
  tierView,
  expanded,
  onToggle,
  onChartClick
}: {
  mode: ISynergyReportMode
  gameMode: GameMode
  places: number
  sortKey: SortKey
  tierView: TierView
  expanded: Set<Synergy>
  onToggle: (synergy: Synergy) => void
  onChartClick: (synergy: Synergy) => void
}) {
  const { t } = useTranslation()
  const viewRows: ViewRow[] = useMemo(
    () =>
      mode.rows.map((row) => {
        if (tierView === "all") return row
        if (tierView === "lowest") return { ...row, ...row.tiers[0] }
        const highestThreshold = getHighestReachableSynergyTier(
          row.synergy,
          gameMode
        )
        const highestTier =
          row.tiers.find(
            (candidate) => candidate.threshold === highestThreshold
          ) ?? row.tiers[row.tiers.length - 1]
        return { ...row, ...highestTier }
      }),
    [mode, tierView, gameMode]
  )
  const sortedRows = useMemo(
    () =>
      [...viewRows].sort((a, b) => {
        // a tier nobody reached has no place, so it trails whatever the sort
        if ((a.boards === 0) !== (b.boards === 0)) {
          return a.boards === 0 ? 1 : -1
        }
        return sortKey === "averagePlace"
          ? a.averagePlace - b.averagePlace
          : b.playRate - a.playRate
      }),
    [viewRows, sortKey]
  )
  const scatterRows: ScatterRow[] = useMemo(
    () =>
      viewRows
        .filter((row) => row.boards >= LOW_SAMPLE_BOARDS)
        .map((row) => ({ ...row, picks: row.boards })),
    [viewRows]
  )

  if (mode.games === 0) return <p>{t("no_data_available")}</p>

  const renderPoint = (row: ScatterRow) => (
    <button
      type="button"
      className="synergy-placement-point"
      onClick={() => onChartClick(row.synergy)}
    >
      <SynergyIcon type={row.synergy} size="20px" />
    </button>
  )

  const renderTooltip = (row: ScatterRow) => (
    <div className="synergy-placement-tooltip">
      <p>
        <SynergyIcon type={row.synergy} size="24px" />
        {t(`synergy.${row.synergy}`)}
        {row.threshold && ` ${row.threshold}`}
      </p>
      <dl className="wish-scatter-stats">
        <div>
          <dt>Count</dt>
          <dd>{row.boards}</dd>
        </div>
        <div>
          <dt>Play rate</dt>
          <dd>{percent(row.playRate)}</dd>
        </div>
        <div>
          <dt>Top</dt>
          <dd>{row.averagePlace.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Winrate</dt>
          <dd>{percent(row.firstRate)}</dd>
        </div>
      </dl>
      <PlacementBars stats={row} places={places} />
    </div>
  )

  return (
    <>
      <div className="synergy-placement-chart">
        {scatterRows.length > 0 ? (
          <ReportScatter
            rows={scatterRows}
            places={places}
            renderPoint={renderPoint}
            renderTooltip={renderTooltip}
            quadrantLabels={QUADRANT_LABELS}
          />
        ) : (
          <p className="synergy-placement-chart-empty">
            No synergy has {LOW_SAMPLE_BOARDS} boards at this tier yet
          </p>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th>Synergy</th>
            <th>Count</th>
            <th className={cc({ sorted: sortKey === "playRate" })}>
              Play rate
            </th>
            <th className={cc({ sorted: sortKey === "averagePlace" })}>
              Top
            </th>
            <th>Winrate</th>
            <th>Placements</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <Fragment key={row.synergy}>
              <tr
                id={`synergy-placement-${row.synergy}`}
                className={cc("synergy-placement-row", {
                  expanded: expanded.has(row.synergy),
                  "low-sample": row.boards < LOW_SAMPLE_BOARDS
                })}
                onClick={() => onToggle(row.synergy)}
              >
                <td>
                  <span className="synergy-placement-name">
                    <span className="synergy-placement-chevron">›</span>
                    <SynergyIcon type={row.synergy} size="24px" />
                    {t(`synergy.${row.synergy}`)}
                    {row.threshold && ` ${row.threshold}`}
                  </span>
                </td>
                <StatCells stats={row} places={places} sortKey={sortKey} />
              </tr>
              {expanded.has(row.synergy) &&
                row.tiers.map((tier) => (
                  <tr
                    key={tier.threshold}
                    className={cc("synergy-placement-tier-row", {
                      "low-sample": tier.boards < LOW_SAMPLE_BOARDS
                    })}
                  >
                    <td>
                      <span className="synergy-placement-name">
                        <SynergyIcon type={row.synergy} size="18px" />
                        {tier.threshold}
                      </span>
                    </td>
                    <StatCells
                      stats={tier}
                      places={places}
                      sortKey={sortKey}
                    />
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  )
}

function StatCells({
  stats,
  places,
  sortKey
}: {
  stats: ISynergyReportStats
  places: number
  sortKey: SortKey
}) {
  if (stats.boards === 0) {
    return (
      <>
        <td>0</td>
        <td className={cc({ sorted: sortKey === "playRate" })}>0%</td>
        <td className={cc({ sorted: sortKey === "averagePlace" })}>–</td>
        <td>–</td>
        <td />
      </>
    )
  }
  const placeDifference = stats.averagePlace - (places + 1) / 2
  return (
    <>
      <td>{stats.boards}</td>
      <td className={cc({ sorted: sortKey === "playRate" })}>
        {percent(stats.playRate)}
      </td>
      <td
        className={cc({
          sorted: sortKey === "averagePlace",
          "better-place": placeDifference < -EVEN_PLACE_MARGIN,
          "worse-place": placeDifference > EVEN_PLACE_MARGIN
        })}
      >
        {stats.averagePlace.toFixed(2)}
      </td>
      <td>{percent(stats.firstRate)}</td>
      <td>
        <PlacementBars stats={stats} places={places} />
      </td>
    </>
  )
}

function PlacementBars({
  stats,
  places
}: {
  stats: ISynergyReportStats
  places: number
}) {
  const mostBoards = Math.max(1, ...stats.boardsPerPlace)
  return (
    <span
      className="synergy-placement-bars"
      title={stats.boardsPerPlace
        .map((boards, index) => `#${index + 1}: ${boards}`)
        .join("  ")}
    >
      {stats.boardsPerPlace.map((boards, index) => (
        <span
          key={index}
          className={cc({ "top-half": index < places / 2 })}
          style={{ height: `${(boards / mostBoards) * 100}%` }}
        />
      ))}
    </span>
  )
}
