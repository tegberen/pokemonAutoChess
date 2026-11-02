import { type CSSProperties, memo, type ReactNode, useMemo } from "react"
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import type { IWishReportRow } from "../../../models/wish-report"
import { BlessingTooltipCard } from "../synergy/blessing-tooltip-card"
import { BlessingTile } from "../tier-list/blessing-tile"
import "./wish-scatter.css"

const TIER_LIST_TILE_SIZE = 48
const POINT_SIZE = 20

// a few Wishes take most picks, so a log scale spreads out the crowded rest
const COUNT_TICKS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]

const AXIS_TICK = { fill: "var(--color-fg-secondary)", fontSize: 11 }

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

type ScatterRow = { averagePlace: number; picks: number }

const ReportScatterPoint = memo(
  function ReportScatterPoint({
    cx = 0,
    cy = 0,
    payload,
    renderPoint
  }: {
    cx?: number
    cy?: number
    payload?: ScatterRow
    renderPoint: (row: ScatterRow) => ReactNode
  }) {
    if (!payload) return null
    return (
      <foreignObject
        x={cx - POINT_SIZE / 2}
        y={cy - POINT_SIZE / 2}
        width={POINT_SIZE}
        height={POINT_SIZE}
        className="wish-scatter-point"
        style={
          {
            "--wish-scatter-scale": POINT_SIZE / TIER_LIST_TILE_SIZE
          } as CSSProperties
        }
      >
        {renderPoint(payload)}
      </foreignObject>
    )
  },
  (before, after) =>
    before.cx === after.cx &&
    before.cy === after.cy &&
    before.payload === after.payload
)

function ReportScatterTooltip<Row extends ScatterRow>({
  active,
  payload,
  renderTooltip
}: {
  active?: boolean
  payload?: { payload: Row }[]
  renderTooltip: (row: Row) => ReactNode
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-theme-tooltip blessing-panel-tooltip">
      {renderTooltip(payload[0].payload)}
    </div>
  )
}

const renderWishPoint = (row: IWishReportRow) => (
  <BlessingTile blessing={row.blessing} />
)

const renderWishTooltip = (row: IWishReportRow) => (
  <BlessingTooltipCard
    blessing={row.blessing}
    beforeDescription={
      <dl className="wish-scatter-stats">
        <div>
          <dt>Count</dt>
          <dd>{row.picks}</dd>
        </div>
        <div>
          <dt>Pick rate</dt>
          <dd>{percent(row.pickRate)}</dd>
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
    }
  />
)

export function WishScatter({
  rows,
  places
}: {
  rows: IWishReportRow[]
  places: number
}) {
  return (
    <ReportScatter
      rows={rows}
      places={places}
      renderPoint={renderWishPoint}
      renderTooltip={renderWishTooltip}
    />
  )
}

export type ScatterQuadrantLabels = {
  popularStrong: string
  popularWeak: string
  rareStrong: string
  rareWeak: string
}

export function ReportScatter<Row extends ScatterRow>({
  rows,
  places,
  renderPoint,
  renderTooltip,
  quadrantLabels
}: {
  rows: Row[]
  places: number
  renderPoint: (row: Row) => ReactNode
  renderTooltip: (row: Row) => ReactNode
  quadrantLabels?: ScatterQuadrantLabels
}) {
  const medianPicks = useMemo(() => {
    const sortedPicks = rows.map((row) => row.picks).sort((a, b) => a - b)
    return sortedPicks[Math.floor(sortedPicks.length / 2)] ?? 1
  }, [rows])
  const { placeDomain, placeTicks, countDomain, countTicks } = useMemo(() => {
    const averagePlaces = rows.map((row) => row.averagePlace)
    // zoomed to the Wishes on show, on quarter-place steps
    const low = Math.max(
      1,
      Math.floor((Math.min(...averagePlaces) - 0.1) * 4) / 4
    )
    const high = Math.min(
      places,
      Math.ceil((Math.max(...averagePlaces) + 0.1) * 4) / 4
    )
    const step = high - low > 2 ? 0.5 : 0.25
    const xTicks: number[] = []
    for (let tick = low; tick <= high + 1e-9; tick += step) xTicks.push(tick)
    const mostPicks = Math.max(...rows.map((row) => row.picks))
    const fewestPicks = Math.min(...rows.map((row) => row.picks))
    const topTick = COUNT_TICKS.find((tick) => tick >= mostPicks) ?? mostPicks
    const bottomTick =
      COUNT_TICKS.findLast((tick) => tick <= fewestPicks) ?? COUNT_TICKS[0]
    // past the end ticks, so a Wish on 1st or last place clears the axis
    const placePadding = (high - low) * 0.02
    return {
      placeDomain: [low - placePadding, high + placePadding],
      placeTicks: xTicks,
      // below the lowest tick, so the rarest point sits above the axis
      countDomain: [bottomTick * 0.7, topTick],
      countTicks: COUNT_TICKS.filter(
        (tick) => tick >= bottomTick && tick <= topTick
      )
    }
  }, [rows, places])

  return (
    <div className="wish-scatter">
      {quadrantLabels && (
        <div className="wish-scatter-quadrants" aria-hidden="true">
          <span className="popular-strong">{quadrantLabels.popularStrong}</span>
          <span className="popular-weak">{quadrantLabels.popularWeak}</span>
          <span className="rare-strong">{quadrantLabels.rareStrong}</span>
          <span className="rare-weak">{quadrantLabels.rareWeak}</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 24, left: 8, bottom: 24 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-bg-tertiary)"
          />
          <XAxis
            type="number"
            dataKey="averagePlace"
            domain={placeDomain}
            ticks={placeTicks}
            tickFormatter={(value: number) => value.toFixed(2)}
            tick={AXIS_TICK}
            label={{
              value: "Top",
              position: "insideBottomRight",
              offset: -16,
              ...AXIS_TICK
            }}
          />
          <YAxis
            type="number"
            dataKey="picks"
            scale="log"
            domain={countDomain}
            ticks={countTicks}
            allowDataOverflow
            tick={AXIS_TICK}
            width={40}
            label={{
              value: "Count",
              angle: -90,
              position: "insideLeft",
              ...AXIS_TICK
            }}
          />
          {quadrantLabels && (
            <>
              <ReferenceLine
                x={(places + 1) / 2}
                stroke="var(--color-fg-secondary)"
                strokeDasharray="6 4"
              />
              <ReferenceLine
                y={medianPicks}
                stroke="var(--color-fg-secondary)"
                strokeDasharray="6 4"
              />
            </>
          )}
          <Tooltip
            content={<ReportScatterTooltip renderTooltip={renderTooltip} />}
            cursor={{ strokeDasharray: "3 3" }}
            wrapperStyle={{ outline: "none", zIndex: 1 }}
            animationDuration={0}
          />
          <Scatter
            data={rows}
            shape={
              <ReportScatterPoint
                renderPoint={renderPoint as (row: ScatterRow) => ReactNode}
              />
            }
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
