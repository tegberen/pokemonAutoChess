import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { getKeyStoneCooldown } from "../../../../../core/mega-evolution"
import { precomputedPokemonsImplemented } from "../../../../../models/precomputed/precomputed-pokemons"
import { Item } from "../../../../../types/enum/Item"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { addIconsToDescription } from "../../utils/descriptions"
import { GamePokemonDetailTooltip } from "../game/game-pokemon-detail"
import "./wiki-mega-evolutions.css"

type MegaEvolution = { base: Pkm; mega: Pkm }

const MEGA_EVOLUTIONS: MegaEvolution[] = precomputedPokemonsImplemented
  .filter((pokemon) => pokemon.evolution.startsWith("MEGA_"))
  .filter(
    (pokemon, index, all) =>
      all.findIndex((other) => other.evolution === pokemon.evolution) === index
  )
  .map((pokemon) => ({ base: pokemon.name, mega: pokemon.evolution }))

const KEY_STONE_MEGAS = MEGA_EVOLUTIONS.filter(
  ({ mega }) => mega !== Pkm.MEGA_RAYQUAZA
)

const COOLDOWN_GROUPS = [
  ...new Set(KEY_STONE_MEGAS.map(({ mega }) => getKeyStoneCooldown(mega)))
]
  .sort((a, b) => a - b)
  .map((cooldown) => ({
    cooldown,
    megas: KEY_STONE_MEGAS.filter(
      ({ mega }) => getKeyStoneCooldown(mega) === cooldown
    )
  }))

// the forms reached by holding an orb, in every game
const ORB_EVOLUTIONS: { orb: Item; evolution: MegaEvolution }[] = [
  {
    orb: Item.GREEN_ORB,
    evolution: { base: Pkm.RAYQUAZA, mega: Pkm.MEGA_RAYQUAZA }
  },
  {
    orb: Item.RED_ORB,
    evolution: { base: Pkm.GROUDON, mega: Pkm.PRIMAL_GROUDON }
  },
  {
    orb: Item.BLUE_ORB,
    evolution: { base: Pkm.KYOGRE, mega: Pkm.PRIMAL_KYOGRE }
  }
]

function Portrait({ pkm }: { pkm: Pkm }) {
  const { t } = useTranslation()
  return (
    <img
      src={getPortraitSrc(PkmIndex[pkm])}
      alt={t(`pkm.${pkm}`)}
      width={40}
      height={40}
      data-tooltip-id="game-pokemon-detail-tooltip"
      data-tooltip-content={pkm}
    />
  )
}

function MegaGroup({
  label,
  megas
}: {
  label: ReactNode
  megas: MegaEvolution[]
}) {
  return (
    <div className="wiki-mega-evolutions-group">
      <h3>{label}</h3>
      <ul>
        {megas.map(({ base, mega }) => (
          <li key={mega} className="wiki-mega-evolutions-pair">
            <Portrait pkm={base} />
            <span aria-hidden="true">→</span>
            <Portrait pkm={mega} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function WikiMegaEvolutions() {
  const { t: tBase } = useTranslation()
  const t = tBase as any
  return (
    <section className="my-box wiki-mega-evolutions">
      <h2>{t("wiki.mega.title")}</h2>
      <p>{addIconsToDescription(t("wiki.mega.intro"))}</p>
      {COOLDOWN_GROUPS.map(({ cooldown, megas }) => (
        <MegaGroup
          key={cooldown}
          label={
            <span
              className="wiki-mega-evolutions-cooldown"
              title={t("wiki.mega.cooldown", { count: cooldown })}
            >
              <img
                src="assets/icons/STOPWATCH_ICON.svg"
                alt={t("wiki.mega.cooldown", { count: cooldown })}
                width={20}
                height={20}
              />
              {cooldown}
            </span>
          }
          megas={megas}
        />
      ))}
      {ORB_EVOLUTIONS.map(({ orb, evolution }) => (
        <MegaGroup
          key={orb}
          label={addIconsToDescription(orb)}
          megas={[evolution]}
        />
      ))}
      <GamePokemonDetailTooltip origin="wiki" />
    </section>
  )
}
