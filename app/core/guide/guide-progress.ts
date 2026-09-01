import type Player from "../../models/colyseus-models/player"
import { PortalCarouselStages } from "../../config/game/stages"
import { GamePhaseState } from "../../types/enum/Game"
import type { Item } from "../../types/enum/Item"
import type { Pkm } from "../../types/enum/Pokemon"
import type { GuideAction, GuideStep } from "./guide-lesson"
import { getGuideLesson, type GuideGameState } from "./guide-stage"

/* Where the player is WITHIN the lesson: which step is active, whether it is
   waiting on them, and what that step permits them to do. Everything a guide
   locks by default - rolling, levelling, buying, crafting, item targets - is
   answered from the active step here.

   Its counterpart is guide-stage.ts, which answers what the script wants on a
   given round. */

export interface GuideProgressState extends GuideGameState {
  stageLevel: number
  guideStep: number
  guideStepAcked: boolean
  // server-only cursor recording which step already ran its onEnter
  guideStepEntered: number
}

export function getActiveGuideStep(
  state: GuideProgressState
): GuideStep | null {
  const lesson = getGuideLesson(state)
  if (!lesson) return null
  const step = lesson.steps[state.guideStep]
  if (!step || step.stage > state.stageLevel) return null
  return step
}

/* Called every tick of the picking phase. Fires the step's grants once, then
   advances past it as soon as its check passes. Steps whose stage is already
   behind us are dropped rather than blocking the run forever. */
export function updateGuideProgress(
  state: GuideProgressState,
  player: Player
) {
  const lesson = getGuideLesson(state)
  if (!lesson) return

  while (state.guideStep < lesson.steps.length) {
    const step = lesson.steps[state.guideStep]
    if (step.stage > state.stageLevel) return
    if (step.stage < state.stageLevel) {
      state.guideStep++
      continue
    }
    if (state.guideStepEntered !== state.guideStep) {
      state.guideStepEntered = state.guideStep
      step.onEnter?.(player)
    }
    if (!step.isCompleted || !step.isCompleted(player)) return
    state.guideStep++
    state.guideStepAcked = false
  }
}

// the picking timer is frozen while a step is still waiting on the player, so
// reading never costs them the round
export function isGuideWaitingOnPlayer(state: GuideProgressState): boolean {
  return getActiveGuideStep(state) !== null
}

// the only unit allowed to receive items while the active step is an
// itemization one, so a misdrop cannot quietly ruin the lesson
export function getGuideItemTarget(state: GuideProgressState): Pkm | null {
  return getActiveGuideStep(state)?.itemTarget ?? null
}

/* Rolling and levelling are off by default in a guide: the lesson decides when
   they matter, and an accidental roll can put the run somewhere the script does
   not cover. */
export function isGuideActionAllowed(
  state: GuideProgressState,
  action: GuideAction
): boolean {
  if (!getGuideLesson(state)) return true
  return getActiveGuideStep(state)?.allowActions?.includes(action) ?? false
}

/* True while a reading step is up during a carousel: the player is meant to
   take in the plan before walking, so their avatar does not move until they
   acknowledge it. A step with a check never holds them, because the check is
   usually "go and pick the thing up". */
export function isGuideHoldingPlayerStill(
  state: GuideProgressState & { phase: number; stageLevel: number }
): boolean {
  if (state.phase !== GamePhaseState.TOWN) return false
  /* Portal stages hide the card until the picking phase so it does not talk
     over the transition animation - which means there is nothing on screen to
     acknowledge, and holding the avatar would strand the player outside the
     portal with no way in. */
  if (PortalCarouselStages.includes(state.stageLevel)) return false
  return isGuideAwaitingConfirm(state)
}

/* Rolls done on the current step, compared against its pity floor. */
export function getGuidePityUnit(
  state: GuideProgressState,
  rollsThisStep: number
): Pkm | null {
  const pity = getActiveGuideStep(state)?.pity
  if (!pity || rollsThisStep < pity.afterRolls) return null
  return pity.pokemon
}

/* Units the shop will sell right now. An active guide with no buyable list on
   its step sells nothing at all. */
export function getGuideBuyableUnits(state: GuideProgressState): Pkm[] | null {
  if (!getGuideLesson(state)) return null
  return getActiveGuideStep(state)?.buyable ?? []
}

/* The recipes the active step permits. Locked by default like everything else
   in a guide: a step that does not name any recipes allows none at all, so a
   player who reads ahead cannot burn the components a later step is built on.
   Null means there is no lesson and normal crafting rules apply. */
export function getGuideAllowedCrafts(
  state: GuideProgressState
): Item[] | null {
  if (!getGuideLesson(state)) return null
  return getActiveGuideStep(state)?.allowedCrafts ?? []
}

/* Null means "no restriction beyond the itemTarget", which is already a lock:
   a step only narrows further when the inventory is carrying something the
   lesson is saving for a later stage. */
export function getGuideAllowedItems(
  state: GuideProgressState
): Item[] | null {
  if (!getGuideLesson(state)) return null
  return getActiveGuideStep(state)?.allowedItems ?? null
}

/* "Got it" means two different things. On a reading step it clears the step; on
   a step that first has to reveal a proposition screen it only reveals it, and
   the step's own check is what clears it. */
export function acknowledgeGuideStep(state: GuideProgressState) {
  const step = getActiveGuideStep(state)
  if (!step) return
  if (!step.isCompleted) {
    state.guideStep++
    state.guideStepAcked = false
  } else if (step.confirmFirst) {
    state.guideStepAcked = true
  }
}

// true while the player still has to press "Got it" before anything is revealed
export function isGuideAwaitingConfirm(state: GuideProgressState): boolean {
  const step = getActiveGuideStep(state)
  if (!step) return false
  if (!step.isCompleted) return true
  return step.confirmFirst === true && !state.guideStepAcked
}
