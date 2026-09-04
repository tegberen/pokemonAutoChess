import {
  ARCEUS_RATE,
  BuyPrices,
  DITTO_RATE,
  EEVEE_RATE,
  FALINKS_TROOPER_RATE,
  FishRarityProbability,
  getAltFormForPlayer,
  getUnownsPoolPerStage,
  HIGH_ROLLER_CHANCE,
  HONEY_CHANCE,
  INCENSE_CHANCE,
  JUGGERNAUT_COPY_RATE,
  KECLEON_RATE,
  LegendaryPool,
  MIN_STAGE_FOR_DITTO,
  NB_STARTERS,
  NB_UNIQUE_PROPOSITIONS,
  PkmAltFormsByPkm,
  PkmsWithAltForms,
  PoolSize,
  PortalCarouselStages,
  RarityCost,
  RarityProbabilityPerLevel,
  REMORAID_RATE,
  REPEAT_BALL_LEGENDARY_CAP,
  REPEAT_BALL_UNIQUE_CAP,
  REPEAT_BALL_UNIQUE_INTERVAL,
  SellPrices,
  SHOP_SIZE,
  getShopSize,
  SynergyTiersThresholds,
  UNOWN_PSY3_NB_SHOPS_INTERVAL,
  UNOWN_PSY5_NB_SHOPS_INTERVAL,
  UNOWN_PSY7_NB_SHOPS_INTERVAL,
  UniquePool
} from "../config"
import { BAZAAR_SHOP_INTERVAL, createBazaarShopOffers } from "../core/bazaar"
import {
  createSmearglePackPropositions,
  pickFirstPartners,
  pickJuggernautChampions
} from "../core/scribbles"
import type GameState from "../rooms/states/game-state"
import type { IPokemon, IPokemonEntity } from "../types"
import { EffectEnum } from "../types/enum/Effect"
import { JuggernautFeedStats, Rarity } from "../types/enum/Game"
import {
  type FishingRod,
  Item,
  ItemComponentsNoFossilOrScarf
} from "../types/enum/Item"
import {
  isRegionalVariant,
  Pkm,
  PkmDuos,
  PkmFamily,
  type PkmProposition,
  PkmRegionalVariants,
  Unowns
} from "../types/enum/Pokemon"
import { SpecialGameRule } from "../types/enum/SpecialGameRule"
import {
  FOSSIL_UNLOCK_MAX_GUARANTEES_PER_SHOP,
  FOSSIL_UNLOCK_MIN_ENTRIES,
  isFossilUnlockPokemon
} from "../types/enum/FossilUnlock"
import {
  decayIgnoredFossilShopWeights,
  getFossilShopWeight,
  getFossilUnlockPool,
  onFossilUnlockFishing,
  releaseFossilUnlockCopy
} from "../services/fossil-unlocks"
import {
  Blessing,
  BERSERKER_HORDES_SHOP_INTERVAL,
  CURSOLA_SELL_PRICE,
  getCarouselLockForStage,
  GRUDGE_SUBSTITUTE_SELL_COST,
  isGrudgeSubstitute,
  MIND_RUSH_UNOWN_GUARANTEE_TIER,
  CONVERGENT_PARADOX_UNIQUES,
  CONVERGENT_PARADOX_LEGENDARIES
} from "../types/enum/Blessing"
import { PRECOMPUTED_POKEMONS_PER_TYPE } from "./precomputed/precomputed-types"
import { Synergy } from "../types/enum/Synergy"
import { getGuidePityUnit } from "../core/guide/guide-progress"
import {
  getGuideForcedPickItem,
  getGuideForcedProposition,
  getGuideShopInjections
} from "../core/guide/guide-stage"
import { removeInArray } from "../utils/array"
import { logger } from "../utils/logger"
import { clamp, min } from "../utils/number"
import {
  chance,
  pickNRandomIn,
  pickRandomIn,
  randomWeighted,
  shuffleArray
} from "../utils/random"
import { schemaValues } from "../utils/schemas"
import type Player from "./colyseus-models/player"
import {
  PlayerChoice,
  type PlayerChoiceType
} from "./colyseus-models/player-choice"
import { type Pokemon, PokemonClasses } from "./colyseus-models/pokemon"
import { getSynergyTier, getWildChance } from "./colyseus-models/synergies"
import { getPokemonBaseline } from "./pokemon-factory"
import {
  getPokemonData,
  getRegularsTier1
} from "./precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "./precomputed/precomputed-rarity"

export function getPoolSize(rarity: Rarity, maxStars: number): number {
  return PoolSize[rarity][clamp(maxStars, 1, 3) - 1]
}

