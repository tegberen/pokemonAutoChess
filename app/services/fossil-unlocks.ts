import { PoolSize } from "../config"
import type { Board } from "../core/board"
import type { PokemonEntity } from "../core/pokemon-entity"
import type Player from "../models/colyseus-models/player"
import { PlayerChoice } from "../models/colyseus-models/player-choice"
import { PlayerFossilUnlocks } from "../models/colyseus-models/player-fossil-unlocks"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import type GameState from "../rooms/states/game-state"
import PokemonFactory from "../models/pokemon-factory"
import { Title } from "../types"
import {
  FOSSIL_RESTORATION_CHOICES,
  FOSSIL_RESTORATION_FIGHTS_PER_DISCOVERY,
  FOSSIL_RESTORATION_SYNERGY_LEVEL,
  FOSSIL_UNLOCK_MIN_SHOP_WEIGHT,
  FOSSIL_UNLOCK_WEIGHT_LOST_WHEN_IGNORED,
  FossilUnlockDefinitionByPokemon,
  FossilUnlocks,
  GalarFossil,
  getRestoredPokemon,
  isFossilUnlockPokemon,
  REGIGIGAS_FOSSIL_SYNERGY_REQUIRED
} from "../types/enum/FossilUnlock"
import { Rarity } from "../types/enum/Game"
import { Pkm, PkmFamily } from "../types/enum/Pokemon"
import { Synergy } from "../types/enum/Synergy"
import { getFirstAvailablePositionOnBoard, isOnBench } from "../utils/board"
import { clamp } from "../utils/number"
import { pickNRandomIn } from "../utils/random"
import { schemaValues } from "../utils/schemas"

const EvolvedSwinubs: Pkm[] = [Pkm.PILOSWINE, Pkm.MAMOSWINE]
const WIMPOD_HP_THRESHOLD = 0.5
const ANORITH_BUGS_REQUIRED = 2
// GRASS on the board that completes LILEEP outright, instead of two tidal waves
const LILEEP_GRASS_REQUIRED = 3

export function initFossilUnlocks(player: Player, state: GameState) {
  const unlocks = new PlayerFossilUnlocks()
  state.fossilUnlocksByPlayerId.set(player.id, unlocks)
  player.fossilUnlocksRef = unlocks
  FossilUnlocks.forEach((unlock) => unlocks.progress.set(unlock.pokemon, 0))
}

export function getFossilUnlockPool(
  player: Player,
  rarity: Rarity
): Pkm[] | undefined {
  switch (rarity) {
    case Rarity.COMMON:
      return player.commonUnlockPool
    case Rarity.UNCOMMON:
      return player.uncommonUnlockPool
    case Rarity.RARE:
      return player.rareUnlockPool
    case Rarity.EPIC:
      return player.epicUnlockPool
    case Rarity.ULTRA:
      return player.ultraUnlockPool
    case Rarity.LEGENDARY:
      return player.legendaryUnlockPool
    default:
      return undefined
  }
}

/* Returns true when the copy was handled here, so the shared pool is left alone.
   An unlocked Pokemon is drawn from the player's own pool, so selling one has to
   put the copy back there. REGIGIGAS is excluded: it has an unlock condition but
   was never taken out of the shared legendary pool. */
export function releaseFossilUnlockCopy(player: Player, pkm: Pkm): boolean {
  const baseline = PkmFamily[pkm]
  if (!isFossilUnlockPokemon(baseline)) return false
  const { rarity, stars } = getPokemonData(pkm)
  if (rarity === Rarity.LEGENDARY) return false
  const pool = getFossilUnlockPool(player, rarity)
  if (!pool) return true
  const copies = stars >= 3 ? 9 : stars === 2 ? 3 : 1
  for (let n = 0; n < copies; n++) pool.push(baseline)
  return true
}

export function getFossilShopWeight(player: Player, pkm: Pkm): number {
  return player.fossilUnlocksRef?.shopWeight.get(pkm) ?? 0
}

/* buying is the player saying they want it after all, so the weight goes back
   to normal rarity odds however far it had faded */
export function resetFossilShopWeight(player: Player, pkm: Pkm) {
  player.fossilUnlocksRef?.shopWeight.delete(pkm)
}

/* weight only moves on a shop that actually showed the Pokemon and was replaced
   without buying it, so rerolling past shops it never appeared in costs nothing.
   It keeps sliding negative past zero: passing on a fossil repeatedly is how a
   player tells the game to stop offering it. */
