import { ScribbleShapeType } from "../config/game/scribble-shapes"
import type Player from "../models/colyseus-models/player"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import PokemonFactory from "../models/pokemon-factory"
import { precomputedPokemonsImplemented } from "../models/precomputed/precomputed-pokemons"
import { Rarity } from "../types/enum/Game"
import { Item } from "../types/enum/Item"
import type { Pkm } from "../types/enum/Pokemon"
import { pickRandomIn } from "../utils/random"

const SCRIBBLE_QUIZ_STATS = {
  ATK: (pokemon: Pokemon) => pokemon.atk,
  DEF: (pokemon: Pokemon) => pokemon.def,
  SPE_DEF: (pokemon: Pokemon) => pokemon.speDef,
  HP: (pokemon: Pokemon) => pokemon.hp,
  SPEED: (pokemon: Pokemon) => pokemon.speed,
  RANGE: (pokemon: Pokemon) => pokemon.range,
  PP: (pokemon: Pokemon) => pokemon.maxPP
} as const

export type ScribbleQuizStat = keyof typeof SCRIBBLE_QUIZ_STATS

const QUIZ_RARITIES: Rarity[] = [
  Rarity.COMMON,
  Rarity.UNCOMMON,
  Rarity.RARE,
  Rarity.EPIC,
  Rarity.ULTRA,
  Rarity.UNIQUE,
  Rarity.LEGENDARY
]

const QUIZ_CANDIDATES = precomputedPokemonsImplemented
  .filter((pokemon) => QUIZ_RARITIES.includes(pokemon.rarity))
  .map((pokemon) => pokemon.name)

function getQuizStatValue(pkm: Pkm, stat: ScribbleQuizStat): number {
  return SCRIBBLE_QUIZ_STATS[stat](PokemonFactory.createPokemonFromName(pkm))
}

const QUIZ_MAX_ROLLS = 50
export const SCRIBBLE_QUIZ_FEEDBACK_DURATION = 1500
const SCRIBBLE_QUIZ_COMPLETION_GOLD_BOWS = 3

// rerolled until the two differ, so the question never has a tie
export function rollScribbleQuiz(): { pokemons: Pkm[]; stat: ScribbleQuizStat } {
  for (let roll = 0; roll < QUIZ_MAX_ROLLS; roll++) {
    const stat = pickRandomIn(
      Object.keys(SCRIBBLE_QUIZ_STATS) as ScribbleQuizStat[]
    )
    const first = pickRandomIn(QUIZ_CANDIDATES)
    const second = pickRandomIn(QUIZ_CANDIDATES)
    if (
      first !== second &&
      getQuizStatValue(first, stat) !== getQuizStatValue(second, stat)
    ) {
      return { pokemons: [first, second], stat }
    }
  }
  return { pokemons: [QUIZ_CANDIDATES[0], QUIZ_CANDIDATES[1]], stat: "HP" }
}

export function getScribbleQuizValues(pokemons: Pkm[], stat: string): number[] {
  if (!(stat in SCRIBBLE_QUIZ_STATS)) return []
  return pokemons.map((pkm) => getQuizStatValue(pkm, stat as ScribbleQuizStat))
}

export function isScribbleQuizAnswerCorrect(
  values: number[],
  answerIndex: number
): boolean {
  if (values.length !== 2) return false
  const winnerIndex = values[0] > values[1] ? 0 : 1
  return answerIndex === winnerIndex
}

export function grantRandomScribbleShape(
  player: Player
): ScribbleShapeType | null {
  const missing = Object.values(ScribbleShapeType).filter(
    (shapeType) => !player.scribbleShapesCollected.includes(shapeType)
  )
  if (missing.length === 0) return null
  const shapeType = pickRandomIn(missing)
  player.scribbleShapesCollected.push(shapeType)
  if (missing.length === 1) {
    for (let i = 0; i < SCRIBBLE_QUIZ_COMPLETION_GOLD_BOWS; i++) {
      player.items.push(Item.GOLD_BOW)
    }
  }
  return shapeType
}
