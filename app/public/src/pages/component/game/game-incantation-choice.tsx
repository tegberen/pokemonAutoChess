import { Fragment, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  decodeGhostIncantation,
  FatedRitual,
  getHexingStrength,
  getRitualStrength,
  GHOST_INCANTATION_SLOTS,
  IncantationKind
} from "../../../../../config/game/ghost-incantations"
import type { PlayerChoice } from "../../../../../models/colyseus-models/player-choice"
import { useAppSelector } from "../../../hooks"
import { writeIncantation } from "../../../network"
import { playSound, SOUNDS } from "../../utils/audio"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import {
  describeIncantationOption,
  describeIncantationLines,
  describeIncantationSentence,
  describeFatedRitualSummary,
  describeHexingSummary,
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
  const writtenIncantations = useAppSelector(
    (state) => state.game.ghostIncantationsByPlayerId[state.network.uid] ?? []
  )
  const decodedIncantations = writtenIncantations.map(decodeGhostIncantation)
  const writtenHexings = decodedIncantations.filter(
    (written) => written.kind === IncantationKind.HEXING
  )
  const writtenRitual = decodedIncantations.find(
    (written) => written.kind === IncantationKind.RITUAL
  )
  const fatedGhostLevel =
    GHOST_INCANTATION_SLOTS.find(
      (slot) => slot.kind === IncantationKind.FATED
    )?.ghostLevel ?? 0
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
    <div
      className={cc("game-incantation-choice", {
        fated: kind === IncantationKind.FATED
      })}
    >
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
                <h3>
                  {addIconsToDescription(
                    t(`ghost_incantations.${kind}.columns.${column}`)
                  )}
                </h3>
                {kind === IncantationKind.FATED &&
                  column === 0 &&
                  writtenHexings.length > 0 && (
                    <p className="game-incantation-current">
                      {writtenHexings.map((hexing, index) => (
                        <span key={index} className="game-incantation-line">
                          {index + 1}.{" "}
                          {addIconsToDescription(
                            describeHexingSummary(
                              t,
                              hexing,
                              getHexingStrength(fatedGhostLevel),
                              selected[0]
                            )
                          )}
                        </span>
                      ))}
                    </p>
                  )}
                {kind === IncantationKind.FATED &&
                  column === 1 &&
                  writtenRitual && (
                    <p className="game-incantation-current">
                      {addIconsToDescription(
                        describeIncantationSentence(
                          t,
                          IncantationKind.RITUAL,
                          [
                            writtenRitual.cause,
                            writtenRitual.effect,
                            writtenRitual.bonus
                          ],
                          "",
                          selected[1] === FatedRitual.DOUBLE_REWARDS ? 2 : 1
                        ) +
                          describeFatedRitualSummary(
                            t,
                            selected[1],
                            writtenRitual.cause
                          ),
                        {
                          ...tierParams,
                          stars: getRitualStrength(fatedGhostLevel) + 1
                        }
                      )}
                    </p>
                  )}
                <div className="game-incantation-options">
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
                </div>
              </section>
            </Fragment>
          ))}
        </div>
        {isSequence && (
          <p className="game-incantation-sentence">
            {describeIncantationLines(
              t,
              kind,
              selected,
              choice.incantationContext
            ).map((line, index) => (
              <span key={index} className="game-incantation-sentence-line">
                {addIconsToDescription(line, tierParams)}
              </span>
            ))}
          </p>
        )}
        <button
          className="bubbly green game-incantation-write"
          disabled={!isComplete}
          onClick={() => {
            playSound(
              kind === IncantationKind.FATED
                ? SOUNDS.GHOST_CHOICE_FATED
                : kind === IncantationKind.RITUAL
                  ? SOUNDS.GHOST_CHOICE_RITUAL
                  : SOUNDS.GHOST_CHOICE_HEX
            )
            writeIncantation(
              choice.id,
              selected.map((option) => option ?? "")
            )
          }}
        >
          {t("ghost_incantations.write")}
        </button>
      </div>
    </div>
  )
}
