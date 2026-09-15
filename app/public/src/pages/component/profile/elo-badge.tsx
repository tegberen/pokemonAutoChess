import { useTranslation } from "react-i18next"
import { getRank } from "../../../../../utils/elo"
import { usePreference } from "../../../preferences"
import "./elo-badge.css"

export function EloBadge(props: { elo: number }) {
  const { t } = useTranslation()
  const [hideElo] = usePreference("hideElo")
  if (hideElo) return null
  const rank = getRank(props.elo)
  return (
    <div className="elo badge">
      <img
        src={"assets/ranks/" + rank + ".svg"}
        alt={t(`elorank.${rank}`)}
        title={t(`elorank.${rank}`)}
      />
      <p style={{ margin: 0 }}>{props.elo}</p>
    </div>
  )
}