export function getSellPrice(
  pokemon: IPokemon | IPokemonEntity,
  specialGameRule?: SpecialGameRule | null,
  ignoreRareCandy = false,
  blessings?: Blessing[],
  // the seller's board, only read for the BERSERKER_HORDES discount
  sellerBoard?: Player["board"]
): number {
  const name = pokemon.name

  if (
    blessings?.includes(Blessing.COLONY) &&
    PkmFamily[name] === Pkm.SCATTERBUG &&
    name !== Pkm.SCATTERBUG
  )
    return 0

  if ("manifestationLocked" in pokemon && isGrudgeSubstitute(pokemon)) {
    return -GRUDGE_SUBSTITUTE_SELL_COST
  }

  if (name === Pkm.CURSOLA && blessings?.includes(Blessing.CURSE_OF_CORAL)) {
    return CURSOLA_SELL_PRICE
  }

  if (specialGameRule === SpecialGameRule.FREE_MARKET && name !== Pkm.EGG)
    return 0

  if (specialGameRule === SpecialGameRule.JUGGERNAUT) {
    // match the reduced copy buy price
    if (pokemon.rarity === Rarity.UNIQUE) return 6
    if (pokemon.rarity === Rarity.LEGENDARY) return 7
  }

  // sell for buy price since pokemons evolve on purchase
  if (specialGameRule === SpecialGameRule.EVOLUTION_LAB && name !== Pkm.EGG) {
    return getBuyPrice(name, specialGameRule)
  }

  const duo = Object.entries(PkmDuos).find(([key, duo]) => duo.includes(name))

  let price = 1
  let stars = pokemon.stars
  const hasRareCandy = pokemon.items && pokemon.items.has(Item.RARE_CANDY)

  if (hasRareCandy && !ignoreRareCandy) {
    stars = min(1)(stars - 1)
  }

  if (name === Pkm.EGG) {
    price = pokemon.shiny ? SellPrices.SHINY_EGG : SellPrices.EGG
  } else if (name == Pkm.DITTO) {
    price = SellPrices.DITTO
  } else if (name == Pkm.FALINKS_TROOPER) {
    price = SellPrices.FALINKS_TROOPER
  } else if (name == Pkm.MELTAN) {
    price = SellPrices.MELTAN
  } else if (name === Pkm.MAGIKARP) {
    price = SellPrices.MAGIKARP
  } else if (name === Pkm.FEEBAS) {
    price = SellPrices.FEEBAS
  } else if (name === Pkm.WISHIWASHI) {
    price = SellPrices.WISHIWASHI
  } else if (name === Pkm.SCIZOR) {
    price = SellPrices.SCIZOR
  } else if (name === Pkm.KLEAVOR) {
    price = SellPrices.KLEAVOR
  } else if (name === Pkm.REMORAID) {
    price = SellPrices.REMORAID
  } else if (name === Pkm.OCTILLERY) {
    price = hasRareCandy ? SellPrices.REMORAID : SellPrices.OCTILLERY
  } else if (name === Pkm.GYARADOS) {
    price = hasRareCandy ? SellPrices.MAGIKARP : SellPrices.GYARADOS
  } else if (name === Pkm.MILOTIC) {
    price = hasRareCandy ? SellPrices.FEEBAS : SellPrices.MILOTIC
  } else if (name === Pkm.WISHIWASHI_SCHOOL) {
    price = hasRareCandy ? SellPrices.WISHIWASHI : SellPrices.WISHIWASHI_SCHOOL
  } else if (Unowns.includes(name)) {
    price = SellPrices.UNOWN
  } else if (pokemon.rarity === Rarity.HATCH) {
    price = SellPrices.HATCH[stars - 1] ?? SellPrices.HATCH.at(-1)
  } else if (pokemon.rarity === Rarity.UNIQUE) {
    price = duo ? SellPrices.UNIQUE_DUO : SellPrices.UNIQUE
  } else if (pokemon.rarity === Rarity.LEGENDARY) {
    price = duo ? SellPrices.LEGENDARY_DUO : SellPrices.LEGENDARY
  } else if (getPokemonBaseline(name) === Pkm.EEVEE) {
    price = SellPrices.EEVEE
  } else if (duo) {
    price = Math.ceil((RarityCost[pokemon.rarity] * stars) / 2)
  } else if (name === Pkm.MOTHIM) {
    price = RarityCost[pokemon.rarity] * 1
  } else {
    price = RarityCost[pokemon.rarity] * stars
  }

  /* the same discount getBuyPrice applies, scaled by stars so that merging free
     copies cannot refund more than they cost either. Without it a WILD unit
     bought for 0 still sells for full price, which is an unbounded gold loop */
  if (
    sellerBoard &&
    blessings?.includes(Blessing.BERSERKER_HORDES) &&
    getPokemonData(name).types.includes(Synergy.WILD)
  ) {
    price = Math.max(0, price - countWildsThreeStarsOrMore(sellerBoard) * stars)
  }

  return price
}

export function countWildsThreeStarsOrMore(board: Player["board"]): number {
  const pokemons: any[] =
    typeof (board as any)?.values === "function"
      ? [...(board as any).values()]
      : Object.values((board as any) ?? {})
  return pokemons.filter(
    (pokemon) =>
      pokemon?.stars >= 3 &&
      (typeof pokemon.types?.has === "function"
        ? pokemon.types.has(Synergy.WILD)
        : Array.isArray(pokemon?.types) &&
          pokemon.types.includes(Synergy.WILD))
  ).length
}

export function getBuyPrice(
  name: Pkm,
  specialGameRule?: SpecialGameRule | null,
  // narrow shape so the client can pass the synced blessings alongside the board
  buyer?: { board: Player["board"]; blessings?: Blessing[] }
): number {
  if (specialGameRule === SpecialGameRule.FREE_MARKET) return 0

  if (specialGameRule === SpecialGameRule.JUGGERNAUT) {
    // Unique/Legendary champion copies are cheaper than their normal price
    const rarity = getPokemonData(name).rarity
    if (rarity === Rarity.UNIQUE) return 6
    if (rarity === Rarity.LEGENDARY) return 7
  }

  let price: number

  if (name === Pkm.DITTO) {
    price = BuyPrices.DITTO
  } else if (name === Pkm.FALINKS_TROOPER) {
    price = BuyPrices.FALINKS_TROOPER
  } else if (name === Pkm.MELTAN) {
    price = BuyPrices.MELTAN
  } else if (Unowns.includes(name)) {
    price = BuyPrices.UNOWN
  } else {
    price = RarityCost[getPokemonData(name).rarity]
  }

  if (
    buyer?.blessings?.includes(Blessing.BERSERKER_HORDES) &&
    getPokemonData(name).types.includes(Synergy.WILD)
  ) {
    price = Math.max(0, price - countWildsThreeStarsOrMore(buyer.board))
  }

  return price
}

/* what a fished Pokemon is worth in gold, for the CLAMPERL unlock. The fish that
   are not drawn from a rarity pool are SPECIAL, whose RarityCost is 0 because
   they price themselves, so read those from their explicit sell price instead. */
export function getFishedGoldValue(fish: Pkm): number {
  if (fish === Pkm.MAGIKARP) return SellPrices.MAGIKARP
  if (fish === Pkm.FEEBAS) return SellPrices.FEEBAS
  if (fish === Pkm.WISHIWASHI) return SellPrices.WISHIWASHI
  if (fish === Pkm.REMORAID) return SellPrices.REMORAID
  return RarityCost[getPokemonData(fish).rarity]
}

const CommonShop = getRegularsTier1(PRECOMPUTED_POKEMONS_PER_RARITY.COMMON)
const UncommonShop = getRegularsTier1(PRECOMPUTED_POKEMONS_PER_RARITY.UNCOMMON)
const RareShop = getRegularsTier1(PRECOMPUTED_POKEMONS_PER_RARITY.RARE)
const EpicShop = getRegularsTier1(PRECOMPUTED_POKEMONS_PER_RARITY.EPIC)
const UltraShop = getRegularsTier1(PRECOMPUTED_POKEMONS_PER_RARITY.ULTRA)

