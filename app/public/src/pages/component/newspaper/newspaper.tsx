import type { ArraySchema } from "@colyseus/schema"
import { useTranslation } from "react-i18next"
import type { IPokemonRecord } from "../../../../../models/colyseus-models/game-record"
import type { Synergy } from "../../../../../types/enum/Synergy"
import type {
  IRecentVictory,
  IVictoryWinner
} from "../../../../../types/interfaces/RecentVictory"
import { getRankLabel } from "../../../../../types/strings/Strings"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { useAppSelector } from "../../../hooks"
import { searchById } from "../../../network"
import { formatRelativeDate } from "../../utils/date"
import Team from "../after/team"
import { GamePokemonDetailTooltip } from "../game/game-pokemon-detail"
import { GameModeIcon } from "../icons/game-mode-icon"
import SynergyIcon from "../icons/synergy-icon"
import PokemonPortrait from "../pokemon-portrait"
import { EloBadge } from "../profile/elo-badge"
import {
  BlessingHistoryTooltip,
  getActiveSynergies
} from "../profile/game-history"
import { BlessingIcon } from "../synergy/blessing-tooltip-card"
import "./newspaper.css"

// deriving synergies rebuilds every Pokemon of a board, ~2.5ms a piece. Teams
// come straight from the store, so keying on the array makes one computation
// per board outlast re-renders and tab switches alike
const activeSynergiesByTeam = new WeakMap<object, [Synergy, number][]>()

function getCachedActiveSynergies(
  team: IPokemonRecord[] | ArraySchema<IPokemonRecord>
): [Synergy, number][] {
  const cached = activeSynergiesByTeam.get(team)
  if (cached) return cached
  const synergies = getActiveSynergies(team)
  activeSynergiesByTeam.set(team, synergies)
  return synergies
}

export default function Newspaper() {
  const { t } = useTranslation()
  const victories = useAppSelector((state) => state.lobby.recentVictories)
  const loaded = useAppSelector((state) => state.lobby.recentVictoriesLoaded)

  // plain div: `.lobby section` in lobby.css forces 25% width on any <section>
  return (
    <div className="newspaper">
      {!loaded ? (
        <p className="newspaper-placeholder loading">{t("loading")}</p>
      ) : victories.length === 0 ? (
        <p className="newspaper-placeholder">{t("newspaper.no_stories")}</p>
      ) : (
        // how many cards there are is the endpoint's call, see
        // NEWSPAPER_VICTORIES_RETURNED
        victories.map((victory) => (
          <VictoryCard key={victory.winners[0].playerId} victory={victory} />
        ))
      )}

      <GamePokemonDetailTooltip origin="history" />
      <ItemDetailTooltip />
      <BlessingHistoryTooltip />
    </div>
  )
}

function VictoryCard({ victory }: { victory: IRecentVictory }) {
  const match = victory.winners[0].game
  return (
    <article className="my-box newspaper-card">
      <p className="newspaper-kicker">
        <img
          src="/assets/icons/LAUREL_CROWN_ICON.svg"
          alt=""
          className="newspaper-crown"
        />
        <strong>{getRankLabel(match.rank)}</strong>
        <GameModeIcon gameMode={match.gameMode} whimsy={match.whimsy} />
        <span>{formatRelativeDate(match.time)}</span>
      </p>
      {victory.winners.map((winner) => (
        <WinnerBoard key={winner.playerId} winner={winner} />
      ))}
    </article>
  )
}

// a Double Up match crowns both partners, each with a board of their own
function WinnerBoard({ winner }: { winner: IVictoryWinner }) {
  const { t } = useTranslation()
  return (
    <div className="newspaper-board">
      <div className="newspaper-result">
        <button
          type="button"
          className="newspaper-player"
          title={t("newspaper.see_profile", { player: winner.playerName })}
          onClick={() => searchById(winner.playerId)}
        >
          <PokemonPortrait avatar={winner.playerAvatar} />
          <span>{winner.playerName}</span>
        </button>
        <EloBadge elo={winner.game.elo} />
      </div>
      <div className="newspaper-buildup">
        <Synergies team={winner.game.pokemons} />
        {winner.game.blessings.length > 0 && (
          <ul className="newspaper-blessings">
            {winner.game.blessings.map((blessing, index) => (
              <li key={index}>
                <BlessingIcon
                  blessing={blessing}
                  tooltipId="blessing-history-tooltip"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <Team team={winner.game.pokemons} />
    </div>
  )
}

function Synergies(props: {
  team: IPokemonRecord[] | ArraySchema<IPokemonRecord>
}) {
  return (
    <ul className="newspaper-synergies">
      {getCachedActiveSynergies(props.team).map(([type, value]) => (
        <li key={type}>
          <SynergyIcon type={type} />
          <span>{value}</span>
        </li>
      ))}
    </ul>
  )
}
