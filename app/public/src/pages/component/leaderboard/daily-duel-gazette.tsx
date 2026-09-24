import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { IRecentVictory } from "../../../../../types/interfaces/RecentVictory"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { GamePokemonDetailTooltip } from "../game/game-pokemon-detail"
import { VictoryCard } from "../newspaper/newspaper"
import { BlessingHistoryTooltip } from "../profile/game-history"
import "../newspaper/newspaper.css"

export default function DailyDuelGazette() {
  const { t } = useTranslation()
  const [results, setResults] = useState<IRecentVictory[] | null>(null)
  const tooltipPortal = typeof document === "undefined" ? null : document.body

  useEffect(() => {
    fetch("/daily-duel-results")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: IRecentVictory[]) =>
        setResults(Array.isArray(data) ? data : [])
      )
      .catch(() => setResults([]))
  }, [])

  return (
    <div className="newspaper">
      {results === null ? (
        <p className="newspaper-placeholder loading">{t("loading")}</p>
      ) : results.length === 0 ? (
        <p className="newspaper-placeholder">{t("daily_duel_no_results")}</p>
      ) : (
        results.map((result) => (
          <VictoryCard
            key={`${result.winners[0].playerId}-${result.winners[0].game.time}`}
            victory={result}
          />
        ))
      )}

      <GamePokemonDetailTooltip origin="history" portalRoot={tooltipPortal} />
      <ItemDetailTooltip portalRoot={tooltipPortal} />
      <BlessingHistoryTooltip portalRoot={tooltipPortal} />
    </div>
  )
}