export default class Shop {
  commonPool: Pkm[] = new Array<Pkm>()
  uncommonPool: Pkm[] = new Array<Pkm>()
  rarePool: Pkm[] = new Array<Pkm>()
  epicPool: Pkm[] = new Array<Pkm>()
  ultraPool: Pkm[] = new Array<Pkm>()
  constructor() {
    this.commonPool = CommonShop.flatMap((pkm) =>
      Array(getPoolSize(Rarity.COMMON, 3)).fill(pkm)
    )
    this.uncommonPool = UncommonShop.flatMap((pkm) =>
      Array(getPoolSize(Rarity.UNCOMMON, 3)).fill(pkm)
    )
    this.rarePool = RareShop.flatMap((pkm) =>
      Array(getPoolSize(Rarity.RARE, 3)).fill(pkm)
    )
    this.epicPool = EpicShop.flatMap((pkm) =>
      Array(getPoolSize(Rarity.EPIC, 3)).fill(pkm)
    )
    this.ultraPool = UltraShop.flatMap((pkm) =>
      Array(getPoolSize(Rarity.ULTRA, 3)).fill(pkm)
    )
  }

  getPool(rarity: Rarity) {
    switch (rarity) {
      case Rarity.COMMON:
        return this.commonPool
      case Rarity.UNCOMMON:
        return this.uncommonPool
      case Rarity.RARE:
        return this.rarePool
      case Rarity.EPIC:
        return this.epicPool
      case Rarity.ULTRA:
        return this.ultraPool
    }
  }

  getRegionalPool(rarity: Rarity, player: Player) {
    switch (rarity) {
      case Rarity.COMMON:
        return player.commonRegionalPool
      case Rarity.UNCOMMON:
        return player.uncommonRegionalPool
      case Rarity.RARE:
        return player.rareRegionalPool
      case Rarity.EPIC:
        return player.epicRegionalPool
      case Rarity.ULTRA:
        return player.ultraRegionalPool
    }
  }

  addAdditionalPokemon(pkmProposition: PkmProposition, state: GameState) {
    const pkm: Pkm =
      pkmProposition in PkmDuos ? PkmDuos[pkmProposition][0] : pkmProposition
    if (state.additionalPokemons.includes(pkm)) return // already added, like in Everyone is here scribble
    state.additionalPokemons.push(pkm)
    const { rarity, stages } = getPokemonData(pkm)
    const pool = this.getPool(rarity)
    const entityNumber = getPoolSize(rarity, stages)
    if (pool) {
      for (let n = 0; n < entityNumber; n++) {
        pool.push(pkm)
      }
    }
  }

  addRegionalPokemon(pkm: Pkm, player: Player) {
    //logger.debug("adding regional pokemon", pkm)
    const { rarity, stages } = getPokemonData(pkm)
    const pool = this.getRegionalPool(rarity, player)
    const entityNumber = getPoolSize(rarity, stages)
    if (pool) {
      for (let n = 0; n < entityNumber; n++) {
        pool.push(pkm)
      }
    }
  }

  resetRegionalPool(player: Player) {
    player.commonRegionalPool = player.commonRegionalPool.filter(
      (p) => getPokemonData(p).regional === false
    )
    player.uncommonRegionalPool = player.uncommonRegionalPool.filter(
      (p) => getPokemonData(p).regional === false
    )
    player.rareRegionalPool = player.rareRegionalPool.filter(
      (p) => getPokemonData(p).regional === false
    )
    player.epicRegionalPool = player.epicRegionalPool.filter(
      (p) => getPokemonData(p).regional === false
    )
    player.ultraRegionalPool = player.ultraRegionalPool.filter(
      (p) => getPokemonData(p).regional === false
    )
  }

  releasePokemon(pkm: Pkm, player: Player, state: GameState) {
    if (
      state.specialGameRule === SpecialGameRule.JUGGERNAUT &&
      player.firstPartner &&
      PkmFamily[pkm] === PkmFamily[player.firstPartner]
    ) {
      // champion copies are pool-independent; never return them to the pool
      return
    }
    const { stars, rarity, regional } = getPokemonData(pkm)
    const baseline = getPokemonBaseline(pkm)
    let entityNumber = stars >= 3 ? 9 : stars === 2 ? 3 : 1
    const duo = Object.entries(PkmDuos).find(([_key, duo]) => duo.includes(pkm))
    if (duo) {
      // duos increase the number in pool by one if selling both
      // but it is negligible and cannot be abused
      entityNumber = Math.ceil(entityNumber / 2)
    }

    if (releaseFossilUnlockCopy(player, pkm)) return

    if (regional && player.canFindRegionalPokemon(pkm, state) === false) {
      return // regional pokemons sold in a region other than their original region are not added back to the pool
    }

    const pool = regional
      ? this.getRegionalPool(rarity, player)
      : this.getPool(rarity)

    if (pool) {
      for (let n = 0; n < entityNumber; n++) {
        pool.push(baseline)
      }
    }
  }

  // JUGGERNAUT: assign a random stat (color) to each copy slot ("" otherwise);
  // reset=true re-rolls colors on a full shop
  syncJuggernautShopStats(player: Player, state: GameState, reset = false) {
    if (state.specialGameRule !== SpecialGameRule.JUGGERNAUT) return
    while (player.shopJuggernautStats.length < SHOP_SIZE) {
      player.shopJuggernautStats.push("")
    }
    for (let i = 0; i < SHOP_SIZE; i++) {
      const pkm = player.shop[i]
      const isCopy =
        player.firstPartner != null &&
        pkm !== Pkm.DEFAULT &&
        PkmFamily[pkm] === PkmFamily[player.firstPartner]
      if (isCopy) {
        if (reset || !player.shopJuggernautStats[i]) {
          player.shopJuggernautStats[i] = pickRandomIn(JuggernautFeedStats)
        }
      } else {
        player.shopJuggernautStats[i] = ""
      }
    }
  }

  private ensureBazaarSlots(player: Player, size: number) {
    while (player.bazaarSlots.length < size) {
      player.bazaarSlots.push("")
    }
  }

  assignBazaarShop(player: Player, state: GameState) {
    const size = getShopSize(state.specialGameRule, state.stageLevel)
    this.ensureBazaarSlots(player, size)
    const offers = createBazaarShopOffers(state.stageLevel)
    for (let i = 0; i < player.bazaarSlots.length; i++) {
      if (i < size && offers[i]) {
        player.shop[i] = Pkm.DEFAULT
        player.bazaarSlots[i] = JSON.stringify(offers[i])
      } else {
        player.bazaarSlots[i] = ""
      }
    }
    player.bazaarShop = true
    player.shopFreeRolls += 1
  }

