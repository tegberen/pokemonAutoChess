import { useTranslation } from "react-i18next"
import { GameModification } from "../../../../../types/enum/Game"
import type { SpecialGameRule } from "../../../../../types/enum/SpecialGameRule"
import { addIconsToDescription } from "../../utils/descriptions"

export const GameModificationIcon: Record<GameModification, string> = {
  [GameModification.CLASSIC]: "/assets/ui/game_modes/classic_icon.svg",
  [GameModification.WISHES]: "/assets/ui/game_modes/wishes_icon.svg",
  [GameModification.SCRIBBLE]: "/assets/ui/game_modes/scribble_icon.svg"
}

const GameModificationArt: Record<GameModification, string> = {
  [GameModification.CLASSIC]: "assets/ui/game_modes/classic.png",
  [GameModification.WISHES]: "assets/ui/game_modes/wishes.png",
  [GameModification.SCRIBBLE]: "assets/ui/game_modes/scribble.png"
}

export function useGameModificationLabel(
  modification: GameModification,
  specialGameRule: SpecialGameRule | null
) {
  const { t } = useTranslation()
  return modification === GameModification.SCRIBBLE && specialGameRule
    ? t(`scribble.${specialGameRule}`)
    : t(`game_modification.${modification}`)
}

export function GameModificationBanner(props: {
  modification: GameModification
  specialGameRule: SpecialGameRule | null
}) {
  const { t } = useTranslation()
  const title = useGameModificationLabel(
    props.modification,
    props.specialGameRule
  )
  const description =
    props.modification === GameModification.SCRIBBLE
      ? props.specialGameRule
        ? addIconsToDescription(
            t(`scribble_description.${props.specialGameRule}`, {
              type: "(random Synergy)"
            })
          )
        : t("smeargle_scribble_hint")
      : t(`game_modification_description.${props.modification}`)

  return (
    <div
      className={`rule-banner my-box modification-${props.modification.toLowerCase()}`}
    >
      <img
        className="rule-banner-icon"
        src={GameModificationArt[props.modification]}
        alt=""
        aria-hidden="true"
      />
      <div className="rule-banner-text">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}
