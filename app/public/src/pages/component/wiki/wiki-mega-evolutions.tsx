import { useTranslation } from "react-i18next"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { precomputedPokemonsImplemented } from "../../../../../models/precomputed/precomputed-pokemons"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { MEGA_STACK_PASSIVES } from "../../../../../types/enum/SpecialGameRule"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { addIconsToDescription } from "../../utils/descriptions"
import { GamePokemonDetailTooltip } from "../game/game-pokemon-detail"
import "./wiki-mega-evolutions.css"

// Rayquaza's passive is about Primal forms, so its Green Orb is written out
const MEGA_CONDITION_OVERRIDES: Partial<Record<Pkm, string>> = {
  [Pkm.RAYQUAZA]: "wiki.mega.conditions.RAYQUAZA"
}

function getMegaConditionKey(base: Pkm) {
  const override = MEGA_CONDITION_OVERRIDES[base]
  if (override) return override
  const { passive, passive2 } = getPokemonData(base)
  const megaPassive = MEGA_STACK_PASSIVES.includes(passive2)
    ? passive2
    : passive
  return `passive_description.${megaPassive}`
}

const MEGA_EVOLUTIONS = precomputedPokemonsImplemented
  .filter((pokemon) => pokemon.evolution.startsWith("MEGA_"))
  .filter(
    (pokemon, index, all) =>
      all.findIndex((other) => other.evolution === pokemon.evolution) === index
  )
  .map((pokemon) => ({ base: pokemon.name, mega: pokemon.evolution }))

function Portrait({ pkm }: { pkm: Pkm }) {
  const { t } = useTranslation()
  return (
    <img
      src={getPortraitSrc(PkmIndex[pkm])}
      alt={t(`pkm.${pkm}`)}
      title={t(`pkm.${pkm}`)}
      width={40}
      height={40}
      data-tooltip-id="game-pokemon-detail-tooltip"
      data-tooltip-content={pkm}
    />
  )
}

export default function WikiMegaEvolutions() {
  const { t: tBase } = useTranslation()
  const t = tBase as any
  return (
    <section className="my-box wiki-mega-evolutions">
      <h2>{t("wiki.mega.title")}</h2>
      <p>{addIconsToDescription(t("wiki.mega.intro"))}</p>
      <table>
        <thead>
          <tr>
            <th>{t("wiki.mega.pokemon")}</th>
            <th>{t("wiki.mega.condition")}</th>
          </tr>
        </thead>
        <tbody>
          {MEGA_EVOLUTIONS.map(({ base, mega }) => (
            <tr key={mega}>
              <th scope="row">
                <span className="wiki-mega-evolutions-pair">
                  <Portrait pkm={base} />
                  <span aria-hidden="true">→</span>
                  <Portrait pkm={mega} />
                  {t(`pkm.${mega}`)}
                </span>
              </th>
              <td>
                {addIconsToDescription(t(getMegaConditionKey(base)))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <GamePokemonDetailTooltip origin="wiki" />
    </section>
  )
}
