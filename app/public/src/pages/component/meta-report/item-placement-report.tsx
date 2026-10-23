import { memo, useDeferredValue, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  CraftableItems,
  type Item,
  ShinyItems,
  Tools,
  UnholdableItems
} from "../../../../../types/enum/Item"
import { isIn } from "../../../../../utils/array"
import {
  fetchWishItemReport,
  type IWishItemReport,
  type IWishItemReportMode,
  type IWishItemReportRow
} from "../../../models/wish-item-report"
import { cc } from "../../utils/jsx"
import { SearchInput } from "../search-input/search-input"
import { ReportScatter } from "./wish-scatter"
import "./wish-report.css"
import "./item-placement-report.css"

type SortKey = "averagePlace" | "picks"
type View = "table" | "chart"
type ReportMode = "duo" | "solo"
type Category = "craftable" | "tools" | "shiny"

const CATEGORIES: {
  key: Category
  label: "craftable_items" | "tools" | "shiny_items"
  items: readonly Item[]
}[] = [
  { key: "craftable", label: "craftable_items", items: CraftableItems },
  { key: "tools", label: "tools", items: Tools },
  {
    key: "shiny",
    label: "shiny_items",
    items: ShinyItems.filter((item) => !isIn(UnholdableItems, item))
  }
]

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function renderItemPoint(row: IWishItemReportRow) {
  return (
    <img
      src={`assets/item/${row.item}.png`}
      width={24}
      height={24}
      alt={row.item}
    />
  )
}

function ItemTooltip({ row }: { row: IWishItemReportRow }) {
  const { t } = useTranslation()
  return (
    <div className="item-placement-tooltip">
      <img src={`assets/item/${row.item}.png`} width={32} height={32} />
      <strong>{t(`item.${row.item}`)}</strong>
      <dl className="wish-scatter-stats">
        <div>
          <dt>Count</dt>
          <dd>{row.picks}</dd>
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
    </div>
  )
}

const renderItemTooltip = (row: IWishItemReportRow) => <ItemTooltip row={row} />

export function ItemPlacementReport() {
  const { t } = useTranslation()
  const [report, setReport] = useState<IWishItemReport | null>(null)
  const [error, setError] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("averagePlace")
  const [view, setView] = useState<View>("table")
  const [reportMode, setReportMode] = useState<ReportMode>("duo")
  const [category, setCategory] = useState<Category>("craftable")
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    fetchWishItemReport()
      .then(setReport)
      .catch((err: Error) => setError(err.message))
  }, [])

  const mode = report?.[reportMode]
  const rows = useMemo(() => {
    if (!mode) return []
    const search = deferredQuery.trim().toLowerCase()
    const categoryItems =
      CATEGORIES.find(({ key }) => key === category)?.items ?? []
    return mode.rows
      .filter(
        (row) =>
          isIn(categoryItems, row.item) &&
          (search === "" ||
            t(`item.${row.item}`).toLowerCase().includes(search))
      )
      .sort((a, b) =>
        sortKey === "averagePlace"
          ? a.averagePlace - b.averagePlace
          : b.picks - a.picks
      )
  }, [mode, category, sortKey, deferredQuery, t])

  return (
    <div id="wish-report" className="item-placement-report">
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
            <option value="picks">
              {t("rank")} {t("by_popularity")}
            </option>
          </select>
        )}
        <nav className="wish-report-tiers">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={cc("bubbly", { unselected: key !== category })}
              onClick={() => setCategory(key)}
            >
              {t(label)}
            </button>
          ))}
        </nav>
        {mode && (
          <span className="wish-report-count">
            {mode.games} games, {mode.players} players
          </span>
        )}
        <SearchInput value={query} onChange={setQuery} />
      </header>

      <div className="wish-report-body">
        {error && <p className="error">{error}</p>}
        {!report && !error && <p>Loading</p>}
        {mode && (
          <ItemContent
            mode={mode}
            rows={rows}
            view={view}
            places={reportMode === "duo" ? 4 : 8}
            sortKey={sortKey}
          />
        )}
        {mode && (
          <ul className="wish-report-notes">
            <li>{t("pokemon_report_footer")}</li>
            <li>
              <b>Count</b>: players whose team held this item at the end of
              the game, once each
            </li>
            <li>
              <b>Top</b>: the average place of those players
            </li>
            <li>
              <b>Winrate</b>: how often those players finished 1st
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}

function ItemContent({
  mode,
  rows,
  view,
  places,
  sortKey
}: {
  mode: IWishItemReportMode
  rows: IWishItemReportRow[]
  view: View
  places: number
  sortKey: SortKey
}) {
  const { t } = useTranslation()
  if (mode.games === 0 || rows.length === 0)
    return <p>{t("no_data_available")}</p>

  if (view === "chart") {
    return (
      <ReportScatter
        rows={rows}
        places={places}
        renderPoint={renderItemPoint}
        renderTooltip={renderItemTooltip}
      />
    )
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th className={cc({ sorted: sortKey === "picks" })}>Count</th>
          <th className={cc({ sorted: sortKey === "averagePlace" })}>Top</th>
          <th>Winrate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <ItemRow key={row.item} row={row} sortKey={sortKey} />
        ))}
      </tbody>
    </table>
  )
}

const ItemRow = memo(function ItemRow({
  row,
  sortKey
}: {
  row: IWishItemReportRow
  sortKey: SortKey
}) {
  const { t } = useTranslation()
  return (
    <tr>
      <td>
        <span className="wish-report-name">
          <img src={`assets/item/${row.item}.png`} width={28} height={28} />
          <span>{t(`item.${row.item}`)}</span>
        </span>
      </td>
      <td className={cc({ sorted: sortKey === "picks" })}>{row.picks}</td>
      <td className={cc({ sorted: sortKey === "averagePlace" })}>
        {row.averagePlace.toFixed(2)}
      </td>
      <td>{percent(row.firstRate)}</td>
    </tr>
  )
})