  clearBazaarShop(player: Player) {
    player.bazaarShop = false
    for (let i = 0; i < player.bazaarSlots.length; i++) {
      player.bazaarSlots[i] = ""
    }
  }

  refillShop(player: Player, state: GameState, specificTypes?: Synergy[]) {
    if (player.bazaarShop) return
    // No need to release pokemons since they won't be changed
    player.shop.forEach((pokemon, i) => {
      if (pokemon === Pkm.MAGIKARP || pokemon === Pkm.DEFAULT) {
        player.shop[i] = this.pickPokemon(
          player,
          state,
          i,
          false,
          specificTypes
        )
      }
    })
    this.syncJuggernautShopStats(player, state)
  }

  /* ALL_FOURS: a one-shot themed shop drawn outside the pool, like the Berserker
     Hordes shop, so buying from it does not deplete the epic line for the lobby */
  assignAllEpicShop(player: Player, state: GameState) {
    this.releaseCurrentShop(player, state)
    const epicPool = PRECOMPUTED_POKEMONS_PER_RARITY.EPIC.filter(
      (pkm) => getPokemonData(pkm).stars === 1 && !(pkm in PkmDuos)
    )
    if (epicPool.length === 0) return
    const size = getShopSize(state.specialGameRule, state.stageLevel)
    for (let i = 0; i < size; i++) {
      player.shop[i] = pickRandomIn(epicPool)
    }
    player.shopSlotsMinted = true
    this.syncJuggernautShopStats(player, state)
  }

  /* a themed shop is minted rather than drawn, so returning it to the pool on
     the next refresh would hand the lobby units that were never taken out */
  releaseCurrentShop(player: Player, state: GameState) {
    /* the shop about to be thrown away is exactly the set of offers the player
       saw and did not buy, which is what the unlock bonus decays on */
    decayIgnoredFossilShopWeights(player, [...player.shop])
    if (player.shopSlotsMinted) {
      player.shopSlotsMinted = false
      return
    }
    player.shop.forEach((pkm) => this.releasePokemon(pkm, player, state))
  }

  /* A guide shop is a real shop with the lesson's units dealt into it. Keeping
     the rest of the draw honest is the point: the player has to read a normal
     board, they are just guaranteed to find what the step asks for. */
  /* Puts specific units into the shop, replacing whatever is in the leftmost
     slots. Used for a stage's opening deal, where the whole set is written at
     once and nothing needs preserving. */
  injectUnits(player: Player, state: GameState, units: Pkm[]) {
    if (units.length === 0) return
    const size = getShopSize(state.specialGameRule, state.stageLevel)
    units.slice(0, size).forEach((pkm, i) => {
      // released back to the pool by the next refresh like any other offer
      this.releasePokemon(player.shop[i], player, state)
      player.shop[i] = pkm
    })
    this.syncJuggernautShopStats(player, state)
  }


  injectGuideUnits(player: Player, state: GameState, manualRefresh: boolean) {
    const pity = getGuidePityUnit(
      state,
      player.gameStats.rerollCount - state.guideStepRerollBase
    )
    /* The stage's opening shop is dealt the lesson's units so the step that
       names them is always followable. Rerolls are not: a step that asks the
       player to roll for something has to be a real search, and the pity floor
       is what stops it being an unbounded one. */
    const injections = pity ? [pity] : manualRefresh ? [] : getGuideShopInjections(state)
    this.injectUnits(player, state, injections)
  }

  assignShop(player: Player, manualRefresh: boolean, state: GameState) {
    this.releaseCurrentShop(player, state)

    if (state.specialGameRule === SpecialGameRule.BAZAAR) {
      const shopKey = state.stageLevel + player.gameStats.rerollCount
      if (
        shopKey > 0 &&
        shopKey % BAZAAR_SHOP_INTERVAL === 0 &&
        shopKey !== player.bazaarLastShopKey
      ) {
        player.bazaarLastShopKey = shopKey
        this.assignBazaarShop(player, state)
        return
      }
      this.clearBazaarShop(player)
    }

    /* BERSERKER_HORDES: every Nth shop is all WILD, keyed the same way the
       Bazaar shop is so a locked or repeated shop cannot re-trigger it */
    if (player.blessings?.includes(Blessing.BERSERKER_HORDES)) {
      const shopKey = state.stageLevel + player.gameStats.rerollCount
      if (
        shopKey > 0 &&
        shopKey % BERSERKER_HORDES_SHOP_INTERVAL === 0 &&
        shopKey !== player.berserkerLastShopKey
      ) {
        player.berserkerLastShopKey = shopKey
        const wildPool = (
          PRECOMPUTED_POKEMONS_PER_TYPE[Synergy.WILD] ?? []
        ).filter((pkm) => getPokemonData(pkm).stars === 1)
        if (wildPool.length > 0) {
          const size = getShopSize(state.specialGameRule, state.stageLevel)
          for (let i = 0; i < size; i++) {
            player.shop[i] = pickRandomIn(wildPool)
          }
          player.shopSlotsMinted = true
          this.syncJuggernautShopStats(player, state)
          return
        }
      }
    }

    let psychicLevel = player.synergies.get(Synergy.PSYCHIC) ?? 0

    if (!manualRefresh && player.unownReminiscences > 0) {
      // consume unown reminescenses for next automatic shopm
      psychicLevel += player.unownReminiscences
      player.unownReminiscences = 0
    }

    const hasTranscendence =
      psychicLevel >= SynergyTiersThresholds[Synergy.PSYCHIC][2]
    if (hasTranscendence) {
      player.shopsSinceLastUnownShop += 1
    }
    const shouldBeUnownShop =
      hasTranscendence &&
      ((!manualRefresh && !player.shopLocked) ||
        (manualRefresh &&
          player.shopsSinceLastUnownShop === UNOWN_PSY7_NB_SHOPS_INTERVAL))

    if (shouldBeUnownShop) {
      // Unown shop
      player.shopFreeRolls += 1
      player.shopsSinceLastUnownShop = 0
      const unowns = getUnownsPoolPerStage(state.stageLevel)
      const chosenUnowns: Pkm[] = []
      for (let i = 0; i < getShopSize(state.specialGameRule, state.stageLevel); i++) {
        const availableUnowns = unowns.filter((u) => !chosenUnowns.includes(u))
        const randomUnown = pickRandomIn(availableUnowns)
        chosenUnowns.push(randomUnown)
        player.shop[i] = randomUnown
      }
      if (
        player.blessings?.includes(Blessing.MIND_RUSH) &&
        getSynergyTier(player.synergies, Synergy.PSYCHIC) >=
          MIND_RUSH_UNOWN_GUARANTEE_TIER &&
        !chosenUnowns.includes(Pkm.UNOWN_EXCLAMATION)
      ) {
        player.shop[0] = Pkm.UNOWN_EXCLAMATION
      }
    } else {
      // Regular shop
      for (let i = 0; i < getShopSize(state.specialGameRule, state.stageLevel); i++) {
        player.shop[i] = this.pickPokemon(player, state, i)
      }
      if (!manualRefresh) {
        this.guaranteeWildInShop(player, state)
      }
      this.injectGuideUnits(player, state, manualRefresh)
      this.guaranteeFossilUnlocksInShop(player, state)
      this.syncJuggernautShopStats(player, state, true)
    }
  }

