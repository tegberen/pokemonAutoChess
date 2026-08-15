import { memo } from "react"
import { useTranslation } from "react-i18next"
import type { IDps } from "../../../../../types"
import { usePreference } from "../../../preferences"
import PokemonPortrait from "../pokemon-portrait"
import ProgressBar from "../progress-bar/progress-bar"
import { getSyntheticDpsDisplay } from "./synthetic-dps"

/* the meter re-renders on every damage tick, but immer only gives a new identity
   to the row that actually changed, so memo lets the other rows bail out */
function GameDps(props: { maxDamage: number; dps: IDps; rank: number }) {
  const { t } = useTranslation()
  const [colorblindMode] = usePreference("colorblindMode")
  const synthetic = getSyntheticDpsDisplay(props.dps.id)
  return (
    <div
      className="game-dps-bar"
      style={{ "--dps-rank": props.rank } as React.CSSProperties}
    >
      {synthetic ? (
        <img
          src={synthetic.icon}
          className="pokemon-portrait"
          title={t(synthetic.labelKey)}
          alt={t(synthetic.labelKey)}
        />
      ) : (
        <PokemonPortrait avatar={props.dps.name} />
      )}
      <div className="game-dps-progress-wrapper">
        <p>
          {props.dps.physicalDamage +
            props.dps.specialDamage +
            props.dps.trueDamage}
        </p>
        <ProgressBar className="my-progress is-primary">
          <ProgressBar
            className={
              colorblindMode ? "colorblind-pattern-vertical-stripes" : ""
            }
            style={{ backgroundColor: "var(--color-physical)" }}
            max={props.maxDamage}
            now={props.dps.physicalDamage}
            key="physical"
            title={`${t("game_stats.physical_damage_dealt")}: ${props.dps.physicalDamage}`}
          />
          <ProgressBar
            className={
              colorblindMode ? "colorblind-pattern-diagonal-stripes" : ""
            }
            style={{ backgroundColor: "var(--color-special)" }}
            max={props.maxDamage}
            now={props.dps.specialDamage}
            key="special"
            title={`${t("game_stats.special_damage_dealt")}: ${props.dps.specialDamage}`}
          />
          <ProgressBar
            className={colorblindMode ? "colorblind-pattern-dots" : ""}
            style={{ backgroundColor: "var(--color-true)" }}
            max={props.maxDamage}
            now={props.dps.trueDamage}
            key="true"
            title={`${t("game_stats.true_damage_dealt")}: ${props.dps.trueDamage}`}
          />
        </ProgressBar>
      </div>
    </div>
  )
}

export default memo(GameDps)
