import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { RarityColor } from "../../../../../config"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import {
  FOSSIL_RESTORATION_FIGHTS_PER_DISCOVERY,
  FossilUnlocks,
  GalarFossilRestorations
} from "../../../../../types/enum/FossilUnlock"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { addIconsToDescription } from "../../utils/descriptions"
import { FossilUnlockCondition } from "../game/fossil-unlock-condition"
import "./wiki-fossil-unlocks.css"

/* Reads the same FossilUnlocks table and locale keys the in-game menu uses, so
   the wiki cannot drift from the real conditions */
export function WikiFossilUnlocks() {
  const { t } = useTranslation()

  return (
    <section className="wiki-fossil-unlocks">
      <h3>{t("fossil_unlocks.title")}</h3>
      <p className="help">{t("fossil_unlocks.subtitle")}</p>
      <p className="wiki-fossil-entry">
        <img src="/assets/icons/FOSSIL_PIN_ICON.svg" alt="" />
        <span>
          {/* the locale string marks its emphasis with **...**, so translators
              keep control of which words are highlighted */}
          {t("fossil_unlocks.entry_requirement")
            .split("**")
            .map((part, index) =>
              index % 2 === 1 ? (
                <strong key={index}>{addIconsToDescription(part)}</strong>
              ) : (
                addIconsToDescription(part)
              )
            )}
        </span>
      </p>
      <ul>
        {FossilUnlocks.map((unlock) => {
          const pokemon = getPokemonData(unlock.pokemon)
          return (
            <li
              key={unlock.pokemon}
              style={
                { "--rarity-color": RarityColor[pokemon.rarity] } as CSSProperties
              }
            >
              <img
                src={getPortraitSrc(pokemon.index)}
                alt={t(`pkm.${unlock.pokemon}`)}
                data-tooltip-id="game-pokemon-detail-tooltip"
                data-tooltip-content={unlock.pokemon}
              />
              <div>
                <h4>
                  {t(`pkm.${unlock.pokemon}`)}
                  <em>{t(`rarity.${pokemon.rarity}`)}</em>
                </h4>
                <p>
                  <FossilUnlockCondition conditionKey={unlock.conditionKey} />
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* Reads GalarFossilRestorations, the same table the restoration bench resolves
   a pairing with, so the recipes cannot drift */
export function WikiFossilRestorations() {
  const { t } = useTranslation()

  return (
    <section className="wiki-fossil-unlocks wiki-fossil-restorations">
      <h3>{t("fossil_unlocks.restoration_title")}</h3>
      <p className="wiki-fossil-entry">
        {t("fossil_unlocks.restoration_source", {
          fights: FOSSIL_RESTORATION_FIGHTS_PER_DISCOVERY
        })
          .split("**")
          .map((part, index) =>
            index % 2 === 1 ? (
              <strong key={index}>{addIconsToDescription(part)}</strong>
            ) : (
              addIconsToDescription(part)
            )
          )}
      </p>
      <p className="wiki-fossil-capstone">
        {addIconsToDescription(t("fossil_unlocks.restoration_capstone"))}
      </p>
      <ul>
        {GalarFossilRestorations.map(({ fossils, pokemon }) => {
          const restored = getPokemonData(pokemon)
          return (
            <li
              key={pokemon}
              style={
                { "--rarity-color": RarityColor[restored.rarity] } as CSSProperties
              }
            >
              <span className="wiki-fossil-recipe">
                <img src={`assets/item/${fossils[0]}.webp`} alt={fossils[0]} />
                <b>+</b>
                <img src={`assets/item/${fossils[1]}.webp`} alt={fossils[1]} />
                <b>&rarr;</b>
              </span>
              <img
                src={getPortraitSrc(restored.index)}
                alt={t(`pkm.${pokemon}`)}
                data-tooltip-id="game-pokemon-detail-tooltip"
                data-tooltip-content={pokemon}
              />
              <h4>{t(`pkm.${pokemon}`)}</h4>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