  /* a freshly unlocked Pokemon is owed one guaranteed offer, placed in the
     rightmost slots and filling leftwards. Guarantees beyond what one shop can
     spend stay queued for the next ones. */
  guaranteeFossilUnlocksInShop(player: Player, state: GameState) {
    const pending = player.fossilUnlocksRef?.pendingGuarantees
    if (!pending || pending.length === 0) return
    const size = getShopSize(state.specialGameRule, state.stageLevel)
    const nbGuaranteed = Math.min(
      pending.length,
      FOSSIL_UNLOCK_MAX_GUARANTEES_PER_SHOP,
      size
    )

    for (let n = 0; n < nbGuaranteed; n++) {
      const guaranteed = pending[0]
      const pool = getFossilUnlockPool(player, getPokemonData(guaranteed).rarity)
      const copyIndex = pool?.indexOf(guaranteed) ?? -1
      // the whole Unlock Pool has been bought out: the guarantee cannot be paid
      if (!pool || copyIndex < 0) {
        pending.shift()
        continue
      }
      const slot = size - 1 - n
      if (player.shop[slot] !== guaranteed) {
        this.releasePokemon(player.shop[slot], player, state)
        pool.splice(copyIndex, 1)
        player.shop[slot] = guaranteed
      }
      pending.shift()
    }
  }

  guaranteeWildInShop(player: Player, state: GameState) {
    if (!state.hasBlessing(player.id, Blessing.WILD_SUBSCRIPTION)) return
    const alreadyWild = player.shop.some((pkm) =>
      pkm ? getPokemonData(pkm).types.includes(Synergy.WILD) : false
    )
    if (alreadyWild) return
    const replacedIndex = player.shop.length - 1
    const replaced = player.shop[replacedIndex]
    const wild = this.getRandomPokemonFromPool(
      getPokemonData(replaced).rarity,
      player,
      player.getFinalizedLines(),
      [Synergy.WILD]
    )
    if (!wild) return

    const wildData = getPokemonData(wild)
    const guaranteedWild =
      wildData.rarity !== Rarity.SPECIAL &&
      wildData.types.includes(Synergy.WILD)
        ? wild
        : Pkm.RATTATA
    this.releasePokemon(replaced, player, state)
    player.shop[replacedIndex] = guaranteedWild
  }

  assignSootheBellShop(
    player: Player,
    state: GameState,
    specificTypes: Synergy[]
  ) {
    this.releaseCurrentShop(player, state)
    this.clearBazaarShop(player)
    for (let i = 0; i < getShopSize(state.specialGameRule, state.stageLevel); i++) {
      player.shop[i] = this.pickPokemon(player, state, i, true, specificTypes)
    }
  }

