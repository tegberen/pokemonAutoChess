import { useTranslation } from "react-i18next"
import type { Synergy } from "../../../../../types/enum/Synergy"
import { renderGuideText } from "./guide-text"
import "./guide-notes.css"

/* The lesson plays one line; the notes are what generalises past it - how the
   trait wants to be played, which item sets it is looking for, where it caps.
   Read after finishing on the end card, and before committing to twenty stages
   from the synergy picker, so they are a component rather than a screen. */
const GUIDE_NOTE_SECTIONS = ["synergy", "items"] as const

export function GuideNotes(props: { synergy: Synergy }) {
  const { t } = useTranslation()

  const sections = GUIDE_NOTE_SECTIONS.map((section) => {
    // only the synergies with a lesson written exist under guide.lessons
    const bullets = (t as any)(
      `guide.lessons.${props.synergy}.notes.${section}`,
      { returnObjects: true, defaultValue: [] }
    )
    return { section, bullets: Array.isArray(bullets) ? bullets : [] }
  }).filter(({ bullets }) => bullets.length > 0)

  if (sections.length === 0) return null

  return (
    <div className="guide-notes">
      {sections.map(({ section, bullets }) => (
        <section key={section}>
          <h3>{t(`guide.notes.${section}`)}</h3>
          <ul>
            {bullets.map((bullet: string, i: number) => (
              <li key={i}>{renderGuideText(bullet, t)}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
