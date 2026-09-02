import type Player from "../../models/colyseus-models/player"
import type { Item } from "../../types/enum/Item"
import type { Pkm } from "../../types/enum/Pokemon"
import type { Synergy } from "../../types/enum/Synergy"
import type { Title } from "../../types"
import type {
  GuideAction,
  GuideLesson,
  GuideStep,
  GuideTopic
} from "./guide-lesson"

/* HOW TO WRITE A LESSON
   ---------------------
   A lesson is a list of stages, in order. Each stage owns everything that
   happens on it - what the shop deals, what the fight pays, what the carousel
   holds, what level the player starts on, and the steps the player works
   through - so authoring one stage never means editing nine separate maps.

   `compileGuideLesson` turns that into the flat, stage-keyed lookups the
   runtime reads. Authors never see the compiled shape, and the runtime never
   sees the authored one.

   Every step needs a matching locale string at
   `guide.lessons.<SYNERGY>.steps.<key>`. Write item and Pokemon names in CAPS
   there so they render as icons and portraits.

   A step with no `isCompleted` is a reading step: it shows a "Got it" button
   and holds the clock until the player dismisses it. Everything else in a
   guide is locked unless the active step opens it - rolling, levelling,
   buying, crafting and where items may be dropped. */

export interface GuideStepScript {
  /** suffix of the locale key under `guide.lessons.<SYNERGY>.steps` */
  key: string
  topic: GuideTopic
  /** interpolation values for the instruction text */
  params?: Record<string, string | number>
  /** portraits rendered above the text, for the steps that show a pool */
  showPokemons?: Pkm[]
  /** units the shop will sell while this step is up; everything else greys out */
  buyable?: Pkm[]
  /** guarantees a copy once this step's own rolls reach the floor */
  pity?: { pokemon: Pkm; afterRolls: number }
  /** hold a proposition screen back until the player has pressed "Got it" */
  confirmFirst?: boolean
  /** buttons this step unlocks; everything unlisted stays disabled */
  allowActions?: GuideAction[]
  /** the only recipes this step permits; omit to permit none */
  allowedCrafts?: Item[]
  /** narrows what may go on the itemTarget; omit to accept any item */
  allowedItems?: Item[]
  /** the only unit that accepts items; omit and the step equips nothing */
  itemTarget?: Pkm
  /** omit for a reading step; the run pauses here until this passes */
  isCompleted?: (player: Player) => boolean
  /** runs once when the step becomes active */
  onEnter?: (player: Player) => void
  /** acknowledging this step replays the lesson's rewind stage */
  triggersRewind?: boolean
}

export interface GuideStageScript {
  stage: number
  /** the level the player is put on when the stage begins */
  level?: number
  /** how many XP purchases this stage's level-up step should take */
  xpPurchases?: number
  /** units dealt into the stage's opening shop, duplicates meaning copies */
  shop?: Pkm[]
  /** components this stage's fight pays out, win or lose */
  reward?: Item[]
  /** a UNIQUE or LEGENDARY forced onto this stage's proposition screen */
  proposition?: Pkm
  /** the component forced onto this stage's additional pick */
  pickItem?: Item
  /** the only component this stage's carousel will hand over */
  carousel?: Item
  /* Fixes what grows on the berry trees and ripens them, so a lesson can tell
     the player to harvest named berries on this stage. One entry per tree from
     the left; a tree only renders once the GRASS tier pays for it, so never
     list more than the board will have by then. */
  ripeBerries?: Item[]
  steps?: GuideStepScript[]
}

export interface GuideLessonScript {
  synergy: Synergy
  /** awarded once the player reaches the last stage of this lesson */
  title?: Title
  /** units the script depends on; `untilStage` releases a rented item holder */
  protect?: { pkm: Pkm; untilStage?: number }[]
  /** replays one carousel stage with the taught pick gone */
  rewind?: GuideLesson["rewind"]
  /** in ascending stage order */
  stages: GuideStageScript[]
}

class GuideLessonError extends Error {
  constructor(synergy: Synergy, message: string) {
    super(`guide lesson ${synergy}: ${message}`)
  }
}

/* Authoring mistakes that are silent at runtime and painful to debug: a stage
   out of order quietly never runs, a pity unit the step cannot buy never
   appears, an XP target with no starting level is unreachable. Fail loudly at
   load instead. */
function validate(script: GuideLessonScript) {
  const fail = (message: string) => {
    throw new GuideLessonError(script.synergy, message)
  }

  if (script.stages.length === 0) fail("has no stages")

  const seenStages = new Set<number>()
  let previousStage = -1
  for (const stage of script.stages) {
    if (seenStages.has(stage.stage)) fail(`stage ${stage.stage} declared twice`)
    if (stage.stage <= previousStage) {
      fail(`stage ${stage.stage} is out of order, stages must ascend`)
    }
    seenStages.add(stage.stage)
    previousStage = stage.stage

    if (stage.xpPurchases !== undefined && stage.level === undefined) {
      fail(
        `stage ${stage.stage} sets xpPurchases without a level, so the experience bar has no baseline to start from`
      )
    }

    for (const step of stage.steps ?? []) {
      if (step.pity && !step.buyable?.includes(step.pity.pokemon)) {
        fail(
          `step "${step.key}" pities ${step.pity.pokemon} but does not list it as buyable, so the shop would offer a unit the player cannot buy`
        )
      }
      if (step.allowedItems?.length === 0) {
        fail(
          `step "${step.key}" declares an empty allowedItems, which refuses every equip; omit the field to allow any`
        )
      }
      if (step.allowedItems && !step.itemTarget) {
        fail(
          `step "${step.key}" narrows allowedItems but names no itemTarget, so equipping is closed anyway and the list can never apply`
        )
      }
      if (step.triggersRewind && !script.rewind) {
        fail(`step "${step.key}" triggers a rewind but the lesson declares none`)
      }
    }
  }

  if (script.rewind && !seenStages.has(script.rewind.stage)) {
    fail(`rewind targets stage ${script.rewind.stage}, which the lesson never reaches`)
  }

  const keys = script.stages.flatMap((s) => (s.steps ?? []).map((x) => x.key))
  const duplicate = keys.find((k, i) => keys.indexOf(k) !== i)
  if (duplicate) fail(`step key "${duplicate}" is used twice`)
}

/** Flattens the authored stage list into the lookups the runtime reads. */
export function compileGuideLesson(script: GuideLessonScript): GuideLesson {
  validate(script)

  const byStage = <T>(pick: (stage: GuideStageScript) => T | undefined) => {
    const out: { [stage: number]: T } = {}
    for (const stage of script.stages) {
      const value = pick(stage)
      if (value !== undefined) out[stage.stage] = value
    }
    return out
  }

  const steps: GuideStep[] = script.stages.flatMap((stage) =>
    (stage.steps ?? []).map((step) => ({ ...step, stage: stage.stage }))
  )

  return {
    synergy: script.synergy,
    title: script.title,
    lastStage: script.stages[script.stages.length - 1].stage,
    protectedFamilies: script.protect,
    rewind: script.rewind,
    shopInjections: byStage((s) => s.shop),
    stageRewards: byStage((s) => s.reward),
    forcedPropositions: byStage((s) => s.proposition),
    forcedPickItems: byStage((s) => s.pickItem),
    carouselTargets: byStage((s) => s.carousel),
    levels: byStage((s) => s.level),
    xpPurchases: byStage((s) => s.xpPurchases),
    ripeBerries: byStage((s) => s.ripeBerries),
    steps
  }
}
