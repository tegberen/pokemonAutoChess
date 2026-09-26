import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { SynergyTiersThresholds } from "../../../../../config"
import { Blessings } from "../../../../../config/game/blessings"
import type { IPlayer } from "../../../../../types"
import type { Blessing } from "../../../../../types/enum/Blessing"
import { BattleResult } from "../../../../../types/enum/Game"
import type { Pkm } from "../../../../../types/enum/Pokemon"
import type { Synergy } from "../../../../../types/enum/Synergy"
import { getAvatarSrc } from "../../../../../utils/avatar"
import { useAppSelector } from "../../../hooks"
import { addIconsToDescription } from "../../utils/descriptions"
import { Life } from "../icons/life"
import { Money } from "../icons/money"
import "./game-player-detail.css"

const NO_BLESSINGS: Blessing[] = []

const MATCH_RESULT_CLASS = {
  [BattleResult.WIN]: "win",
  [BattleResult.DRAW]: "draw",
  [BattleResult.DEFEAT]: "defeat"
}

export default function GamePlayerDetail(props: {
  player: IPlayer
  hideLife?: boolean
}) {
  const { t } = useTranslation()
  const blessings = useAppSelector(
    (state) => state.game.blessingsByPlayerId[props.player.id] ?? NO_BLESSINGS
  )
  const synergyList = useMemo(() => {
    const synergies = props.player.synergies
    // synergies may be a Synergies/Map instance (has .entries) or, transiently,
    // a plain object cloned into the store — handle both to avoid crashing.
    const entries = (
      typeof synergies?.entries === "function"
        ? [...synergies.entries()]
        : Object.entries(synergies ?? {})
    ) as [Synergy, number][]
    return entries
      .filter(([syn, val]) => val >= SynergyTiersThresholds[syn]?.[0])
      .sort((a, b) => b[1] - a[1])
      .map(([syn]) => syn)
  }, [props.player.synergies])
  const history = props.player.history.slice(-5)

  return (
    <div className="game-player-detail">
      <header>
        <span className="player-name">{props.player.name}</span>
        <span className="game-player-detail-level">
          {t("lvl")} {props.player.experienceManager.level}
        </span>
        {!props.hideLife && (
          <span className="game-player-detail-vital">
            <Life value={props.player.life} />
          </span>
        )}
        <span className="game-player-detail-vital">
          <Money value={props.player.money} />
        </span>
      </header>

      {history.length > 0 && (
        <ul className="game-player-detail-history">
          {history.map((record, i) => (
            <li
              key={`${record.name}${i}_game-player-detail`}
              className={`game-player-detail-match ${MATCH_RESULT_CLASS[record.result]}`}
            >
              <img src={getAvatarSrc(record.avatar)} alt="" />
              <span>
                {(record.id === "pve"
                  ? t(record.name as `pkm.${Pkm}`)
                  : record.name
                ).slice(0, 5)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {synergyList.length > 0 && (
        <ul className="game-player-detail-synergies">
          {synergyList.map((synergy) => (
            <li key={`${props.player.name}_${synergy}_game-player-detail`}>
              <img
                src={`assets/types/${synergy}.svg`}
                alt={synergy}
                title={t(`synergy.${synergy}`)}
                className="synergy-icon"
              />
            </li>
          ))}
        </ul>
      )}

      {blessings.length > 0 && (
        <ul className="game-player-detail-wishes">
          {blessings.map((blessing, i) => (
            <li
              key={`${props.player.name}_${blessing}${i}_game-player-detail`}
              className="game-player-detail-wish"
            >
              <img
                src={`/assets/blessings/${Blessings[blessing].icon}.svg`}
                alt=""
                className={`blessing-panel-icon blessing-tier-${Blessings[
                  blessing
                ].tier.toLowerCase()}`}
              />
              <span>
                {addIconsToDescription(t(`blessing.${blessing}.name`))}
              </span>
            </li>
          ))}
        </ul>
      )}

      <footer>
        <span className="game-player-detail-totals-label">{t("total")}</span>
        <span title={t("game_stats.total_money_earned")}>
          <img src="assets/icons/money_total.svg" alt="$" />
          {props.player.gameStats.totalMoneyEarned}
        </span>
        <span title={t("game_stats.total_player_damage_dealt")}>
          <img src="assets/icons/ATK.png" alt="✊" />
          {props.player.gameStats.totalPlayerDamageDealt}
        </span>
        <span title={t("game_stats.total_reroll_count")}>
          <img src="assets/ui/refresh.svg" alt="↻" />
          {props.player.gameStats.rerollCount}
        </span>
      </footer>
    </div>
  )
}
