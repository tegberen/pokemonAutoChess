import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { GuideLessons } from "../../../../../core/guide/lessons"
import { type Synergy, SynergyArray } from "../../../../../types/enum/Synergy"
import { cc } from "../../utils/jsx"
import SynergyIcon from "../icons/synergy-icon"
import { Modal } from "../modal/modal"
import "./guide-menu.css"

export function GuideMenu(props: {
  show: boolean
  onClose: () => void
  onSelectSynergy: (synergy: Synergy) => void
}) {
  const { t } = useTranslation()
  /* Opening a guide takes a moment while the room is created, so the picked
     card stays lit and the rest dim - otherwise the click has no feedback. */
  const [picked, setPicked] = useState<Synergy | null>(null)
  const lessons = SynergyArray.filter((synergy) => synergy in GuideLessons)
  useEffect(() => {
    if (!props.show) setPicked(null)
  }, [props.show])

  return (
    <Modal
      show={props.show}
      onClose={props.onClose}
      className="guide-menu anchor-top"
      header={
        <>
          <img
            src="assets/ui/guide_lobby.svg"
            alt=""
            className="guide-menu-icon"
          />
          {t("guide.pick_a_synergy")}
        </>
      }
      body={
        <div className="guide-menu-content">
          <ul
            className={cc("guide-menu-list", { "is-picking": picked !== null })}
            aria-label={t("guide.available_lessons")}
          >
            {lessons.map(
              (synergy) => {
                return (
                  <li
                    key={synergy}
                    className={cc("my-box", "guide-menu-entry", {
                      "guide-menu-entry--picked": picked === synergy
                    })}
                    onClick={() => {
                      if (picked !== null) return
                      setPicked(synergy)
                      props.onSelectSynergy(synergy)
                    }}
                    role="button"
                    tabIndex={picked === null ? 0 : -1}
                    aria-disabled={picked !== null}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return
                      event.preventDefault()
                      if (picked !== null) return
                      setPicked(synergy)
                      props.onSelectSynergy(synergy)
                    }}
                  >
                    <SynergyIcon type={synergy} size="2.5em" />
                    <strong>{t(`synergy.${synergy}`)}</strong>
                  </li>
                )
              }
            )}
          </ul>
          <p className="guide-menu-note">{t("guide.choose_lesson_hint")}</p>
        </div>
      }
    />
  )
}
