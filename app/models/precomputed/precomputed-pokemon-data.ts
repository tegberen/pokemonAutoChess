import { Ability } from "../../types/enum/Ability"
import { Rarity } from "../../types/enum/Game"
import { Passive } from "../../types/enum/Passive"
import { Pkm, PkmFamily, PkmIndex } from "../../types/enum/Pokemon"
import type { Synergy } from "../../types/enum/Synergy"
import type { IPokemonData } from "../../types/interfaces/PokemonData"
import { mapToObj } from "../../utils/map"
import { schemaValues } from "../../utils/schemas"
import { precomputedPokemons } from "./precomputed-pokemons"

console.time("precompute-pokemon-data")

const data = new Map<Pkm, Omit<IPokemonData, "name" | "index">>()

// highest star count in each family, worked out once up front so the loop
// below can look it up instead of searching the whole list for every pokemon
const maxStarsByFamily = new Map<Pkm, number>()
precomputedPokemons.forEach((pokemon) => {
  if (pokemon.skill === Ability.DEFAULT) return
  const family = PkmFamily[pokemon.name]
  const highest = maxStarsByFamily.get(family)
  if (highest === undefined || pokemon.stars > highest) {
    maxStarsByFamily.set(family, pokemon.stars)
  }
})

precomputedPokemons.forEach((pokemon) => {
  data.set(pokemon.name, {
    skill: pokemon.skill,
    passive: pokemon.passive,
    passive2: pokemon.passive2,
    stars: pokemon.stars,
    rarity: pokemon.rarity,
    additional: pokemon.additional,
    unlockable: pokemon.unlockable,
    regional: pokemon.regional,
    hp: pokemon.hp,
    pp: pokemon.maxPP,
    speed: pokemon.speed,
    range: pokemon.range,
    types: schemaValues(pokemon.types) as Synergy[],
    evolution: pokemon.evolution === Pkm.DEFAULT ? null : pokemon.evolution,
    evolutions: pokemon.evolutions,
    // -Infinity when nobody in the family has a skill yet, same as before
    stages:
      maxStarsByFamily.get(PkmFamily[pokemon.name]) ??
      Number.NEGATIVE_INFINITY
  })
})

export const PRECOMPUTED_POKEMONS_DATA = mapToObj(data) as {
  [pkm in Pkm]?: Omit<IPokemonData, "name" | "index">
}

export const PRECOMPUTED_REGIONAL_MONS: Pkm[] = Object.values(Pkm)
  .filter((p) => {
    const { regional, skill, passive } = getPokemonData(p)
    return regional && (skill !== Ability.DEFAULT || passive !== Passive.NONE)
  })
  .sort((a, b) => getPokemonData(a).stars - getPokemonData(b).stars)

console.timeEnd("precompute-pokemon-data")

export function getPokemonData(name: Pkm): IPokemonData {
  if (name in PRECOMPUTED_POKEMONS_DATA)
    return { name, index: PkmIndex[name], ...PRECOMPUTED_POKEMONS_DATA[name]! }
  //console.error(`Precomputed data not found for ${name}`)
  return {
    name: Pkm.DEFAULT,
    index: PkmIndex[Pkm.DEFAULT],
    additional: false,
    unlockable: false,
    regional: false,
    hp: 10,
    pp: 100,
    speed: 50,
    range: 1,
    rarity: Rarity.SPECIAL,
    stars: 1,
    stages: 1,
    skill: Ability.DEFAULT,
    passive: Passive.NONE,
    passive2: Passive.NONE,
    types: [],
    evolution: null,
    evolutions: []
  }
}

export function getRegularsTier1(pokemons: Pkm[]) {
  return pokemons.filter((p) => {
    const pokemonData = getPokemonData(p)
    return (
      pokemonData.stars === 1 &&
      pokemonData.skill !== Ability.DEFAULT &&
      !pokemonData.additional &&
      !pokemonData.unlockable &&
      !pokemonData.regional
    )
  })
}

export function getAdditionalsTier1(pokemons: Pkm[]) {
  return pokemons.filter((p) => {
    const pokemonData = getPokemonData(p)
    return (
      pokemonData.stars === 1 &&
      pokemonData.skill !== Ability.DEFAULT &&
      pokemonData.additional &&
      !pokemonData.regional
    )
  })
}
