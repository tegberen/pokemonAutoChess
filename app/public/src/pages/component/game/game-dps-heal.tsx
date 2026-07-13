import { useTranslation } from "react-i18next"
import type { IDps } from "../../../../../types"
import { usePreference } from "../../../preferences"
import PokemonPortrait from "../pokemon-portrait"
import ProgressBar from "../progress-bar/progress-bar"
import { getSyntheticDpsDisplay } from "./synthetic-dps"

export default function GameDpsHeal(props: {
  maxHeal: number
  dpsMeter: IDps
}) {
  const { t } = useTranslation()
  const [colorblindMode] = usePreference("colorblindMode")
  const synthetic = getSyntheticDpsDisplay(props.dpsMeter.id)
  return (
    <div className="game-dps-bar">
      {synthetic ? (
        <img
          src={synthetic.icon}
          className="pokemon-portrait"
          title={t(synthetic.labelKey)}
          alt={t(synthetic.labelKey)}
        />
      ) : (
        <PokemonPortrait avatar={props.dpsMeter.name} />
      )}
      <div className="game-dps-progress-wrapper">
        <p>{props.dpsMeter.heal + props.dpsMeter.shield}</p>
        <ProgressBar className="my-progress is-primary">
          <ProgressBar
            className={
              colorblindMode ? "colorblind-pattern-vertical-stripes" : ""
            }
            style={{ backgroundColor: "#76c442" }}
            max={props.maxHeal}
            now={props.dpsMeter.heal}
            key="heal"
            title={`${t("game_stats.hp_healed")}: ${props.dpsMeter.heal}`}
          />
          <ProgressBar
            className={
              colorblindMode ? "colorblind-pattern-diagonal-stripes" : ""
            }
            style={{ backgroundColor: "#8d8d8d" }}
            max={props.maxHeal}
            now={props.dpsMeter.shield}
            key="shield"
            title={`${t("game_stats.shield_given")}: ${props.dpsMeter.shield}`}
          />
        </ProgressBar>
      </div>
    </div>
  )
}
