import { PVEStages, type PVEStage } from "../../models/pve-stages"
import { GameMode } from "../../types/enum/Game"
import type { Item } from "../../types/enum/Item"
import type { Pkm } from "../../types/enum/Pokemon"
import type { Synergy } from "../../types/enum/Synergy"
import type { GuideLesson } from "./guide-lesson"
import { guidePveStage } from "./guide-opponents"
import { GuideLessons } from "./lessons"

/* What the lesson says about a STAGE: the shop it deals, the reward it pays,
   the proposition it forces, the opponent it fields. Everything here is keyed
   by stage level and answers "what does the script want on this round?".

   Its counterpart is guide-progress.ts, which tracks where the player is
   WITHIN a stage - which step is active and what that step permits.

   The state parameter is structural rather than an imported GameState, so the
   client bundle and the schema file can both use these without a cycle. */
export interface GuideGameState {
  gameMode: GameMode
  guideSynergy: Synergy | null
}

export function getGuideLesson(state: GuideGameState): GuideLesson | null {
  if (state.gameMode !== GameMode.GUIDE || state.guideSynergy === null) {
    return null
  }
  return GuideLessons[state.guideSynergy] ?? null
}

/* Every guide stage is a scripted PVE round, so the whole run stays
   deterministic and an objective the lesson set is always reachable. */
export function isPveStage(state: GuideGameState, stageLevel: number): boolean {
  const lesson = getGuideLesson(state)
  if (!lesson) return stageLevel in PVEStages
  return stageLevel > 0 && stageLevel <= lesson.lastStage
}

/* A guide authors every one of its stages, wild rounds included: this server
   has variants on all six of them and the players a guide is written for come
   from one that does not. */
export function getPveStage(
  state: GuideGameState,
  stageLevel: number
): PVEStage | undefined {
  if (!getGuideLesson(state)) return PVEStages[stageLevel]
  if (!isPveStage(state, stageLevel)) return undefined
  return guidePveStage(stageLevel) ?? undefined
}

/* The synergy a guide's portals must lead to a region for. Null outside a
   guide, where regions stay random. */
export function getGuideRegionSynergy(state: GuideGameState): Synergy | null {
  return getGuideLesson(state)?.synergy ?? null
}

export function getGuideShopInjections(
  state: GuideGameState & { stageLevel: number }
): Pkm[] {
  const lesson = getGuideLesson(state)
  return lesson?.shopInjections?.[state.stageLevel] ?? []
}

/* The UNIQUE or LEGENDARY the lesson teaches, forced onto that stage's
   proposition list so it is picked from the real screen rather than handed over. */
export function getGuideForcedProposition(
  state: GuideGameState & { stageLevel: number }
): Pkm | null {
  const lesson = getGuideLesson(state)
  return lesson?.forcedPropositions?.[state.stageLevel] ?? null
}

/* The only component a scripted carousel will let the player pick up, so a
   misgrab cannot cost them the item the next step is built on. */
export function getGuideCarouselTarget(
  state: GuideGameState & { stageLevel: number; guideRewinding: boolean }
): Item | null {
  const lesson = getGuideLesson(state)
  if (!lesson) return null
  if (state.guideRewinding && lesson.rewind?.stage === state.stageLevel) {
    return lesson.rewind.target
  }
  return lesson.carouselTargets?.[state.stageLevel] ?? null
}


/* Takes the stage explicitly: the caller runs after the stage counter has
   already moved on to the next round, and the rewards belong to the fight that
   was just played. */
export function getGuideStageRewards(
  state: GuideGameState,
  stageLevel: number
): Item[] {
  return getGuideLesson(state)?.stageRewards?.[stageLevel] ?? []
}

export function getGuideForcedPickItem(
  state: GuideGameState & { stageLevel: number }
): Item | null {
  return getGuideLesson(state)?.forcedPickItems?.[state.stageLevel] ?? null
}

export function getGuideXpPurchases(
  state: GuideGameState & { stageLevel: number }
): number | null {
  return getGuideLesson(state)?.xpPurchases?.[state.stageLevel] ?? null
}

/** The berries the trees should be grown and ready to drop on this stage. */
export function getGuideRipeBerries(
  state: GuideGameState & { stageLevel: number }
): Item[] | null {
  return getGuideLesson(state)?.ripeBerries?.[state.stageLevel] ?? null
}

/** The level the player is put on when this stage begins. */
export function getGuideStartingLevel(
  state: GuideGameState & { stageLevel: number }
): number | null {
  return getGuideLesson(state)?.levels?.[state.stageLevel] ?? null
}

/* Components kept out of a replayed carousel, so "somebody beat you to the
   seed" is literally true on screen. */
export function getGuideCarouselExclusions(
  state: GuideGameState & { stageLevel: number; guideRewinding: boolean }
): Item[] {
  const lesson = getGuideLesson(state)
  if (!lesson?.rewind || !state.guideRewinding) return []
  if (lesson.rewind.stage !== state.stageLevel) return []
  return lesson.rewind.excludes
}
