import { type CSSProperties, memo, useMemo } from "react"
import {
  CartesianGrid,
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

const WishScatterPoint = memo(
  function WishScatterPoint({
    cx = 0,
    cy = 0,
    payload
  }: {
    cx?: number
    cy?: number
    payload?: IWishReportRow
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
        <BlessingTile blessing={payload.blessing} />
      </foreignObject>
    )
  },
  (before, after) =>
    before.cx === after.cx &&
    before.cy === after.cy &&
    before.payload?.blessing === after.payload?.blessing
)

function WishScatterTooltip({
  active,
  payload
}: {
  active?: boolean
  payload?: { payload: IWishReportRow }[]
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="custom-theme-tooltip blessing-panel-tooltip">
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
    </div>
  )
}

export function WishScatter({
  rows,
  places
}: {
  rows: IWishReportRow[]
  places: number
}) {
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
    const topTick = COUNT_TICKS.find((tick) => tick >= mostPicks) ?? mostPicks
    // past the end ticks, so a Wish on 1st or last place clears the axis
    const placePadding = (high - low) * 0.02
    return {
      placeDomain: [low - placePadding, high + placePadding],
      placeTicks: xTicks,
      // below 1, so a Wish picked once sits above the axis instead of on it
      countDomain: [0.7, topTick],
      countTicks: COUNT_TICKS.filter((tick) => tick <= topTick)
    }
  }, [rows, places])

  return (
    <div className="wish-scatter">
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
          <Tooltip
            content={<WishScatterTooltip />}
            cursor={{ strokeDasharray: "3 3" }}
            wrapperStyle={{ outline: "none", zIndex: 1 }}
            animationDuration={0}
          />
          <Scatter
            data={rows}
            shape={<WishScatterPoint />}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
