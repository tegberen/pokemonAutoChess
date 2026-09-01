import type { Synergy } from "../../../types/enum/Synergy"
import type { GuideLesson } from "../guide-lesson"
import { compileGuideLesson } from "../guide-script"
import { GrassLesson } from "./grass"

/* One lesson per synergy, added a synergy at a time. A synergy missing from
   this map has no guide yet, and the picker lists it as coming soon.

   To add one: write `<synergy>.ts` next to grass.ts as a GuideLessonScript,
   add its `guide.lessons.<SYNERGY>.steps.*` locale block, and register it
   below. compileGuideLesson validates it at load, so an authoring mistake
   throws on server start rather than mid-run. */
const SCRIPTS = [GrassLesson]

export const GuideLessons: Partial<Record<Synergy, GuideLesson>> =
  Object.fromEntries(
    SCRIPTS.map((script) => [script.synergy, compileGuideLesson(script)])
  )
