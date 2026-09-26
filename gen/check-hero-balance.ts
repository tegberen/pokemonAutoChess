import { readFileSync } from "node:fs"
import path from "node:path"
import { Blessings } from "../app/config/game/blessings"
import { getPokemonData } from "../app/models/precomputed/precomputed-pokemon-data"
import {
  Blessing,
  BlessingTier,
  HERO_BLESSING_EXTRA_SYNERGIES,
  HERO_BLESSING_FAMILY,
  HERO_BLESSING_GIFT,
  HERO_BLESSING_POKEMON
} from "../app/types/enum/Blessing"
import { Rarity } from "../app/types/enum/Game"
import { Pkm, PkmFamily } from "../app/types/enum/Pokemon"
import { Synergy } from "../app/types/enum/Synergy"

// Counts hero Wishes per synergy and rarity, one table per tier plus a total,
// to see which categories still lack a hero.
//
// A hero Wish is what the game's isHeroBlessing treats as one: it gifts a
// Pokémon or lists hero Pokémon. Each hero Pokémon counts once in every
// synergy its line has at any evolution stage plus the synergies the Wish
// adds, under the rarity of the line's base form. A Wish with two hero
// Pokémon (Trash to Treasure) counts once per Pokémon.
//
// npm run check-hero-balance

const TRANSLATION_FILE = path.resolve(
  __dirname,
  "../app/public/dist/client/locales/en/translation.json"
)
const RARITY_COLUMNS = [
  Rarity.COMMON,
  Rarity.UNCOMMON,
  Rarity.RARE,
  Rarity.EPIC,
  Rarity.ULTRA,
  Rarity.HATCH
]
// synergies a Wish adds only count where the hero really plays that synergy
const COUNTED_WISH_SYNERGIES: { [blessing in Blessing]?: Synergy[] } = {
  [Blessing.TRASH_TO_TREASURE]: [Synergy.GRASS],
  [Blessing.INFINITE_CONVERSION]: [Synergy.AMORPHOUS]
}
// Flora Wishes that champion one summoned flower without gifting it, counted
// as a hero of that flower's line
const PSEUDO_HERO_FAMILY: { [blessing in Blessing]?: Pkm } = {
  [Blessing.MEGA_SOL]: Pkm.CHIKORITA,
  [Blessing.DOUBLE_WINDFALL]: Pkm.HOPPIP,
  [Blessing.FLYTRAP]: Pkm.BELLSPROUT,
  [Blessing.SPORE_CLOUDS]: Pkm.ODDISH,
  [Blessing.BLOSSOM_FESTIVAL]: Pkm.BELLOSSOM
}
// a synergy at or under these totals is flagged as short on heroes
const LOW_TOTAL_PER_TIER = 1
const LOW_TOTAL_ALL_TIERS = 4

type Hero = {
  blessing: Blessing
  name: string
  tier: BlessingTier
  family: Pkm
  rarity: string
  synergies: Synergy[]
  baseSynergies: Synergy[]
  synergiesFromEvolving: Synergy[]
  synergiesFromWish: Synergy[]
}

const wishNames = JSON.parse(readFileSync(TRANSLATION_FILE, "utf8")).blessing

// follows the single evolution line; a branching evolution (Vivillon's patterns)
// ends the walk, or every pattern's synergy would count as the hero's
function synergiesOfFamily(family: Pkm): Synergy[] {
  const synergies = new Set<Synergy>()
  // some lines loop back on themselves (form changes), so each stage is read once
  const visited = new Set<Pkm>()
  let stage: Pkm | null = family
  while (stage && !visited.has(stage)) {
    visited.add(stage)
    const data = getPokemonData(stage)
    data.types.forEach((type) => synergies.add(type))
    stage =
      data.evolution ??
      (data.evolutions.length === 1 ? data.evolutions[0] : null)
  }
  return [...synergies]
}

