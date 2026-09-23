import type Player from "../../models/colyseus-models/player"
import type { Pokemon } from "../../models/colyseus-models/pokemon"
import PokemonFactory from "../../models/pokemon-factory"
import type { IPlayer } from "../../types"
import type {
  DivergentEvolution,
  EvolutionRule
} from "../../types/EvolutionRules"
import { Ability } from "../../types/enum/Ability"
import { Awakening } from "../../types/enum/Awakening"
import { Stat } from "../../types/enum/Game"
import type { Pkm } from "../../types/enum/Pokemon"
import { sum } from "../../utils/array"
import { pickRandomIn } from "../../utils/random"

export abstract class EvolutionHandler<AdditionalArgs extends any[] = []> {
  abstract canEvolve(
    pokemon: Pokemon,
    player: Player,
    ...additionalArgs: AdditionalArgs
  ): boolean
  abstract evolve(
    pokemon: Pokemon,
    player: Player,
    ...additionalArgs: AdditionalArgs
  ): Pokemon
  divergentEvolution?: DivergentEvolution<AdditionalArgs>

  constructor(evolutionRule: EvolutionRule) {
    if (evolutionRule.divergentEvolution)
      this.divergentEvolution = evolutionRule.divergentEvolution
  }

  getEvolution(
    pokemon: Pokemon,
    player: IPlayer,
    ...additionalArgs: AdditionalArgs
  ): Pkm {
    if (this.divergentEvolution) {
      return this.divergentEvolution(pokemon, player, ...additionalArgs)
    }
    return pokemon.evolution
  }
}

export function carryOverPermanentStats(
  pokemonEvolved: Pokemon,
  pokemonsBeforeEvolution: Pokemon[]
) {
  // carry over the permanent stat buffs
  const permanentBuffStats = [
    "maxHP",
    "atk",
    "def",
    "speDef",
    "speed",
    "ap",
    "luck",
    "critChance",
    "critPower",
    "pp"
  ] as const
  const pkm = pokemonsBeforeEvolution[0].name
  const baseData = PokemonFactory.createPokemonFromName(pkm)
  for (const stat of permanentBuffStats) {
    const sumOfPermaStatsModifier = sum(
      pokemonsBeforeEvolution.map((p) => p[stat] - baseData[stat])
    )
    const statMapping: Record<typeof stat, Stat> = {
      maxHP: Stat.HP,
      atk: Stat.ATK,
      def: Stat.DEF,
      speDef: Stat.SPE_DEF,
      speed: Stat.SPEED,
      ap: Stat.AP,
      luck: Stat.LUCK,
      critChance: Stat.CRIT_CHANCE,
      critPower: Stat.CRIT_POWER,
      pp: Stat.PP
    }
    pokemonEvolved.applyStat(statMapping[stat], sumOfPermaStatsModifier) // can be negative or positive
  }

  // carry over TM
  const existingTms = pokemonsBeforeEvolution
    .map((p) => p.tm)
    .filter<Ability>((tm): tm is Ability => tm !== Ability.DEFAULT)
  if (existingTms.length > 0) {
    pokemonEvolved.tm = pickRandomIn(existingTms)
    if (pokemonEvolved.tm === Ability.SKILL_SWAP) {
      // keep the ability learnt with skill swap if there is one
      pokemonEvolved.skill =
        pokemonsBeforeEvolution.find((p) => p.tm === Ability.SKILL_SWAP)
          ?.skill ?? Ability.SKILL_SWAP
    } else {
      pokemonEvolved.skill = pokemonEvolved.tm
    }
    pokemonEvolved.maxPP = 100
  }

  // carry over the AWAKENING: a fully-awakened unit keeps its buff on the
  // evolved form; otherwise a mid-charge unit keeps its charge. First match wins.
  const awakenedBefore = pokemonsBeforeEvolution.find(
    (p) => p.awakening !== Awakening.NONE
  )
  const chargingBefore = pokemonsBeforeEvolution.find(
    (p) => p.awakeningRock !== ""
  )
  if (awakenedBefore) {
    pokemonEvolved.awakening = awakenedBefore.awakening
  } else if (chargingBefore) {
    pokemonEvolved.awakeningRock = chargingBefore.awakeningRock
    pokemonEvolved.awakeningCharge = chargingBefore.awakeningCharge
  }

  pokemonEvolved.trashToTreasureRounds = Math.max(
    ...pokemonsBeforeEvolution.map((pokemon) => pokemon.trashToTreasureRounds)
  )

  pokemonEvolved.silverSpoonRounds = Math.max(
    ...pokemonsBeforeEvolution.map((pokemon) => pokemon.silverSpoonRounds)
  )

  pokemonEvolved.motherYarnStages = Math.max(
    ...pokemonsBeforeEvolution.map((pokemon) => pokemon.motherYarnStages)
  )

  pokemonEvolved.honeyExplorationFriend = pokemonsBeforeEvolution.some(
    (pokemon) => pokemon.honeyExplorationFriend
  )

  pokemonEvolved.keptSynergies = [
    ...new Set(pokemonsBeforeEvolution.flatMap((pokemon) => pokemon.keptSynergies))
  ]
}
