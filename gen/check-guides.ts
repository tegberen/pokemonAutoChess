import { readFileSync } from "node:fs"
import path from "node:path"
import { GuideLessons } from "../app/core/guide/lessons"

/* Checks every guide lesson against the locale file.

   compileGuideLesson already validates a lesson's structure at load, but it
   cannot see the translations - a step whose key has no string renders the raw
   key on screen and nothing complains. With 31 lessons of ~48 steps that is a
   lot of chances to miss one, so this is the check to run before shipping a
   lesson.

   npm run check-guides */

const TRANSLATION_FILE = path.resolve(
  __dirname,
  "../app/public/dist/client/locales/en/translation.json"
)

type StepStrings = Record<string, string>

// kept in step with guide-notes.tsx, which renders exactly these
const GUIDE_NOTE_SECTIONS = ["synergy", "items"]

const problems: string[] = []
const report = (lesson: string, message: string) =>
  problems.push(`${lesson}: ${message}`)

const locale = JSON.parse(readFileSync(TRANSLATION_FILE, "utf8"))
const lessonStrings = locale?.guide?.lessons ?? {}

for (const [synergy, lesson] of Object.entries(GuideLessons)) {
  if (!lesson) continue
  const steps: StepStrings = lessonStrings[synergy]?.steps ?? {}

  if (Object.keys(steps).length === 0) {
    report(synergy, `has no guide.lessons.${synergy}.steps block at all`)
    continue
  }

  for (const step of lesson.steps) {
    const text = steps[step.key]
    if (text === undefined) {
      report(synergy, `step "${step.key}" has no translation`)
      continue
    }

    // {{placeholders}} in the text and params on the step have to agree
    const placeholders = [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
    const params = Object.keys(step.params ?? {})
    for (const name of placeholders) {
      if (!params.includes(name)) {
        report(
          synergy,
          `step "${step.key}" text uses {{${name}}} but the step supplies no such param`
        )
      }
    }
    for (const name of params) {
      if (!placeholders.includes(name)) {
        report(
          synergy,
          `step "${step.key}" supplies param "${name}" that the text never uses`
        )
      }
    }
  }

  /* The notes are the lesson's editor's note, shown on the end card and in the
     picker. They are easy to forget because nothing in the lesson code refers
     to them, so a lesson without them fails here rather than rendering an
     empty panel. */
  const notes = lessonStrings[synergy]?.notes ?? {}
  for (const section of GUIDE_NOTE_SECTIONS) {
    const bullets = notes[section]
    if (!Array.isArray(bullets) || bullets.length === 0) {
      report(
        synergy,
        `has no guide.lessons.${synergy}.notes.${section} bullets`
      )
    }
  }
  for (const section of Object.keys(notes)) {
    if (!GUIDE_NOTE_SECTIONS.includes(section)) {
      report(synergy, `notes section "${section}" is not one the UI renders`)
    }
  }

  const authored = new Set(lesson.steps.map((step) => step.key))
  for (const key of Object.keys(steps)) {
    if (!authored.has(key)) {
      report(synergy, `translation "${key}" belongs to no step`)
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} guide problem(s):`)
  problems.forEach((p) => console.error(`  ${p}`))
  process.exit(1)
}

const lessonCount = Object.keys(GuideLessons).length
const stepCount = Object.values(GuideLessons).reduce(
  (total, lesson) => total + (lesson?.steps.length ?? 0),
  0
)
console.log(`${lessonCount} guide lesson(s), ${stepCount} steps, all translated`)
