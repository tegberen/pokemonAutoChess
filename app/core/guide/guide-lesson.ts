import type Player from "../../models/colyseus-models/player"
import type { Item } from "../../types/enum/Item"
import { type Pkm, PkmFamily } from "../../types/enum/Pokemon"
import type { Synergy } from "../../types/enum/Synergy"
import type { Title } from "../../types"

/* What is left of a scripted carousel once the player has the component. They
   are alone on the map, so the rest of the timer is dead air. */
export const GUIDE_CAROUSEL_OUTRO_DURATION = 1500

/* What is left of a picking phase once the lesson has nothing further to ask.
   A normal stage timer exists to pressure eight players into deciding; a guide
   has one player who has already done what the step wanted, so the rest of it
   is dead air too. Long enough to see the board settle before the fight. */
export const GUIDE_PICK_OUTRO_DURATION = 2000

// the teacher fronting every lesson
export const GUIDE_PRESENTER_INDEX = "0199"

// which of the four things a guide teaches a step belongs to, so the overlay can
// label it and the summary can score each one separately
export enum GuideTopic {
  BOARD = "BOARD",
  ITEMIZATION = "ITEMIZATION",
  ECONOMY = "ECONOMY",
  POSITIONING = "POSITIONING"
}

/* A guide run is not an economy simulation: predicting exactly how much gold a
   player will have at stage 20 is hopeless once they are free to misplay, so
   gold is simply unlimited and the client shows an infinity icon instead of a
   number. Levels are set outright per stage for the same reason. */
export const GUIDE_INFINITE_GOLD = 9999

// buttons a step can unlock; everything not listed is disabled while it is active
export type GuideAction = "reroll" | "levelup"

export interface GuideStep {
  // stage the step appears on; steps are authored in ascending stage order
  stage: number
  topic: GuideTopic
  // suffix of the locale key under wiki.guide.lessons.<SYNERGY>.steps
  key: string
  // interpolation values for the instruction text
  params?: Record<string, string | number>
  // portraits rendered above the text, for the steps that show a pool
  showPokemons?: Pkm[]
  /* Guarantees a copy once the player has rolled this many times on this step,
     so a roll lesson is a real search with a floor under it. Per step rather
     than per stage: a stage can ask for two different rolls. */
  pity?: { pokemon: Pkm; afterRolls: number }
  /* Units the shop will actually sell while this step is up. Tied to the step
     rather than the stage so a unit stays greyed out until the instruction that
     needs it is on screen - otherwise the player buys ahead of the lesson. */
  buyable?: Pkm[]
  /* Hold back the proposition screen until the player has pressed "Got it".
     Without it a choice modal opens straight over the card explaining what to
     choose, which is exactly backwards. Unlike a pure reading step this one
     still has a check: the ack reveals the screen, the check clears the step. */
  confirmFirst?: boolean
  /* Everything is locked in a guide unless its step says otherwise, so the
     player cannot roll or level their way out of the lesson by accident. */
  allowActions?: GuideAction[]
  /* The only items this step lets the player craft. Anything else is refused,
     so a misdrop cannot burn the components the next step is built on. */
  allowedCrafts?: Item[]
  /* Narrows which items may go onto the itemTarget. Omit it and the target
     accepts anything; declare it when the inventory is holding a component a
     later stage spends, so a misdrop cannot sink it into a body. Useless
     without an itemTarget, since nothing may be equipped at all then. */
  allowedItems?: Item[]
  /* The one unit that accepts items while this step is up, and the switch that
     opens equipping at all: a step naming no target refuses every drop. A
     component put somewhere on a whim is a component the stage that spends it
     will not find, so the guide would rather say no and explain why. */
  itemTarget?: Pkm
  // the run stays paused on this step until the check passes; a step without a
  // check is pure reading and clears when the player acknowledges it
  isCompleted?: (player: Player) => boolean
  // runs once when the step becomes the active one, to hand out what the step
  // asks the player to use
  onEnter?: (player: Player) => void
  /* Acknowledging this step replays the lesson's rewind stage. Only meaningful
     on a reading step, since the replay is what clears it. */
  triggersRewind?: boolean
}

export interface GuideLesson {
  synergy: Synergy
  /* Paid out for reaching the last stage. Named per lesson rather than from a
     central table so writing a lesson never means editing a second file. */
  title?: Title
  // the run ends after this stage
  lastStage: number
  /* Units forced into the shop on the stage that teaches them. The rest of the
     shop is drawn normally, so the player still reads a realistic board. */
  shopInjections?: { [stage: number]: Pkm[] }
  /* Families the rest of the script depends on, so selling one cannot strand the
     lesson. Matched by family, which keeps the protection across evolutions.
     `untilStage` releases a unit the lesson only rents, such as an early item
     holder that is meant to be sold once a better body inherits its items. */
  protectedFamilies?: { pkm: Pkm; untilStage?: number }[]
  /* Forced onto the proposition screen of its stage, so a UNIQUE or LEGENDARY
     the lesson needs is chosen from the real screen with the others greyed out.
     Uniques are offered at stage 10, legendaries at stage 20. */
  forcedPropositions?: { [stage: number]: Pkm }
  // the only component the carousel of that stage will hand over
  carouselTargets?: { [stage: number]: Item }
  /* Components handed out as that stage's fight reward. Granted whether the
     fight was won or lost: the lesson's text names what is in the inventory, so
     the inventory cannot depend on the result of a scripted sparring match. */
  stageRewards?: { [stage: number]: Item[] }
  /* Additional-pick stages propose Pokemon carrying items. This forces the
     lesson's component onto one of them; the others are greyed out. */
  forcedPickItems?: { [stage: number]: Item }
  // the level the player is put on when a stage begins
  levels?: { [stage: number]: number }
  /* How many XP purchases a stage's "level up" step should take. The stage
     starts with the experience bar already that far along, so "buy XP twice"
     is literally true rather than an estimate that drifts with the exp table. */
  xpPurchases?: { [stage: number]: number }
  /* What the berry trees grow, ripened for that stage, one entry per tree from
     the left. Trees are random in type and grow a stage at a time, and a portal
     rerolls both - none of which a script can write text against - so a lesson
     that teaches harvesting pins them. */
  ripeBerries?: { [stage: number]: Item[] }
  /* Replays one carousel stage with the taught pick already gone, to teach the
     adaptation rather than only the plan. */
  rewind?: {
    stage: number
    // kept out of the replay's carousel, so the taught pick is genuinely gone
    excludes: Item[]
    // what the replay wants taken instead
    target: Item
    /* Removed before the replay. These are the items the stage produced, not
       the components it consumed: by the time the player asks to see the other
       branch they have already crafted, so undoing the pick means undoing what
       the pick was spent on. */
    takeBack: Item[]
    /* The unit the stage built onto. Named because the same component can
       legitimately sit on two units at once, and unwinding the wrong one
       strips a body the lesson is not replaying. With a holder set, takeBack
       only ever looks at that family and the bag. */
    holder?: Pkm
    // components handed back so the alternative craft is affordable
    restore: Item[]
  }
  steps: GuideStep[]
}

export function isProtectedFromSelling(
  lesson: GuideLesson,
  pkm: Pkm,
  stageLevel: number
): boolean {
  const family = PkmFamily[pkm]
  return (
    lesson.protectedFamilies?.some(
      (protection) =>
        PkmFamily[protection.pkm] === family &&
        (protection.untilStage === undefined ||
          stageLevel < protection.untilStage)
    ) ?? false
  )
}
