import { useTranslation } from "react-i18next"
import type { SynergyTier } from "../../../../../config/game/synergies"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { GalarFossilRestorations } from "../../../../../types/enum/FossilUnlock"
import { type Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import "./synergy-tier-description.css"

export function SynergyTierDescription(props: { tier: SynergyTier }) {
  const { t } = useTranslation()
  const description = t(`effect_description.${props.tier}`)
  return (
    <p className="synergy-description" style={{ whiteSpace: "pre-line" }}>
      {addIconsToDescription(description)}
    </p>
  )
}

// shown under the FOSSIL (8) tier: the capstone is whichever Pokemon is
// restored, so each recipe comes with the passive it grants. restoredPokemon
// is the player's current restoration in game, highlighted; the wiki leaves it
// out and shows every recipe alike
export function FossilRestorationList(props: { restoredPokemon?: Pkm | "" }) {
  const { t } = useTranslation()
  return (
    <ul className="fossil-restoration-list">
      {GalarFossilRestorations.map(({ fossils, pokemon }) => (
        <li
          key={pokemon}
          className={cc({
            active: props.restoredPokemon === pokemon,
            inactive: !!props.restoredPokemon && props.restoredPokemon !== pokemon
          })}
        >
          <span className="fossil-restoration-recipe" aria-hidden="true">
            <img src={`assets/item/${fossils[0]}.webp`} alt="" />
            <span className="fossil-restoration-joiner">+</span>
            <img src={`assets/item/${fossils[1]}.webp`} alt="" />
            <span className="fossil-restoration-joiner">=</span>
          </span>
          <img
            className="fossil-restoration-portrait"
            src={getPortraitSrc(PkmIndex[pokemon])}
            alt={t(`pkm.${pokemon}`)}
            title={t(`pkm.${pokemon}`)}
            width={32}
            height={32}
          />
          <span className="fossil-restoration-effect">
            {addIconsToDescription(
              t(`passive_description.${getPokemonData(pokemon).passive}`, {
                defaultValue: ""
              })
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
