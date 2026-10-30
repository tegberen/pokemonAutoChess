import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { PlayerChoice } from "../../../../../models/colyseus-models/player-choice"
import { Emotion } from "../../../../../types/enum/Emotion"
import type { Pkm } from "../../../../../types/enum/Pokemon"
import { DEPTH } from "../../../game/depths"
import { pickChoice, rerollChoice } from "../../../network"
import { playSound, SOUNDS } from "../../utils/audio"
import SeasonCard from "../season/season-card"
import "../season/season.css"
import "./game-smeargle-pack.css"

const REVEAL_ALL_STAGGER_MS = 60

export default function GameSmearglePack(props: {
  choice: PlayerChoice
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const cards = props.choice.pokemons.map((name, i) => ({
    name: name as Pkm,
    emotion: (props.choice.emotions[i] as Emotion) ?? Emotion.NORMAL
  }))

  // a reroll replaces the choice with a new id, so this component remounts and
  // the cards deal in face down again, like opening a new booster
  const [flipped, setFlipped] = useState<boolean[]>(() =>
    new Array(cards.length).fill(false)
  )
  const [flipDelays, setFlipDelays] = useState<number[]>(() =>
    new Array(cards.length).fill(0)
  )
  const allFlipped = flipped.length > 0 && flipped.every(Boolean)

  // one button, like the booster: reveal the current pack, then open the next.
  // count = packs still openable: the current one while face down + the reroll
  const packsLeft = (allFlipped ? 0 : 1) + (props.choice.canReroll ? 1 : 0)
  const onOpenClick = () => {
    playSound(SOUNDS.BUTTON_CLICK)
    if (!allFlipped) {
      // the cards still face down turn one after another, left to right
      let order = 0
      setFlipDelays(
        flipped.map((isFlipped) =>
          isFlipped ? 0 : order++ * REVEAL_ALL_STAGGER_MS
        )
      )
      setFlipped(new Array(cards.length).fill(true))
    } else if (props.choice.canReroll) {
      rerollChoice(props.choice.id)
    }
  }

  const handleCardClick = (index: number) => {
    playSound(SOUNDS.BUTTON_CLICK)
    if (!flipped[index]) {
      setFlipDelays((previous) => previous.with(index, 0))
      setFlipped((previous) => previous.with(index, true))
      return
    }
    if (props.disabled) return
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
        <div className="season-booster-reveal smeargle-pack-cards">
          {cards.map((card, i) => (
            <SeasonCard
              key={`${props.choice.id}-${i}`}
              pokemon={card.name}
              emotion={card.emotion}
              isFaceUp={flipped[i]}
              flipDelayMs={flipDelays[i]}
              synergyIconSize="22px"
              style={{ animationDelay: `${i * REVEAL_ALL_STAGGER_MS}ms` }}
              onClick={() => handleCardClick(i)}
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
