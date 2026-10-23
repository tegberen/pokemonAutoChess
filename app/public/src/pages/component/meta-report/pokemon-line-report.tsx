import type React from "react"
import { memo, useDeferredValue, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { RarityColor } from "../../../../../config"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../../../../../models/precomputed/precomputed-rarity"
import { PRECOMPUTED_POKEMONS_PER_TYPE } from "../../../../../models/precomputed/precomputed-types"
import { Rarity } from "../../../../../types/enum/Game"
import {
  NonPkm,
  Pkm,
  PkmFamily,
  PkmIndex
} from "../../../../../types/enum/Pokemon"
import type { PoolType } from "../../../../../types/enum/PoolType"
import { Synergy } from "../../../../../types/enum/Synergy"
import { keys } from "../../../../../utils/object"
import {
  fetchPokemonItemsReport,
  fetchPokemonReport,
  type IPokemonItemsMode,
  type IPokemonItemsReport,
  type IPokemonReport,
  type IPokemonReportForm,
  type IPokemonReportLine,
  type IPokemonReportMode,
  type IPokemonTopItem
} from "../../../models/pokemon-report"
import { cc } from "../../utils/jsx"
import PokemonPortrait from "../pokemon-portrait"
import { SearchInput } from "../search-input/search-input"
import { ReportScatter } from "./wish-scatter"
import "./wish-report.css"
import "./pokemon-line-report.css"

type SortKey = "averagePlace" | "picks" | "averageItems"
type View = "table" | "chart"
type ReportMode = "duo" | "solo"

type LineRowData = IPokemonReportLine & {
  visibleForms: IPokemonReportForm[]
}

const FAMILIES_THAT_EVOLVE = (() => {
  const starsPerFamily = new Map<Pkm, Set<number>>()
  Object.values(Pkm)
    .filter((pkm) => PkmFamily[pkm] !== undefined && !NonPkm.includes(pkm))
    .forEach((pkm) => {
      const stars = starsPerFamily.get(PkmFamily[pkm]) ?? new Set<number>()
      stars.add(getPokemonData(pkm).stars)
      starsPerFamily.set(PkmFamily[pkm], stars)
    })
  return new Set(
    [...starsPerFamily].filter(([, stars]) => stars.size > 1).map(([f]) => f)
  )
})()

const POOLS = ["regular", "additional", "regional"] satisfies PoolType[]

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function isInPool(pkm: Pkm, pool: string) {
  if (pool === "all") return true
  const data = getPokemonData(pkm)
  if (pool === "special") return data.rarity === Rarity.SPECIAL
  if (pool === "additional") return data.additional
  if (pool === "regional") return data.regional
  return !data.additional && !data.regional && data.rarity !== Rarity.SPECIAL
}

function renderLinePoint(row: LineRowData) {
  return <PokemonPortrait portrait={PkmIndex[row.pkm]} width={24} height={24} />
}

function LineTooltip({ row }: { row: LineRowData }) {
  const { t } = useTranslation()
  return (
    <div className="pokemon-line-tooltip">
      <PokemonPortrait portrait={PkmIndex[row.pkm]} loading="eager" />
      <strong>{t(`pkm.${row.pkm}`)}</strong>
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

const renderLineTooltip = (row: LineRowData) => <LineTooltip row={row} />

export function PokemonLineReport() {
  const { t } = useTranslation()
  const [report, setReport] = useState<IPokemonReport | null>(null)
  const [itemsReport, setItemsReport] = useState<IPokemonItemsReport | null>(
    null
  )
  const [error, setError] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("averagePlace")
  const [view, setView] = useState<View>("table")
  const [reportMode, setReportMode] = useState<ReportMode>("duo")
  const [synergy, setSynergy] = useState<Synergy | "all">("all")
  const [rarity, setRarity] = useState<Rarity | "all">("all")
  const [pool, setPool] = useState("all")
  const [stars, setStars] = useState("all")
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    fetchPokemonReport()
      .then(setReport)
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    fetchPokemonItemsReport()
      .then(setItemsReport)
      .catch(() => setItemsReport(null))
  }, [])

  const mode = report?.[reportMode]
  const rows = useMemo(() => {
    if (!mode) return []
    const search = deferredQuery.trim().toLowerCase()
    const nameOf = (pkm: Pkm) => t(`pkm.${pkm}`).toLowerCase()
    const inSynergy = (pkm: Pkm) =>
      synergy === "all" || PRECOMPUTED_POKEMONS_PER_TYPE[synergy].includes(pkm)
    const inRarity = (pkm: Pkm) =>
      rarity === "all" || PRECOMPUTED_POKEMONS_PER_RARITY[rarity].includes(pkm)
    const matchesFilters = (pkm: Pkm) =>
      inSynergy(pkm) &&
      inRarity(pkm) &&
      isInPool(pkm, pool) &&
      (stars === "all" || getPokemonData(pkm).stars === +stars)

    const lines: LineRowData[] = []
    for (const line of mode.lines) {
      const visibleForms = line.forms.filter((form) =>
        matchesFilters(form.pkm)
      )
      if (visibleForms.length === 0) continue
      if (
        search !== "" &&
        !line.forms.some((form) => nameOf(form.pkm).includes(search))
      )
        continue
      lines.push({ ...line, visibleForms })
    }
    return lines.sort((a, b) =>
      sortKey === "averagePlace"
        ? a.averagePlace - b.averagePlace
        : b[sortKey] - a[sortKey]
    )
  }, [mode, sortKey, synergy, rarity, pool, stars, deferredQuery, t])

  const itemsMode: IPokemonItemsMode | null = itemsReport?.[reportMode] ?? null

  return (
    <div id="wish-report" className="pokemon-line-report">
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
            <option value="averageItems">
              {t("rank")} {t("by_average_held_items")}
            </option>
          </select>
        )}
        <select
          value={synergy}
          onChange={(e) => setSynergy(e.target.value as Synergy | "all")}
        >
          <option value="all">{`${t("synergies")}: ${t("all")}`}</option>
          {keys(Synergy).map((s) => (
            <option value={s} key={s}>
              {t(`synergy.${s}`)}
            </option>
          ))}
        </select>
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value as Rarity | "all")}
        >
          <option value="all">{`${t("rarity_label")}: ${t("all")}`}</option>
          {keys(Rarity).map((r) => (
            <option
              value={r}
              key={r}
              style={{ color: RarityColor[r as Rarity] }}
            >
              {t(`rarity.${r}`)}
            </option>
          ))}
        </select>
        <select value={pool} onChange={(e) => setPool(e.target.value)}>
          <option value="all">{`${t("pool_label")}: ${t("all")}`}</option>
          {POOLS.map((p) => (
            <option value={p} key={p}>
              {t(`pool.${p}`)}
            </option>
          ))}
          <option value="special">{t("rarity.SPECIAL")}</option>
        </select>
        <select value={stars} onChange={(e) => setStars(e.target.value)}>
          <option value="all">{`${t("tier")}: ${t("all")}`}</option>
          {[1, 2, 3, 4].map((count) => (
            <option value={count} key={count}>
              {`${t("tier")}: ${"⭐".repeat(count)}`}
            </option>
          ))}
        </select>
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
          <PokemonLineContent
            mode={mode}
            rows={rows}
            view={view}
            places={reportMode === "duo" ? 4 : 8}
            sortKey={sortKey}
            itemsMode={itemsMode}
          />
        )}
        {mode && (
          <ul className="wish-report-notes">
            <li>{t("pokemon_report_footer")}</li>
            <li>
              <b>Count</b>: players who fielded this Pokémon at the end of
              the game, once each
            </li>
            <li>
              <b>Top</b>: the average place of those players
            </li>
            <li>
              <b>Winrate</b>: how often those players finished 1st
            </li>
            <li>
              <b>Held items</b>: the average number of items on each copy
              of this Pokémon
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}

function PokemonLineContent({
  mode,
  rows,
  view,
  places,
  sortKey,
  itemsMode
}: {
  mode: IPokemonReportMode
  rows: LineRowData[]
  view: View
  places: number
  sortKey: SortKey
  itemsMode: IPokemonItemsMode | null
}) {
  const { t } = useTranslation()
  if (mode.games === 0 || rows.length === 0)
    return <p>{t("no_data_available")}</p>

  if (view === "chart") {
    return (
      <ReportScatter
        rows={rows}
        places={places}
        renderPoint={renderLinePoint}
        renderTooltip={renderLineTooltip}
      />
    )
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Pokémon</th>
          <th className={cc({ sorted: sortKey === "picks" })}>Count</th>
          <th className={cc({ sorted: sortKey === "averagePlace" })}>Top</th>
          <th>Winrate</th>
          <th className={cc({ sorted: sortKey === "averageItems" })}>
            Held items
          </th>
          {itemsMode && (
            <th>
              Items (
              <span className="pokemon-line-items-warning">
                not a recommendation
              </span>
              )
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <PokemonLineRow
            key={row.pkm}
            row={row}
            sortKey={sortKey}
            itemsMode={itemsMode}
          />
        ))}
      </tbody>
    </table>
  )
}

