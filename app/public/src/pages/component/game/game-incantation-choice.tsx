import { Fragment, useState } from "react"
import { useTranslation } from "react-i18next"
import { IncantationKind } from "../../../../../config/game/ghost-incantations"
import type { PlayerChoice } from "../../../../../models/colyseus-models/player-choice"
import { writeIncantation } from "../../../network"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import {
  describeIncantationOption,
  describeIncantationSentence,
  getIncantationIcon
} from "./ghost-incantation-text"
import "./game-incantation-choice.css"

export function GameIncantationChoice({
  choice,
  pendingChoices
}: {
  choice: PlayerChoice
  pendingChoices: number
}) {
  const { t: tBase } = useTranslation()
  const t = tBase as any
  const kind = choice.incantationKind as IncantationKind
  const columns = [
    choice.incantationCauses,
    choice.incantationEffects,
    choice.incantationBonuses
  ].filter((options) => options.length > 0)
  const [selected, setSelected] = useState<(string | null)[]>(
    columns.map(() => null)
  )
  const cause = selected[0]
  const tierParams = {
    ap: 0,
    luck: 0,
    stars: choice.incantationStrength + 1,
    showAbilityTiers: true
  }

  const describe = (column: number, option: string) =>
    describeIncantationOption(
      t,
      kind,
      column,
      option,
      cause,
      choice.incantationContext
    )

  const select = (column: number, option: string) =>
    setSelected((current) =>
      current.map((value, index) => (index === column ? option : value))
    )

  const isComplete = selected.every((option) => option !== null)

  const isSequence = kind !== IncantationKind.FATED

  return (
    <div className="game-incantation-choice">
      <header className="draggable-window-header">
        <span className="game-incantation-title">
          <img
            className="game-incantation-kind-icon"
            src={getIncantationIcon(kind)}
            alt=""
          />
          <h3 className="draggable-window-title">
            {t(`ghost_incantations.${kind}.title`)}
          </h3>
        </span>
        {pendingChoices > 0 && (
          <span className="game-incantation-pending">
            {t("player_choices.more_choices", { count: pendingChoices })}
          </span>
        )}
      </header>
      <div className="game-incantation-body">
        <div className="game-incantation-panels">
          {columns.map((options, column) => (
            <Fragment key={column}>
              {column > 0 && (
                <span
                  className={
                    isSequence
                      ? "game-incantation-chevron"
                      : "game-incantation-gap"
                  }
                />
              )}
              <section className="game-incantation-panel">
                <h3
                  className={cc({
                    "status-label":
                      kind === IncantationKind.HEXING && column === 2
                  })}
                >
                  {addIconsToDescription(
                    t(`ghost_incantations.${kind}.columns.${column}`)
                  )}
                </h3>
                {options.map((option) => (
                  <button
                    key={option}
                    className={cc("game-incantation-option", {
                      selected: selected[column] === option
                    })}
                    onClick={() => select(column, option)}
                  >
                    <span>
                      {addIconsToDescription(
                        describe(column, option),
                        tierParams
                      )}
                    </span>
                  </button>
                ))}
              </section>
            </Fragment>
          ))}
        </div>
        <p className="game-incantation-sentence">
          {addIconsToDescription(
            describeIncantationSentence(
              t,
              kind,
              selected,
              choice.incantationContext
            ),
            tierParams
          )}
        </p>
        <button
          className="bubbly green game-incantation-write"
          disabled={!isComplete}
          onClick={() =>
            writeIncantation(
              choice.id,
              selected.map((option) => option ?? "")
            )
          }
        >
          {t("ghost_incantations.write")}
        </button>
      </div>
    </div>
  )
}