export function decayIgnoredFossilShopWeights(
  player: Player,
  offeredPokemons: Pkm[]
) {
  const weights = player.fossilUnlocksRef?.shopWeight
  if (!weights) return
  new Set(offeredPokemons).forEach((pkm) => {
    if (!isFossilUnlockPokemon(pkm)) return
    weights.set(
      pkm,
      Math.max(
        FOSSIL_UNLOCK_MIN_SHOP_WEIGHT,
        (weights.get(pkm) ?? 0) - FOSSIL_UNLOCK_WEIGHT_LOST_WHEN_IGNORED
      )
    )
  })
}

export function advanceFossilUnlockProgress(
  player: Player,
  pokemon: Pkm,
  amount = 1
) {
  setFossilUnlockProgress(
    player,
    pokemon,
    getFossilUnlockProgress(player, pokemon) + amount
  )
}

/* for conditions phrased as a peak reached inside one combat or one preparation
   phase rather than a running tally */
export function recordFossilUnlockBest(
  player: Player,
  pokemon: Pkm,
  value: number
) {
  if (value > getFossilUnlockProgress(player, pokemon)) {
    setFossilUnlockProgress(player, pokemon, value)
  }
}

export function getFossilUnlockProgress(player: Player, pokemon: Pkm): number {
  return player.fossilUnlocksRef?.progress.get(pokemon) ?? 0
}

function setFossilUnlockProgress(player: Player, pokemon: Pkm, value: number) {
  const unlocks = player.fossilUnlocksRef
  const definition = FossilUnlockDefinitionByPokemon.get(pokemon)
  if (!unlocks || !definition) return
  if (!unlocks.revealed) return
  if (unlocks.unlocked.includes(pokemon)) return
  if (player.experienceManager.level < definition.minLevel) return

  const progress = clamp(value, 0, definition.target)
  if (progress === (unlocks.progress.get(pokemon) ?? 0)) return
  unlocks.progress.set(pokemon, progress)
  if (progress >= definition.target) unlockFossil(player, pokemon)
}

function unlockFossil(player: Player, pokemon: Pkm) {
  const unlocks = player.fossilUnlocksRef
  const definition = FossilUnlockDefinitionByPokemon.get(pokemon)
  if (!unlocks || !definition) return
  if (unlocks.unlocked.includes(pokemon)) return

  unlocks.unlocked.push(pokemon)
  unlocks.progress.set(pokemon, definition.target)

  const { rarity, stages } = getPokemonData(pokemon)
  const pool = getFossilUnlockPool(player, rarity)
  if (pool) {
    const copies = PoolSize[rarity][clamp(stages, 1, 3) - 1]
    for (let n = 0; n < copies; n++) pool.push(pokemon)
  }

  // the guaranteed slot is the reward; no weighting on top of it
  unlocks.pendingGuarantees.push(pokemon)

  if (unlocks.unlocked.length === FossilUnlocks.length) {
    player.titles.add(Title.ANCIENT)
  }
}

/* the ways into the system: an evolved Swinub, or any UNIQUE FOSSIL, so a
   player who lands one can pivot into fossils without having gone down the
   Swinub line. Derived from the data rather than a list, so a new unique fossil
   is a valid entry point too. */
function isFossilEntryPoint(pokemon: {
  name: Pkm
  rarity: Rarity
  types: { has: (type: Synergy) => boolean }
}): boolean {
  return (
    EvolvedSwinubs.includes(pokemon.name) ||
    (pokemon.rarity === Rarity.UNIQUE && pokemon.types.has(Synergy.FOSSIL))
  )
}

function isFossilEntryPointFielded(player: Player): boolean {
  return schemaValues(player.board).some(
    (pokemon) => !isOnBench(pokemon) && isFossilEntryPoint(pokemon)
  )
}

function countFielded(player: Player, type: Synergy): number {
  return schemaValues(player.board).filter(
    (pokemon) => !isOnBench(pokemon) && pokemon.types.has(type)
  ).length
}

function countFieldedStars(player: Player, type: Synergy): number {
  return schemaValues(player.board)
    .filter((pokemon) => !isOnBench(pokemon) && pokemon.types.has(type))
    .reduce((total, pokemon) => total + pokemon.stars, 0)
}

/* OMANYTE and CLAMPERL: called for every Pokemon reeled in, whichever rod or
   ability produced it */
export function onFossilUnlockFishing(
  player: Player,
  fish: Pkm,
  goldValue: number
) {
  const isWater = getPokemonData(fish).types.includes(Synergy.WATER)
  if (isWater && isFossilEntryPointFielded(player)) {
    advanceFossilUnlockProgress(player, Pkm.OMANYTE)
  }
  advanceFossilUnlockProgress(player, Pkm.CLAMPERL, goldValue)
}