function TopItems({ items }: { items: IPokemonTopItem[] | undefined }) {
  const { t } = useTranslation()
  if (!items || items.length === 0) return <>–</>
  return (
    <span className="pokemon-line-items">
      {items.map(({ item, share }) => (
        <span key={item} title={t(`item.${item}`)}>
          <img src={`assets/item/${item}.png`} width={20} height={20} />
          {Math.round(share * 100)}%
        </span>
      ))}
    </span>
  )
}

const PokemonLineRow = memo(function PokemonLineRow({
  row,
  sortKey,
  itemsMode
}: {
  row: LineRowData
  sortKey: SortKey
  itemsMode: IPokemonItemsMode | null
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const expandable = row.visibleForms.length > 1
  const toggle = () => setExpanded((value) => !value)
  return (
    <>
      <tr
        className={cc({ "pokemon-line-expandable": expandable })}
        {...(expandable && {
          role: "button",
          tabIndex: 0,
          "aria-expanded": expanded,
          onClick: toggle,
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key !== "Enter" && event.key !== " ") return
            event.preventDefault()
            toggle()
          }
        })}
      >
        <td>
          <span className="wish-report-name">
            <PokemonPortrait
              portrait={PkmIndex[row.pkm]}
              width={32}
              height={32}
              loading="eager"
            />
            <span>
              {FAMILIES_THAT_EVOLVE.has(row.pkm)
                ? t("pokemon_line_name", { name: t(`pkm.${row.pkm}`) })
                : t(`pkm.${row.pkm}`)}
            </span>
            {expandable && (
              <span
                className={cc("pokemon-line-chevron", { open: expanded })}
              />
            )}
          </span>
        </td>
        <td className={cc({ sorted: sortKey === "picks" })}>{row.picks}</td>
        <td className={cc({ sorted: sortKey === "averagePlace" })}>
          {row.averagePlace.toFixed(2)}
        </td>
        <td>{percent(row.firstRate)}</td>
        <td className={cc({ sorted: sortKey === "averageItems" })}>
          {row.averageItems.toFixed(2)}
        </td>
        {itemsMode && (
          <td>
            <TopItems items={itemsMode.lines[row.pkm]} />
          </td>
        )}
      </tr>
      {expanded &&
        expandable &&
        row.visibleForms.map((form) => (
          <tr key={form.pkm} className="pokemon-line-form">
            <td>
              <span className="wish-report-name">
                <PokemonPortrait
                  portrait={PkmIndex[form.pkm]}
                  width={32}
                  height={32}
                  loading="eager"
                />
                <span>{t(`pkm.${form.pkm}`)}</span>
              </span>
            </td>
            <td>{form.picks}</td>
            <td>{form.averagePlace.toFixed(2)}</td>
            <td>{percent(form.firstRate)}</td>
            <td className={cc({ sorted: sortKey === "averageItems" })}>
              {form.averageItems.toFixed(2)}
            </td>
            {itemsMode && (
              <td>
                <TopItems items={itemsMode.forms[form.pkm]} />
              </td>
            )}
          </tr>
        ))}
    </>
  )
})
