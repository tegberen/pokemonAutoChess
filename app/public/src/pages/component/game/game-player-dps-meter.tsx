import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { SYNTHETIC_DPS_IDS, type IDps } from "../../../../../types"
import GameDps from "./game-dps"

type GamePlayerDpsMeterInput = {
  dpsMeter: IDps[]
}

export default function GamePlayerDpsMeter({
  dpsMeter = []
}: GamePlayerDpsMeterInput) {
  const { t } = useTranslation()
  const damageDealt = (dps: IDps) =>
    dps.physicalDamage + dps.specialDamage + dps.trueDamage

  const visibleDps = useMemo(
    () =>
      dpsMeter
        // hide synthetic effect rows (Tidal Wave, Curse) that dealt no damage
        .filter((d) => !SYNTHETIC_DPS_IDS.has(d.id) || damageDealt(d) > 0),
    [dpsMeter]
  )

  const { rankById, maxDamage } = useMemo(() => {
    const ranked = [...visibleDps].sort(
      (a, b) => damageDealt(b) - damageDealt(a)
    )
    return {
      rankById: new Map(ranked.map((dps, rank) => [dps.id, rank])),
      maxDamage: ranked.length > 0 ? damageDealt(ranked[0]) : 0
    }
  }, [visibleDps])

  /* rendered in a stable order and placed by rank with a transform: reordering
     the DOM instead would move every row below a swap, and each move is a
     layout shift that reflows the whole panel on every damage tick */
  const rowsInStableOrder = useMemo(
    () => [...visibleDps].sort((a, b) => a.id.localeCompare(b.id)),
    [visibleDps]
  )

  const totalDamage = useMemo(
    () => visibleDps.reduce((acc, dps) => acc + damageDealt(dps), 0),
    [visibleDps]
  )

  return (
    <div>
      <div
        className="game-dps-list"
        style={
          { "--dps-row-count": rowsInStableOrder.length } as React.CSSProperties
        }
      >
        {rowsInStableOrder.map((p) => (
          <GameDps
            key={p.id}
            dps={p}
            maxDamage={maxDamage}
            rank={rankById.get(p.id) ?? 0}
          />
        ))}
      </div>
      {visibleDps.length > 0 && (
        <div>
          {t("total")}: {totalDamage}
        </div>
      )}
    </div>
  )
}