  assignUniquePropositions(
    player: Player,
    state: GameState,
    portalSynergies: Synergy[]
  ) {
    const stageLevel = state.stageLevel

    // SMEARGLE_PACK: at the starter stage, offer a booster of Pokemon to pick one
    // starter from (reusing the "starter" pick pipeline), then skip the normal
    // synergy/item-based proposition generation below.
    if (
      stageLevel === PortalCarouselStages[0] &&
      state.specialGameRule === SpecialGameRule.SMEARGLE_PACK
    ) {
      const pack = createSmearglePackPropositions(player)
      player.choices.push(
        new PlayerChoice({
          type: "starter",
          pokemons: pack.map((card) => card.name),
          shinies: pack.map((card) => card.shiny),
          emotions: pack.map((card) => card.emotion),
          canReroll: true // one reroll = 2 packs total
        })
      )
      return
    }

    const typeByStage: { [stage: number]: PlayerChoiceType } = {
      [PortalCarouselStages[0]]: "starter",
      [PortalCarouselStages[1]]: "unique",
      [PortalCarouselStages[2]]: "legendary"
    }
    const type = typeByStage[stageLevel]

    const poolByType: {
      [type in "starter" | "unique" | "legendary"]: PkmProposition[]
    } = {
      starter: [...this.commonPool],
      unique: [...UniquePool],
      // an unlocked legendary fossil is only ever proposed to its own unlocker
      legendary: [...LegendaryPool, ...player.legendaryUnlockPool]
    }

    let allCandidates: PkmProposition[] = poolByType[type] || []

    if (stageLevel === 0) {
      if (state.specialGameRule === SpecialGameRule.UNIQUE_STARTER) {
        allCandidates = [...UniquePool]
      } else if (state.specialGameRule === SpecialGameRule.FIRST_PARTNER) {
        allCandidates = pickFirstPartners(player, state)
      } else if (state.specialGameRule === SpecialGameRule.JUGGERNAUT) {
        allCandidates = pickJuggernautChampions(player, state)
      }
    }

    if (state.specialGameRule === SpecialGameRule.EVOLUTION_LAB) {
      allCandidates = allCandidates.filter((p) => p !== Pkm.COSMOG)
    }

    // ensure we have at least one synergy per proposition
    if (portalSynergies.length > NB_UNIQUE_PROPOSITIONS) {
      portalSynergies = pickNRandomIn(portalSynergies, NB_UNIQUE_PROPOSITIONS)
    }

    const nbPropositions =
      stageLevel === PortalCarouselStages[0]
        ? state.specialGameRule === SpecialGameRule.JUGGERNAUT
          ? 5 // JUGGERNAUT offers more champions to choose from
          : NB_STARTERS
        : NB_UNIQUE_PROPOSITIONS
    const pokemonsProposed: PkmProposition[] = []
    const itemsProposed: Item[] = []
    /* Kecleon and Arceus are not in the pools; they are injected below by a
       chance roll, so a carousel-lock blessing forces that roll instead of
       seeding a proposition */
    const guaranteedPick = getCarouselLockForStage(
      player.blessings,
      stageLevel
    )?.guaranteedPick
    // SIX_PACK: a second component paired with each starter proposition
    const itemsProposed2: Item[] = []
    const isSixPack = state.specialGameRule === SpecialGameRule.SIX_PACK

    for (let i = 0; i < nbPropositions; i++) {
      let synergyWanted: Synergy | undefined = portalSynergies[i]

      function filterCandidates(proposition: PkmProposition): boolean {
        const pkm: Pkm =
          proposition in PkmDuos ? PkmDuos[proposition][0] : proposition
        const { types, regional } = getPokemonData(pkm)

        const hasSynergyWanted =
          synergyWanted === undefined || types.includes(synergyWanted)

        if (!hasSynergyWanted) return false

        if (regional && !player.canFindRegionalPokemon(pkm)) {
          // skip regional pokemons not in their region
          return false
        }

        if (
          pokemonsProposed.some((prop) => {
            const p: Pkm = prop in PkmDuos ? PkmDuos[prop][0] : prop
            return PkmFamily[p] === PkmFamily[pkm] || isRegionalVariant(p, pkm)
          })
        ) {
          // avoid proposing two pokemons of the same family or regional variants
          return false
        }

        if (
          pkm in PkmRegionalVariants &&
          PkmRegionalVariants[pkm]?.some((p) => {
            const variant = new PokemonClasses[p](p)
            const lostTypes = types.filter((type) => !variant.types.has(type))
            return (
              variant.isInRegion(player.map) &&
              synergyWanted &&
              lostTypes.includes(synergyWanted)
            )
          })
        ) {
          // avoid proposing pokemon whose regional variants would lose the wanted synergy
          return false
        }

        return true
      }

      let candidates = allCandidates.filter(filterCandidates)
      const initialCandidatesEmpty = candidates.length === 0
      if (initialCandidatesEmpty) {
        synergyWanted = undefined
        candidates = allCandidates.filter(filterCandidates)
      }
      let selected = pickRandomIn(candidates)

      if (selected in PkmRegionalVariants) {
        const regionalVariants = PkmRegionalVariants[selected]!.filter((p) =>
          new PokemonClasses[p](p).isInRegion(player.map)
        )
        if (regionalVariants.length > 0)
          selected = pickRandomIn(regionalVariants)
      }
      if (selected in PkmAltFormsByPkm) {
        selected = getAltFormForPlayer(selected as Pkm, player)
      }

      if (stageLevel === PortalCarouselStages[0]) {
        itemsProposed[i] = pickRandomIn(
          ItemComponentsNoFossilOrScarf.filter(
            (c) => itemsProposed.includes(c) === false
          )
        )
        if (isSixPack) {
          itemsProposed2[i] = pickRandomIn(
            ItemComponentsNoFossilOrScarf.filter((c) => c !== itemsProposed[i])
          )
        }
      }
      /* Eevee, Kecleon and Arceus overwrite both the proposition and its item,
         which would quietly undo whatever the lesson forced onto this screen. */
      const guideForcesThisScreen =
        getGuideForcedPickItem(state) !== null ||
        getGuideForcedProposition(state) !== null

      if (
        !guideForcesThisScreen &&
        stageLevel === PortalCarouselStages[0] &&
        pokemonsProposed.includes(Pkm.EEVEE) === false &&
        (chance(EEVEE_RATE) || initialCandidatesEmpty) &&
        state.specialGameRule !== SpecialGameRule.FIRST_PARTNER &&
        state.specialGameRule !== SpecialGameRule.UNIQUE_STARTER &&
        state.specialGameRule !== SpecialGameRule.JUGGERNAUT
      ) {
        selected = Pkm.EEVEE
        itemsProposed[i] = Item.FOSSIL_STONE
      } else if (
        !guideForcesThisScreen &&
        stageLevel === PortalCarouselStages[1] &&
        pokemonsProposed.includes(Pkm.KECLEON) === false &&
        (guaranteedPick === Pkm.KECLEON || chance(KECLEON_RATE))
      ) {
        selected = Pkm.KECLEON
      } else if (
        !guideForcesThisScreen &&
        stageLevel === PortalCarouselStages[2] &&
        pokemonsProposed.includes(Pkm.ARCEUS) === false &&
        (guaranteedPick === Pkm.ARCEUS || chance(ARCEUS_RATE))
      ) {
        selected = Pkm.ARCEUS
      }

      removeInArray(allCandidates, selected)
      pokemonsProposed.push(selected)
    }

    /* CONVERGENT_PARADOX promises a Paradox among the Unique and Legendary
       options, so one slot is swapped when the roll produced none */
    const paradoxRoster =
      stageLevel === PortalCarouselStages[1]
        ? CONVERGENT_PARADOX_UNIQUES
        : stageLevel === PortalCarouselStages[2]
          ? CONVERGENT_PARADOX_LEGENDARIES
          : []
    if (
      player.blessings?.includes(Blessing.CONVERGENT_PARADOX) &&
      paradoxRoster.length > 0 &&
      !pokemonsProposed.some((proposition) =>
        paradoxRoster.includes(proposition as Pkm)
      )
    ) {
      /* canFindRegionalPokemon answers "shares a synergy with this map" for a
         non-regional Pokemon, so it may only gate the regional ones */
      const offerable = paradoxRoster.filter(
        (pkm) =>
          !getPokemonData(pkm).regional || player.canFindRegionalPokemon(pkm)
      )
      if (offerable.length > 0) {
        pokemonsProposed[pokemonsProposed.length - 1] = pickRandomIn(offerable)
      }
    }

    /* A guide teaches one specific pick, so it has to actually be on offer. It
       goes in the middle slot with the component the lesson needs, and the two
       either side keep their own random components - which is what makes the
       greyed-out pair read as a real choice that was passed over. */
    const guideForced = getGuideForcedProposition(state)
    if (guideForced) {
      const middle = Math.floor(pokemonsProposed.length / 2)
      if (!pokemonsProposed.includes(guideForced)) {
        pokemonsProposed[middle] = guideForced
      }
      const guideItem = getGuideForcedPickItem(state)
      const forcedIndex = pokemonsProposed.indexOf(guideForced)
      if (guideItem && itemsProposed.length > forcedIndex) {
        // never leave two slots holding the taught component
        const duplicate = itemsProposed.indexOf(guideItem)
        if (duplicate >= 0 && duplicate !== forcedIndex) {
          itemsProposed[duplicate] = pickRandomIn(
            ItemComponentsNoFossilOrScarf.filter(
              (c) => c !== guideItem && !itemsProposed.includes(c)
            )
          )
        }
        itemsProposed[forcedIndex] = guideItem
      }
    }

    player.choices.push(
      new PlayerChoice({
        type,
        pokemons: pokemonsProposed,
        items: itemsProposed,
        items2: itemsProposed2
      })
    )
  }

