import { useTranslation } from "react-i18next"
import { GameMode } from "../../../../../types/enum/Game"

// every room is either played alone or as a Double Up pair, whatever its
// older mode was, so old game records read the same way
export function GameModeIcon(props: { gameMode: GameMode }) {
  const { t } = useTranslation()
  const label =
    props.gameMode === GameMode.DOUBLE_UP ? t("new_game_duo") : t("new_game_solo")
  return (
    <span className="gamemode gamemode-badge" title={label}>
      {label}
    </span>
  )
}