// getHeroBlessingPokemon in config/game/blessings.ts, plus pseudo heroes and
// heroes known only by their family
function heroPokemonOf(blessing: Blessing): Pkm[] {
  const pseudoHero = PSEUDO_HERO_FAMILY[blessing]
  if (pseudoHero !== undefined) return [pseudoHero]
  const gift = HERO_BLESSING_GIFT[blessing]
  if (gift !== undefined) return [gift]
  const listedHeroes = HERO_BLESSING_POKEMON[blessing]
  if (listedHeroes) return listedHeroes
  // a hero that gifts nothing (Aurora Borealis) is only named by its family
  const family = HERO_BLESSING_FAMILY[blessing]
  return family !== undefined ? [family] : []
}

const heroes: Hero[] = Object.values(Blessing).flatMap((blessing) => {
  const heroPokemon = heroPokemonOf(blessing)
  const wishName = wishNames?.[blessing]?.name ?? blessing
  return heroPokemon.map((pokemon) => {
    // the family table wins for single heroes: alt forms like Flabébé are
    // their own family in PkmFamily
    const family =
      heroPokemon.length === 1
        ? (HERO_BLESSING_FAMILY[blessing] ?? PkmFamily[pokemon])
        : PkmFamily[pokemon]
    const baseData = getPokemonData(family)
    const baseSynergies = [...baseData.types]
    const lineSynergies = synergiesOfFamily(family)
    const countedWishSynergies = (
      HERO_BLESSING_EXTRA_SYNERGIES[blessing] ?? []
    ).filter(
      (synergy) =>
        !lineSynergies.includes(synergy) &&
        COUNTED_WISH_SYNERGIES[blessing]?.includes(synergy)
    )
    const synergies = new Set([...lineSynergies, ...countedWishSynergies])
    return {
      blessing,
      name:
        heroPokemon.length === 1 ? wishName : `${wishName} (${family})`,
      tier: Blessings[blessing].tier,
      family,
      rarity: baseData.rarity,
      synergies: [...synergies],
      baseSynergies,
      synergiesFromEvolving: lineSynergies.filter(
        (synergy) => !baseSynergies.includes(synergy)
      ),
      synergiesFromWish: countedWishSynergies
    }
  })
})

// rarities outside the shop ones (Wishiwashi is SPECIAL) get a column of their own
const columns = [
  ...RARITY_COLUMNS,
  ...new Set(
    heroes
      .map((hero) => hero.rarity)
      .filter((rarity) => !RARITY_COLUMNS.includes(rarity as Rarity))
  )
]

const RED = "\x1b[31m"
const GREEN = "\x1b[32m"
const DIM = "\x1b[2m"
const BOLD = "\x1b[1m"
const RESET = "\x1b[0m"
const SYNERGY_WIDTH = 12
const COUNT_WIDTH = 9

