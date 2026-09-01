import { useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { PortalCarouselStages } from "../../../../../config/game/stages"
import { GUIDE_PRESENTER_INDEX } from "../../../../../core/guide/guide-lesson"
import { GuideLessons } from "../../../../../core/guide/lessons"
import { Emotion } from "../../../../../types"
import { GameMode, GamePhaseState } from "../../../../../types/enum/Game"
import { PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { useAppSelector } from "../../../hooks"
import { acknowledgeGuideStep } from "../../../network"
import { cc } from "../../utils/jsx"
import { renderGuideText } from "./guide-text"
import "./guide-overlay.css"

/* The card the whole Guide mode is built around. The server freezes the picking
   timer while a step is active, so this stays on screen until the player either
   does what it asks or acknowledges it. */
export default function GuideOverlay() {
  const { t } = useTranslation()
  const gameMode = useAppSelector((state) => state.game.gameMode)
  const synergy = useAppSelector((state) => state.game.guideSynergy)
  const stepIndex = useAppSelector((state) => state.game.guideStep)
  const stageLevel = useAppSelector((state) => state.game.stageLevel)
  const acked = useAppSelector((state) => state.game.guideStepAcked)
  const phase = useAppSelector((state) => state.game.phase)
  /* On a short screen the card sits over the item inventory, so it can be
     rolled up to its header. A new step always expands it again - hiding an
     instruction the player has not read yet would be worse than the overlap. */
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => setCollapsed(false), [stepIndex])

  if (gameMode !== GameMode.GUIDE || synergy === null) return null

  const lesson = GuideLessons[synergy]
  const step = lesson?.steps[stepIndex]
  if (!lesson || !step || step.stage > stageLevel) return null

  /* Portal stages open with a transition animation, and a lesson talking over
     it lands before the player has seen what they are choosing between. The
     card waits for the picking phase; the proposition screen is gated behind
     the card's own "Got it", so it waits too. */
  if (
    phase === GamePhaseState.TOWN &&
    PortalCarouselStages.includes(stageLevel)
  ) {
    return null
  }

  /* "Got it" appears on reading steps, and on a step that has to reveal a
     proposition screen before its own check can be met. */
  const needsConfirm =
    step.isCompleted === undefined || (step.confirmFirst === true && !acked)
  // only the synergies that already have a lesson exist under guide.lessons, so
  // the key cannot be typed until all 31 are written
  const text = (t as any)(
    `guide.lessons.${synergy}.steps.${step.key}`,
    step.params ?? {}
  ) as string

  return (
    <div
      className={cc(
        "guide-overlay",
        "my-container",
        `guide-overlay--${step.topic}`,
        { "is-collapsed": collapsed }
      )}
      role="dialog"
      aria-live="polite"
      aria-label={t(`guide.topics.${step.topic}`)}
    >
      <img
        className="guide-overlay-presenter"
        src={getPortraitSrc(GUIDE_PRESENTER_INDEX, false, Emotion.NORMAL)}
        alt=""
        width={64}
        height={64}
      />
      <div className="guide-overlay-body">
        <header>
          <span className="guide-overlay-topic">
            {t(`guide.topics.${step.topic}`)}
          </span>
          <span className="guide-overlay-progress">
            {t("guide.step_counter", {
              current: stepIndex + 1,
              total: lesson.steps.length
            })}
          </span>
          <button
            className="guide-overlay-collapse"
            type="button"
            aria-label={t(collapsed ? "maximize" : "minimize")}
            aria-expanded={!collapsed}
            title={t(collapsed ? "maximize" : "minimize")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "➕" : "➖"}
          </button>
        </header>
        <p className="guide-overlay-text">{renderGuideText(text, t)}</p>
        {step.showPokemons && (
          <ul className="guide-overlay-pokemons">
            {step.showPokemons.map((pkm) => (
              <li key={pkm}>
                <img
                  src={getPortraitSrc(PkmIndex[pkm])}
                  alt={t(`pkm.${pkm}`)}
                  title={t(`pkm.${pkm}`)}
                  width={40}
                  height={40}
                />
              </li>
            ))}
          </ul>
        )}
        {needsConfirm ? (
          <button className="bubbly green" onClick={acknowledgeGuideStep}>
            {t("guide.got_it")}
          </button>
        ) : (
          <p className="guide-overlay-objective">
            <Trans
              i18nKey="guide.waiting_for_you"
              components={{
                stopwatch: (
                  <img
                    className="guide-overlay-stopwatch"
                    src="assets/icons/STOPWATCH_ICON.svg"
                    alt=""
                  />
                )
              }}
            />
          </p>
        )}
      </div>
    </div>
  )
}