  getRandomPokemonFromPool(
    rarity: Rarity,
    player: Player,
    finals: Set<Pkm> = new Set(),
    specificTypesWanted?: Synergy[]
  ): Pkm {
    let pkm = Pkm.MAGIKARP
    const unlockPool = getFossilUnlockPool(player, rarity) ?? []
    /* an unlocked Pokemon is drawn on its remaining copies shifted by its shop
       weight: up right after the unlock, down every time it is offered and
       passed over. The weight only moves draw entries, never the Unlock Pool
       itself, which still empties one copy per purchase. */
    const unlockEntries: Pkm[] = []
    new Set(unlockPool).forEach((unlocked) => {
      const copies = unlockPool.filter((pkm) => pkm === unlocked).length
      const entries = Math.max(
        FOSSIL_UNLOCK_MIN_ENTRIES,
        copies + getFossilShopWeight(player, unlocked)
      )
      for (let n = 0; n < entries; n++) unlockEntries.push(unlocked)
    })
    const candidates = (this.getPool(rarity) ?? [])
      .concat(this.getRegionalPool(rarity, player) ?? [])
      .concat(unlockEntries)
      .map((pkm) => {
        if (pkm in PkmRegionalVariants) {
          const regionalVariants = PkmRegionalVariants[pkm]!.filter((p) =>
            player.regionalPokemons.includes(p)
          )
          if (regionalVariants.length > 0) pkm = pickRandomIn(regionalVariants)
        }
        return pkm
      })
      .filter((pkm) => {
        const types = getPokemonData(pkm).types
        const isOfTypeWanted = specificTypesWanted
          ? specificTypesWanted.some((specificTypeWanted) =>
              types.includes(specificTypeWanted)
            )
          : types.includes(Synergy.WILD) === false

        if (
          PkmsWithAltForms.includes(pkm) &&
          getAltFormForPlayer(pkm, player) !== pkm
        ) {
          // only keep desired alt form for player
          return false
        }

        return isOfTypeWanted && !finals.has(getPokemonBaseline(pkm))
      })

    if (candidates.length > 0) {
      pkm = pickRandomIn(candidates)
    } else if (
      specificTypesWanted &&
      specificTypesWanted.includes(Synergy.WATER)
    ) {
      return Pkm.MAGIKARP // if no more water in pool, return magikarp
    } else if (specificTypesWanted) {
      return this.getRandomPokemonFromPool(rarity, player, finals) // could not find of specific type, return another type
    }

    const { regional } = getPokemonData(pkm)
    const pool = isFossilUnlockPokemon(getPokemonBaseline(pkm))
      ? getFossilUnlockPool(player, rarity)
      : regional
        ? this.getRegionalPool(rarity, player)
        : this.getPool(rarity)
    if (pool) {
      const index = pool.indexOf(getPokemonBaseline(pkm))
      if (index >= 0) {
        pool.splice(index, 1)
      }
    }

    return pkm
  }

  pickPokemon(
    player: Player,
    state: GameState,
    shopIndex: number = -1,
    noSpecial = false,
    specificTypes?: Synergy[]
  ): Pkm {
    if (
      state.specialGameRule === SpecialGameRule.JUGGERNAUT &&
      player.firstPartner &&
      !noSpecial &&
      chance(JUGGERNAUT_COPY_RATE)
    ) {
      // pool-independent 1-star copy of the player's champion, at a fixed rate
      return PkmFamily[player.firstPartner]
    }

    if (
      state.specialGameRule !== SpecialGameRule.DITTO_PARTY &&
      state.specialGameRule !== SpecialGameRule.EVOLUTION_LAB &&
      chance(DITTO_RATE) &&
      state.stageLevel >= MIN_STAGE_FOR_DITTO &&
      !noSpecial
    ) {
      return player.items.includes(Item.MYSTERY_BOX) ? Pkm.MELTAN : Pkm.DITTO
    }

    if (shopIndex === 5 && !noSpecial) {
      const totalRerolls = player.gameStats.rerollCount + state.stageLevel
      if (
        (player.effects.has(EffectEnum.PRECOGNITION) &&
          totalRerolls % UNOWN_PSY3_NB_SHOPS_INTERVAL === 0) ||
        (player.effects.has(EffectEnum.AURA) &&
          totalRerolls % UNOWN_PSY5_NB_SHOPS_INTERVAL === 0)
      ) {
        const unowns = getUnownsPoolPerStage(state.stageLevel)
        return pickRandomIn(unowns)
      }
    }

    if (
      player.effects.has(EffectEnum.FALINKS_BRASS) &&
      chance(FALINKS_TROOPER_RATE)
    ) {
      return Pkm.FALINKS_TROOPER
    }

    const wildChance = getWildChance(player, state.stageLevel)
    const finals = player.getFinalizedLines()
    let specificTypesWanted: Synergy[] | undefined = undefined

    const attractors = schemaValues(player.board).filter(
      (p) => p.items.has(Item.INCENSE) || p.dishes.has(Item.HONEY)
    )
    let attractor: Pokemon | null = null
    for (const p of attractors) {
      if (p.items.has(Item.INCENSE) && chance(INCENSE_CHANCE, p)) attractor = p
      if (p.dishes.has(Item.HONEY) && chance(HONEY_CHANCE, p)) attractor = p
    }

    if (specificTypes) {
      specificTypesWanted = specificTypes
    } else if (attractor) {
      specificTypesWanted = schemaValues(attractor.types)
    } else if (wildChance > 0 && chance(wildChance)) {
      specificTypesWanted = [Synergy.WILD]
    }

    const probas = RarityProbabilityPerLevel[player.experienceManager.level]
    const rarity_seed = Math.random()
    let i = 0,
      threshold = 0
    while (rarity_seed > threshold) {
      threshold += probas[i]
      i++
    }
    const rarity = [
      Rarity.COMMON,
      Rarity.UNCOMMON,
      Rarity.RARE,
      Rarity.EPIC,
      Rarity.ULTRA
    ][i - 1]

    if (
      state.specialGameRule === SpecialGameRule.HIGH_ROLLER &&
      chance(HIGH_ROLLER_CHANCE) &&
      !noSpecial
    ) {
      if (state.stageLevel < 10) return this.pickSpecialPokemon(Rarity.HATCH)
      if (state.stageLevel < 20) return this.pickSpecialPokemon(Rarity.UNIQUE)
      return this.pickSpecialPokemon(Rarity.LEGENDARY)
    }

    if (!rarity) {
      logger.error(
        `error in shop while picking seed = ${rarity_seed}, threshold = ${threshold}`
      )
      return Pkm.MAGIKARP
    }

    const repeatBallHolders = schemaValues(player.board).filter((p) =>
      p.items.has(Item.REPEAT_BALL)
    )
    const totalRerolls = player.gameStats.rerollCount + state.stageLevel

    if (
      repeatBallHolders.length > 0 &&
      shopIndex >= 0 &&
      shopIndex < repeatBallHolders.length &&
      !noSpecial
    ) {
      if (
        totalRerolls >= REPEAT_BALL_LEGENDARY_CAP &&
        totalRerolls % REPEAT_BALL_UNIQUE_INTERVAL === 0
      ) {
        return this.pickSpecialPokemon(Rarity.LEGENDARY)
      } else if (
        totalRerolls >= REPEAT_BALL_UNIQUE_CAP &&
        totalRerolls % REPEAT_BALL_UNIQUE_INTERVAL === 0
      ) {
        return this.pickSpecialPokemon(Rarity.UNIQUE)
      }
    }

    return this.getRandomPokemonFromPool(
      rarity,
      player,
      finals,
      specificTypesWanted
    )
  }

