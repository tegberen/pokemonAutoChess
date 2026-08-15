import { memo, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  getExpeditionLabel,
  getPlayerExpeditions
} from "../../../../../core/expeditions"
import { useAppSelector } from "../../../hooks"
import { usePreference } from "../../../preferences"
import { addIconsToDescription } from "../../utils/descriptions"
import DraggableWindow from "../modal/draggable-window"

/* takes no props, so memo bails out of every parent-driven re-render and only
   runs when its own profile/preference hooks actually change */
function GameExpeditions() {
  const { t } = useTranslation()
  /* subscribing to the whole profile re-rendered this on every unrelated field
     change and busted the memo below with it; the expedition list is derived
     from these two values alone, and they compare by value */
  const uid = useAppSelector((state) => state.network.profile?.uid)
  const eventPoints = useAppSelector(
    (state) => state.network.profile?.eventPoints ?? 0
  )
  const [expeditionsPosition, setExpeditionsPosition] = usePreference(
    "expeditionsPosition"
  )

  const expeditionItems = useMemo(
    () =>
      uid
        ? getPlayerExpeditions({ uid, eventPoints }).map((expedition) => (
            <li key={expedition.type + expedition.rank}>
              <span className="expedition-type">
                {t(`expeditions.${expedition.type}`)}
              </span>
              <p>{addIconsToDescription(getExpeditionLabel(expedition))}</p>
            </li>
          ))
        : null,
    [uid, eventPoints, t]
  )

  if (!uid) return null

  return (
    <DraggableWindow
      title={t("expeditions.title")}
      className="my-container expeditions-container"
      initialPosition={expeditionsPosition}
      onMove={(position) => setExpeditionsPosition(position)}
      defaultMinimized={true}
    >
      <ul style={{ maxWidth: "500px" }}>{expeditionItems}</ul>
    </DraggableWindow>
  )
}

export default memo(GameExpeditions)
