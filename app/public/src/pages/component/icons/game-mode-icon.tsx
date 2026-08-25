import { useTranslation } from "react-i18next"
import type { GameMode } from "../../../../../types/enum/Game"
import { cc } from "../../utils/jsx"

export function GameModeIcon(props: { gameMode: GameMode; whimsy?: boolean }) {
  const { t } = useTranslation()
  // Whimsy Weekend runs as a Double Up game, but shows its own badge
  const label = props.whimsy
    ? t("whimsy_weekend")
    : t(`game_modes.${props.gameMode}`)
  return (
    <img
      alt={label}
      title={label}
      className={cc(props.gameMode.toLowerCase(), "gamemode icon")}
      src={
        props.whimsy
          ? "/assets/ui/whimsy_weekend.png"
          : `/assets/ui/${props.gameMode.toLowerCase()}.png`
      }
      draggable="false"
    />
  )
}
