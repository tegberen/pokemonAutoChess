import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { PlayerChoice } from "../../../../../models/colyseus-models/player-choice"
import type { BoosterCard as BoosterCardType } from "../../../../../types/Booster"
import { Emotion } from "../../../../../types/enum/Emotion"
import type { Pkm } from "../../../../../types/enum/Pokemon"
import { DEPTH } from "../../../game/depths"
import { pickChoice, rerollChoice } from "../../../network"
import { playSound, SOUNDS } from "../../utils/audio"
import { BoosterCard } from "../booster/booster-card"
import "../booster/booster.css"
import "./game-smeargle-pack.css"

export default function GameSmearglePack(props: {
  choice: PlayerChoice
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const cards: BoosterCardType[] = props.choice.pokemons.map((name, i) => ({
    name: name as Pkm,
    shiny: props.choice.shinies[i] ?? false,
    emotion: (props.choice.emotions[i] as Emotion) ?? Emotion.NORMAL,
    new: false
  }))

  // a reroll replaces the choice with a new id, so this component remounts and
  // the cards fly in / reset face-down automatically (like opening a new booster)
  const [flipped, setFlipped] = useState<boolean[]>(() =>
    new Array(cards.length).fill(false)
  )
  const allFlipped = flipped.length > 0 && flipped.every(Boolean)

  // one button, like the booster: reveal the current pack, then open the next one.
  // count = packs still openable: the current one while face-down + the reroll pack
  const packsLeft = (allFlipped ? 0 : 1) + (props.choice.canReroll ? 1 : 0)
  const onOpenClick = () => {
    playSound(SOUNDS.BUTTON_CLICK)
    if (!allFlipped) {
      setFlipped(new Array(cards.length).fill(true))
    } else if (props.choice.canReroll) {
      rerollChoice(props.choice.id)
    }
  }

  const handleCardClick = (index: number) => {
    if (!flipped[index]) {
      // first click reveals the card
      playSound(SOUNDS.BUTTON_CLICK)
      setFlipped((prev) => prev.with(index, true))
      return
    }
    if (props.disabled) return
    // clicking an already-revealed card picks it
    playSound(SOUNDS.BUTTON_CLICK)
    pickChoice(props.choice.id, index)
  }

  return (
    <div className="smeargle-pack-backdrop" style={{ zIndex: DEPTH.MODAL }}>
      <div className="smeargle-pack-page">
        <p className="help">
          {allFlipped
            ? t("player_choices.choose_starter")
            : t("player_choices.smeargle_pack_hint")}
        </p>
        <div className="boosters-content">
          {cards.map((card, i) => (
            <BoosterCard
              key={`${props.choice.id}-${i}`}
              card={card}
              flipped={flipped[i]}
              onFlip={() => handleCardClick(i)}
              hideReward
            />
          ))}
        </div>
        <div className="actions">
          <button
            className="bubbly blue active"
            onClick={onOpenClick}
            disabled={allFlipped && !props.choice.canReroll}
          >
            {t("player_choices.smeargle_pack_reveal")}
          </button>
          <span className="booster-count">{packsLeft}</span>
          <img src="/assets/ui/booster.png" alt="" />
        </div>
      </div>
    </div>
  )
}