function printTable(title: string, tierHeroes: Hero[], lowTotal: number) {
  const header = [
    "SYNERGY".padEnd(SYNERGY_WIDTH),
    ...columns.map((column) => column.padStart(COUNT_WIDTH)),
    "TOTAL".padStart(COUNT_WIDTH)
  ].join("")
  console.log(`\n${BOLD}${title}${RESET} (${tierHeroes.length} heroes)`)
  console.log(BOLD + header + RESET)

  const needsWork: { synergy: Synergy; heroCount: number }[] = []
  for (const synergy of Object.values(Synergy)) {
    const withSynergy = tierHeroes.filter((hero) =>
      hero.synergies.includes(synergy)
    )
    const counts = columns.map((column) => {
      const count = withSynergy.filter((hero) => hero.rarity === column).length
      return count > 0
        ? String(count).padStart(COUNT_WIDTH)
        : DIM + "·".padStart(COUNT_WIDTH) + RESET
    })
    const isLow = withSynergy.length <= lowTotal
    if (isLow) needsWork.push({ synergy, heroCount: withSynergy.length })
    const color = isLow ? RED : GREEN
    console.log(
      color +
        synergy.padEnd(SYNERGY_WIDTH) +
        RESET +
        counts.join("") +
        color +
        BOLD +
        String(withSynergy.length).padStart(COUNT_WIDTH) +
        (isLow ? "  !" : "") +
        RESET
    )
  }
  // distinct heroes, not the column sum: a hero is listed under each of its synergies
  const heroesPerRarity = columns.map((column) =>
    String(
      tierHeroes.filter((hero) => hero.rarity === column).length
    ).padStart(COUNT_WIDTH)
  )
  console.log(
    BOLD +
      "HEROES".padEnd(SYNERGY_WIDTH) +
      heroesPerRarity.join("") +
      String(tierHeroes.length).padStart(COUNT_WIDTH) +
      RESET
  )
  const synergySlotsPerRarity = columns.map((column) =>
    tierHeroes
      .filter((hero) => hero.rarity === column)
      .reduce((sum, hero) => sum + hero.synergies.length, 0)
  )
  console.log(
    BOLD +
      "SUM".padEnd(SYNERGY_WIDTH) +
      synergySlotsPerRarity
        .map((sum) => String(sum).padStart(COUNT_WIDTH))
        .join("") +
      String(synergySlotsPerRarity.reduce((a, b) => a + b, 0)).padStart(
        COUNT_WIDTH
      ) +
      RESET
  )
  if (needsWork.length === 0) {
    console.log(`${GREEN}Every synergy is covered${RESET}`)
    return
  }
  console.log(`${RED}${BOLD}Needs work, most urgent first:${RESET}`)
  for (let heroCount = 0; heroCount <= lowTotal; heroCount++) {
    const synergiesAtCount = needsWork
      .filter((entry) => entry.heroCount === heroCount)
      .map((entry) => entry.synergy)
    if (synergiesAtCount.length === 0) continue
    const label = `${heroCount} hero${heroCount === 1 ? "" : "es"}`
    console.log(`${RED}  ${label.padEnd(10)}${synergiesAtCount.join(", ")}${RESET}`)
  }
}

for (const tier of Object.values(BlessingTier)) {
  printTable(
    tier,
    heroes.filter((hero) => hero.tier === tier),
    LOW_TOTAL_PER_TIER
  )
}
printTable("ALL", heroes, LOW_TOTAL_ALL_TIERS)

console.log("\nHeroes counted")
console.table(
  [...heroes]
    .sort((a, b) => a.tier.localeCompare(b.tier) || a.name.localeCompare(b.name))
    .map((hero) => ({
      tier: hero.tier,
      wish: hero.name,
      family: hero.family,
      rarity: hero.rarity,
      synergies: hero.synergies.join(", ")
    }))
)

// the synergies a hero is counted in that its base Pokémon does not show,
// so the tables can be read knowing where each count comes from
const heroesWithBorrowedSynergies = heroes.filter(
  (hero) =>
    hero.synergiesFromEvolving.length > 0 || hero.synergiesFromWish.length > 0
)
console.log(
  `\n${BOLD}Counted in synergies the base Pokémon does not have${RESET} (${heroesWithBorrowedSynergies.length} heroes)`
)
const WISH_WIDTH = 30
const FAMILY_WIDTH = 16
const BASE_WIDTH = 26
const EVOLVING_WIDTH = 30
console.log(
  BOLD +
    "WISH".padEnd(WISH_WIDTH) +
    "FAMILY".padEnd(FAMILY_WIDTH) +
    "BASE".padEnd(BASE_WIDTH) +
    "+ EVOLVING".padEnd(EVOLVING_WIDTH) +
    "+ WISH" +
    RESET
)
for (const hero of [...heroesWithBorrowedSynergies].sort(
  (a, b) => a.tier.localeCompare(b.tier) || a.name.localeCompare(b.name)
)) {
  console.log(
    hero.name.padEnd(WISH_WIDTH) +
      hero.family.padEnd(FAMILY_WIDTH) +
      DIM +
      hero.baseSynergies.join(", ").padEnd(BASE_WIDTH) +
      RESET +
      hero.synergiesFromEvolving.join(", ").padEnd(EVOLVING_WIDTH) +
      RED +
      hero.synergiesFromWish.join(", ") +
      RESET
  )
}
