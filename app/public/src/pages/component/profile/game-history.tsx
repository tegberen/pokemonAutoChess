import type { ArraySchema } from "@colyseus/schema"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import { AutoSizer } from "react-virtualized-auto-sizer"
import { List, useDynamicRowHeight } from "react-window"
import { SynergyTiersThresholds } from "../../../../../config"
import { Blessings } from "../../../../../config/game/blessings"
import type {
  IGameRecord,
  IPokemonRecord
} from "../../../../../models/colyseus-models/game-record"
import {
  computeSynergies,
  sortSynergiesForDisplay
} from "../../../../../models/colyseus-models/synergies"
import PokemonFactory from "../../../../../models/pokemon-factory"
import type { Blessing } from "../../../../../types/enum/Blessing"
import type { Synergy } from "../../../../../types/enum/Synergy"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { formatDate } from "../../utils/date"
import Team from "../after/team"
import { GamePokemonDetailTooltip } from "../game/game-pokemon-detail"
import { GameModeIcon } from "../icons/game-mode-icon"
import SynergyIcon from "../icons/synergy-icon"
import {
  BlessingIcon,
  BlessingTooltipCard
} from "../synergy/blessing-tooltip-card"
import { EloBadge } from "./elo-badge"
import "./game-history.css"

const ROW_HEIGHT = 72

export default function GameHistory(props: {
  uid: string
  onUpdate?: (history: IGameRecord[]) => void
}) {
  const { t } = useTranslation()
  const [gameHistory, setGameHistory] = useState<IGameRecord[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)

  useEffect(() => {
    if (props.onUpdate) {
      props.onUpdate(gameHistory)
    }
  }, [gameHistory, props.onUpdate])

  const pageSize = 10
  const loadHistory = async (uid: string, page: number) => {
    try {
      setLoading(true)

      const response = await fetch(
        `/game-history/${uid}?page=${page}&t=${Date.now()}`
      )
      const data: IGameRecord[] = await response.json()
      if (props.uid !== uid) return // ignore response if uid changed in the meantime

      if (data.length < pageSize) {
        setHasMore(false) // No more data to load
      }

      setGameHistory((prevHistory) => [
        ...prevHistory,
        ...data.filter(
          (h) => prevHistory.some((p) => p.time == h.time) == false
        )
      ])
    } catch (error) {
      console.error("Failed to load history:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (loading || !hasMore) return
    const skip = gameHistory.length
    const page = Math.floor(skip / pageSize + 1)
    loadHistory(props.uid, page)
  }

  useEffect(() => {
    // reset history on uid change
    setGameHistory([])
    setHasMore(true)
    loadHistory(props.uid, 1) // load last 10 games history
  }, [props.uid])

  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: ROW_HEIGHT,
    key: gameHistory.length
  })

  // Trigger loadMore when user scrolls near the end
  const handleRowsRendered = useCallback(
    (
      _visibleRows: { startIndex: number; stopIndex: number },
      allRows: { startIndex: number; stopIndex: number }
    ) => {
      if (hasMore && !loading && allRows.stopIndex >= gameHistory.length - 3) {
        loadMore()
      }
    },
    [hasMore, loading, gameHistory.length]
  )

  return (
    <article className="game-history-list">
      <h2>{t("game_history")}</h2>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {(!gameHistory || gameHistory.length === 0) && (
          <p>{t("no_history_found")}</p>
        )}
        {gameHistory && gameHistory.length > 0 && (
          <AutoSizer
            renderProp={({ height, width }) => {
              if (height === undefined || width === undefined) return null
              return (
                <List<HistoryRowData>
                  style={{ height, width }}
                  rowCount={gameHistory.length}
                  rowHeight={dynamicRowHeight}
                  rowComponent={GameHistoryRow}
                  rowProps={{
                    gameHistory
                  }}
                  onRowsRendered={handleRowsRendered}
                />
              )
            }}
          />
        )}
      </div>
      <GamePokemonDetailTooltip origin="history" />
      <ItemDetailTooltip />
      <BlessingHistoryTooltip />
    </article>
  )
}

type HistoryRowData = {
  gameHistory: IGameRecord[]
}

function GameHistoryRow({
  index,
  style,
  gameHistory
}: {
  ariaAttributes: object
  index: number
  style: React.CSSProperties
} & HistoryRowData): React.ReactElement | null {
  const r = gameHistory[index]
  const { t } = useTranslation()

  return (
    <div style={style}>
      <div className="my-box game-history">
        <span className="top">
          <GameModeIcon gameMode={r.gameMode} whimsy={r.whimsy} />
          {t("top")} {r.rank}
        </span>
        <EloBadge elo={r.elo} />
        <ul className="synergies">
          {getTopSynergies(r.pokemons).map(([type, value]) => (
            <li key={r.time + type}>
              <SynergyIcon type={type} />
              <span>{value}</span>
            </li>
          ))}
        </ul>
        <p className="date">{formatDate(r.time)}</p>
        <Team team={r.pokemons}></Team>
        <div className="player-items">
          {r.unholdableItems.map((item, i) => (
            <img
              key={i}
              src={"/assets/item/" + item + ".png"}
              data-tooltip-id="item-detail-tooltip"
              data-tooltip-content={item}
            />
          ))}
        </div>
        {(r.blessings?.length ?? 0) > 0 && (
          <div className="player-blessings">
            {r.blessings.map((blessing, i) => (
              <BlessingIcon
                key={i}
                blessing={blessing}
                tooltipId="blessing-history-tooltip"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function BlessingHistoryTooltip(
  props: { portalRoot?: Element | null } = {}
) {
  return (
    <Tooltip
      id="blessing-history-tooltip"
      className="custom-theme-tooltip blessing-panel-tooltip"
      portalRoot={props.portalRoot}
      render={({ content }) => {
        const blessing = content as Blessing | null
        if (!blessing || !Blessings[blessing]) return null
        return <BlessingTooltipCard blessing={blessing} />
      }}
    />
  )
}

function computeRecordSynergies(
  team: IPokemonRecord[] | ArraySchema<IPokemonRecord>
): Map<Synergy, number> {
  return computeSynergies(
    team.map((pkmRecord) => {
      const pkm = PokemonFactory.createPokemonFromName(pkmRecord.name)
      pkm.positionY = 1 // just to not be counted on bench
      pkmRecord.items.forEach((item) => {
        pkm.items.add(item)
      })
      return pkm
    })
  )
}

// every synergy the team actually triggered, ordered like the in-game panel
export function getActiveSynergies(
  team: IPokemonRecord[] | ArraySchema<IPokemonRecord>
): [Synergy, number][] {
  return sortSynergiesForDisplay([
    ...computeRecordSynergies(team).entries()
  ]).filter(([type, value]) => value >= SynergyTiersThresholds[type][0])
}

function getTopSynergies(
  team: IPokemonRecord[] | ArraySchema<IPokemonRecord>
): [Synergy, number][] {
  const synergies = computeRecordSynergies(team)

  const topSynergies = [...synergies.entries()]
    .sort((a, b) => {
      const [typeA, valueA] = a
      const [typeB, valueB] = b
      const aTier = SynergyTiersThresholds[typeA].filter(
        (n) => valueA >= n
      ).length
      const bTier = SynergyTiersThresholds[typeB].filter(
        (n) => valueB >= n
      ).length
      return aTier !== bTier ? bTier - aTier : valueB - valueA
    })
    .slice(0, 4)
  return topSynergies
}
