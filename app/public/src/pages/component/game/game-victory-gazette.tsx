import { useTranslation } from "react-i18next"
import type { IPokemonRecord } from "../../../../../models/colyseus-models/game-record"
import type { Blessing } from "../../../../../types/enum/Blessing"
import { GameMode } from "../../../../../types/enum/Game"
import type { Synergy } from "../../../../../types/enum/Synergy"
import { getRankLabel } from "../../../../../types/strings/Strings"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import SynergyIcon from "../icons/synergy-icon"
import PokemonPortrait from "../pokemon-portrait"
import { BlessingHistoryTooltip } from "../profile/game-history"
import { BlessingIcon } from "../synergy/blessing-tooltip-card"
import { GamePokemonDetailTooltip } from "./game-pokemon-detail"
import "./game-victory-gazette.css"

export type VictoryResult = {
  id: string
  name: string
  avatar: string
  moneyEarned: number
  damageDealt: number
  rerolls: number
  pokemons: IPokemonRecord[]
  activeSynergies: [Synergy, number][]
  blessings: Blessing[]
}

export default function GameVictoryGazette(props: {
  results: VictoryResult[]
}) {
  const { t } = useTranslation()
  return (
    <div className="my-container game-victory-gazette">
      <header>
        <h2>
          <img src="/assets/ui/rank1.png" alt="" />
          {getRankLabel(1)}
        </h2>
        <p>{t(`game_modes.${GameMode.DOUBLE_UP}`)}</p>
      </header>
      {props.results.map((result) => (
        <section key={result.id} className="my-box">
          <div className="game-victory-gazette-player">
            <PokemonPortrait avatar={result.avatar} />
            <strong>{result.name}</strong>
            <div className="game-victory-gazette-stats">
              <span title={t("game_stats.total_money_earned")}>
                <img src="assets/icons/money_total.svg" alt="" />
                {result.moneyEarned}
              </span>
              <span title={t("game_stats.total_player_damage_dealt")}>
                <img src="assets/icons/ATK.png" alt="" />
                {result.damageDealt}
              </span>
              <span title={t("game_stats.total_reroll_count")}>
                <img src="assets/ui/refresh.svg" alt="" />
                {result.rerolls}
              </span>
            </div>
          </div>
          <ul className="game-victory-gazette-team">
            {result.pokemons.map((pokemon, index) => (
              <li key={index}>
                <PokemonPortrait
                  avatar={pokemon.avatar}
                  data-tooltip-id="game-pokemon-detail-tooltip"
                  data-tooltip-content={pokemon.name}
                />
                <div className="game-victory-gazette-items">
                  {pokemon.items.map((item, itemIndex) => (
                    <img
                      key={itemIndex}
                      src={`/assets/item/${item}.png`}
                      alt=""
                      data-tooltip-id="item-detail-tooltip"
                      data-tooltip-content={item}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div className="game-victory-gazette-buildup">
            <ul className="game-victory-gazette-synergies">
              {result.activeSynergies.map(([type, value]) => (
                <li key={type}>
                  <SynergyIcon type={type} />
                  {value}
                </li>
              ))}
            </ul>
            {result.blessings.length > 0 && (
              <ul className="game-victory-gazette-blessings">
                {result.blessings.map((blessing, index) => (
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
        </section>
      ))}
      <GamePokemonDetailTooltip origin="after" portalRoot={document.body} />
      <ItemDetailTooltip portalRoot={document.body} />
      <BlessingHistoryTooltip portalRoot={document.body} />
    </div>
  )
}
