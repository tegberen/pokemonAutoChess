import { GuideLessons } from "../../../../../core/guide/lessons"
import type { GuideAction } from "../../../../../core/guide/guide-lesson"
import { GameMode } from "../../../../../types/enum/Game"
import type { Pkm } from "../../../../../types/enum/Pokemon"
import { useAppSelector } from "../../../hooks"

/* Everything is locked during a guide unless the active step opens it, so the
   player cannot roll or level their way somewhere the script does not cover.
   Derived from the lesson the same way the server derives it, so no schema
   field is spent syncing which buttons are live. */
export function useGuideActionAllowed(action: GuideAction): boolean {
  const gameMode = useAppSelector((state) => state.game.gameMode)
  const synergy = useAppSelector((state) => state.game.guideSynergy)
  const stepIndex = useAppSelector((state) => state.game.guideStep)
  const stageLevel = useAppSelector((state) => state.game.stageLevel)

  if (gameMode !== GameMode.GUIDE || synergy === null) return true
  const lesson = GuideLessons[synergy]
  if (!lesson) return true
  const step = lesson.steps[stepIndex]
  if (!step || step.stage > stageLevel) return false
  return step.allowActions?.includes(action) ?? false
}

/* True while Slowking is mid-sentence: a proposition screen popping up over the
   lesson would have the player picking before they have read why. */
export function useGuideIsReading(): boolean {
  const gameMode = useAppSelector((state) => state.game.gameMode)
  const synergy = useAppSelector((state) => state.game.guideSynergy)
  const stepIndex = useAppSelector((state) => state.game.guideStep)
  const stageLevel = useAppSelector((state) => state.game.stageLevel)
  const acked = useAppSelector((state) => state.game.guideStepAcked)

  if (gameMode !== GameMode.GUIDE || synergy === null) return false
  const step = GuideLessons[synergy]?.steps[stepIndex]
  if (!step || step.stage > stageLevel) return false
  if (step.isCompleted === undefined) return true
  // a step that reveals a proposition holds it back until "Got it"
  return step.confirmFirst === true && !acked
}

/* Whether this shop unit is one the lesson deals in. Outside a guide every unit
   is buyable, so this is true. */
export function useGuideAllowsBuying(pkm: Pkm | undefined): boolean {
  const gameMode = useAppSelector((state) => state.game.gameMode)
  const synergy = useAppSelector((state) => state.game.guideSynergy)
  const stageLevel = useAppSelector((state) => state.game.stageLevel)
  const stepIndex = useAppSelector((state) => state.game.guideStep)

  if (gameMode !== GameMode.GUIDE || synergy === null || !pkm) return true
  const lesson = GuideLessons[synergy]
  if (!lesson) return true
  const step = lesson.steps[stepIndex]
  if (!step || step.stage > stageLevel) return false
  return step.buyable?.includes(pkm) ?? false
}