  pickSpecialPokemon(rarity: Rarity) {
    let pool: PkmProposition[]
    switch (rarity) {
      case Rarity.LEGENDARY:
        pool = LegendaryPool
        break
      case Rarity.UNIQUE:
        pool = UniquePool
        break
      case Rarity.HATCH:
        pool = PRECOMPUTED_POKEMONS_PER_RARITY.HATCH.filter(
          (p) => getPokemonData(p).stars === 1
        )
        break
      default:
        return Pkm.MAGIKARP
    }
    let candidates: Pkm[] = pool.filter<Pkm>((p): p is Pkm => !(p in PkmDuos))
    shuffleArray(candidates)
    candidates = candidates.filter(
      (p, index) =>
        candidates.findIndex((p2) => PkmFamily[p2] === PkmFamily[p]) === index
    )
    if (candidates.length > 0) return pickRandomIn(candidates)
    return Pkm.MAGIKARP
  }

  pickFish(player: Player, rod: FishingRod, state: GameState): Pkm {
    const fish = this.pickFishFromPool(player, rod, state)
    onFossilUnlockFishing(player, fish, getFishedGoldValue(fish))
    return fish
  }

  private pickFishFromPool(
    player: Player,
    rod: FishingRod,
    state: GameState
  ): Pkm {
    const mantine = schemaValues(player.board).find(
      (p) => p.name === Pkm.MANTYKE || p.name === Pkm.MANTINE
    )

    if (
      state.hasBlessing(player.id, Blessing.GYARODOS_TRES_QUATRO) &&
      (player.synergies.get(Synergy.WATER) ?? 0) > 0
    ) {
      return Pkm.MAGIKARP
    }

    if (
      state.hasBlessing(player.id, Blessing.BEAUTY_CONTEST) &&
      (player.synergies.get(Synergy.WATER) ?? 0) > 0
    ) {
      return Pkm.FEEBAS
    }

    const rarityProbability = FishRarityProbability[rod]
    const rarity_seed = Math.random()
    let threshold = 0
    const finals = player.getFinalizedLines()
    const wildChance = getWildChance(player, state.stageLevel)

    if (
      finals.has(Pkm.REMORAID) === false &&
      ((mantine && chance(REMORAID_RATE, mantine)) || chance(wildChance))
    )
      return Pkm.REMORAID

    let rarity = Rarity.SPECIAL
    for (const r in rarityProbability) {
      threshold += rarityProbability[r]
      if (rarity_seed < threshold) {
        rarity = r as Rarity
        break
      }
    }

    if (rarity !== Rarity.SPECIAL) {
      const fish = this.getRandomPokemonFromPool(rarity, player, finals, [
        Synergy.WATER
      ])
      if (fish !== Pkm.MAGIKARP) return fish
    }

    if (rod === Item.SUPER_ROD) return Pkm.WISHIWASHI
    if (rod === Item.GOOD_ROD) return Pkm.FEEBAS
    return Pkm.MAGIKARP
  }

  magnetPull(meltan: IPokemonEntity, player: Player): Pkm {
    const finals = player.getFinalizedLines()

    const rarityProbabilies =
      RarityProbabilityPerLevel[player.experienceManager.level]
    const magnetPullRatePerRarity = {
      [Rarity.COMMON]: rarityProbabilies[0],
      [Rarity.UNCOMMON]: rarityProbabilies[1],
      [Rarity.RARE]: rarityProbabilies[2],
      [Rarity.EPIC]: rarityProbabilies[3],
      [Rarity.ULTRA]: rarityProbabilies[4],
      [Rarity.SPECIAL]: 0.35
    }
    const rarity =
      randomWeighted(
        magnetPullRatePerRarity,
        1.35,
        meltan.ap,
        0.5,
        meltan.luck
      ) ?? Rarity.SPECIAL

    if (rarity !== Rarity.SPECIAL) {
      const steelPkm = this.getRandomPokemonFromPool(rarity, player, finals, [
        Synergy.STEEL
      ])
      if (getPokemonData(steelPkm).types.includes(Synergy.STEEL))
        return steelPkm
    }

    return Pkm.MELTAN
  }

  presentPull(pokemon: IPokemonEntity, player: Player): Pkm | null {
    const finals = player.getFinalizedLines()
    const rarityProbabilities = RarityProbabilityPerLevel[player.experienceManager.level]
    const presentPullRatePerRarity = {
      [Rarity.COMMON]: rarityProbabilities[0],
      [Rarity.UNCOMMON]: rarityProbabilities[1],
      [Rarity.RARE]: rarityProbabilities[2],
      [Rarity.EPIC]: rarityProbabilities[3],
      [Rarity.ULTRA]: rarityProbabilities[4],
      [Rarity.SPECIAL]: 0
    }
    const rarity = randomWeighted(presentPullRatePerRarity) ?? Rarity.COMMON
    const icePkm = this.getRandomPokemonFromPool(rarity, player, finals, [
      Synergy.ICE
    ])
    if (getPokemonData(icePkm).types.includes(Synergy.ICE)) return icePkm
    return null
  }
}
