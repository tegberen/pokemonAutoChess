import {
  BoosterRarityProbability,
  EmotionCost,
  getAltFormForPlayer,
  PkmsWithAltForms
} from "../config"
import type Player from "../models/colyseus-models/player"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import PokemonFactory from "../models/pokemon-factory"
import { getAvailableEmotions } from "../models/precomputed/precomputed-emotions"
import { getPokemonData, getRegularsTier1 } from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../models/precomputed/precomputed-rarity"
import { PokemonAnimations } from "../public/src/game/components/pokemon-animations"
import type GameState from "../rooms/states/game-state"
import { Ability } from "../types/enum/Ability"
import { Emotion } from "../types/enum/Emotion"
import { Rarity } from "../types/enum/Game"
import { Pkm, PkmFamily, PkmIndex, PkmRegionalVariants, Unowns } from "../types/enum/Pokemon"
import { getPokemonCustomFromAvatar } from "../utils/avatar"
import { getFirstAvailablePositionInBench } from "../utils/board"
import { min } from "../utils/number"
import { chance, pickRandomIn, randomWeighted, simpleHashSeededCoinFlip } from "../utils/random"
import { getUnitPowerScore } from "./bot-logic"
import { createRandomEgg } from "./eggs"

export function spawnDIAYAvatar(player: Player): Pokemon {
  const {
    name,
    emotion,
    shiny = false
  } = getPokemonCustomFromAvatar(player.avatar)
  player.firstPartner = name
  let powerScore = getUnitPowerScore(name)

  switch (player.firstPartner) {
    case Pkm.AEGISLASH_BLADE:
      player.firstPartner = Pkm.AEGISLASH
      break

    case Pkm.HOOPA_UNBOUND:
      player.firstPartner = Pkm.HOOPA
      break

    case Pkm.MINIOR_KERNEL_BLUE:
    case Pkm.MINIOR_KERNEL_GREEN:
    case Pkm.MINIOR_KERNEL_ORANGE:
    case Pkm.MINIOR_KERNEL_RED:
      player.firstPartner = Pkm.MINIOR
      break

    case Pkm.MORPEKO_HANGRY:
      player.firstPartner = Pkm.MORPEKO
      break

    case Pkm.DARMANITAN_ZEN:
      player.firstPartner = Pkm.DARMANITAN
      break

    case Pkm.COSMOG:
    case Pkm.POIPOLE:
    case Pkm.CHIMECHO:
    case Pkm.GIMMIGHOUL:
      powerScore = 5
      break

    case Pkm.COSMOEM:
      powerScore = 6
      break

    case Pkm.NAGANADEL:
    case Pkm.GHOLDENGO:
      powerScore = 8
      break
  }

  let avatar: Pokemon
  if (player.firstPartner === Pkm.EGG) {
    avatar = createRandomEgg(player, false)
    powerScore = 5
  } else {
    avatar = PokemonFactory.createPokemonFromName(player.firstPartner, {
      emotion,
      shiny
    })
  }

  avatar.positionX = getFirstAvailablePositionInBench(player.board) ?? 0
  avatar.positionY = 0

  applyScribbleStarterStats(avatar, player, powerScore)
  return avatar
}

export function applyScribbleStarterStats(
  avatar: Pokemon,
  player: Player,
  powerScore: number
) {
  if (avatar.name === Pkm.EGG) {
    powerScore = 5
    if (avatar.shiny) {
      player.money = 1
    }
  }
  if (avatar.rarity === Rarity.HATCH) {
    powerScore = [4, 5, 6][avatar.stars] ?? 6
  }
  if (avatar.rarity === Rarity.SPECIAL) {
    powerScore = [1, 3, 7, 7][avatar.stars - 1] ?? 7
  }
  if (powerScore < 5) {
    player.money += 55 - Math.round(10 * powerScore)
  } else {
    avatar.ap = min(-100)(avatar.ap - (powerScore - 5) * 10)
    avatar.addAttack(-Math.round(avatar.atk * (powerScore - 5) * 0.1))
  }
  const bonusHP = Math.round(150 - powerScore * 30)
  avatar.maxHP = min(10)(avatar.maxHP + bonusHP)
  avatar.hp = avatar.maxHP
}

