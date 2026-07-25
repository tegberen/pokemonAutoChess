import {
  BoosterRarityProbability,
  EmotionCost,
  getAltFormForPlayer,
  PkmsWithAltForms
} from "../config"
import type Player from "../models/colyseus-models/player"
import { type Pokemon, PokemonClasses } from "../models/colyseus-models/pokemon"
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

// Per-family AP adjustments to the whole line
export const SCRIBBLE_STARTER_AP_OVERRIDES: Partial<Record<Pkm, number>> = {
  [Pkm.HOUNDOUR]: -50,
  [Pkm.SHUPPET]: -50
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
    powerScore = [4, 5, 6][avatar.stars - 1] ?? 6
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

  const apOverride = SCRIBBLE_STARTER_AP_OVERRIDES[PkmFamily[avatar.name]]
  if (apOverride) {
    avatar.addAbilityPower(apOverride)
  }
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

// JUGGERNAUT: pick a fully-evolved champion from one shared rarity (stats
// normalized), grow it by feeding 1-star copies of itself.
export const JuggernautRarities = [
  Rarity.COMMON,
  Rarity.UNCOMMON,
  Rarity.RARE,
  Rarity.EPIC,
  Rarity.ULTRA
]

export const JUGGERNAUT_CHANCE = 1 / 40
export const JuggernautRareRarities = [Rarity.UNIQUE, Rarity.LEGENDARY]

// Families banned from being champions (add any form to ban the whole line)
export const JuggernautBans: Pkm[] = [
  Pkm.HOUNDOUR,
  Pkm.SHUPPET,
  Pkm.TOTODILE,
  Pkm.MARSHADOW
]
const JuggernautBannedFamilies = new Set(JuggernautBans.map((p) => PkmFamily[p]))

// Lines offered as their pre-evolution so the player picks the final form in-game
// (Milcery -> flavor item -> chosen Alcremie); their finals are excluded from the pool
export const JuggernautPreEvolutionChampions: Pkm[] = [Pkm.MILCERY]
const JuggernautPreEvoFamilies = new Set(
  JuggernautPreEvolutionChampions.map((p) => PkmFamily[p])
)

// stat-normalization tuning knobs (playtest-tunable)
export const JUGGERNAUT_STAT_TARGET = { hp: 150, atk: 10, def: 10, speDef: 10 }
export const JUGGERNAUT_COMPRESSION_K = 0.3

export function getJuggernautRarity(state: GameState): Rarity {
  // deterministic per lobby, so every player draws from the same rarity
  const hash = Array.from(state.preparationId).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  )
  if (hash % Math.round(1 / JUGGERNAUT_CHANCE) === 0) {
    return JuggernautRareRarities[
      Math.floor(hash / 40) % JuggernautRareRarities.length
    ]
  }
  return JuggernautRarities[hash % JuggernautRarities.length]
}

// fully-evolved final forms of a rarity (incl. additional/regional; regionals
// are region-gated later by the proposition machinery). Unique/Legendary are
// single-stage, so their "1-star copy" is the champion itself.
export function getJuggernautChampionPool(rarity: Rarity): Pkm[] {
  const minStages =
    rarity === Rarity.UNIQUE || rarity === Rarity.LEGENDARY ? 1 : 2
  const pool = (PRECOMPUTED_POKEMONS_PER_RARITY[rarity] ?? []).filter((p) => {
    const d = getPokemonData(p)
    return (
      d.stages >= minStages &&
      d.stars === d.stages && // fully evolved final form
      d.skill !== Ability.DEFAULT &&
      Unowns.includes(p) === false &&
      JuggernautBannedFamilies.has(PkmFamily[p]) === false &&
      // final forms of pre-evolution lines are excluded; the pre-evo is offered instead
      JuggernautPreEvoFamilies.has(PkmFamily[p]) === false
    )
  })
  // offer the pre-evolution champion(s) of this rarity (e.g. Milcery)
  for (const pkm of JuggernautPreEvolutionChampions) {
    if (
      getPokemonData(pkm).rarity === rarity &&
      JuggernautBannedFamilies.has(PkmFamily[pkm]) === false
    ) {
      pool.push(pkm)
    }
  }
  return pool
}

export function pickJuggernautChampions(player: Player, state: GameState): Pkm[] {
  const rarity = getJuggernautRarity(state)
  return getJuggernautChampionPool(rarity).map((pkm) => {
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

// average base statline of the shared-rarity champion pool (memoized per rarity)
const juggernautPoolMeanCache = new Map<
  Rarity,
  { hp: number; atk: number; def: number; speDef: number }
>()

export function getJuggernautPoolMean(rarity: Rarity) {
  const cached = juggernautPoolMeanCache.get(rarity)
  if (cached) return cached
  const pool = getJuggernautChampionPool(rarity)
  const totals = { hp: 0, atk: 0, def: 0, speDef: 0 }
  for (const pkm of pool) {
    const p = new PokemonClasses[pkm](pkm)
    totals.hp += p.hp
    totals.atk += p.atk
    totals.def += p.def
    totals.speDef += p.speDef
  }
  const n = Math.max(1, pool.length)
  const mean = {
    hp: totals.hp / n,
    atk: totals.atk / n,
    def: totals.def / n,
    speDef: totals.speDef / n
  }
  juggernautPoolMeanCache.set(rarity, mean)
  return mean
}

// Normalize the champion's HP/ATK/DEF/Sp.DEF toward a shared baseline via
// additive compression: normalized = target + (natural - poolMean) * k.
export function applyJuggernautStats(champion: Pokemon, state: GameState) {
  const rarity = getJuggernautRarity(state)
  const mean = getJuggernautPoolMean(rarity)
  const t = JUGGERNAUT_STAT_TARGET
  const k = JUGGERNAUT_COMPRESSION_K
  const normalize = (natural: number, target: number, m: number) =>
    Math.max(1, Math.round(target + (natural - m) * k))

  // use the model's add* setters (delta) so clamping and maxHP stay consistent
  champion.addAttack(normalize(champion.atk, t.atk, mean.atk) - champion.atk)
  champion.addDefense(normalize(champion.def, t.def, mean.def) - champion.def)
  champion.addSpecialDefense(
    normalize(champion.speDef, t.speDef, mean.speDef) - champion.speDef
  )
  champion.addMaxHP(normalize(champion.hp, t.hp, mean.hp) - champion.hp)
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
