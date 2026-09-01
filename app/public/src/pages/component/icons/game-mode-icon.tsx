import { useTranslation } from "react-i18next"
import { GameMode } from "../../../../../types/enum/Game"
import { cc } from "../../utils/jsx"

export function GameModeIcon(props: { gameMode: GameMode; whimsy?: boolean }) {
  const { t } = useTranslation()
  // Whimsy Weekend runs as a Double Up game, but shows its own badge
  const label = props.whimsy
    ? t("whimsy_weekend")
    : t(`game_modes.${props.gameMode}`)
  // the png icons are all 40x40, but guide_lobby.svg declares 512x512 inline,
  // so the size is pinned here rather than left to intrinsic dimensions.
  // Call sites that size it in CSS still win over these attributes.
  return (
    <img
      alt={label}
      title={label}
      className={cc(props.gameMode.toLowerCase(), "gamemode icon")}
      src={
        props.whimsy
          ? "/assets/ui/whimsy_weekend.png"
          : props.gameMode === GameMode.GUIDE
            ? "/assets/ui/guide_lobby.svg"
            : `/assets/ui/${props.gameMode.toLowerCase()}.png`
      }
      draggable="false"
      width={40}
      height={40}
    />
  )
}