export function getScribbleStarterPowerScore(name: Pkm): number {
  let powerScore = getUnitPowerScore(name)
  switch (name) {
    case Pkm.COSMOG:
    case Pkm.POIPOLE:
    case Pkm.CHIMECHO:
    case Pkm.GIMMIGHOUL:
      powerScore = 5
      break
    case Pkm.COSMOEM:
      powerScore = 6
      break
    case Pkm.NAGANADEL:
    case Pkm.GHOLDENGO:
      powerScore = 8
      break
  }
  return powerScore
}

export const SMEARGLE_PACK_SIZE = 10

export type SmearglePackCard = {
  name: Pkm
  shiny: boolean
  emotion: Emotion
}

export function createSmearglePackPropositions(
  player: Player,
  size = SMEARGLE_PACK_SIZE
): SmearglePackCard[] {
  const propositions: SmearglePackCard[] = []
  const families = new Set<Pkm>()
  let attempts = 0
  const maxAttempts = size * 30

  while (propositions.length < size && attempts < maxAttempts) {
    attempts++
    const rarity =
      randomWeighted<Rarity>(BoosterRarityProbability) ?? Rarity.COMMON
    const candidates = (PRECOMPUTED_POKEMONS_PER_RARITY[rarity] ?? [])
      .map((p) => PkmFamily[p]) // normalize to the tier-1 base of the family
      .filter(
        (base) =>
          getPokemonData(base).skill !== Ability.DEFAULT &&
          Unowns.includes(base) === false &&
          families.has(base) === false
      )
    if (candidates.length === 0) continue

    let pkm = pickRandomIn(candidates)
    if (pkm in PkmRegionalVariants) {
      const regionalVariants = PkmRegionalVariants[pkm]!.filter((p) =>
        player.regionalPokemons.includes(p)
      )
      if (regionalVariants.length > 0) pkm = pickRandomIn(regionalVariants)
    }
    if (PkmsWithAltForms.includes(pkm)) {
      pkm = getAltFormForPlayer(pkm, player)
    }

    const family = PkmFamily[pkm]
    if (families.has(family)) continue
    families.add(family)

    // shiny + emotion picked exactly like a real collection booster card
    const shiny =
      chance(0.05) && PokemonAnimations[pkm]?.shinyUnavailable !== true
    const availableEmotions = getAvailableEmotions(PkmIndex[pkm], shiny)
    const emotion =
      randomWeighted<Emotion>(
        availableEmotions.reduce(
          (o, e) => ({ ...o, [e]: 1 / EmotionCost[e] }),
          {}
        )
      ) ?? Emotion.NORMAL

    propositions.push({ name: pkm, shiny, emotion })
  }

  return propositions
}

export function pickFirstPartners(player: Player, state: GameState): Pkm[] {
  const rarities = [Rarity.COMMON, Rarity.UNCOMMON, Rarity.RARE, Rarity.EPIC]
  const hash = Array.from(state.preparationId).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  )
  const rarityIndex = hash % 4
  const rarityPartner = rarities[rarityIndex]
  return getRegularsTier1(PRECOMPUTED_POKEMONS_PER_RARITY[rarityPartner])
    .filter((p) => getPokemonData(p).stages === 3)
    .map((pkm) => {
      if (pkm in PkmRegionalVariants) {
        const regionalVariants = PkmRegionalVariants[pkm]!.filter((p) =>
          player.regionalPokemons.includes(p)
        )
        if (regionalVariants.length > 0) pkm = pickRandomIn(regionalVariants)
      }
      if (PkmsWithAltForms.includes(pkm)) {
        pkm = getAltFormForPlayer(pkm, player)
      }
      return pkm
    })
}