// KABUTO
export function onFossilUnlockCrit(attacker: PokemonEntity, board: Board) {
  if (!isFossilEntryPoint(attacker.refToBoardPokemon)) return
  const player = attacker.player
  if (!player || attacker.isGhostOpponent) return
  const hasDarkAlly = board.cells.some(
    (entity) =>
      entity != null &&
      entity.team === attacker.team &&
      entity.types.has(Synergy.DARK)
  )
  if (hasDarkAlly) advanceFossilUnlockProgress(player, Pkm.KABUTO)
}

// WIMPOD
export function onFossilUnlockDamageReceived(pokemon: PokemonEntity) {
  if (!isFossilEntryPoint(pokemon.refToBoardPokemon)) return
  if (pokemon.hp > pokemon.maxHP * WIMPOD_HP_THRESHOLD) return
  const player = pokemon.player
  if (!player || pokemon.isGhostOpponent) return
  const hasBugOnBench = schemaValues(player.board).some(
    (p) => p.types.has(Synergy.BUG) && isOnBench(p)
  )
  if (hasBugOnBench) advanceFossilUnlockProgress(player, Pkm.WIMPOD)
}

// LILEEP
export function onFossilUnlockTidalWave(player: Player | undefined) {
  if (!player) return
  advanceFossilUnlockProgress(player, Pkm.LILEEP)
}

// ARCHEN and SHIELDON, both scored over a single combat
export function onFossilUnlockRockExplosion(
  pokemon: PokemonEntity,
  target: PokemonEntity,
  damage: number
) {
  const player = pokemon.player
  if (!player || pokemon.isGhostOpponent) return
  player.fossilRockExplosionArmorBreakIds.add(target.id)
  player.fossilRockExplosionTrueDamage += damage
  recordFossilUnlockBest(
    player,
    Pkm.ARCHEN,
    player.fossilRockExplosionArmorBreakIds.size
  )
  recordFossilUnlockBest(
    player,
    Pkm.SHIELDON,
    player.fossilRockExplosionTrueDamage
  )
}

// TANGELA: berries picked and dishes cooked both count
export function onFossilUnlockHarvest(player: Player) {
  advanceFossilUnlockProgress(player, Pkm.TANGELA)
}

// YANMA
export function onFossilUnlockSpeedChanged(pokemon: PokemonEntity) {
  if (!pokemon.types.has(Synergy.BUG) && !pokemon.types.has(Synergy.FLYING))
    return
  const player = pokemon.player
  if (!player || pokemon.isGhostOpponent) return
  recordFossilUnlockBest(
    player,
    Pkm.YANMA,
    pokemon.speed - pokemon.refToBoardPokemon.speed
  )
}

/* AMAURA: one FOSSIL or ICE unit casting repeatedly while lit, so the count is
   per unit rather than a team total */
export function onFossilUnlockSpotlightCast(pokemon: PokemonEntity) {
  if (!pokemon.types.has(Synergy.FOSSIL) && !pokemon.types.has(Synergy.ICE))
    return
  if (!pokemon.inSpotlight) return
  const player = pokemon.player
  if (!player || pokemon.isGhostOpponent) return
  if (!player.synergies.hasSynergyActive(Synergy.LIGHT)) return
  pokemon.spotlightCasts += 1
  recordFossilUnlockBest(player, Pkm.AMAURA, pokemon.spotlightCasts)
}

// TYRUNT, counted within a single preparation phase
export function onFossilUnlockReroll(player: Player) {
  if (
    !player.synergies.hasSynergyActive(Synergy.DRAGON) &&
    !player.synergies.hasSynergyActive(Synergy.ROCK)
  ) {
    return
  }
  player.fossilRerollsThisPickPhase += 1
  recordFossilUnlockBest(
    player,
    Pkm.TYRUNT,
    player.fossilRerollsThisPickPhase
  )
}

export function resetFossilUnlockPickPhaseTrackers(player: Player) {
  player.fossilRerollsThisPickPhase = 0
}

// ANORITH, plus the per-combat counters ARCHEN and SHIELDON accumulate into
export function onFossilUnlockCombatStart(player: Player) {
  player.fossilRockExplosionArmorBreakIds.clear()
  player.fossilRockExplosionTrueDamage = 0
  if (isFossilEntryPointFielded(player)) {
    player.fossilUnlockRevealPending = true
  }
  if (countFielded(player, Synergy.BUG) >= ANORITH_BUGS_REQUIRED) {
    advanceFossilUnlockProgress(player, Pkm.ANORITH)
  }
  recordFossilUnlockBest(
    player,
    Pkm.CRANIDOS,
    countFieldedStars(player, Synergy.DRAGON)
  )
  if ((player.synergies.get(Synergy.GRASS) ?? 0) >= LILEEP_GRASS_REQUIRED) {
    const lileep = FossilUnlockDefinitionByPokemon.get(Pkm.LILEEP)
    if (lileep) recordFossilUnlockBest(player, Pkm.LILEEP, lileep.target)
  }
}

