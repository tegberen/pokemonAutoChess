import { useTranslation } from "react-i18next"
import { GuideLessons } from "../../../../../core/guide/lessons"
import { SynergyArray } from "../../../../../types/enum/Synergy"
import { GuideNotes } from "../guide/guide-notes"
import SynergyIcon from "../icons/synergy-icon"
import "./synergy-guide.css"

/* The takeaways from every lesson that has been written, in one place. The end
   card shows a player the notes for the synergy they just finished; this is
   where they go to read one without playing it, or to compare two. */
export function SynergyGuide() {
  const { t } = useTranslation()
  const lessons = SynergyArray.filter((synergy) => synergy in GuideLessons)

  return (
    <div className="synergy-guide">
      <header>
        <h2>{t("guide.bookmarks_title")}</h2>
        <p>{t("guide.bookmarks_hint")}</p>
      </header>
      {lessons.map((synergy) => (
        <article key={synergy} className="synergy-guide-lesson my-box">
          <h3>
            <SynergyIcon type={synergy} size="2em" />
            {t(`synergy.${synergy}`)}
          </h3>
          <GuideNotes synergy={synergy} />
        </article>
      ))}
      {lessons.length === 0 && <p>{t("guide.choose_lesson_hint")}</p>}
    </div>
  )
}
