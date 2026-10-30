import type React from "react"
import { useTranslation } from "react-i18next"
import { RarityColor } from "../../../../../config"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import type { BoosterCard } from "../../../../../types/Booster"
import { PkmIndex } from "../../../../../types/enum/Pokemon"
import { cc } from "../../utils/jsx"
import PokemonPortrait from "../pokemon-portrait"
import "./booster-card.css"

interface BoosterCardProps {
  card: BoosterCard
  flipped: boolean
  onFlip: () => void
  // hide the collection-only "new" footer (e.g. in-game picks)
  hideReward?: boolean
}

export function BoosterCard({
  card,
  flipped,
  onFlip,
  hideReward
}: BoosterCardProps) {
  const { t } = useTranslation()
  const pokemonData = getPokemonData(card.name)
  const style = {
    "--rarity-color": RarityColor[pokemonData.rarity]
  } as React.CSSProperties
  return (
    <div
      className={cc(
        "booster-card",
        "rarity-" + pokemonData.rarity.toLowerCase(),
        { shiny: card.shiny || false, flipped }
      )}
      style={style}
      onClick={onFlip}
    >
      <div className="back">
        <img src="/assets/ui/pokecard.png" />
      </div>
      <div className={cc("front", { shimmer: card.shiny })}>
        <PokemonPortrait
          portrait={{
            index: PkmIndex[card.name],
            shiny: card.shiny,
            emotion: card.emotion
          }}
        />
        <div className="front-text">
          <p className="name">
            {t(`pkm.${card.name}`)}
            <br />{" "}
            <span style={{ fontWeight: "normal" }}>
              {t(`emotion.${card.emotion}`)}
            </span>
          </p>
          {!hideReward && card.new && <p className="new">{t("new")}</p>}
        </div>
      </div>
    </div>
  )
}