/* the reveal is paid out at the end of the combat rather than at its start, and
   never taken back: the entry point does not have to survive, nor to stay on the
   board afterwards */
export function onFossilUnlockCombatEnd(player: Player) {
  if (player.fossilUnlockRevealPending) {
    player.fossilUnlockRevealPending = false
    if (player.fossilUnlocksRef) player.fossilUnlocksRef.revealed = true
  }
  offerGalarFossilChoice(player)
}

export function hasFossilRestoration(player: Player): boolean {
  return (
    (player.synergies.get(Synergy.FOSSIL) ?? 0) >=
    FOSSIL_RESTORATION_SYNERGY_LEVEL
  )
}

/* the first fossil is offered on the spot, opening the Restoration section;
   each later one costs FOSSIL_RESTORATION_FIGHTS_PER_DISCOVERY fights */
function offerGalarFossilChoice(player: Player) {
  const unlocks = player.fossilUnlocksRef
  if (!unlocks || !hasFossilRestoration(player)) return
  // one offer at a time, so consecutive fights cannot stack choices up
  if (player.choices.some((choice) => choice.type === "galar_fossil")) return

  const undiscovered = Object.values(GalarFossil).filter(
    (fossil) => !unlocks.galarFossils.includes(fossil)
  )
  if (undiscovered.length === 0) return

  const isFirstFossil = unlocks.galarFossils.length === 0
  if (!isFirstFossil) {
    unlocks.fightsTowardsNextFossil += 1
    const earned =
      unlocks.fightsTowardsNextFossil >= FOSSIL_RESTORATION_FIGHTS_PER_DISCOVERY
    if (!earned) return
  }

  unlocks.fightsTowardsNextFossil = 0
  player.choices.push(
    new PlayerChoice({
      type: "galar_fossil",
      galarFossils: pickNRandomIn(undiscovered, FOSSIL_RESTORATION_CHOICES)
    })
  )
}

export function discoverGalarFossil(player: Player, fossil: GalarFossil) {
  const unlocks = player.fossilUnlocksRef
  if (!unlocks || unlocks.galarFossils.includes(fossil)) return
  unlocks.galarFossils.push(fossil)
}

/* Only one restored Pokemon exists at a time: restoring again swaps the old one
   off the board for the new one. It never costs a team slot. */
export function restoreGalarFossilPokemon(
  player: Player,
  first: GalarFossil,
  second: GalarFossil
): boolean {
  const unlocks = player.fossilUnlocksRef
  if (!unlocks || !hasFossilRestoration(player)) return false
  if (
    !unlocks.galarFossils.includes(first) ||
    !unlocks.galarFossils.includes(second)
  ) {
    return false
  }
  const restored = getRestoredPokemon(first, second)
  if (!restored || restored === unlocks.restoredPokemon) return false

  const previous = schemaValues(player.board).find(
    (pokemon) => pokemon.name === unlocks.restoredPokemon
  )
  const pokemon = PokemonFactory.createPokemonFromName(restored, player)
  // reusing the outgoing tile means a swap can never fail for lack of room
  const position = previous
    ? ([previous.positionX, previous.positionY] as const)
    : getFirstAvailablePositionOnBoard(player.board, pokemon.range)
  if (!position) return false
  if (previous) player.board.delete(previous.id)

  const [x, y] = position
  pokemon.positionX = x
  pokemon.positionY = y
  player.board.set(pokemon.id, pokemon)
  pokemon.onAcquired(player)
  unlocks.restoredPokemon = restored
  player.updateSynergies()
  return true
}

// REGIGIGAS
export function onFossilUnlockFightWon(
  player: Player,
  survivors: PokemonEntity[]
) {
  const mamoswineSurvived = survivors.some(
    (entity) => entity.refToBoardPokemon.name === Pkm.MAMOSWINE
  )
  const fossilSynergy = player.synergies.get(Synergy.FOSSIL) ?? 0
  if (mamoswineSurvived && fossilSynergy >= REGIGIGAS_FOSSIL_SYNERGY_REQUIRED) {
    advanceFossilUnlockProgress(player, Pkm.REGIGIGAS)
  }
}
