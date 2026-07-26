import type React from "react"
import { useTranslation } from "react-i18next"
import { isIn } from "../../../../../utils/array"
import { Item } from "../../../../../types/enum/Item"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { selectSpectatedPlayer, useAppSelector } from "../../../hooks"
import type { IBazaarOffer } from "../../../stores/GameStore"
import { cc } from "../../utils/jsx"
import { Money } from "../icons/money"
import { getCachedPortrait } from "./game-pokemon-portrait"

// Bazaar offer categories whose display key is a Pokémon (rendered as a portrait)
const BAZAAR_PKM_CATEGORIES = ["magikarp", "egg"]

export default function GameBazaarPortrait(props: {
  offer: IBazaarOffer
  click?: React.MouseEventHandler<HTMLDivElement>
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>
}) {
  const { t } = useTranslation()
  const { offer } = props
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const canBuy = !!spectatedPlayer?.alive && spectatedPlayer.money >= offer.price

  const isPkm = BAZAAR_PKM_CATEGORIES.includes(offer.category)
  const isRealItem = !isPkm && isIn(Object.values(Item), offer.item)
  const portraitSrc = isPkm
    ? getCachedPortrait(PkmIndex[offer.item as Pkm])
    : undefined

  // native-title fallback name for non-Item slots (Pokémon offers)
  const fallbackName = isPkm ? t(`pkm.${offer.item as Pkm}`) : offer.item

  return (
    <div
      className={cc(
        "my-box",
        "clickable",
        "game-pokemon-portrait",
        "game-bazaar-portrait",
        { disabled: !canBuy }
      )}
      style={isPkm ? { backgroundImage: `url("${portraitSrc}")` } : undefined}
      onClick={(e) => {
        if (canBuy && props.click) props.click(e)
      }}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      title={isRealItem ? undefined : fallbackName}
      data-tooltip-id={isRealItem ? "item-detail-tooltip" : undefined}
      data-tooltip-content={isRealItem ? offer.item : undefined}
    >
      {!isPkm && (
        <img
          className="game-bazaar-item-img"
          src={`assets/item/${offer.item}.png`}
          alt={fallbackName}
        />
      )}
      <div className="game-pokemon-portrait-cost">
        <Money value={offer.price} />
      </div>
    </div>
  )
}
