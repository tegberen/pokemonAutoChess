import { Command } from "@colyseus/command"
import {
  anchorPlayerAvatars,
  removePlayerAvatar,
  updatePlayerAvatars
} from "../../core/player-avatars"
import { MapSchema, SetSchema, StateView } from "@colyseus/schema"
import { type Client, updateLobby } from "colyseus"
import {
  AdditionalPicksStages,
  ArmoryAssistStages,
  BOARD_SIDE_HEIGHT,
  BOARD_WIDTH,
  FIGHTING_PHASE_DURATION,
  GOLDEN_BERRY_TREE_TYPES,
  getAltFormForPlayer,
  ITEM_CAROUSEL_BASE_DURATION,
  ItemCarouselStages,
  ItemSellPricesAtTown,
  EVOLUTION_LAB_REWARD_COMPONENTS,
  EVOLUTION_LAB_REWARD_OPTIONS,
  EvolutionLabRewardKinds,
  getItemCapacity,
  getRerollCost,
  MAX_PLAYERS_PER_GAME,
  OUTLAW_GOLD_REWARD,
  PkmsWithAltForms,
  PORTAL_CAROUSEL_BASE_DURATION,
  PortalCarouselStages,
  SHARDS_PER_SHINY_UNOWN_WANDERER,
  SHARDS_PER_UNOWN_WANDERER,
  SHINY_UNOWN_ENCOUNTER_CHANCE,
  StageDuration,
  TREASURE_BOX_LIFE_THRESHOLD,
  UNOWN_ENCOUNTER_CHANCE,
  UniquePool,
  unpackBoardCell
} from "../../config"
import {
  Blessings,
  consumeGreedyWishTier,
  drawBlessingOptions,
  getMaxItemBlessingOptions,
  getMaxSynergyBlessingOptions,
  getBlessingsAvailable,
  peekGreedyWishTier,
  rollBlessingTierForStage
} from "../../config/game/blessings"
import {
  applyBlessingTrigger,
  applyRecurringBlessingGrants,
  applyScheduledBlessingGrants,
  checkBlessingQuests,
  checkIndecisionSynergies,
  absorbFertileSoil,
  grantAdoptionBaby,
  serveFestivePicnicDishes,
  rollWaterFountainPonds,
  GemBySynergy,
  grantSweetTreat,
  grantSynergyAwareItem,
  grantRobinGemsReward
} from "../../services/blessings"
import {
  buildScribbleShapeBag,
  placeScribbleShapeCompatibleWith,
  rollScribbleShapes
} from "../../config/game/scribble-shapes"
import { WATER_FOUNTAIN_REROLL_INTERVAL } from "../../config/game/water-ponds"
import { AbilityStrategies } from "../../core/abilities/abilities"
import { castAbility } from "../../core/abilities/cast"
import {
  OnChangePositionEffect,
  OnItemDroppedEffect,
  OnSpotlightChangeEffect,
  OnStageStartEffect
} from "../../core/effects/effect"
import { ItemEffects } from "../../core/effects/items"
import {
  bazaarOfferNeedsBench,
  grantBazaarOffer
} from "../../core/bazaar"
import { PassiveEffects } from "../../core/effects/passives"
import {
  endIgnitionRound,
  groundDigEffect,
  SynergyEffects
} from "../../core/effects/synergies"
import { giveRandomEgg } from "../../core/eggs"
import { EvolutionManager } from "../../core/evolution-logic/evolution-manager"
import { getFlowerPotsUnlocked } from "../../core/flower-pots"
import { selectDoubleUpMatchups, selectMatchups } from "../../core/matchmaking"
import { canSell, PokemonEntity } from "../../core/pokemon-entity"
import { rollExplorerBonusReward } from "../../core/seeds"
import Simulation from "../../core/simulation"
import { getLevelUpCost } from "../../models/colyseus-models/experience-manager"
import type Player from "../../models/colyseus-models/player"
import {
  PlayerChoice,
  type PlayerChoiceType
} from "../../models/colyseus-models/player-choice"
import {
  type Pokemon,
  PokemonClasses
} from "../../models/colyseus-models/pokemon"
import { ScribbleShape } from "../../models/colyseus-models/scribble-shape"
import Synergies, {
  computeSynergies,
  getSynergyTier
} from "../../models/colyseus-models/synergies"
import { Effects } from "../../models/effects"
import UserMetadata from "../../models/mongo-models/user-metadata"
import PokemonFactory, {
  getPokemonBaseline
} from "../../models/pokemon-factory"
import { getPokemonData } from "../../models/precomputed/precomputed-pokemon-data"
import { getBuyPrice, getSellPrice } from "../../models/shop"
import { updatePlayerTitlesAfterFight } from "../../models/titles"
import {
  Emotion,
  type IClient,
  type IDragDropCombineMessage,
  type IDragDropItemMessage,
  type IDragDropMessage,
  RemovableItems,
  Role,
  Title,
  TMPerAbility,
  Transfer
} from "../../types"
import { EvolutionRuleType } from "../../types/EvolutionRules"
import { Ability } from "../../types/enum/Ability"
import {
  type ArmoryOptions,
  FreeOptions,
  PaidOptions
} from "../../types/enum/ArmoryOptions"
import {
  type Awakening,
  AwakeningTypes,
  ROCK_AWAKENING_TIER
} from "../../types/enum/Awakening"
import {
  Blessing,
  BLESSING_OPTIONS_PER_SELECTION,
  BLESSING_REROLLS_PER_OPTION,
  BLESSING_SELECTION_STAGES,
  BLESSING_SELECTION_EXTRA_TIME,
  FAST_DELIVERY_RETURN_DELAY,
  BlessingTrigger,
  countsForTeamSize,
  PRISMATIC_REROLL_CHANCE,
  PRISMATIC_REROLL_FREE_ROLLS,
  STURDY_DEFENSE,
  STURDY_MAX_HP,
  STURDY_SPECIAL_DEFENSE,
  UP_IS_UP_GOLD,
  UP_IS_UP_LIFE,
  WISE_SPENDING_EXP_PER_REROLL,
  GEM_HARVEST_CHARGE_REDUCTION,
  GRUDGE_SUBSTITUTE_SELL_COST,
  isGrudgeSubstitute,
  SIMULATION_SCOPED_HERO_BLESSINGS
} from "../../types/enum/Blessing"
import {
  checkRainbowHourReward,
  grantRainbowHourEevee,
  getUniqueFieldCap,
  isPokemonManifestationLocked,
  isUniqueFieldCapReached
} from "../../services/blessings"
import { DungeonPMDO } from "../../types/enum/Dungeon"
import { EffectEnum } from "../../types/enum/Effect"
import {
  BattleResult,
  GameMode,
  GamePhaseState,
  JUGGERNAUT_BASE_HP_BONUS,
  JuggernautFeedStats,
  JuggernautStatFlatAmount,
  PokemonActionState,
  Rarity,
  Stat,
  Team
} from "../../types/enum/Game"
import {
  ConsumableItems,
  CraftableItemsNoScarves,
  CraftableNoStonesOrScarves,
  Dishes,
  DoubleUpTradeableItems,
  Item,
  ItemComponents,
  ItemComponentsNoFossilOrScarf,
  ItemComponentsNoScarf,
  ArtificialItems,
  Berries,
  ItemRecipe,
  ItemsSoldAtTown,
  Mulches,
  Scarves,
  Seeds,
  ShinyItems,
  SpecialItems,
  Sweets,
  SynergyGems,
  SynergyGivenByGem,
  SynergyGivenByItem,
  SynergyStones,
  Tools,
  UnholdableItems
} from "../../types/enum/Item"
import { Passive } from "../../types/enum/Passive"
import {
  Pkm,
  PkmDuos,
  PkmFamily,
  PkmIndex,
  PkmRegionalVariants,
  Unowns,
  UnownsForScribble
} from "../../types/enum/Pokemon"
import { SpecialGameRule } from "../../types/enum/SpecialGameRule"
import { Synergy } from "../../types/enum/Synergy"
import { TownEncounters } from "../../types/enum/TownEncounter"
import { WandererBehavior, WandererType } from "../../types/enum/Wanderer"
import type { IDetailledPokemon } from "../../types/models/bot-v2"
import type { DisplayText } from "../../types/strings/DisplayText"
import { isIn, removeInArray } from "../../utils/array"
import { canEatMoreDishes } from "../../utils/dishes"
import { getAvatarString } from "../../utils/avatar"
import {
  getFirstAvailablePositionInBench,
  getFirstAvailablePositionOnBoard,
  getFreeSpaceOnBench,
  getMaxTeamSize,
  isOnBench,
  isPositionEmpty
} from "../../utils/board"
import { repeat } from "../../utils/function"
import { logger } from "../../utils/logger"
import { max } from "../../utils/number"
import {
  chance,
  pickNRandomIn,
  pickRandomIn,
  randomBetween,
  simpleHashSeededCoinFlip
} from "../../utils/random"
import { resetArraySchema, schemaValues } from "../../utils/schemas"
import { ExpTable, XP_PER_PURCHASE } from "../../config/game/experience"
import {
  GUIDE_INFINITE_GOLD,
  GUIDE_CAROUSEL_OUTRO_DURATION,
  GUIDE_PICK_OUTRO_DURATION,
  isProtectedFromSelling
} from "../../core/guide/guide-lesson"
import {
  getGuideAllowedCrafts,
  getGuideAllowedItems,
  getGuideBuyableUnits,
  getGuideItemTarget,
  isGuideActionAllowed,
  isGuideWaitingOnPlayer,
  updateGuideProgress
} from "../../core/guide/guide-progress"
import { isGuideWildStage } from "../../core/guide/guide-opponents"
import {
  getGuideCarouselTarget,
  getGuideForcedPickItem,
  getGuideLesson,
  getGuideRipeBerries,
  getGuideStartingLevel,
  getGuideStageRewards,
  getGuideXpPurchases,
  getPveStage,
  isPveStage
} from "../../core/guide/guide-stage"
import { getWeather } from "../../utils/weather"
import type GameRoom from "../game-room"
import type GameState from "../states/game-state"
import {
  resetFossilShopWeight,
  onFossilUnlockHarvest,
  onFossilUnlockCombatEnd,
  onFossilUnlockCombatStart,
  onFossilUnlockReroll,
  resetFossilUnlockPickPhaseTrackers
} from "../../services/fossil-unlocks"

export class OnBuyPokemonCommand extends Command<
  GameRoom,
  {
    playerId: string
    index: number
  }
> {
  execute({ playerId, index }) {
    if (
      playerId === undefined ||
      index === undefined ||
      !this.state.players.has(playerId)
    )
      return
    const player = this.state.players.get(playerId)
    if (!player || !player.alive) return

    // BAZAAR: this slot holds a purchasable item offer instead of a Pokémon
    const bazaarSlot = player.bazaarShop ? player.bazaarSlots[index] : ""
    if (bazaarSlot) {
      const offer = JSON.parse(bazaarSlot) as {
        item: string
        price: number
        category: string
      }
      const needsBench = bazaarOfferNeedsBench(offer.category)
      const canBuy =
        player.money >= offer.price &&
        (!needsBench || getFreeSpaceOnBench(player.board) > 0)
      if (!canBuy) return
      player.money -= offer.price
      grantBazaarOffer(offer, player, this.state)
      // one purchase per bazaar: advance to a regular shop and spend the bazaar's
      // free reroll, same as picking from an unown shop
      this.state.shop.assignShop(player, true, this.state)
      if (player.shopFreeRolls > 0) player.shopFreeRolls -= 1
      this.room.checkEvolutionsAfterPokemonAcquired(playerId)
      return
    }

    const name = player.shop[index]

    const buyable = getGuideBuyableUnits(this.state)
    if (buyable && !buyable.includes(name)) {
      // the shop still draws normally, but only the lesson's units are live
      return
    }
    if (!name || name === Pkm.DEFAULT) return

    let pokemon = PokemonFactory.createPokemonFromName(name, player)

    if (
      this.state.specialGameRule === SpecialGameRule.EVOLUTION_LAB &&
      pokemon.hasEvolution
    ) {
      // keep Bergmite as 1-star once its evolution is on board, so it can still
      // be carried by Avalugg / Hisui Avalugg
      const keepBergmite =
        name === Pkm.BERGMITE &&
        schemaValues(player.board).some(
          (p) => p.name === Pkm.AVALUGG || p.name === Pkm.HISUI_AVALUGG
        )
      if (!keepBergmite) {
        const evolutionName = EvolutionManager.getEvolution(
          pokemon,
          player,
          this.state.stageLevel
        )
        pokemon = PokemonFactory.createPokemonFromName(evolutionName, player)
      }
    }

    if (
      this.state.specialGameRule === SpecialGameRule.JUGGERNAUT &&
      player.firstPartner &&
      PkmFamily[name] === PkmFamily[player.firstPartner]
    ) {
      // remember which stat this copy feeds (its shop color)
      pokemon.juggernautStat = player.shopJuggernautStats[index] ?? ""
      // Unique/Legendary copies are feed-only: null their combat stats
      const rarity = getPokemonData(name).rarity
      if (rarity === Rarity.UNIQUE || rarity === Rarity.LEGENDARY) {
        pokemon.atk = 0
        pokemon.def = 0
        pokemon.speDef = 0
        pokemon.ap = -100
      }
    }
    const isEvolution =
      pokemon.evolutionRule &&
      pokemon.evolutionRule.type === EvolutionRuleType.COUNT &&
      EvolutionManager.canEvolveIfGettingOne(pokemon, player)

    const isAllFoursFreeBuy =
      player.allFoursFreeBuyPending &&
      getPokemonData(name).rarity === Rarity.EPIC
    const cost = isAllFoursFreeBuy
      ? 0
      : getBuyPrice(name, this.state.specialGameRule, player)
    const freeSpaceOnBench = getFreeSpaceOnBench(player.board)
    const hasSpaceOnBench = freeSpaceOnBench > 0 || isEvolution

    const canBuy = player.money >= cost && hasSpaceOnBench
    if (!canBuy) return

    player.money -= cost
    resetFossilShopWeight(player, name)
    if (isAllFoursFreeBuy) player.allFoursFreeBuyPending = false

    /* HYPER_HYPER_ROLL mints the 3-star outright: the 8 extra copies are never
       taken from the shared pool, so the lobby's common lines are untouched */
    if (
      player.hyperHyperRollPending &&
      getPokemonData(name).rarity === Rarity.COMMON
    ) {
      const secondStage = EvolutionManager.getEvolution(
        pokemon,
        player,
        this.state.stageLevel
      )
      if (secondStage !== pokemon.name) {
        const secondStagePokemon = PokemonFactory.createPokemonFromName(
          secondStage,
          player
        )
        const thirdStage = EvolutionManager.getEvolution(
          secondStagePokemon,
          player,
          this.state.stageLevel
        )
        if (thirdStage !== secondStage) {
          player.hyperHyperRollPending = false
          pokemon = PokemonFactory.createPokemonFromName(thirdStage, player)
        }
      }
    }

    const x = getFirstAvailablePositionInBench(player.board)
    pokemon.positionX = x !== null ? x : -1
    pokemon.positionY = 0
    player.board.set(pokemon.id, pokemon)
    pokemon.onAcquired(player)

    if (
      pokemon.passive === Passive.UNOWN &&
      (player.effects.has(EffectEnum.TRANSCENDENCE) ||
        player.shopsSinceLastUnownShop === 0) &&
      player.shopFreeRolls > 0 &&
      player.shop.every((p) => Unowns.includes(p) || p === Pkm.DEFAULT)
    ) {
      // reset shop after picking in a unown shop
      this.state.shop.assignShop(player, true, this.state)
      player.shopFreeRolls -= 1
    } else {
      player.shop[index] = Pkm.DEFAULT
      if (player.shopJuggernautStats.length > index) {
        player.shopJuggernautStats[index] = ""
      }
    }

    this.room.checkEvolutionsAfterPokemonAcquired(playerId)
  }
}

export class OnRemoveFromShopCommand extends Command<
  GameRoom,
  {
    playerId: string
    index: number
  }
> {
  execute({ playerId, index }) {
    if (
      playerId === undefined ||
      index === undefined ||
      !this.state.players.has(playerId)
    )
      return
    /* A guide deals its own shop, so discarding a slot throws away a unit the
       lesson put there and cannot put back. */
    if (getGuideLesson(this.state)) return
    const player = this.state.players.get(playerId)
    if (!player || !player.alive) return

    // BAZAAR item slot: no Pokémon underneath, just clear the offer
    if (player.bazaarShop && player.bazaarSlots[index]) {
      player.bazaarSlots[index] = ""
      player.shop[index] = Pkm.DEFAULT
      player.shopLocked = true
      return
    }

    const name = player.shop[index]
    if (!name || name === Pkm.DEFAULT) return

    const cost = getBuyPrice(name, this.state.specialGameRule, player)
    if (player.money >= cost) {
      player.shop[index] = Pkm.DEFAULT
      player.shopLocked = true
      this.state.shop.releasePokemon(name, player, this.state)
    }
  }
}

export class OnPokemonCatchCommand extends Command<
  GameRoom,
  {
    client: Client
    playerId: string
    id: string
  }
> {
  async execute({ client, playerId, id }) {
    if (playerId === undefined || !this.state.players.has(playerId)) return
    const player = this.state.players.get(playerId)
    const wanderer = player?.wanderers.get(id)

    if (!player || !player.alive || !wanderer) return
    player.wanderers.delete(id)

    if (wanderer.type === WandererType.UNOWN) {
      const unownIndex = PkmIndex[wanderer.pkm]
      if (client.auth) {
        const shardsGained = wanderer.shiny
          ? SHARDS_PER_SHINY_UNOWN_WANDERER
          : SHARDS_PER_UNOWN_WANDERER
        const u = await UserMetadata.findOne({ uid: client.auth.uid })
        if (u) {
          const c = u.pokemonCollection.get(unownIndex)
          if (c) {
            c.dust += shardsGained
          } else {
            u.pokemonCollection.set(unownIndex, {
              id: unownIndex,
              unlocked: Buffer.alloc(5, 0),
              dust: shardsGained,
              selectedEmotion: Emotion.NORMAL,
              selectedShiny: false,
              played: 0
            })
          }
          u.save()
        }
      }
    } else if (wanderer.type === WandererType.CATCHABLE) {
      const pokemon = PokemonFactory.createPokemonFromName(wanderer.pkm, player)
      const freeSpaceOnBench = getFreeSpaceOnBench(player.board)
      const hasSpaceOnBench =
        freeSpaceOnBench > 0 ||
        (pokemon.evolutionRule &&
          pokemon.evolutionRule.type === EvolutionRuleType.COUNT &&
          EvolutionManager.canEvolveIfGettingOne(pokemon, player))

      if (hasSpaceOnBench) {
        const x = getFirstAvailablePositionInBench(player.board)
        pokemon.positionX = x !== null ? x : -1
        pokemon.positionY = 0
        player.board.set(pokemon.id, pokemon)
        pokemon.onAcquired(player)
        this.room.checkEvolutionsAfterPokemonAcquired(playerId)
      }
    } else if (wanderer.type === WandererType.OUTLAW) {
      if (wanderer.pkm === Pkm.TOGEPI_MAFIA) {
        // give additonally a random egg when Mafia Togepi pogchamp
        giveRandomEgg(player, false)
      }
      player.addMoney(OUTLAW_GOLD_REWARD, true, null)
      removeInArray(player.items, Item.WANTED_NOTICE)
    }
  }
}

function sendPokemonToPartner(
  state: GameState,
  room: GameRoom,
  sender: Player,
  pokemon: Pokemon,
  item: Item
) {
  if (state.finale) return // partners are opponents now
  const partner = state.players.get(sender.doubleUpPartnerId)
  if (!partner || !partner.alive) return
  if (
    sender.blessings?.includes(Blessing.COLONY) &&
    PkmFamily[pokemon.name] === Pkm.SCATTERBUG
  )
    return

  // Consume the Prison Bottle and start cooldown
  removeInArray(sender.items, item)
  const cooldown =
    pokemon.rarity === Rarity.EPIC ||
    pokemon.rarity === Rarity.LEGENDARY ||
    pokemon.rarity === Rarity.UNIQUE ||
    pokemon.rarity === Rarity.ULTRA ||
    pokemon.rarity === Rarity.SPECIAL
      ? 5
      : 3
  sender.doubleUpSendCooldown = cooldown

  // Remove from sender's board
  sender.board.delete(pokemon.id)
  sender.updateSynergies()
  sender.boardSize = room.getTeamSize(sender.board, sender.blessings)

  // Place Pokemon on partner's bench
  room.clock.setTimeout(() => {
    const freeX = getFirstAvailablePositionInBench(partner.board)
    if (freeX === null) {
      // Partner bench full — return to sender and refund bottle
      const senderX = getFirstAvailablePositionInBench(sender.board)
      if (senderX !== null) {
        pokemon.positionX = senderX
        pokemon.positionY = 0
        sender.board.set(pokemon.id, pokemon)
        sender.updateSynergies()
        sender.items.push(Item.PRISON_BOTTLE)
        sender.doubleUpSendCooldown = 0
      }
      return
    }
    // success: remove items
    const itemsToReturn = schemaValues(pokemon.items)
    pokemon.removeItems(itemsToReturn, sender)
    itemsToReturn.forEach((item) => {
      sender.items.push(item)
    })
    sender.updateSynergies()

    pokemon.positionX = freeX
    pokemon.positionY = 0
    partner.board.set(pokemon.id, pokemon)
    // A Prison Bottle transfer is an acquisition for the receiving player too.
    // Keep it on the same lifecycle as shop/pick rewards before resolving merges.
    pokemon.onAcquired(partner)
    partner.updateSynergies()
    partner.boardSize = room.getTeamSize(partner.board, partner.blessings)
    room.checkEvolutionsAfterPokemonAcquired(partner.id)
  }, 500)
}

function offerTradeItem(state: GameState, player: Player, item: Item) {
  if (state.finale) return // partners are opponents now
  if (!DoubleUpTradeableItems.includes(item)) return
  const croagunk = [...player.wanderers.values()].find(
    (w) => w.type === WandererType.CROAGUNK_TRADE
  )
  if (!croagunk) return
  // If already offered, refund previous item before accepting new one
  if (player.doubleUpTradeOffer) {
    player.items.push(player.doubleUpTradeOffer as Item)
    player.doubleUpTradeOffer = ""
    croagunk.data = ""
  }
  removeInArray(player.items, item)
  player.doubleUpTradeOffer = item
  croagunk.data = item
  const partner = state.players.get(player.doubleUpPartnerId)
  if (!partner?.alive || !partner.doubleUpTradeOffer) return
  // Both offered — check compatibility before swapping
  const partnerItem = partner.doubleUpTradeOffer as Item
  const playerOffersComponent = ItemComponentsNoScarf.includes(item)
  const partnerOffersComponent = ItemComponentsNoScarf.includes(partnerItem)
  if (playerOffersComponent !== partnerOffersComponent) {
    // Mismatch — refund both, clear visuals
    player.items.push(item)
    player.doubleUpTradeOffer = ""
    croagunk.data = ""
    partner.items.push(partnerItem)
    partner.doubleUpTradeOffer = ""
    const partnerCroagunk = [...partner.wanderers.values()].find(
      (w) => w.type === WandererType.CROAGUNK_TRADE
    )
    if (partnerCroagunk) partnerCroagunk.data = ""
    return
  }
  // Both same type — execute swap
  player.items.push(partnerItem)
  partner.items.push(item)
  player.doubleUpTradeOffer = ""
  partner.doubleUpTradeOffer = ""
  croagunk.data = ""
  const partnerCroagunk = [...partner.wanderers.values()].find(
    (w) => w.type === WandererType.CROAGUNK_TRADE
  )
  if (partnerCroagunk) partnerCroagunk.data = ""
}
export class OnCancelTradeOfferCommand extends Command<
  GameRoom,
  { playerId: string }
> {
  execute({ playerId }) {
    const player = this.state.players.get(playerId)
    if (!player?.doubleUpTradeOffer) return
    const croagunk = [...player.wanderers.values()].find(
      (w) => w.type === WandererType.CROAGUNK_TRADE
    )
    player.items.push(player.doubleUpTradeOffer as Item)
    player.doubleUpTradeOffer = ""
    if (croagunk) croagunk.data = ""
  }
}

export class OnDragDropPokemonCommand extends Command<
  GameRoom,
  {
    client: IClient
    detail: IDragDropMessage
  }
> {
  execute({ client, detail }) {
    const commands = []
    let success = false
    let dittoReplaced = false
    const message = {
      updateBoard: true,
      updateItems: true
    }
    const playerId = client.auth.uid
    const player = this.state.players.get(playerId)

    if (player && player.alive) {
      message.updateItems = false
      const pokemon = player.board.get(detail.id)
      const { x, y } = detail

      if (
        pokemon &&
        x != null &&
        x >= 0 &&
        x < BOARD_WIDTH &&
        y != null &&
        y >= 0 &&
        y < BOARD_SIDE_HEIGHT
      ) {
        const dropOnBench = y == 0
        const dropFromBench = isOnBench(pokemon)

        if (
          pokemon.name === Pkm.DITTO &&
          dropFromBench &&
          !isPositionEmpty(x, y, player.board) &&
          !(this.state.phase === GamePhaseState.FIGHT && y > 0)
        ) {
          const pokemonToClone = player.getPokemonAt(x, y)
          if (pokemonToClone && pokemonToClone.canBeCloned) {
            dittoReplaced = true
            player.gameStats.dittosUsed += 1
            let pkm = getPokemonBaseline(pokemonToClone.name)
            if (PkmsWithAltForms.includes(pkm)) {
              pkm = getAltFormForPlayer(pkm, player)
            }
            const replaceDitto = PokemonFactory.createPokemonFromName(
              pkm,
              player
            )
            // cloned copy keeps its stat; cloning the champion rolls a random one
            replaceDitto.juggernautStat = pokemonToClone.juggernautStat
            if (
              this.state.specialGameRule === SpecialGameRule.JUGGERNAUT &&
              player.firstPartner &&
              PkmFamily[replaceDitto.name] === PkmFamily[player.firstPartner] &&
              !replaceDitto.juggernautStat
            ) {
              replaceDitto.juggernautStat = pickRandomIn(JuggernautFeedStats)
            }
            // Unique/Legendary feed-copies are feed-only: null combat stats
            const dittoRarity = getPokemonData(replaceDitto.name).rarity
            if (
              replaceDitto.juggernautStat !== "" &&
              (dittoRarity === Rarity.UNIQUE ||
                dittoRarity === Rarity.LEGENDARY)
            ) {
              replaceDitto.atk = 0
              replaceDitto.def = 0
              replaceDitto.speDef = 0
              replaceDitto.ap = -100
            }
            replaceDitto.onAcquired(player)
            pokemon.items.forEach((item) => {
              player.items.push(item)
            })
            player.board.delete(detail.id)
            const position = getFirstAvailablePositionInBench(player.board)
            if (position !== null) {
              replaceDitto.positionX = position
              replaceDitto.positionY = 0
              player.board.set(replaceDitto.id, replaceDitto)
              success = true
              message.updateBoard = false
            }
          } else if (dropOnBench) {
            success = this.swapPokemonPositions(player, pokemon, x, y)
          }
        } else if (
          pokemon.name === Pkm.MELTAN &&
          player.getPokemonAt(x, y)?.name === Pkm.MELMETAL
        ) {
          // Meltan can merge with Melmetal
          const melmetal = player.getPokemonAt(x, y)!
          melmetal.addMaxHP(50)
          melmetal.addAttack(5)
          pokemon.items.forEach((item) => {
            player.items.push(item)
          })
          player.board.delete(pokemon.id)
          success = true
        } else if (
          this.state.specialGameRule === SpecialGameRule.JUGGERNAUT &&
          player.firstPartner &&
          pokemon.juggernautStat !== "" && // dragged is a feed copy (has a color)
          player.getPokemonAt(x, y) != null &&
          PkmFamily[player.getPokemonAt(x, y)!.name] ===
            PkmFamily[player.firstPartner] &&
          player.getPokemonAt(x, y)!.juggernautStat === "" // target is the champion
        ) {
          // feed a copy: every feed grants HP, its color adds a stat (green = bigger HP)
          const champion = player.getPokemonAt(x, y)!
          const feedStat = (pokemon.juggernautStat as Stat) || Stat.HP
          if (feedStat !== Stat.HP) {
            champion.addMaxHP(JUGGERNAUT_BASE_HP_BONUS)
          }
          champion.applyStat(feedStat, JuggernautStatFlatAmount[feedStat] ?? 0)
          pokemon.items.forEach((item) => {
            if (!SpecialItems.includes(item)) player.items.push(item)
          })
          player.board.delete(pokemon.id)
          // clean up any pillar the fed copy left behind (Timburr line)
          player.updatePillars()
          success = true
        } else if (dropOnBench && dropFromBench) {
          // Drag and drop pokemons through bench has no limitation
          success = this.swapPokemonPositions(player, pokemon, x, y)
        } else if (this.state.phase == GamePhaseState.PICK) {
          // On pick, allow to drop on / from board
          const teamSize = this.room.getTeamSize(player.board, player.blessings)
          const isBoardFull =
            teamSize >=
            getMaxTeamSize(
              player.experienceManager.level,
              this.room.state.specialGameRule
            )
          const dropToEmptyPlace = isPositionEmpty(x, y, player.board)
          const target = player.getPokemonAt(x, y)
          // swapping onto a unit that is free to field would raise the count by one
          const targetIsExemptFromTeamSize =
            target != null &&
            countsForTeamSize(target, player.blessings) === false

          if (dropOnBench) {
            if (
              pokemon.canBeBenched &&
              (!target ||
                (target.canBePlaced &&
                  !isPokemonManifestationLocked(player, target.id) &&
                  !isUniqueFieldCapReached(player, target, pokemon))) &&
              !(
                isBoardFull &&
                target &&
                countsForTeamSize(pokemon, player.blessings) === false
              )
            ) {
              // From board to bench (bench to bench is already handled)
              success = this.swapPokemonPositions(player, pokemon, x, y)
            }
          } else if (
            pokemon.canBePlaced &&
            !isPokemonManifestationLocked(player, pokemon.id) &&
            !isUniqueFieldCapReached(player, pokemon, target ?? undefined) &&
            (!target || target.canBeBenched) &&
            !(
              dropFromBench &&
              dropToEmptyPlace &&
              isBoardFull &&
              countsForTeamSize(pokemon, player.blessings)
            ) &&
            !(dropFromBench && isBoardFull && targetIsExemptFromTeamSize)
          ) {
            // Prevents a pokemon to go on the board only if it's adding a pokemon from the bench on a full board
            success = this.swapPokemonPositions(player, pokemon, x, y)
          }
        }
      }

      if (!success && client.send) {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
      }
      if (dittoReplaced) {
        this.room.checkEvolutionsAfterPokemonAcquired(playerId)
      }

      if (success) {
        player.updateSynergies()
        checkRainbowHourReward(player)
        player.boardSize = this.room.getTeamSize(player.board, player.blessings)
      }
    }
    if (commands.length > 0) {
      return commands
    }
  }

  swapPokemonPositions(
    player: Player,
    pokemon: Pokemon,
    x: number,
    y: number
  ): boolean {
    const pokemonToSwap = player.getPokemonAt(x, y)
    const lockedActions = [
      PokemonActionState.EXPLORING,
      PokemonActionState.DIGGING
    ]
    if (
      lockedActions.includes(pokemon.action) ||
      (pokemonToSwap != null && lockedActions.includes(pokemonToSwap.action))
    ) {
      return false
    }
    if (pokemonToSwap) {
      const oldX = pokemonToSwap.positionX
      const oldY = pokemonToSwap.positionY
      pokemonToSwap.positionX = pokemon.positionX
      pokemonToSwap.positionY = pokemon.positionY
      onPokemonChangePosition({
        pokemon: pokemonToSwap,
        newX: pokemon.positionX,
        newY: pokemon.positionY,
        oldX,
        oldY,
        player,
        state: this.state,
        room: this.room
      })
    }
    const oldX = pokemon.positionX
    const oldY = pokemon.positionY
    pokemon.positionX = x
    pokemon.positionY = y
    onPokemonChangePosition({
      pokemon,
      newX: x,
      newY: y,
      oldX,
      oldY,
      player,
      state: this.state,
      room: this.room
    })
    return true
  }
}

export class OnSwitchBenchAndBoardCommand extends Command<
  GameRoom,
  {
    client: Client
    pokemonId: string
  }
> {
  execute({ client, pokemonId }) {
    const playerId = client.auth.uid
    const player = this.room.state.players.get(playerId)
    if (!player || !player.alive) return

    const pokemon = player.board.get(pokemonId)
    if (!pokemon) return

    if (this.state.phase !== GamePhaseState.PICK) return // can't switch pokemons if not in pick phase

    if (pokemon.positionY === 0) {
      // pokemon is on bench, switch to board
      const teamSize = this.room.getTeamSize(player.board, player.blessings)
      const isBoardFull =
        teamSize >=
        getMaxTeamSize(
          player.experienceManager.level,
          this.room.state.specialGameRule
        )
      const destination = getFirstAvailablePositionOnBoard(
        player.board,
        pokemon.range
      )
      if (
        pokemon.canBePlaced &&
        !isPokemonManifestationLocked(player, pokemon.id) &&
        !isUniqueFieldCapReached(player, pokemon) &&
        destination &&
        !(isBoardFull && countsForTeamSize(pokemon, player.blessings))
      ) {
        const [x, y] = destination
        const oldX = pokemon.positionX
        const oldY = pokemon.positionY
        pokemon.positionX = x
        pokemon.positionY = y
        onPokemonChangePosition({
          pokemon,
          newX: x,
          newY: y,
          oldX,
          oldY,
          player,
          state: this.state,
          room: this.room
        })
        checkRainbowHourReward(player)
      }
    } else {
      // pokemon is on board, switch to bench
      const x = getFirstAvailablePositionInBench(player.board)
      if (x !== null && pokemon.canBeBenched) {
        const oldX = pokemon.positionX
        const oldY = pokemon.positionY
        pokemon.positionX = x
        pokemon.positionY = 0
        onPokemonChangePosition({
          pokemon,
          newX: x,
          newY: 0,
          oldX: oldX,
          oldY: oldY,
          player,
          state: this.state,
          room: this.room
        })
      }
    }

    player.updateSynergies()
    player.boardSize = this.room.getTeamSize(player.board, player.blessings)
  }
}

export class OnDragDropCombineCommand extends Command<
  GameRoom,
  {
    client: Client
    detail: IDragDropCombineMessage
  }
> {
  execute({ client, detail }) {
    const playerId = client.auth.uid
    const message = {
      updateBoard: true,
      updateItems: true
    }
    const player = this.state.players.get(playerId)

    if (!player || !player.alive) return

    message.updateBoard = false
    message.updateItems = true

    const itemA = detail.itemA
    const itemB = detail.itemB

    //verify player has both items
    if (!player.items.includes(itemA) || !player.items.includes(itemB)) {
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }
    // check for two if both items are same
    else if (itemA == itemB) {
      let count = 0
      player.items.forEach((item) => {
        if (item == itemA) {
          count++
        }
      })

      if (count < 2) {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
    }

    let result: Item | undefined = undefined

    if (itemA === Item.EXCHANGE_TICKET || itemB === Item.EXCHANGE_TICKET) {
      const exchangedItem = itemA === Item.EXCHANGE_TICKET ? itemB : itemA
      if (ItemComponentsNoScarf.includes(exchangedItem)) {
        result = pickRandomIn(
          ItemComponentsNoFossilOrScarf.filter((i) => i !== exchangedItem)
        )
      } else if (SynergyStones.includes(exchangedItem)) {
        result = pickRandomIn(SynergyStones.filter((i) => i !== exchangedItem))
      } else if (CraftableItemsNoScarves.includes(exchangedItem)) {
        result = pickRandomIn(
          CraftableNoStonesOrScarves.filter((i) => i !== exchangedItem)
        )
      } else {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
    } else if (itemA === Item.DUBIOUS_DISC_BLESSING_ITEM || itemB === Item.DUBIOUS_DISC_BLESSING_ITEM) {
      const copiedItem = itemA === Item.DUBIOUS_DISC_BLESSING_ITEM ? itemB : itemA
      if (!isIn(ArtificialItems, copiedItem)) {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
      /* the copy is kept out of artificialItems, which is pruned when the
         ARTIFICIAL synergy drops, so it survives regardless of the level */
      removeInArray(player.items, Item.DUBIOUS_DISC_BLESSING_ITEM)
      player.items.push(copiedItem)
      player.updateSynergies()
      return
    } else if (itemA === Item.RECYCLE_TICKET || itemB === Item.RECYCLE_TICKET) {
      const recycledItem = itemA === Item.RECYCLE_TICKET ? itemB : itemA
      const recipe = ItemRecipe[recycledItem]
      if (!recipe) {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
      if (Scarves.includes(recycledItem)) {
        removeInArray(player.scarvesItems, recycledItem)
      }
      removeInArray(player.items, itemA)
      removeInArray(player.items, itemB)
      player.items.push(recipe[0])
      player.items.push(recipe[1])
      if (player.blessings?.includes(Blessing.WOBBUFFETS_GOLD_PRIZE)) {
        player.items.push(pickRandomIn(ItemComponents))
      }
      player.updateSynergies()
      return
    } else {
      // find recipe result
      const recipes = Object.entries(ItemRecipe) as [Item, Item[]][]
      for (const [key, value] of recipes) {
        if (
          (value[0] == itemA && value[1] == itemB) ||
          (value[0] == itemB && value[1] == itemA)
        ) {
          result = key
          break
        }
      }
    }

    if (!result) {
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    const allowedCrafts = getGuideAllowedCrafts(this.state)
    if (allowedCrafts && !allowedCrafts.includes(result)) {
      // the step names the items to build; anything else would burn components
      client.send(Transfer.GUIDE_WRONG_CRAFT, allowedCrafts)
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    {
      if (itemA === Item.SILK_SCARF || itemB === Item.SILK_SCARF) {
        const nbScarvesBasedOnNormalSynergy = getSynergyTier(
          player.synergies,
          Synergy.NORMAL
        )
        if (player.scarvesItems.length < nbScarvesBasedOnNormalSynergy) {
          player.scarvesItems.push(result)
        }
      }

      player.items.push(result)
      removeInArray(player.items, itemA)
      removeInArray(player.items, itemB)
      grantRainbowHourEevee(player, result)
    }

    player.updateSynergies()
  }
}

export class OnDragDropItemCommand extends Command<
  GameRoom,
  {
    client: Client
    detail: IDragDropItemMessage
  }
> {
  execute({
    client,
    detail
  }: {
    client: Client
    detail: IDragDropItemMessage
  }) {
    const playerId = client.auth.uid
    const message = {
      updateBoard: true,
      updateItems: true
    }
    const player = this.state.players.get(playerId)
    if (!player || !player.alive) return

    message.updateBoard = false
    message.updateItems = true

    const { zone, index, id: item } = detail

    if (!player.items.includes(item)) {
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    let pokemon: Pokemon | undefined
    if (zone === "flower-pot-zone") {
      const nbPots = getFlowerPotsUnlocked(player).length
      if (index >= nbPots) {
        // has not unlocked that flower pot yet
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
      pokemon = player.flowerPots[index]
      if (!pokemon || isIn(Mulches, item) === false) {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
      if (item === Item.RICH_MULCH) {
        if (pokemon.evolution === Pkm.DEFAULT) {
          client.send(Transfer.DRAG_DROP_CANCEL, {
            ...message,
            text: "fully_grown" satisfies DisplayText,
            pokemonId: pokemon.id
          })
          return
        }
        const potEvolution = PokemonFactory.createPokemonFromName(
          pokemon.evolution,
          player
        )
        potEvolution.action = PokemonActionState.SLEEP
        /* the pot is replaced by a brand new Pokemon, so any Amaze Mulch buffs
           already spent on it have to be carried across by hand */
        const potBaseline = PokemonFactory.createPokemonFromName(
          pokemon.name,
          player
        )
        potEvolution.addMaxHP(pokemon.hp - potBaseline.hp)
        potEvolution.ap += pokemon.ap - potBaseline.ap
        player.flowerPots[index] = potEvolution
        if (
          potEvolution.evolution === Pkm.DEFAULT &&
          player.blessings?.includes(Blessing.AMAZING_GARDENING)
        ) {
          player.items.push(Item.AMAZE_MULCH)
        }
        removeInArray(player.items, item)
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
    } else if (zone === "berry-tree-zone") {
      const nbTrees = getSynergyTier(player.synergies, Synergy.GRASS)

      if (item === Item.RICH_MULCH && index < nbTrees) {
        player.berryTreesStages[index] = 3
        removeInArray(player.items, item)
      } else if (item === Item.AMAZE_MULCH && index < nbTrees) {
        player.berryTreesType[index] = pickRandomIn(
          GOLDEN_BERRY_TREE_TYPES.filter(
            (b) => player.berryTreesType.includes(b) === false
          )
        )
        player.berryTreesStages[index] = 3
        removeInArray(player.items, item)
      }
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    } else if (zone === "croagunk-trade-zone") {
      if (
        this.state.gameMode === GameMode.DOUBLE_UP &&
        this.state.phase === GamePhaseState.PICK
      ) {
        offerTradeItem(this.state, player, item)
      } else {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
    } else {
      const x = index % BOARD_WIDTH
      const y = Math.floor(index / BOARD_WIDTH)
      pokemon = player.getPokemonAt(x, y)
    }

    if (!pokemon) {
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    if (pokemon.supportiveSoul) {
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    if (getGuideLesson(this.state)) {
      const guideItemTarget = getGuideItemTarget(this.state)
      const guideAllowedItems = getGuideAllowedItems(this.state)
      /* Equipping is locked like everything else in a guide: a step opens it by
         naming the body it teaches, and only then. A component dropped on a
         whim is a component the stage that spends it will not find. An empty
         list tells the player nothing equips here, the same way crafting does. */
      if (!guideItemTarget) {
        client.send(Transfer.GUIDE_WRONG_ITEM, [])
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
      if (PkmFamily[pokemon.name] !== PkmFamily[guideItemTarget]) {
        client.send(Transfer.GUIDE_WRONG_TARGET, guideItemTarget)
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
      if (guideAllowedItems && !guideAllowedItems.includes(item)) {
        client.send(Transfer.GUIDE_WRONG_ITEM, guideAllowedItems)
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
    }

    if (item === Item.SPEAKER) {
      let requestSent = false
      if (
        this.state.gameMode === GameMode.DOUBLE_UP &&
        player.doubleUpPartnerId
      ) {
        const partner = this.state.players.get(player.doubleUpPartnerId)
        if (partner && partner.alive) {
          this.room.clients
            .filter((cli) => cli.auth?.uid === partner.id)
            .forEach((cli) =>
              cli.send(Transfer.SPEAKER_REQUEST, {
                playerId: player.id,
                pokemon: pokemon!.name
              })
            )
          requestSent = true
        }
      }
      client.send(
        Transfer.DRAG_DROP_CANCEL,
        requestSent
          ? {
              ...message,
              text: "request_sent" satisfies DisplayText,
              pokemonId: pokemon.id
            }
          : message
      )
      return
    }

    if (
      item === Item.LETTER &&
      isOnBench(pokemon) &&
      pokemon.types.has(Synergy.FLYING)
    ) {
      if (
        [PokemonActionState.EXPLORING, PokemonActionState.DIGGING].includes(
          pokemon.action
        )
      ) {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
      pokemon.action = PokemonActionState.EXPLORING

      const hasFasterDelivery =
        player.blessings?.includes(Blessing.BIG_PECKS) ||
        schemaValues(player.board).some((p) => p.name === Pkm.PELIPPER)
      const baseDelay =
        pokemon.name === Pkm.GYARADOS
          ? 5
          : 2
      // Gyarados keeps its deliberately slow delivery despite being FLYING
      const returnDelay =
        player.blessings?.includes(Blessing.FAST_DELIVERY) &&
        pokemon.types.has(Synergy.FLYING) &&
        pokemon.name !== Pkm.GYARADOS
          ? FAST_DELIVERY_RETURN_DELAY
          : Math.max(1, baseDelay - (hasFasterDelivery ? 1 : 0))

      player.pokemonsExploring.push({
        pokemonId: pokemon.id,
        returnStage: this.state.stageLevel + returnDelay
      })
      removeInArray(player.items, item)
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    if (
      [PokemonActionState.EXPLORING, PokemonActionState.DIGGING].includes(
        pokemon.action
      )
    ) {
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    const onItemDroppedEffects: OnItemDroppedEffect[] = [
      ...(ItemEffects[item]?.filter(
        (effect) => effect instanceof OnItemDroppedEffect
      ) ?? []),
      ...(PassiveEffects[pokemon.passive]?.filter(
        (effect) => effect instanceof OnItemDroppedEffect
      ) ?? [])
    ]
    for (const onItemDroppedEffect of onItemDroppedEffects) {
      const shouldEquipItem = onItemDroppedEffect.apply({
        pokemon,
        player,
        item,
        room: this.room
      })
      if (shouldEquipItem === false) {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
    }

    if (isIn(Dishes, item)) {
      if (
        canEatMoreDishes(pokemon, player.blessings) &&
        !pokemon.dishes.has(item)
      ) {
        pokemon.dishes.add(item)
        pokemon.action = PokemonActionState.EAT
        removeInArray(player.items, item)
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        pokemon.items.add(item) // add the item just in time for the evolution
        const pokemonEvolved = this.room.checkEvolutionsAfterItemAcquired(
          playerId,
          pokemon,
          item
        )
        if (pokemonEvolved) pokemonEvolved.items.delete(item)
        else pokemon.items.delete(item)
        return
      } else {
        client.send(Transfer.DRAG_DROP_CANCEL, {
          ...message,
          text: (pokemon.dishes.size > 0
            ? "belly_full"
            : "not_hungry") satisfies DisplayText,
          pokemonId: pokemon.id
        })
        return
      }
    }
    if (
      item === Item.PRISON_BOTTLE &&
      this.state.gameMode === GameMode.DOUBLE_UP &&
      this.state.phase === GamePhaseState.PICK &&
      !this.state.finale &&
      isOnBench(pokemon)
    ) {
      if (
        pokemon.rarity === Rarity.UNIQUE ||
        pokemon.rarity === Rarity.LEGENDARY ||
        pokemon.name === Pkm.EGG ||
        pokemon.name === Pkm.SUBSTITUTE ||
        pokemon.name === Pkm.PILLAR_WOOD ||
        pokemon.name === Pkm.PILLAR_IRON ||
        pokemon.name === Pkm.PILLAR_CONCRETE ||
        pokemon.name === Pkm.EEVEE ||
        pokemon.name === Pkm.EEVEE_MAFIA ||
        pokemon.name === Pkm.VAPOREON ||
        pokemon.name === Pkm.JOLTEON ||
        pokemon.name === Pkm.FLAREON ||
        pokemon.name === Pkm.ESPEON ||
        pokemon.name === Pkm.UMBREON ||
        pokemon.name === Pkm.LEAFEON ||
        pokemon.name === Pkm.GLACEON ||
        pokemon.name === Pkm.SYLVEON ||
        pokemon.items.has(Item.RARE_CANDY) ||
        /* the generic check below is never reached: this branch returns first,
           and a manifestation must not leave the player it is bound to */
        isPokemonManifestationLocked(player, pokemon.id)
      ) {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
      sendPokemonToPartner(this.state, this.room, player, pokemon, item)
      return
    }

    if (isIn(UnholdableItems, item) && !ConsumableItems.includes(item)) {
      // Unholdable and non-consummable items should have zero interaction on any Pokémon
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    if (
      pokemon.canHoldItems === false &&
      !(isIn(UnholdableItems, item) && isIn(ConsumableItems, item)) // unholdable consumable items like dishes or dojo tickets can still be used on pokemon that can't hold items, since they are consumed right away and don't actually get held by the pokemon
    ) {
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    if (isPokemonManifestationLocked(player, pokemon.id)) {
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    const isBasicItem = ItemComponents.includes(item)
    const existingBasicItemToCombine = schemaValues(pokemon.items).find((i) =>
      ItemComponents.includes(i)
    )

    /* BERRY_BREAKFAST: a full Pokémon can still take a berry, as a dish rather
       than a held item — it is eaten at the start of the fight */
    if (
      pokemon.items.size >= getItemCapacity(this.state.specialGameRule) &&
      isIn(Berries, item) &&
      player.blessings?.includes(Blessing.BERRY_BREAKFAST) &&
      !pokemon.dishes.has(item)
    ) {
      pokemon.dishes.add(item)
      pokemon.action = PokemonActionState.EAT
      removeInArray(player.items, item)
      client.send(Transfer.DRAG_DROP_CANCEL, message)
      return
    }

    // check if full items and nothing to combine
    if (
      pokemon.items.size >= getItemCapacity(this.state.specialGameRule) &&
      !(isBasicItem && existingBasicItemToCombine) &&
      !isIn(UnholdableItems, item)
    ) {
      client.send(Transfer.DRAG_DROP_CANCEL, {
        ...message,
        text: "full" satisfies DisplayText,
        pokemonId: pokemon.id
      })
      return
    }

    if (!isBasicItem && pokemon.items.has(item)) {
      // prevent adding twice the same item
      client.send(Transfer.DRAG_DROP_CANCEL, {
        ...message,
        text: "already_held" satisfies DisplayText,
        pokemonId: pokemon.id
      })
      return
    }

    if (isBasicItem && existingBasicItemToCombine) {
      const recipe = Object.entries(ItemRecipe).find(
        ([_result, recipe]) =>
          (recipe[0] === existingBasicItemToCombine && recipe[1] === item) ||
          (recipe[0] === item && recipe[1] === existingBasicItemToCombine)
      )

      if (!recipe) {
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }

      const itemCombined = recipe[0] as Item

      const allowedOnPokemon = getGuideAllowedCrafts(this.state)
      if (allowedOnPokemon && !allowedOnPokemon.includes(itemCombined)) {
        client.send(Transfer.GUIDE_WRONG_CRAFT, allowedOnPokemon)
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }

      if (recipe[1].includes(Item.SILK_SCARF)) {
        const nbScarvesBasedOnNormalSynergy = getSynergyTier(
          player.synergies,
          Synergy.NORMAL
        )
        if (player.scarvesItems.length < nbScarvesBasedOnNormalSynergy) {
          player.scarvesItems.push(itemCombined)
        }
      }

      pokemon.items.delete(existingBasicItemToCombine)
      removeInArray(player.items, item)
      grantRainbowHourEevee(player, itemCombined)

      if (pokemon.items.has(itemCombined)) {
        // pokemon already has the combined item so the second one pops off and go to player inventory
        player.items.push(itemCombined)
      } else if (
        (isIn(SynergyStones, itemCombined) ||
          itemCombined === Item.FRIEND_BOW) &&
        pokemon.types.has(SynergyGivenByItem[itemCombined])
      ) {
        // combining into a synergy stone on a pokemon that already has this synergy makes the stone pops off and go to player inventory
        player.items.push(itemCombined)
      } else {
        pokemon.addItem(itemCombined, player)
      }
    } else {
      if (
        isIn(SynergyStones, item) &&
        pokemon.types.has(SynergyGivenByItem[item])
      ) {
        // prevent combining into a synergy stone on a pokemon that already has this synergy
        client.send(Transfer.DRAG_DROP_CANCEL, message)
        return
      }
      pokemon.addItem(item, player)
      removeInArray(player.items, item)
    }

    if (pokemon.items.has(Item.SHINY_CHARM)) {
      pokemon.shiny = true
    }

    this.room.checkEvolutionsAfterItemAcquired(playerId, pokemon, item)

    if (pokemon.items.has(item) && isIn(UnholdableItems, item)) {
      // if the item is not holdable, we immediately remove it from the pokemon items
      // It is added just in time for ItemEvolutionRule to be checked
      pokemon.items.delete(item)
      if (!isIn(ConsumableItems, item) && !isIn(Mulches, item)) {
        // item is not holdable and has not been consumed, so we add it back to player items
        player.items.push(item)
      }
    }

    player.updateSynergies()
  }
}

export class OnSellPokemonCommand extends Command<
  GameRoom,
  {
    client: Client
    pokemonId: string
  }
> {
  execute({ client, pokemonId }) {
    const player = this.state.players.get(client.auth.uid)

    if (!player || !player.alive) return

    const pokemon = player.board.get(pokemonId)
    if (!pokemon) return
    if (!isOnBench(pokemon) && this.state.phase === GamePhaseState.FIGHT) {
      return // can't sell a pokemon currently fighting
    }
    if (
      [PokemonActionState.EXPLORING, PokemonActionState.DIGGING].includes(
        pokemon.action
      )
    ) {
      return
    }

    if (
      pokemon.supportiveSoul ||
      canSell(pokemon.name, this.state.specialGameRule) === false
    ) {
      return
    }

    if (
      isGrudgeSubstitute(pokemon) &&
      player.money < GRUDGE_SUBSTITUTE_SELL_COST
    ) {
      return // getting rid of it has to be paid for
    }

    const lesson = getGuideLesson(this.state)
    if (
      lesson &&
      isProtectedFromSelling(lesson, pokemon.name, this.state.stageLevel)
    ) {
      // the rest of the script is built on this line, so it cannot be sold away
      this.room.clients
        .find((cli) => cli.auth.uid === player.id)
        ?.send(Transfer.GUIDE_PROTECTED_UNIT, pokemon.name)
      return
    }

    const isManifested = isPokemonManifestationLocked(player, pokemonId)
    if (isManifested) {
      removeInArray(player.manifestedPokemonIds, pokemonId)
    }

    player.board.delete(pokemonId)
    this.state.shop.releasePokemon(pokemon.name, player, this.state)

    const sellPrice =
      isManifested ||
      (getUniqueFieldCap(player) !== null && pokemon.rarity === Rarity.UNIQUE)
        ? 0
        : getSellPrice(
            pokemon,
            this.state.specialGameRule,
            false,
            player.blessings,
            player.board
          )
    player.addMoney(sellPrice, false, null)
    pokemon.items.forEach((it) => {
      player.items.push(it)
    })

    player.updateSynergies()
    if (pokemon.awakeningRock !== "") {
      // sold mid-crystallisation: hand the weather rock straight back to the
      // bench now (the Pokémon is already off the board, so it no longer counts
      // as "charging").
      player.updateWeatherRocks()
    }
    player.boardSize = this.room.getTeamSize(player.board, player.blessings)
    pokemon.afterSell(player)
  }
}

export class OnShopRerollCommand extends Command<GameRoom, string> {
  execute(id) {
    const player = this.state.players.get(id)
    if (!player || !player.alive) return
    if (!isGuideActionAllowed(this.state, "reroll")) return
    const thinkFastActive =
      this.state.phase === GamePhaseState.PICK &&
      player.blessingsRef?.thinkFastActive === true
    const rollCost =
      player.shopFreeRolls > 0 || thinkFastActive
        ? 0
        : getRerollCost(this.state.specialGameRule, this.state.stageLevel)
    const canRoll = (player?.money ?? 0) >= rollCost

    if (canRoll) {
      player.gameStats.rerollCount++
      player.money -= rollCost
      onFossilUnlockReroll(player)
      if (!thinkFastActive && player.shopFreeRolls > 0) {
        player.shopFreeRolls--
      } else if (!thinkFastActive) {
        const repeatBallHolders = schemaValues(player.board).filter((p) =>
          p.items.has(Item.REPEAT_BALL)
        )
        if (repeatBallHolders.length > 0)
          player.shopFreeRolls += repeatBallHolders.length
      }
      if (player.blessings?.includes(Blessing.WISE_SPENDING)) {
        player.addExperience(WISE_SPENDING_EXP_PER_REROLL)
      }
      /* chains on its own: the free roll re-enters this command and rolls again */
      if (
        player.blessings?.includes(Blessing.PRISMATIC_REROLL) &&
        chance(PRISMATIC_REROLL_CHANCE)
      ) {
        player.shopFreeRolls += PRISMATIC_REROLL_FREE_ROLLS
      }
      this.state.shop.assignShop(player, true, this.state)
    }
  }
}

export class OnLockCommand extends Command<GameRoom, string> {
  execute(id) {
    const player = this.state.players.get(id)
    if (!player || !player.alive) return
    player.shopLocked = !player.shopLocked
  }
}

export class OnSpectateCommand extends Command<
  GameRoom,
  {
    id: string
    spectatedPlayerId: string
  }
> {
  execute({ id, spectatedPlayerId }) {
    const player = this.state.players.get(id)
    if (!player) return
    player.spectatedPlayerId = spectatedPlayerId
  }
}

export class OnLevelUpCommand extends Command<
  GameRoom,
  {
    id: string
  }
> {
  execute(id) {
    const player = this.state.players.get(id)
    if (!player || !player.alive) return
    if (!isGuideActionAllowed(this.state, "levelup")) return
    if (player.blessings?.includes(Blessing.WISE_SPENDING)) return

    const cost = getLevelUpCost(this.state.specialGameRule)
    if (player.money >= cost && player.experienceManager.canLevelUp()) {
      player.addExperience(XP_PER_PURCHASE)
      player.money -= cost
      if (player.blessings?.includes(Blessing.UP_IS_UP)) {
        player.addBlessingGold(UP_IS_UP_GOLD)
        player.life = Math.min(player.maxLife, player.life + UP_IS_UP_LIFE)
      }
    }
  }
}

export class OnPickBerryCommand extends Command<
  GameRoom,
  {
    playerId: string
    berryIndex: number
  }
> {
  execute({ playerId, berryIndex }) {
    const player = this.state.players.get(playerId)
    if (!player || !player.alive) return
    /* Grass grows berries on its own, so a guide would otherwise hand the
       player free items on every stage the lesson is not talking about them.
       Harvesting opens only on the stages that ripen a tree on purpose. */
    if (getGuideLesson(this.state) && getGuideRipeBerries(this.state) === null) {
      return
    }
    if (player.berryTreesStages[berryIndex] >= 3) {
      player.berryTreesStages[berryIndex] = 0
      const type =
        getSynergyTier(player.synergies, Synergy.GRASS) === 4
          ? GOLDEN_BERRY_TREE_TYPES[berryIndex]
          : player.berryTreesType[berryIndex]
      player.items.push(type)
      onFossilUnlockHarvest(player)
    }
  }
}

export class OnJoinCommand extends Command<GameRoom, { client: Client }> {
  async execute({ client }) {
    try {
      //logger.debug("onJoin", client.auth.uid)
      if (!client.userData) client.userData = {}
      client.userData.spectatedPlayerId = client.auth.uid
      client.view = new StateView()
      const players = schemaValues(this.state.players)
      const connectedPlayer = players.find((p) => p.id === client.auth.uid)
      if (connectedPlayer) {
        /*logger.info(
          `${client.auth.displayName} (${client.id}) joined game room ${this.room.roomId}`
        )*/
        client.view.add(connectedPlayer)
        if (this.state.players.size >= MAX_PLAYERS_PER_GAME) {
          const humanPlayers = players.filter((p) => !p.isBot)
          if (humanPlayers.length === 1) {
            humanPlayers[0].titles.add(Title.LONE_WOLF)
          }
        }
      } else {
        this.state.spectators.add(client.auth.uid)
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

export class OnUpdateCommand extends Command<
  GameRoom,
  {
    deltaTime: number
  }
> {
  execute({ deltaTime }) {
    if (deltaTime) {
      /* The clock stops while a guide step is waiting on the player, so reading
         never costs them the round and a scripted carousel never closes before
         they have taken what it is holding. Everything else still ticks: the
         minigame has to keep running or the carousel would be unplayable. */
      if (!this.isGuidePaused()) {
        this.state.time -= deltaTime
        if (Math.round(this.state.time / 1000) != this.state.roundTime) {
          this.state.roundTime = Math.round(this.state.time / 1000)
        }
      }
      /* outside the phase branches: the avatar walks through both the pick
         phase and the fight, which is what makes it feel like one thing */
      updatePlayerAvatars(this.state, deltaTime)
      if (this.state.time < 0) {
        this.state.updatePhaseNeeded = true
      } else if (this.state.phase == GamePhaseState.FIGHT) {
        let everySimulationFinished = true

        this.state.simulations.forEach((simulation) => {
          if (!simulation.finished) {
            if (simulation.started) simulation.update(deltaTime)
            everySimulationFinished = false
          }
        })

        if (this.state.gameMode === GameMode.DOUBLE_UP) {
          grantRobinGemsForFinishedDoubleUpSimulations(this.state)
          if (!this.state.finale) this.checkDoubleUpReinforcements()
        }
        if (everySimulationFinished && !this.state.updatePhaseNeeded) {
          // wait for 3 seconds victory anim before moving to next stage
          this.state.time = 3000
          this.state.updatePhaseNeeded = true
        }
      } else if (this.state.phase === GamePhaseState.TOWN) {
        this.room.miniGame.update(deltaTime)
      }
      if (this.state.updatePhaseNeeded && this.state.time < 0) {
        return [new OnUpdatePhaseCommand()]
      }
    }
  }
  isGuidePaused(): boolean {
    if (this.state.gameMode !== GameMode.GUIDE) return false
    const player = schemaValues(this.state.players).find((p) => !p.isBot)
    if (!player) return false

    if (this.state.phase === GamePhaseState.TOWN) {
      // a scripted carousel waits until its component has been collected
      const target = getGuideCarouselTarget(this.state)
      if (target === null) return false
      /* Read the avatar, not the inventory. A carousel item only moves into
         player.items when the town phase ends, and the phase cannot end while
         this pause is holding the clock - waiting on the inventory deadlocks
         the run the moment the player picks the component up. */
      let hasPickedUp = false
      this.state.avatars.forEach((avatar) => {
        if (avatar.id === player.id && avatar.itemId !== "") hasPickedUp = true
      })
      if (!hasPickedUp) return true
      /* Nobody else is on the map, so there is nothing to wait for once the
         component is in hand - cut whatever is left of the carousel short. */
      if (this.state.time > GUIDE_CAROUSEL_OUTRO_DURATION) {
        this.state.time = GUIDE_CAROUSEL_OUTRO_DURATION
      }
      return false
    }

    if (this.state.phase !== GamePhaseState.PICK) return false
    /* The clock stops only while a step is still waiting on the player, so
       reading is never rushed but the round still resolves on its own once they
       are done - the same rhythm as any other autochess turn. */
    updateGuideProgress(this.state, player)
    /* A pity floor counts the rolls done on its own step, so its baseline moves
       with the step - otherwise a stage's second roll lesson inherits the first
       one's count and resolves instantly. */
    if (this.state.guideTrackedStep !== this.state.guideStep) {
      this.state.guideTrackedStep = this.state.guideStep
      this.state.guideStepRerollBase = player.gameStats.rerollCount
    }

    const waitingOnPlayer = isGuideWaitingOnPlayer(this.state)
    /* Nothing left to ask on this stage, so cut the rest of the timer short the
       same way a finished carousel does. This also covers the stages a lesson
       skips entirely, which have no steps to wait on in the first place. */
    if (
      !waitingOnPlayer &&
      this.state.time > GUIDE_PICK_OUTRO_DURATION
    ) {
      this.state.time = GUIDE_PICK_OUTRO_DURATION
    }
    return waitingOnPlayer
  }

  /* A stage's opening shop is dealt the units its steps need, but a rolling step
     earlier on the same stage washes that away - so a step that names a unit
     re-offers it if it has gone. Rolling steps are exempt: there the search is
     the lesson, and the pity floor is what bounds it. */

  checkDoubleUpReinforcements() {
    this.state.simulations.forEach((sim) => {
      if (!sim.finished || sim.reinforcementsSent) return
      if (Date.now() - sim.finishedAt < 3000) return
      if (!sim.winnerId) return // draw, no reinforcements

      // Ghost battle where the ghost side wins → no reinforcements
      if (sim.isGhostBattle && sim.winnerId === sim.redPlayerId) return

      const winnerIsBlue = sim.winnerId === sim.bluePlayerId
      const winnerPlayer = winnerIsBlue ? sim.bluePlayer : sim.redPlayer
      if (!winnerPlayer) return // PVE fight

      // Find partner's running sim via doubleUpPartnerId on the Player
      const partnerPlayer = this.state.players.get(
        winnerPlayer.doubleUpPartnerId
      )
      if (!partnerPlayer?.alive) return

      const partnerSim = this.state.simulations.get(partnerPlayer.simulationId)
      if (!partnerSim || partnerSim.finished || !partnerSim.started) return

      sim.reinforcementsSent = true
      this.sendReinforcements(sim, partnerSim)
    })
  }

  sendReinforcements(source: Simulation, target: Simulation) {
    const winnerIsBlue = source.winnerId === source.bluePlayerId
    const winnerPlayer = winnerIsBlue ? source.bluePlayer : source.redPlayer
    if (!winnerPlayer) return

    const partnerIsBlue =
      target.bluePlayer?.id === winnerPlayer.doubleUpPartnerId
    const partnerTeam = partnerIsBlue ? Team.BLUE_TEAM : Team.RED_TEAM

    if (
      !partnerIsBlue &&
      target.redPlayer?.id !== winnerPlayer.doubleUpPartnerId
    ) {
      return
    }

    const winningTeam = winnerIsBlue ? source.blueTeam : source.redTeam
    const survivors: PokemonEntity[] = []
    winningTeam.forEach((e) => {
      if (e.hp > 0 && !e.name.startsWith("UNOWN"))
        survivors.push(e as PokemonEntity)
    })
    if (survivors.length === 0) return

    for (const entity of survivors) {
      const coord = target.getFirstFreeCell(partnerTeam)
      if (!coord) {
        // logger.warn(`[DoubleUp] No free cell for reinforcement — stopping`)
        break
      }
      const reinforcement = target.addPokemon(
        entity.refToBoardPokemon as Pokemon,
        coord.x,
        coord.y,
        partnerTeam,
        true,
        true // skip synergy effects from partner
      )
      reinforcement.sourcePlayer = winnerPlayer
      // e.g. comfey will be attached here
      reinforcement.items.clear()
      entity.items.forEach((item) => reinforcement.items.add(item))
      // negative status effects are not carried over, therefore do not bring over (most) positive status effects
      // positive effects we ignore: spikeArmor, magigBounce, reflect, pokerus, rage

      // bring over light status and exception for these two positive status effects: runeProtect, resurrection
      reinforcement.status.light = entity.status.light
      reinforcement.status.resurrection = entity.status.resurrection
      reinforcement.status.runeProtect = entity.status.runeProtect
      reinforcement.status.runeProtectCooldown =
        entity.status.runeProtectCooldown

      // bring over current active fields (debatable, since technically positie status in wiki)
      reinforcement.status.grassField = entity.status.grassField
      reinforcement.status.fairyField = entity.status.fairyField
      reinforcement.status.psychicField = entity.status.psychicField
      reinforcement.status.electricField = entity.status.electricField

      // bring over current stats
      reinforcement.atk = entity.atk
      reinforcement.def = entity.def
      reinforcement.speDef = entity.speDef
      reinforcement.ap = entity.ap
      reinforcement.speed = entity.speed
      reinforcement.critChance = entity.critChance
      reinforcement.critPower = entity.critPower
      reinforcement.range = entity.range
      reinforcement.luck = entity.luck
      reinforcement.dodge = entity.dodge
      reinforcement.shield = entity.shield
      reinforcement.maxHP = entity.maxHP
      reinforcement.hp = Math.min(entity.hp, reinforcement.maxHP)
      reinforcement.pp = 0

      // bring over item stack counts to prevent double-stacking from current stats
      // TODO: after merge, add JAC specifig item counts: WIDE_LENS, GRIP_CLAW, EXP_CHARM
      reinforcement.count.muscleBandCount = entity.count.muscleBandCount
      reinforcement.count.machRibbonCount = entity.count.machRibbonCount
      reinforcement.count.upgradeCount = entity.count.upgradeCount
      reinforcement.count.soulDewCount = entity.count.soulDewCount
      reinforcement.count.soundCryCount = entity.count.soundCryCount
      reinforcement.count.wideLensCount = entity.count.wideLensCount
      reinforcement.count.gripClawCount = entity.count.gripClawCount
      reinforcement.count.expCharmCount = entity.count.expCharmCount

      // overwrite with players synergy effects
      Array.from(reinforcement.effects).forEach((e) =>
        reinforcement.effects.delete(e)
      )
      entity.effects.forEach((e) => reinforcement.effects.add(e))
      reinforcement.effectsSet = new Set(entity.effectsSet)

      reinforcement.heroBlessings = new Set(
        [...entity.heroBlessings].filter(
          (blessing) => !SIMULATION_SCOPED_HERO_BLESSINGS.includes(blessing)
        )
      )
      reinforcement.isBlessedHero = reinforcement.heroBlessings.size > 0
      reinforcement.skill = entity.skill
      reinforcement.maxPP = entity.maxPP
      reinforcement.axeBlastExecuteChance = entity.axeBlastExecuteChance
      reinforcement.ignited = entity.ignited
    }
    // apply ghost curses, outside the loop to avoid multiple applications
    const opponentTeam =
      partnerTeam === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM
    const ghostCurseEffects = [
      EffectEnum.CURSE_OF_VULNERABILITY,
      EffectEnum.CURSE_OF_WEAKNESS,
      EffectEnum.CURSE_OF_TORMENT,
      EffectEnum.CURSE_OF_FATE
    ]
    ghostCurseEffects.forEach((curse) => {
      if (survivors.some((e) => e.effects.has(curse))) {
        target.applyCurse(curse, opponentTeam)
      }
    })

    const winnerClient = this.room.clients.find(
      (cli) => cli.auth.uid === winnerPlayer.id
    )
    winnerClient?.send(Transfer.DOUBLE_UP_REINFORCEMENT_SENT, {
      partnerPlayerId: winnerPlayer.doubleUpPartnerId
    })
  }
}

function grantRobinGemsForFinishedDoubleUpSimulations(state: GameState) {
  state.simulations.forEach((simulation) => {
    if (!simulation.finished || simulation.robinGemsRewardProcessed) return
    simulation.robinGemsRewardProcessed = true
    if (!simulation.winnerId || simulation.redPlayerId === "pve") return
    if (
      simulation.isGhostBattle &&
      simulation.winnerId === simulation.redPlayerId
    ) {
      return
    }
    const winner =
      simulation.winnerId === simulation.bluePlayerId
        ? simulation.bluePlayer
        : simulation.redPlayer
    if (winner) grantRobinGemsReward(winner, state)
  })
}

/* A PVE board has no Player, so nothing ever computed its synergies and every
   wild encounter fought with none active. Slowking's classes are a Psychic comp
   and are meant to play like one, so the board's own synergies are derived here
   and handed to the simulation. */
function buildPveEffects(board: MapSchema<Pokemon>): Set<EffectEnum> {
  const synergies = new Synergies(computeSynergies(schemaValues(board)))
  const effects = new Effects()
  effects.update(synergies, board)
  return new Set(effects)
}

export class OnUpdatePhaseCommand extends Command<GameRoom> {
  execute() {
    this.state.updatePhaseNeeded = false
    if (this.state.phase == GamePhaseState.TOWN) {
      this.stopTownPhase()
      /* Normally Stage level is bumped after a fighting phase, but since magikarp is round 1, we need to increase stage level from 0 -> 1 to avoid a PVP round 1. There is probably a better solution*/
      if (this.state.stageLevel === 0) {
        this.state.stageLevel = 1
      }
      this.initializePickingPhase()
    } else if (this.state.phase == GamePhaseState.PICK) {
      this.stopPickingPhase()
      this.checkForLazyTeam()
      this.initializeFightingPhase()
    } else if (this.state.phase == GamePhaseState.FIGHT) {
      this.stopFightingPhase()
      if (
        (ItemCarouselStages.includes(this.state.stageLevel) ||
          PortalCarouselStages.includes(this.state.stageLevel)) &&
        !this.state.gameFinished
      ) {
        this.initializeTownPhase()
      } else {
        this.initializePickingPhase()
      }
    }
  }

  computeAchievements() {
    this.state.players.forEach((player) => {
      updatePlayerTitlesAfterFight(player, this.state)
      player.updateGameStats(this.state)
    })
  }

  checkEndGame(): boolean {
    if (this.state.gameMode === GameMode.DOUBLE_UP) {
      return this.checkEndGameDoubleUp()
    }

    if (this.state.gameMode === GameMode.GUIDE) {
      return this.checkEndGameGuide()
    }

    const playersAlive = schemaValues(this.state.players).filter((p) => p.alive)

    if (playersAlive.length <= 1) {
      this.state.gameFinished = true
      const winner = playersAlive[0]
      if (winner) {
        /* there is a case where none of the players is alive because
         all the remaining players are dead due to a draw battle.
         In that case, they all already received their rank with checkDeath function */
        const client = this.room.clients.find(
          (cli) => cli.auth.uid === winner.id
        )
        if (client) {
          client.send(Transfer.FINAL_RANK, 1)
        }
      }
      this.clock.setTimeout(() => {
        // dispose the room automatically after 30 seconds
        this.room.broadcast(Transfer.GAME_END)
        this.room.disconnect()
      }, 30 * 1000)

      return true
    }

    return false
  }

  /* A guide run is solo, so the usual "last player standing" test would end it
     on the first check. It ends when the scripted stages run out instead. */
  checkEndGameGuide(): boolean {
    // checked before the stage counter is bumped, so the last scripted fight is
    // the one that ends the run
    const lesson = getGuideLesson(this.state)
    if (!lesson || this.state.stageLevel < lesson.lastStage) return false

    this.state.gameFinished = true
    /* No FINAL_RANK: finishing a lesson is not winning a game, and the podium
       screen would congratulate the player for beating a scripted opponent. */
    this.clock.setTimeout(() => {
      this.room.broadcast(Transfer.GAME_END)
      this.room.disconnect()
    }, 30 * 1000)
    return true
  }

  checkEndGameDoubleUp(): boolean {
    const playersAlive = schemaValues(this.state.players).filter((p) => p.alive)

    if (this.state.finale) {
      // The finale resolves after the single round where the partners fought
      // each other. Carousel and wild battle stages still play out first.
      const duelPlayed = playersAlive.some((p) => {
        const lastFight = p.history.at(-1)
        return lastFight && lastFight.id === p.doubleUpPartnerId
      })
      if (!duelPlayed && playersAlive.length >= 2) return false

      this.state.gameFinished = true
      playersAlive.forEach((winner) => {
        // any dead finalist already received their FINAL_RANK from checkDeath
        const client = this.room.clients.find(
          (cli) => cli.auth.uid === winner.id
        )
        if (client) client.send(Transfer.FINAL_RANK, 1)
      })
      this.clock.setTimeout(() => {
        this.room.broadcast(Transfer.GAME_END)
        this.room.disconnect()
      }, 30 * 1000)
      return true
    }

    const aliveTeams = new Set(playersAlive.map((p) => p.doubleUpTeamId))

    if (aliveTeams.size <= 1) {
      if (playersAlive.length === 2) {
        // Last team standing with both partners alive: the finale begins.
        // Both keep rank 1 whatever happens next; the game cycle continues
        // with the partners fighting each other until one falls below 0 HP.
        this.startFinale(playersAlive)
        return false
      }
      this.state.gameFinished = true
      playersAlive.forEach((winner) => {
        const client = this.room.clients.find(
          (cli) => cli.auth.uid === winner.id
        )
        if (client) client.send(Transfer.FINAL_RANK, 1)
      })
      this.clock.setTimeout(() => {
        this.room.broadcast(Transfer.GAME_END)
        this.room.disconnect()
      }, 30 * 1000)
      return true
    }

    return false
  }

  startFinale(finalists: Player[]) {
    this.state.finale = true
    this.room.broadcast(Transfer.FINALE_START, {
      playerIds: finalists.map((p) => p.id)
    })
    finalists.forEach((player) => {
      // Refund any pending Croagunk trade offer and dismiss the trader
      if (player.doubleUpTradeOffer) {
        player.items.push(player.doubleUpTradeOffer as Item)
        player.doubleUpTradeOffer = ""
      }
      const croagunk = [...player.wanderers.values()].find(
        (w) => w.type === WandererType.CROAGUNK_TRADE
      )
      if (croagunk) player.wanderers.delete(croagunk.id)
      // Discard pending armory gift choices
      player.choices
        .filter((choice) => choice.type === "armory_assist")
        .forEach((choice) => removeInArray(player.choices, choice))
      // Partners can no longer send Pokémon to each other
      removeInArray(player.items, Item.PRISON_BOTTLE)
      player.doubleUpSendCooldown = 0
    })
  }

  computeIncome(isPVE: boolean, specialGameRule: SpecialGameRule | null) {
    this.state.players.forEach((player) => {
      let income = 0
      if (player.alive && !player.isBot) {
        const nbGimmighoulCoins = player.items.filter(
          (item) => item === Item.GIMMIGHOUL_COIN
        ).length
        const nbAmuletCoins =
          player.items.filter((item) => item === Item.AMULET_COIN).length +
          schemaValues(player.board).filter((pokemon) =>
            pokemon.items.has(Item.AMULET_COIN)
          ).length
        const nbRedScales = player.items.filter(
          (item) => item === Item.RED_SCALE
        ).length
        player.maxInterest = 5 + nbGimmighoulCoins - nbAmuletCoins
        if (specialGameRule !== SpecialGameRule.BLOOD_MONEY) {
          player.interest = max(player.maxInterest)(
            Math.floor(player.money / 10)
          )
          income += player.interest
        }
        if (!isPVE) {
          income += max(5)(player.streak)
        }
        income += 5
        income += nbRedScales * 5
        player.addMoney(income, true, null)
        if (income > 0) {
          const client = this.room.clients.find(
            (cli) => cli.auth.uid === player.id
          )
          client?.send(Transfer.PLAYER_INCOME, income)
        }
        player.addExperience(2)
      }
    })
  }

  checkDeath() {
    const newlyDead: Player[] = []

    if (this.state.gameMode === GameMode.GUIDE) {
      // a lesson is never lost: a scripted round still costs life, but running
      // out of it must not cut the guide short
      this.state.players.forEach((player) => {
        if (player.life <= 0) player.life = 1
      })
      return
    }

    if (this.state.gameMode === GameMode.DOUBLE_UP) {
      const teams = new Map<string, Player[]>()
      this.state.players.forEach((player) => {
        if (!player.alive || !player.doubleUpTeamId) return
        const team = teams.get(player.doubleUpTeamId) ?? []
        team.push(player)
        teams.set(player.doubleUpTeamId, team)
      })
      teams.forEach((team) => {
        if (!team.some((player) => player.life <= 0)) return
        const protector = team.find(
          (player) =>
            player.blessings?.includes(Blessing.STURDY) &&
            !player.sturdyTriggered
        )
        if (protector) this.triggerSturdy(protector, team)
      })
    }

    // Pass 1: mark all dead, release shop/board
    this.state.players.forEach((player: Player) => {
      if (player.life <= 0 && player.alive) {
        if (
          player.blessings?.includes(Blessing.STURDY) &&
          !player.sturdyTriggered
        ) {
          this.triggerSturdy(player, [player])
          return
        }
        if (!player.isBot) {
          this.state.shop.releaseCurrentShop(player, this.state)
          player.board.forEach((pokemon) => {
            this.state.shop.releasePokemon(pokemon.name, player, this.state)
          })
        }
        player.alive = false
        removePlayerAvatar(this.state, player.id)
        player.doubleUpEliminationRound = this.state.stageLevel
        player.spectatedPlayerId = player.id
        newlyDead.push(player)
      }
    })

    // Pass 2: rank all dead together
    if (newlyDead.length > 0 && this.state.gameMode === GameMode.DOUBLE_UP) {
      this.room.rankPlayers()
    }

    // Pass 3: send correct rank to each
    newlyDead.forEach((player) => {
      const client = this.room.clients.find((cli) => cli.auth.uid === player.id)
      if (client) {
        client.send(Transfer.FINAL_RANK, player.rank)
      }
    })
  }

  triggerSturdy(protector: Player, protectedPlayers: Player[]) {
    protector.sturdyTriggered = true
    protectedPlayers.forEach((player) => {
      /* outside the finale both partners already sit on the same life, but
         during it they diverge and a healthy one must not be dropped to 1 */
      if (player.life <= 0) player.life = 1
    })
    protector.board.forEach((pokemon) => {
      pokemon.addMaxHP(STURDY_MAX_HP)
      pokemon.addDefense(STURDY_DEFENSE)
      pokemon.addSpecialDefense(STURDY_SPECIAL_DEFENSE)
    })
  }

  /* Gold is unlimited in a guide and the level is dictated by the lesson, so a
     player who misplays an earlier stage still arrives at the next one in the
     state its instructions assume. */
  applyGuideStageSetup() {
    if (this.state.gameMode !== GameMode.GUIDE) return
    const player = schemaValues(this.state.players).find((p) => !p.isBot)
    if (!player) return

    player.money = GUIDE_INFINITE_GOLD

    /* Applied before the clients are told the phase changed, so each tree is
       already the right berry by the time the board renders it. */
    const ripeBerries = getGuideRipeBerries(this.state)
    ripeBerries?.forEach((berry, index) => {
      player.berryTreesType[index] = berry
      player.berryTreesStages[index] = 3
    })

    const level = getGuideStartingLevel(this.state)
    if (level !== null) {
      if (player.experienceManager.level !== level) {
        player.experienceManager.level = level
        player.boardSize = this.room.getTeamSize(player.board, player.blessings)
      }
      /* expNeeded is its own synced field and is what the XP bar shows as its
         denominator, so setting the level without it leaves the bar reading
         against the previous level's threshold. */
      player.experienceManager.expNeeded =
        player.experienceManager.expNeededAtLevel(level)
      /* Start the bar far enough along that the lesson's stated number of XP
         purchases is exactly what it takes, instead of leaving the player to
         buy blind from zero. */
      const purchases = getGuideXpPurchases(this.state)
      player.experienceManager.experience =
        purchases === null
          ? 0
          : Math.max(0, (ExpTable[level] ?? 0) - XP_PER_PURCHASE * purchases)
    }
  }

  initializePickingPhase() {
    this.state.phase = GamePhaseState.PICK
    this.state.players.forEach(resetFossilUnlockPickPhaseTrackers)
    anchorPlayerAvatars(this.state)
    this.state.time =
      (StageDuration[this.state.stageLevel] ?? StageDuration.DEFAULT) * 1000


    this.applyGuideStageSetup()

    if (
      this.state.stageLevel === 1 &&
      this.state.specialGameRule === SpecialGameRule.SMEARGLE_PACK
    ) {
      this.state.time += 10000
    }

    /* reading 3 blessings and their rerolls does not fit in a normal pick phase */
    if (
      this.state.blessingsEnabled &&
      (this.state.blessingsUnderTest.length > 0 ||
        BLESSING_SELECTION_STAGES.includes(this.state.stageLevel))
    ) {
      this.state.time += BLESSING_SELECTION_EXTRA_TIME
    }

    if (
      this.state.stageLevel === 1 &&
      this.state.gameMode === GameMode.DOUBLE_UP
    ) {
      this.state.players.forEach((player: Player) => {
        player.items.push(Item.PRISON_BOTTLE)
      })
    }
    if (
      this.state.specialGameRule === SpecialGameRule.LIGHT_SHOW &&
      this.state.stageLevel % 3 === 1
    ) {
      // every 3 stages, Smeargle draws one glowing shape on each player's
      // board and proposes 3 more to choose a second one from. Shapes not yet
      // collected in the sketchbook are prioritized.
      this.state.players.forEach((player: Player) => {
        if (!player.alive) return
        player.choices
          .filter((choice) => choice.type === "scribble_shape")
          .forEach((choice) => removeInArray(player.choices, choice))
        const queue = buildScribbleShapeBag([...player.scribbleShapesCollected])
        player.scribbleShapes.clear()
        if (player.isBot) {
          // bots don't make choices, they get both shapes drawn directly
          rollScribbleShapes(queue.slice(0, 2)).forEach(
            ({ shapeType, cells }) => {
              player.scribbleShapes.push(new ScribbleShape(shapeType, cells))
            }
          )
        } else {
          const proposedShapes = queue.slice(1, 4)
          // the first shape is placed so that it cannot block any of the
          // 3 shapes proposed for the second drawing
          const cells = placeScribbleShapeCompatibleWith(
            queue[0],
            proposedShapes
          )
          player.scribbleShapes.push(new ScribbleShape(queue[0], cells))
          player.choices.push(
            new PlayerChoice({
              type: "scribble_shape",
              scribbleShapes: proposedShapes
            })
          )
        }
      })
    }

    if (this.state.stageLevel % WATER_FOUNTAIN_REROLL_INTERVAL === 1) {
      this.state.players.forEach((player: Player) => {
        if (!player.alive) return
        if (player.blessings?.includes(Blessing.WATER_FOUNTAIN)) {
          rollWaterFountainPonds(player)
        }
      })
    }

    this.state.players.forEach((player: Player) => {
      if (!player.alive) return
      absorbFertileSoil(player)
      grantAdoptionBaby(player)
      serveFestivePicnicDishes(player)
      endIgnitionRound(player)
    })

    if (
      [2, 4].includes(this.state.stageLevel) &&
      this.state.specialGameRule === SpecialGameRule.TECHNOLOGIC
    ) {
      this.state.players.forEach((player: Player) => {
        const itemsSet = Tools.filter(
          (item) => player.artificialItems.includes(item) === false
        )
        player.choices.push(
          new PlayerChoice({
            type: "item",
            items: pickNRandomIn(itemsSet, 3)
          })
        )
      })
    }

    // EVOLUTION_LAB replaces add-picks with a reward choice
    if (
      AdditionalPicksStages.includes(this.state.stageLevel) &&
      !this.state.finale &&
      this.state.specialGameRule === SpecialGameRule.EVOLUTION_LAB
    ) {
      this.state.players.forEach((player: Player) => {
        if (player.isBot) return
        const rewards = pickNRandomIn(
          [...EvolutionLabRewardKinds],
          EVOLUTION_LAB_REWARD_OPTIONS
        )
        const items: Item[] = []
        if (rewards.includes("gem")) {
          const gemCandidates = player.synergies
            .getTopSynergies(2)
            .map((syn) => SynergyGems.find((g) => SynergyGivenByGem[g] === syn))
            .filter((g): g is (typeof SynergyGems)[number] => g != null)
          items.push(
            gemCandidates.length > 0
              ? pickRandomIn(gemCandidates)
              : pickRandomIn([...SynergyGems])
          )
        }
        const items2 = rewards.includes("components")
          ? pickNRandomIn(ItemComponentsNoScarf, EVOLUTION_LAB_REWARD_COMPONENTS)
          : []
        player.choices.push(
          new PlayerChoice({
            type: "evolution_lab_reward",
            rewards,
            items,
            items2
          })
        )
      })
    } else if (
      AdditionalPicksStages.includes(this.state.stageLevel) &&
      !this.state.finale
    ) {
      const pool =
        this.state.stageLevel === AdditionalPicksStages[0]
          ? this.room.additionalUncommonPool
          : this.state.stageLevel === AdditionalPicksStages[1]
            ? this.room.additionalRarePool
            : this.room.additionalEpicPool
      let remainingAddPicks = 8
      this.state.players.forEach((player: Player) => {
        if (!player.isBot) {
          const items = pickNRandomIn(ItemComponentsNoScarf, 3)
          /* A guide picks an additional Pokemon for the component it carries,
             so the component the lesson needs has to actually be on offer. */
          const guidePickItem = getGuideForcedPickItem(this.state)
          if (guidePickItem && !items.includes(guidePickItem)) {
            items[0] = guidePickItem
          }
          // SIX_PACK: a second component paired with each add-pick proposition
          const items2 =
            this.state.specialGameRule === SpecialGameRule.SIX_PACK
              ? pickNRandomIn(ItemComponentsNoScarf, 3)
              : undefined
          const pokemons: Pkm[] = []
          for (let i = 0; i < 3; i++) {
            const p = pool.pop()
            if (p) {
              // If the Pokemon has a regional variant in the player's region, show that instead of the base form.
              // Base form will still be added to the pool for all players
              const regionalVariants = (PkmRegionalVariants[p] ?? []).filter(
                (pkm) =>
                  new PokemonClasses[pkm](pkm).isInRegion(
                    player.map === "town" ? DungeonPMDO.AmpPlains : player.map
                  )
              )
              if (regionalVariants.length > 0) {
                pokemons.push(pickRandomIn(regionalVariants))
              } else {
                pokemons.push(p)
              }
            }
          }
          player.choices.push(
            new PlayerChoice({
              type: "addPick",
              pokemons,
              items,
              items2,
              canReroll:
                this.state.hasBlessing(
                  player.id,
                  Blessing.ADDITIONAL_RETHINK_I
                ) ||
                this.state.hasBlessing(
                  player.id,
                  Blessing.ADDITIONAL_RETHINK_II
                ),
              // Rethink II rerolls each pokemon and item slot independently
              rerollableSlots: this.state.hasBlessing(
                player.id,
                Blessing.ADDITIONAL_RETHINK_II
              )
                ? pokemons.map(() => true)
                : [],
              rerollableItemSlots: this.state.hasBlessing(
                player.id,
                Blessing.ADDITIONAL_RETHINK_II
              )
                ? items.map(() => true)
                : []
            })
          )
          remainingAddPicks--
        }
      })

      repeat(remainingAddPicks)(() => {
        const p = pool.pop()
        if (p) {
          this.state.shop.addAdditionalPokemon(p, this.state)
        }
      })

      // update regional pokemons in case some regional variants of add picks are now available
      this.state.players.forEach((p) => p.updateRegionalPool(this.state, false))
    }

    this.state.players.forEach((player: Player) => {
      if (!player.alive) return
      applyScheduledBlessingGrants(player, this.state)
      applyRecurringBlessingGrants(player, this.state)
      checkBlessingQuests(player, this.state)
      if (ItemCarouselStages.includes(this.state.stageLevel)) {
        applyBlessingTrigger(player, this.state, BlessingTrigger.CAROUSEL_END)
      }
    })

    if (
      this.state.blessingsEnabled &&
      (this.state.blessingsUnderTest.length > 0 ||
        BLESSING_SELECTION_STAGES.includes(this.state.stageLevel))
    ) {
      const lobbyTier = rollBlessingTierForStage(
        this.state.stageLevel,
        this.state.blessingsUnderTest
      )
      this.state.players.forEach((player: Player) => {
        if (player.isBot || !player.alive) return
        const playerTier = peekGreedyWishTier(player, lobbyTier)
        const blessingPool = getBlessingsAvailable(
          playerTier,
          this.state.stageLevel,
          player,
          this.state.blessingsUnderTest
        )
        if (blessingPool.length === 0) return
        consumeGreedyWishTier(player, lobbyTier)
        const drawn = drawBlessingOptions(
          blessingPool,
          BLESSING_OPTIONS_PER_SELECTION * (1 + BLESSING_REROLLS_PER_OPTION),
          getMaxSynergyBlessingOptions(this.state.stageLevel),
          getMaxItemBlessingOptions(this.state.stageLevel)
        )
        const proposedBlessings = drawn.slice(0, BLESSING_OPTIONS_PER_SELECTION)
        const rerollCandidates = drawn.slice(BLESSING_OPTIONS_PER_SELECTION)
        player.choices.push(
          new PlayerChoice({
            type: "blessing",
            blessings: proposedBlessings,
            rerollCandidates,
            /* the spare blessings are shared: any slot can take the next one.
               So a slot can reroll while spares are left, not only when it has
               one of its own. rerollBlessingSlot takes from the same pile */
            rerollableSlots: proposedBlessings.map(
              () => rerollCandidates.length > 0
            )
          })
        )
      })
    }

    if (
      this.state.gameMode === GameMode.DOUBLE_UP &&
      ArmoryAssistStages.includes(this.state.stageLevel) &&
      !this.state.finale
    ) {
      const firstGroup: Player[] = []
      const secondGroup: Player[] = []
      // Make groups by user id
      this.state.players.forEach((p) => {
        if (p.id < p.doubleUpPartnerId) firstGroup.push(p)
        else secondGroup.push(p)
      })
      const partnersToPrompt =
        this.state.stageLevel === ArmoryAssistStages[0] ||
        this.state.stageLevel === ArmoryAssistStages[2]
          ? firstGroup
          : secondGroup

      partnersToPrompt.forEach((p) => {
        const armoryChoices: ArmoryOptions[] = []
        armoryChoices.push(
          pickRandomIn(
            [...Object.values(FreeOptions)].filter(
              (gift) => !p.doubleUpGifts.includes(gift)
            )
          )
        )
        const paidOptions = pickNRandomIn(
          [...Object.values(PaidOptions)].filter(
            (gift) => !p.doubleUpGifts.includes(gift)
          ),
          2
        )
        paidOptions.forEach((op) => armoryChoices.push(op))

        p.choices.push(
          new PlayerChoice({
            type: "armory_assist",
            armoryOptions: armoryChoices
          })
        )
      })
    }

    const commands = new Array<Command>()

    this.state.players.forEach((p) => this.updatePlayerBetweenStages(p))

    this.spawnWanderingPokemons()

    // PvE stage initialization
    const pveStageBase = getPveStage(this.state, this.state.stageLevel)
    if (pveStageBase) {
      const allOptions = pveStageBase.variants
        ? [pveStageBase, ...pveStageBase.variants]
        : [pveStageBase]
      /* Guide stages are authored without variants, so rolling one would index
         past the single option and hand the client a mismatched board. */
      this.state.currentPveVariantIndex =
        this.state.gameMode === GameMode.GUIDE
          ? 0
          : Math.floor(Math.random() * allOptions.length)

      this.state.shinyEncounter =
        this.state.townEncounter === TownEncounters.CELEBI ||
        (this.state.specialGameRule === SpecialGameRule.SHINY_HUNTER &&
          pveStageBase.shinyChance !== undefined) ||
        this.state.specialGameRule === SpecialGameRule.SHINIEST_HUNTER ||
        chance(pveStageBase.shinyChance ?? 0)
    }

    if (
      [14, 24].includes(this.state.stageLevel) &&
      this.state.gameMode === GameMode.DOUBLE_UP &&
      !this.state.finale
    ) {
      this.state.players.forEach((player: Player) => {
        if (player.alive && !player.isBot) {
          player.spawnWanderingPokemon({
            pkm: Pkm.KECLEON_PURPLE,
            shiny: false,
            type: WandererType.DIALOG,
            behavior: WandererBehavior.SPECTATE,
            data: ""
          })
        }
      })
    }

    return commands
  }

  updatePlayerBetweenStages(player: Player) {
    const board = schemaValues(player.board)

    const explorersReturning = player.pokemonsExploring.filter(
      (e) => e.returnStage === this.state.stageLevel
    )

    explorersReturning.forEach((e) => {
      const pokemon = player.board.get(e.pokemonId)
      if (pokemon) {
        pokemon.action = PokemonActionState.IDLE
        const rolledSeed = pickRandomIn(Seeds)
        const bonus =
          pokemon.name === Pkm.GYARADOS
            ? null
            : rollExplorerBonusReward(pokemon.rarity)
        const client = this.room.clients.find((c) => c.auth.uid === player.id)

        if (pokemon.name === Pkm.CORVIKNIGHT) {
          const position = getFirstAvailablePositionInBench(player.board)
          if (position !== null) {
            const mareep = PokemonFactory.createPokemonFromName(
              Pkm.MAREEP,
              player
            )
            mareep.positionX = position
            mareep.positionY = 0
            player.board.set(mareep.id, mareep)
          }
        }

        this.room.clock.setTimeout(() => {
          const seed = player.addSeedToBag(rolledSeed)
          if (bonus) {
            if (bonus === Item.COIN) {
              player.addMoney(1, true, null)
              client?.send(Transfer.PLAYER_INCOME, 1)
            } else if (bonus === Item.NUGGET) {
              player.addMoney(3, true, null)
              client?.send(Transfer.PLAYER_INCOME, 3)
            } else if (bonus === Item.BIG_NUGGET) {
              player.addMoney(10, true, null)
              client?.send(Transfer.PLAYER_INCOME, 10)
            } else {
              player.items.push(bonus)
            }
          }
          if (pokemon.name === Pkm.GYARADOS) player.items.push(Item.RED_SCALE)
          if (client) {
            const dishes: Item[] = []
            if (seed) dishes.push(seed)
            if (bonus) dishes.push(bonus)
            if (pokemon.name === Pkm.GYARADOS) dishes.push(Item.RED_SCALE)
            if (dishes.length > 0) {
              client.send(Transfer.COOK, { pokemonId: pokemon.id, dishes })
            }
          }
        }, 2750)
      }
    })

    player.pokemonsExploring = player.pokemonsExploring.filter(
      (e) => e.returnStage > this.state.stageLevel
    )

    if (explorersReturning.length > 0) {
      this.room.checkEvolutionsAfterPokemonAcquired(player.id)
      player.grantLetterIfEligible()
    }

    // Encounter effects
    if (
      player.items.includes(Item.TREASURE_BOX) &&
      player.life <= TREASURE_BOX_LIFE_THRESHOLD
    ) {
      removeInArray(player.items, Item.TREASURE_BOX)

      let rewards: Item[] = []
      let rewardsIcons: Item[] | undefined = undefined
      switch (this.state.treasureBoxRewardGiven) {
        case "sweets":
          rewardsIcons = [Item.SWEETS]
          rewards = pickNRandomIn(Sweets, 5)
          break
        case "itemComponents":
          rewards = pickNRandomIn(ItemComponents, 4)
          break
        case "componentsAndTickets":
          rewards = [
            ...pickNRandomIn(ItemComponents, 2),
            Item.RECYCLE_TICKET,
            Item.EXCHANGE_TICKET
          ]
          break
        case "craftableItems":
          rewards = pickNRandomIn(CraftableNoStonesOrScarves, 2)
          break
        case "mushrooms":
          rewardsIcons = [Item.MUSHROOMS]
          rewards = [Item.TINY_MUSHROOM, Item.BIG_MUSHROOM, Item.BALM_MUSHROOM]
          break
        case "goldBow":
          rewards = [Item.GOLD_BOW]
          break
        case "gold":
        default:
          rewards = [Item.BIG_NUGGET]
          break
      }

      player.spawnWanderingPokemon({
        pkm: Pkm.XATU,
        shiny: false,
        type: WandererType.DIALOG,
        behavior: WandererBehavior.SPECTATE,
        data: (rewardsIcons ?? rewards).join(";"),
        delay: 3000
      })

      setTimeout(() => {
        if (rewards[0] === Item.BIG_NUGGET) {
          const moneyGained = 10
          player.addMoney(moneyGained, true, null)
          const client = this.room.clients.find(
            (cli) => cli.auth.uid === player.id
          )
          client?.send(Transfer.PLAYER_INCOME, moneyGained)
        } else {
          player.items.push(...rewards)
        }
      }, 10000)
    }

    while (player.items.includes(Item.LEFTOVERS)) {
      player.items.splice(player.items.indexOf(Item.LEFTOVERS), 1)
    }

    // Run after old Leftovers expire, otherwise Sweet Treats' newly converted
    // Leftovers would be removed immediately by the cleanup above.
    if (player.blessings?.includes(Blessing.SWEET_TREATS)) {
      grantSweetTreat(player)
    }

    player.fastFoodDishes.forEach((delivery) => delivery.roundsLeft--)
    player.fastFoodDishes
      .filter((delivery) => delivery.roundsLeft <= 0)
      .forEach((delivery) => {
        const index = player.items.indexOf(delivery.dish)
        if (index >= 0) {
          player.items.splice(index, 1)
          player.items.push(Item.LEFTOVERS)
        }
      })
    player.fastFoodDishes = player.fastFoodDishes.filter(
      (delivery) => delivery.roundsLeft > 0
    )

    const rottingItems: Map<Item, Item> = new Map([
      // order matters to not convert several times in a row
      [Item.SIRUPY_APPLE, Item.LEFTOVERS],
      [Item.SWEET_APPLE, Item.SIRUPY_APPLE],
      [Item.TART_APPLE, Item.SWEET_APPLE]
    ])

    for (const rottingItem of rottingItems.keys()) {
      while (player.items.includes(rottingItem as Item)) {
        const index = player.items.indexOf(rottingItem)
        const newItem = rottingItems.get(rottingItem)
        if (index >= 0 && newItem) {
          // SEE https://github.com/colyseus/schema/issues/192
          player.items.splice(index, 1)
          player.items.push(newItem)
        }
      }
    }

    if (
      this.state.specialGameRule === SpecialGameRule.FIRST_PARTNER &&
      this.state.stageLevel > 1 &&
      this.state.stageLevel < 10 &&
      player.firstPartner
    ) {
      this.room.spawnOnBench(player, player.firstPartner, "spawn")
    }

    if (this.state.specialGameRule === SpecialGameRule.GO_BIG_OR_GO_HOME) {
      board.forEach((pokemon) => {
        pokemon.addMaxHP(5)
      })
    }

    if (
      player.pokemonsTrainingInDojo.some(
        (p) => p.returnStage === this.state.stageLevel
      )
    ) {
      const returningPokemons = player.pokemonsTrainingInDojo.filter(
        (p) => p.returnStage === this.state.stageLevel
      )
      returningPokemons.forEach((p) => {
        const substitute = schemaValues(player.board).find(
          (s) => s.name === Pkm.SUBSTITUTE && s.id === p.pokemon.id
        )
        if (!substitute) return
        p.pokemon.hp += [50, 100, 150][p.ticketLevel - 1] ?? 0
        p.pokemon.maxHP += [50, 100, 150][p.ticketLevel - 1] ?? 0
        p.pokemon.atk += [5, 10, 15][p.ticketLevel - 1] ?? 0
        p.pokemon.ap += [15, 30, 45][p.ticketLevel - 1] ?? 0
        p.pokemon.positionX = substitute.positionX
        p.pokemon.positionY = substitute.positionY
        player.board.delete(substitute.id)
        player.board.set(p.pokemon.id, p.pokemon)
        /* Set schemas needs to be reset to fix reactivity issues ; bug on Colyseus Schema ? */
        p.pokemon.types = new SetSchema<Synergy>(schemaValues(p.pokemon.types))
        p.pokemon.items = new SetSchema<Item>(schemaValues(p.pokemon.items))

        this.room.checkEvolutionsAfterPokemonAcquired(player.id)
        if (player.blessings?.includes(Blessing.TRAINING_MONTAGE)) {
          player.items.push(Item.BRONZE_DOJO_TICKET)
        }
        player.pokemonsTrainingInDojo.splice(
          player.pokemonsTrainingInDojo.indexOf(p),
          1
        )
      })
    }

    // Synergy effects on stage start
    player.synergies
      .getActiveSynergyTiers()
      .flatMap((synergyTier: EffectEnum) => SynergyEffects[synergyTier])
      .filter((p) => p instanceof OnStageStartEffect)
      .forEach((effect) => effect.apply({ player, room: this.room }))

    /* TREASURE_TRAIL and ARCHEOLOGY dig without Ground. Skipped when Ground is
       active, since the loop above already ran the same effect */
    if (
      (player.blessings?.includes(Blessing.TREASURE_TRAIL) ||
        player.blessings?.includes(Blessing.ARCHEOLOGY)) &&
      getSynergyTier(player.synergies, Synergy.GROUND) === 0
    ) {
      groundDigEffect.apply({ player, room: this.room })
    }

    // Pokemon effects on stage start
    board.forEach((pokemon) => {
      // Passives updating every stage
      const passiveEffects =
        PassiveEffects[pokemon.passive]?.filter(
          (p) => p instanceof OnStageStartEffect
        ) ?? []
      passiveEffects.forEach((effect) =>
        effect.apply({ pokemon, player, room: this.room })
      )

      // Held item effects on stage start
      const itemEffects =
        schemaValues(pokemon.items)
          .flatMap((item) => ItemEffects[item])
          ?.filter((p) => p instanceof OnStageStartEffect) ?? []
      itemEffects.forEach((effect) =>
        effect.apply({ pokemon, player, room: this.room })
      )

      // AWAKENING: crystallise a charging weather rock one third per stage. The
      // rock stays locked to the Pokémon while the bar fills and only pops off
      // back to the bench once it is full (the Pokémon shatters into its
      // awakened state) — never mid-charge.
      // Crystallisation only progresses while the Pokémon is fielded on the
      // board; a charging Pokémon parked on the bench simply pauses.
      if (pokemon.awakeningRock !== "" && !isOnBench(pokemon)) {
        if (
          getSynergyTier(player.synergies, Synergy.ROCK) < ROCK_AWAKENING_TIER ||
          !pokemon.types.has(Synergy.ROCK)
        ) {
          pokemon.awakeningRock = ""
          pokemon.awakeningCharge = 0
          player.updateWeatherRocks()
        } else {
          const chargeNeeded =
            3 -
            (player.blessings?.includes(Blessing.GEM_HARVEST)
              ? GEM_HARVEST_CHARGE_REDUCTION
              : 0)
          pokemon.awakeningCharge = Math.min(3, pokemon.awakeningCharge + 1)
          if (pokemon.awakeningCharge >= chargeNeeded) {
            pokemon.awakening = pokemon.awakeningRock as Awakening
            pokemon.awakeningRock = ""
            // rock freed → resync weather rocks so it returns to the bench
            player.updateWeatherRocks()
            // recompute synergies now so the awakened type shows immediately,
            // without waiting for the next board interaction
            player.updateSynergies()
            /* GEM_HARVEST: the crystal leaves behind a gem of its own type.
               Kept last so the awakening itself completes regardless */
            if (player.blessings?.includes(Blessing.GEM_HARVEST)) {
              const crystalSynergy = AwakeningTypes[pokemon.awakening]
              const gem = crystalSynergy ? GemBySynergy[crystalSynergy] : null
              // a gem grants its synergy through bonusSynergies, not by being held
              if (gem) grantSynergyAwareItem(player, gem)
            }
          }
        }
      }

      // Condition based evolutions on stage start
      if (
        pokemon.evolutionRule.type === EvolutionRuleType.STATE ||
        pokemon.evolutionRule.type === EvolutionRuleType.STACK
      ) {
        EvolutionManager.tryEvolve(pokemon, player, this.state)
      }
    })

    // Unholdable item effects on stage start
    player.items.forEach((item) => {
      const itemEffects =
        ItemEffects[item]?.filter((p) => p instanceof OnStageStartEffect) ?? []
      itemEffects.forEach((effect) => effect.apply({ player, room: this.room }))
    })
  }

  checkForLazyTeam() {
    // force move on board some units if room available
    this.state.players.forEach((player, key) => {
      if (player.isBot) return

      const teamSize = this.room.getTeamSize(player.board, player.blessings)
      const maxTeamSize = getMaxTeamSize(
        player.experienceManager.level,
        this.state.specialGameRule
      )
      if (teamSize < maxTeamSize) {
        const numberOfPokemonsToMove = maxTeamSize - teamSize
        for (let i = 0; i < numberOfPokemonsToMove; i++) {
          const pokemon = schemaValues(player.board)
            .filter(
              (p) =>
                isOnBench(p) &&
                p.canBePlaced &&
                !isPokemonManifestationLocked(player, p.id) &&
                !isUniqueFieldCapReached(player, p) &&
                ![
                  PokemonActionState.EXPLORING,
                  PokemonActionState.DIGGING
                ].includes(p.action) &&
                /* TEMPLE_OF_LANGUAGE Unown are free to field, so autofill would
                   otherwise dump every one of them onto the board */
                countsForTeamSize(p, player.blessings)
            )
            .sort((a, b) => a.positionX - b.positionX)[0]
          if (pokemon) {
            const coordinates = getFirstAvailablePositionOnBoard(
              player.board,
              pokemon.types.has(Synergy.DARK) && pokemon.range === 1
                ? 3
                : pokemon.range
            )

            if (coordinates) {
              const oldX = pokemon.positionX
              const oldY = pokemon.positionY
              pokemon.positionX = coordinates[0]
              pokemon.positionY = coordinates[1]
              onPokemonChangePosition({
                pokemon,
                newX: coordinates[0],
                newY: coordinates[1],
                oldX,
                oldY,
                player,
                state: this.state,
                room: this.room
              })
            }
          }
        }
        if (numberOfPokemonsToMove > 0) {
          player.updateSynergies()
          player.boardSize = this.room.getTeamSize(player.board, player.blessings)
        }
      }
    })
  }

  stopPickingPhase() {
    this.state.players.forEach((player) => {
      // auto pick choices if player did not choose in time
      const autoPickChoices: PlayerChoiceType[] = [
        "addPick",
        "item",
        "starter",
        "unique",
        "legendary",
        "scribble_shape",
        "evolution_lab_reward",
        /* a blessing choice left open is a blessing banked: its scheduled
           grants all fire at once when it is finally picked ten stages later */
        "blessing",
        "singularity",
        "starter_choice"
      ]
      player.choices
        .filter((choice) => autoPickChoices.includes(choice.type))
        .forEach((choice) => {
          const nbOptions =
            choice.type === "evolution_lab_reward"
              ? choice.rewards.length
              : choice.pokemons.length ||
                choice.items.length ||
                choice.scribbleShapes.length ||
                choice.blessings.length
          if (nbOptions === 0) return
          /* same rule the client greys the card out with: a blessing that has
             to land a pokemon on a full bench is refused, which would leave
             the choice pending and bank it into the next stage */
          const benchIsFull = getFreeSpaceOnBench(player.board) === 0
          const isPickable = (optionIndex: number) =>
            choice.type !== "blessing" ||
            !benchIsFull ||
            Blessings[choice.blessings[optionIndex]]
              ?.grantsPokemonImmediately !== true

          const firstPick = randomBetween(0, nbOptions - 1)
          for (let offset = 0; offset < nbOptions; offset++) {
            const optionIndex = (firstPick + offset) % nbOptions
            if (!isPickable(optionIndex)) continue
            this.room.pickChoice(player.id, choice.id, optionIndex, true)
            const stillPending =
              player.choices.findIndex((c) => c.id === choice.id) !== -1
            if (!stillPending) break
          }
        })
      if (player.blessingsRef) player.blessingsRef.thinkFastActive = false
    })
  }

  stopFightingPhase() {
    const isPVE = isPveStage(this.state, this.state.stageLevel)

    this.state.simulations.forEach((simulation) => {
      if (!simulation.finished) {
        simulation.onFinish()
      }
    })
    if (this.state.gameMode === GameMode.DOUBLE_UP) {
      grantRobinGemsForFinishedDoubleUpSimulations(this.state)
    } else if (!isPVE) {
      this.state.players.forEach((player) => {
        if (player.alive) grantRobinGemsReward(player, this.state)
      })
    }
    if (this.state.gameMode === GameMode.DOUBLE_UP) {
      this.applyDoubleUpDamage()
      if (!this.state.finale) {
        this.syncTeamLife()
      }
      this.room.rankPlayers()
    }

    // Double Up: countdown Prison Bottle cooldown
    if (this.state.gameMode === GameMode.DOUBLE_UP && !this.state.finale) {
      this.state.players.forEach((player: Player) => {
        if (player.alive && player.doubleUpSendCooldown > 0) {
          player.doubleUpSendCooldown--
          if (player.doubleUpSendCooldown === 0) {
            player.items.push(Item.PRISON_BOTTLE)
          }
        }
      })
    }
    // stop all simulations
    this.state.simulations.forEach((simulation) => {
      simulation.stop()
    })

    this.state.players.forEach(onFossilUnlockCombatEnd)

    this.computeAchievements()
    this.checkDeath()
    const isGameFinished = this.checkEndGame()

    if (!isGameFinished) {
      this.state.stageLevel += 1
      this.room.setMetadata({ stageLevel: this.state.stageLevel })
      this.computeIncome(isPVE, this.state.specialGameRule)
      this.state.players.forEach((player: Player) => {
        const croagunk = [...player.wanderers.values()].find(
          (w) => w.type === WandererType.CROAGUNK_TRADE
        )
        player.wanderers.clear()
        if (croagunk) player.wanderers.set(croagunk.id, croagunk)
        if (player.alive) {
          // Fake bots XP bar
          if (player.isBot) {
            player.experienceManager.level = max(9)(
              Math.round(this.state.stageLevel / 2)
            )
          }

          /* Guide rewards are the lesson's item timeline, so they are handed
             over whether the sparring match was won or lost. */
          const guideRewards = getGuideStageRewards(
            this.state,
            this.state.stageLevel - 1
          )
          if (guideRewards.length > 0 && !player.isBot) {
            guideRewards.forEach((item) => player.items.push(item))
          }

          // Give PVE rewards to players
          if (isPVE && player.history.at(-1)?.result === BattleResult.WIN) {
            while (player.pveRewards.length > 0) {
              const reward = player.pveRewards.pop()!
              player.items.push(reward)
            }

            if (player.pveRewardsPropositions.length > 0) {
              player.choices.push(
                new PlayerChoice({
                  type: "item",
                  items: schemaValues(player.pveRewardsPropositions),
                  isPveReward: true,
                  // SIX_PACK: each item option comes paired with a second item
                  items2:
                    player.pveRewardsPropositions2.length > 0
                      ? schemaValues(player.pveRewardsPropositions2)
                      : undefined
                })
              )
              player.pveRewardsPropositions.clear()
              player.pveRewardsPropositions2.clear()
            }
          }

          applyBlessingTrigger(
            player,
            this.state,
            isPVE ? BlessingTrigger.PVE_END : BlessingTrigger.PVP_END
          )

          this.spawnBabyEggs(player, isPVE)

          // Update Pokémon that have special effects between stages
          player.board.forEach((pokemon, key) => {
            if (pokemon.evolutionRule?.type === EvolutionRuleType.HATCH) {
              EvolutionManager.updateHatch(pokemon, player)
            }

            if (pokemon.action === PokemonActionState.TRAINING) {
              if (pokemon.name === Pkm.PIKACHU) {
                const libre = player.transformPokemon(
                  pokemon,
                  Pkm.PIKACHU_LIBRE
                )
                libre.addAttack(4)
                libre.addMaxHP(
                  Math.ceil(0.1 * getPokemonData(Pkm.PIKACHU_LIBRE).hp)
                )
                return
              }
              pokemon.addAttack(4)
              pokemon.addMaxHP(Math.ceil(0.1 * getPokemonData(pokemon.name).hp))
              pokemon.action = PokemonActionState.IDLE
            }
          })

          // Refreshes effects (Tapu Terrains, or if player lost Psychic 6 after Unown diseappeared)
          player.updateSynergies()

          // Refreshes shop
          if (!player.isBot) {
            if (!player.shopLocked) {
              if (player.shop.every((p) => Unowns.includes(p))) {
                // player stayed on unown shop and did nothing, so we remove its free roll
                player.shopFreeRolls -= 1
              }
              if (player.bazaarShop && player.shopFreeRolls > 0) {
                // player left a bazaar shop untouched, so its free roll is spent
                player.shopFreeRolls -= 1
              }

              this.state.shop.assignShop(player, false, this.state)
            } else {
              this.state.shop.refillShop(player, this.state)
              player.shopLocked = false
              player.unownReminiscences = 0
            }
          }
        }
      })
      // Update Bots after unown deletion so unown in bot boards are not deleted
      this.state.botManager.updateBots()
    }
  }
  applyDoubleUpDamage() {
    this.state.simulations.forEach((sim) => {
      if (sim.isGhostBattle) return
      if (sim.redPlayerId === "pve") return

      const loserIsBlue = sim.winnerId === sim.redPlayerId
      const loserIsRed = sim.winnerId === sim.bluePlayerId
      if (!loserIsBlue && !loserIsRed) return // draw

      const losingPlayer = loserIsBlue ? sim.bluePlayer : sim.redPlayer
      const winningTeam = loserIsBlue ? sim.redTeam : sim.blueTeam
      if (!losingPlayer || !losingPlayer.alive) return

      const damage = this.room.computeRoundDamage(
        winningTeam,
        this.state.stageLevel
      )
      losingPlayer.life -= damage
      if (damage > 0) {
        const client = this.room.clients.find(
          (c) => c.auth.uid === losingPlayer.id
        )
        client?.send(Transfer.PLAYER_DAMAGE, damage)
      }
    })
  }

  syncTeamLife() {
    const teams = new Map<string, Player[]>()
    this.state.players.forEach((p) => {
      if (!p.doubleUpTeamId || !p.alive) return
      if (!teams.has(p.doubleUpTeamId)) teams.set(p.doubleUpTeamId, [])
      teams.get(p.doubleUpTeamId)!.push(p)
    })
    teams.forEach((players) => {
      const minLife = Math.min(...players.map((p) => p.life))
      players.forEach((p) => {
        p.life = minLife
      })
    })
  }

  stopTownPhase() {
    // the replay is over as soon as its carousel closes, so the next carousel
    // of the run is dealt normally again
    this.state.guideRewinding = false
    this.room.miniGame.stop(this.room.state)
    this.state.players.forEach((player: Player) => {
      const croagunk = [...player.wanderers.values()].find(
        (w) => w.type === WandererType.CROAGUNK_TRADE
      )
      player.wanderers.clear()
      if (croagunk) {
        croagunk.data = "" // clear item before syncing
        player.wanderers.set(croagunk.id, croagunk)
      }
    })
    // need to clear item sprite when refunded (= failed trade)
    if (this.state.gameMode === GameMode.DOUBLE_UP) {
      this.state.players.forEach((player: Player) => {
        if (player.doubleUpTradeOffer) {
          player.items.push(player.doubleUpTradeOffer as Item)
          player.doubleUpTradeOffer = ""
          const croagunk = [...player.wanderers.values()].find(
            (w) => w.type === WandererType.CROAGUNK_TRADE
          )
          if (croagunk) croagunk.data = ""
        }
        if (player.alive && !this.state.finale) {
          const hasCroagunk = [...player.wanderers.values()].some(
            (w) => w.type === WandererType.CROAGUNK_TRADE
          )
          if (!hasCroagunk) {
            player.spawnWanderingPokemon({
              pkm: Pkm.CROAGUNK,
              shiny: false,
              type: WandererType.CROAGUNK_TRADE,
              behavior: WandererBehavior.SPECTATE
            })
          }
        }
      })
    }
  }

  initializeTownPhase() {
    this.state.phase = GamePhaseState.TOWN
    this.room.miniGame.initialize(this.state, this.room)

    const nbPlayersAlive = schemaValues(this.state.players).filter(
      (p) => p.alive
    ).length

    let minigamePhaseDuration = ITEM_CAROUSEL_BASE_DURATION
    if (PortalCarouselStages.includes(this.state.stageLevel)) {
      minigamePhaseDuration = PORTAL_CAROUSEL_BASE_DURATION
    } else if (this.state.stageLevel !== ItemCarouselStages[0]) {
      minigamePhaseDuration += nbPlayersAlive * 2000
    }
    if (this.state.townEncounter != null) {
      minigamePhaseDuration += 5000
    }
    this.state.time = minigamePhaseDuration

    this.state.players.forEach((player: Player) => {
      if (player.alive) {
        const itemsToSell = player.items.filter((item) =>
          isIn(ItemsSoldAtTown, item)
        )
        let totalMoneyGained = 0
        itemsToSell.forEach((item) => {
          player.money += ItemSellPricesAtTown[item] ?? 0
          totalMoneyGained += ItemSellPricesAtTown[item] ?? 0
          removeInArray<Item>(player.items, item)
        })
        if (totalMoneyGained > 0) {
          const client = this.room.clients.find(
            (cli) => cli.auth.uid === player.id
          )
          client?.send(Transfer.PLAYER_INCOME, totalMoneyGained)
        }
      }
    })
  }

  updateScribbleSketchbooks() {
    this.state.players.forEach((player: Player) => {
      if (!player.alive || player.isBot) return
      player.scribbleShapes.forEach((shape) => {
        if (player.scribbleShapesCollected.includes(shape.shapeType)) return
        const isShapeFilled = shape.cells.every((cell) => {
          const { x, y } = unpackBoardCell(cell)
          return schemaValues(player.board).some(
            (pokemon) => pokemon.positionX === x && pokemon.positionY === y
          )
        })
        if (isShapeFilled) {
          player.scribbleShapesCollected.push(shape.shapeType)
          this.giveSketchbookMilestoneReward(player)
        }
      })
    })
  }

  giveSketchbookMilestoneReward(player: Player) {
    switch (player.scribbleShapesCollected.length) {
      case 2:
        player.items.push(Item.RECYCLE_TICKET)
        break
      case 4:
        player.items.push(pickRandomIn(ItemComponents))
        player.items.push(pickRandomIn(ItemComponents))
        break
      case 6: {
        const ditto = PokemonFactory.createPokemonFromName(Pkm.DITTO, player)
        ditto.positionX = getFirstAvailablePositionInBench(player.board) ?? 0
        ditto.positionY = 0
        player.board.set(ditto.id, ditto)
        break
      }
      case 8:
        player.shopFreeRolls += 10
        break
      case 10:
        player.life = Math.min(player.maxLife, player.life + 20)
        break
      case 12: {
        const topSynergy = player.synergies.getTopSynergies()[0]
        const singleUniques = UniquePool.filter(
          (p): p is Pkm => !(p in PkmDuos)
        )
        const matchingUniques = singleUniques.filter((p) =>
          getPokemonData(p).types.includes(topSynergy)
        )
        const unique = pickRandomIn(
          matchingUniques.length > 0 ? matchingUniques : singleUniques
        )
        const pokemon = PokemonFactory.createPokemonFromName(unique, player)
        pokemon.positionX = getFirstAvailablePositionInBench(player.board) ?? 0
        pokemon.positionY = 0
        player.board.set(pokemon.id, pokemon)
        player.pokemonsPlayed.add(unique)
        break
      }
    }
  }

  initializeFightingPhase() {
    this.state.simulations.clear()
    this.state.phase = GamePhaseState.FIGHT
    this.state.time = FIGHTING_PHASE_DURATION
    this.state.roundTime = Math.round(this.state.time / 1000)
    updateLobby(this.room)
    if (this.state.gameMode === GameMode.DOUBLE_UP) {
      this.state.players.forEach((player: Player) => {
        if (player.doubleUpTradeOffer) {
          player.items.push(player.doubleUpTradeOffer as Item)
          player.doubleUpTradeOffer = ""
        }
      })
    }
    this.state.players.forEach((player: Player) => {
      if (player.alive) {
        player.registerPlayedPokemons()
        onFossilUnlockCombatStart(player)
        /* QUEST_INDECISION banks synergies off the locked combat board, not the
           picking phase, so rotating synergies between rounds still counts */
        checkIndecisionSynergies(player)
      }
    })

    if (this.state.specialGameRule === SpecialGameRule.LIGHT_SHOW) {
      this.updateScribbleSketchbooks()
    }

    const pveStageBase = getPveStage(this.state, this.state.stageLevel)
    if (pveStageBase) {
      const allOptions = pveStageBase.variants
        ? [pveStageBase, ...pveStageBase.variants]
        : [pveStageBase]
      const { variants, ...pveStage } = {
        ...pveStageBase,
        ...allOptions[this.state.currentPveVariantIndex]
      }

      // In Double Up, both players of a team fight together in one shared
      // fight against a strengthened PVE encounter
      const groups: Player[][] = []
      if (this.state.gameMode === GameMode.DOUBLE_UP) {
        const teams = new Map<string, Player[]>()
        this.state.players.forEach((player: Player) => {
          if (!player.alive) return
          if (player.doubleUpTeamId) {
            if (!teams.has(player.doubleUpTeamId)) {
              teams.set(player.doubleUpTeamId, [])
            }
            teams.get(player.doubleUpTeamId)!.push(player)
          } else {
            groups.push([player])
          }
        })
        teams.forEach((teamPlayers) => groups.push(teamPlayers))
      } else {
        this.state.players.forEach((player: Player) => {
          if (player.alive) groups.push([player])
        })
      }

      groups.forEach((group) => {
        group.forEach((player) => {
          player.forgottenPvePokemon = null
          player.forgottenPveItems = []
          player.opponentId = "pve"
          player.opponentName = pveStage.name
          player.opponentAvatar = getAvatarString(
            PkmIndex[pveStage.avatar],
            this.state.shinyEncounter,
            pveStage.emotion
          )
          /* Slowking is running the class, not ambushing anyone. The stages a
             guide reuses from the real game keep their WILD label. */
          player.opponentTitle =
            this.state.gameMode === GameMode.GUIDE &&
            !isGuideWildStage(this.state.stageLevel)
              ? "TEACHER"
              : "WILD"
          player.team = Team.BLUE_TEAM

          /* A guide's components come from its own timeline, so the wild
             rounds it reuses must not also hand out their usual drops - the
             lesson's text names exactly what is in the inventory. */
          const isGuide = this.state.gameMode === GameMode.GUIDE
          const rewards = isGuide
            ? ([] as Item[])
            : (pveStage.getRewards?.(player, this.state.shinyEncounter) ??
              ([] as Item[]))
          resetArraySchema(player.pveRewards, rewards)

          const gaveShinyItemReward = rewards.some((item) =>
            isIn(ShinyItems, item)
          )

          const wantsShinyPropositions =
            !gaveShinyItemReward &&
            ((this.state.shinyEncounter && this.state.stageLevel > 1) ||
              this.state.specialGameRule === SpecialGameRule.SHINIEST_HUNTER)
          const rewardsPropositions = isGuide
            ? ([] as Item[])
            : wantsShinyPropositions
              ? pickNRandomIn(ShinyItems, 3)
              : (pveStage.getRewardsPropositions?.(player, false) ??
                ([] as Item[]))

          resetArraySchema(player.pveRewardsPropositions, rewardsPropositions)

          // SIX_PACK: pair each reward proposition with a second item —
          // a component early, but a full/completed item after stage 20
          const sixPackPairPool =
            this.state.stageLevel > PortalCarouselStages[2]
              ? CraftableItemsNoScarves
              : ItemComponentsNoScarf
          const rewardsPropositions2 =
            this.state.specialGameRule === SpecialGameRule.SIX_PACK
              ? rewardsPropositions.map(() => pickRandomIn(sixPackPairPool))
              : []
          resetArraySchema(
            player.pveRewardsPropositions2,
            rewardsPropositions2
          )
        })

        const [player, partner] = group
        const pveBoard = PokemonFactory.makePveBoard(
          pveStage,
          this.state.shinyEncounter,
          this.state.townEncounter
        )
        if (group.length > 1) {
          PokemonFactory.scalePveBoardForDoubleUp(
            pveBoard,
            group,
            this.state.stageLevel
          )
        }
        const weather = getWeather(
          player,
          partner ?? null,
          pveBoard,
          false,
          this.state.townEncounters.has(Pkm.CASTFORM)
        )
        const simulation = new Simulation(
          crypto.randomUUID(),
          this.room,
          player,
          { id: "pve", board: pveBoard, effects: buildPveEffects(pveBoard) },
          this.state.stageLevel,
          weather,
          false,
          partner
        )
        group.forEach((p) => {
          p.simulationId = simulation.id
        })
        this.state.simulations.set(simulation.id, simulation)
        simulation.start()
      })
    } else {
      const matchups =
        this.state.gameMode === GameMode.DOUBLE_UP
          ? selectDoubleUpMatchups(this.state)
          : selectMatchups(this.state)
      this.state.simulationPaused = true // 2 seconds pause for portal transition animation

      matchups.forEach((matchup) => {
        const { bluePlayer, redPlayer, ghost } = matchup
        const weather = getWeather(
          bluePlayer,
          redPlayer,
          redPlayer.board,
          ghost,
          this.state.townEncounters.has(Pkm.CASTFORM)
        )
        const simulationId = crypto.randomUUID()

        bluePlayer.simulationId = simulationId
        bluePlayer.team = Team.BLUE_TEAM
        bluePlayer.opponents.set(
          redPlayer.id,
          (bluePlayer.opponents.get(redPlayer.id) ?? 0) + 1
        )
        bluePlayer.opponentId = redPlayer.id
        bluePlayer.opponentName = matchup.ghost
          ? `Ghost of ${redPlayer.name}`
          : redPlayer.name
        bluePlayer.opponentAvatar = redPlayer.avatar
        bluePlayer.opponentTitle = redPlayer.title ?? ""

        if (!matchup.ghost) {
          redPlayer.simulationId = simulationId
          redPlayer.team = Team.RED_TEAM
          redPlayer.opponents.set(
            bluePlayer.id,
            (redPlayer.opponents.get(bluePlayer.id) ?? 0) + 1
          )
          redPlayer.opponentId = bluePlayer.id
          redPlayer.opponentName = bluePlayer.name
          redPlayer.opponentAvatar = bluePlayer.avatar
          redPlayer.opponentTitle = bluePlayer.title ?? ""
        }

        const simulation = new Simulation(
          simulationId,
          this.room,
          bluePlayer,
          redPlayer,
          this.state.stageLevel,
          weather,
          matchup.ghost
        )

        this.state.simulations.set(simulation.id, simulation)
        setTimeout(() => {
          this.state.simulationPaused = false
          simulation.start()
        }, 2500) // 2 seconds for portal transition animation, 500 ms for latency
      })
    }

    /* after every simulation exists, so each player's side is known */
    anchorPlayerAvatars(this.state)

    if (this.state.specialGameRule === SpecialGameRule.UNOWN_SPELL) {
      this.state.simulations.forEach((simulation) => {
        const unown = pickRandomIn(UnownsForScribble)
        ;[
          simulation.bluePlayer,
          simulation.bluePartnerPlayer,
          simulation.redPlayer
        ].forEach((player) => {
          if (
            !player ||
            (simulation.isGhostBattle && player === simulation.redPlayer)
          )
            return
          const wanderer = player.spawnWanderingPokemon({
            pkm: unown,
            shiny: false,
            type: WandererType.UNOWN_SPELL,
            behavior: WandererBehavior.SPECTATE
          })
          this.clock.setTimeout(() => {
            player.wanderers.delete(wanderer.id)
            if (simulation.finished) return
            const caster = new PokemonEntity(
              PokemonFactory.createPokemonFromName(unown),
              9,
              2,
              player.team,
              simulation
            )
            castAbility(
              AbilityStrategies[caster.skill],
              caster,
              simulation.board,
              null,
              false
            )
          }, 10000)
        })
      })
    }
  }

  spawnWanderingPokemons() {
    const isPVE = isPveStage(this.state, this.state.stageLevel)

    this.state.players.forEach((player: Player) => {
      if (player.alive && !player.isBot) {
        const client = this.room.clients.find(
          (cli) => cli.auth.uid === player.id
        )
        if (!client) return

        if (chance(UNOWN_ENCOUNTER_CHANCE)) {
          player.spawnWanderingPokemon({
            pkm: pickRandomIn(Unowns),
            shiny: chance(SHINY_UNOWN_ENCOUNTER_CHANCE),
            type: WandererType.UNOWN,
            behavior: WandererBehavior.RUN_THROUGH,
            delay: Math.round((5 + 15 * Math.random()) * 1000)
          })
        }

        if (this.state.outlawStage != null) {
          const outlawPkm = simpleHashSeededCoinFlip(
            this.state.preparationId + "outlaw"
          )
            ? Pkm.DROWZEE
            : Pkm.TOGEPI_MAFIA
          if (this.state.stageLevel === this.state.outlawStage) {
            player.spawnWanderingPokemon({
              pkm: outlawPkm,
              shiny: false,
              type: WandererType.OUTLAW,
              behavior: WandererBehavior.RUN_THROUGH,
              delay: Math.round((5 + 15 * Math.random()) * 1000)
            })
          } else if (this.state.stageLevel < this.state.outlawStage) {
            const magnezoneChance = chance(this.state.stageLevel * 0.04)
            if (magnezoneChance) {
              player.spawnWanderingPokemon({
                pkm: Pkm.MAGNEZONE,
                shiny: false,
                type: WandererType.DIALOG,
                behavior: WandererBehavior.RUN_THROUGH,
                delay: Math.round((5 + 15 * Math.random()) * 1000)
              })
            } else {
              for (let i = 0; i < randomBetween(1, 3); i++) {
                player.spawnWanderingPokemon({
                  pkm: Pkm.MAGNEMITE,
                  shiny: false,
                  type: WandererType.DIALOG,
                  behavior: WandererBehavior.RUN_THROUGH,
                  delay: Math.round((5 + 15 * Math.random()) * 1000)
                })
              }
            }
          } else if (this.state.stageLevel > this.state.outlawStage) {
            removeInArray(player.items, Item.WANTED_NOTICE)
          }
        }

        if (
          isPVE &&
          this.state.specialGameRule === SpecialGameRule.GOTTA_CATCH_EM_ALL
        ) {
          const nbPokemonsToSpawn = Math.ceil(this.state.stageLevel / 2)
          for (let i = 0; i < nbPokemonsToSpawn; i++) {
            const pkm = this.state.shop.pickPokemon(
              player,
              this.state,
              -1,
              true
            )
            player.spawnWanderingPokemon({
              pkm,
              type: WandererType.CATCHABLE,
              behavior: WandererBehavior.RUN_THROUGH,
              delay: 4000 + i * 400
            })
          }
        }
      }
    })
  }

  spawnBabyEggs(player: Player, isPVE: boolean) {
    const hasBabyActive =
      player.effects.has(EffectEnum.HATCHER) ||
      player.effects.has(EffectEnum.BREEDER) ||
      player.effects.has(EffectEnum.GOLDEN_EGGS)
    const hasLostLastBattle =
      player.history.at(-1)?.result === BattleResult.DEFEAT
    const eggsOnBench = schemaValues(player.board).filter(
      (p) => p.name === Pkm.EGG
    )
    const nbOfGoldenEggsOnBench = eggsOnBench.filter((p) => p.shiny).length
    let nbEggsFound = 0
    let goldenEggFound = false

    if (hasLostLastBattle && hasBabyActive) {
      const EGG_CHANCE = 0.1
      const GOLDEN_EGG_CHANCE = 0.05
      const playerEggChanceStacked = player.eggChance
      const playerGoldenEggChanceStacked = player.goldenEggChance
      const babies = schemaValues(player.board).filter(
        (p) => !isOnBench(p) && p.types.has(Synergy.BABY)
      )

      for (const baby of babies) {
        if (
          player.effects.has(EffectEnum.GOLDEN_EGGS) &&
          nbOfGoldenEggsOnBench === 0 &&
          chance(GOLDEN_EGG_CHANCE, baby)
        ) {
          nbEggsFound++
          goldenEggFound = true
        } else if (chance(EGG_CHANCE, baby)) {
          nbEggsFound++
        }
        if (player.effects.has(EffectEnum.GOLDEN_EGGS) && !goldenEggFound) {
          player.goldenEggChance += max(0.1)(
            Math.pow(GOLDEN_EGG_CHANCE, 1 - baby.luck / 200)
          )
        } else if (
          player.effects.has(EffectEnum.HATCHER) &&
          nbEggsFound === 0
        ) {
          player.eggChance += max(0.2)(
            Math.pow(EGG_CHANCE, 1 - baby.luck / 100)
          )
        }
      }

      // Second chance with chance stacked after lose streaks
      if (
        nbEggsFound === 0 &&
        (player.effects.has(EffectEnum.BREEDER) ||
          player.effects.has(EffectEnum.GOLDEN_EGGS) ||
          chance(playerEggChanceStacked))
      ) {
        nbEggsFound = 1 // baby >= 5 guarantees at least 1 egg after a defeat
      }
      if (
        goldenEggFound === false &&
        player.effects.has(EffectEnum.GOLDEN_EGGS) &&
        nbOfGoldenEggsOnBench === 0 &&
        chance(playerGoldenEggChanceStacked)
      ) {
        goldenEggFound = true
      }
    } else if (!isPVE) {
      // winning a PvP fight resets the stacked egg chance
      player.eggChance = 0
      player.goldenEggChance = 0
    }

    if (
      this.state.specialGameRule === SpecialGameRule.OMELETTE_COOK &&
      [2, 3, 4].includes(this.state.stageLevel)
    ) {
      nbEggsFound = 1
    }

    for (let i = 0; i < nbEggsFound; i++) {
      if (getFreeSpaceOnBench(player.board) === 0) continue
      const isGoldenEgg =
        goldenEggFound && i === 0 && nbOfGoldenEggsOnBench === 0
      giveRandomEgg(player, isGoldenEgg)
      if (player.effects.has(EffectEnum.HATCHER)) {
        player.eggChance = 0 // getting an egg resets the stacked egg chance
      }
      if (player.effects.has(EffectEnum.GOLDEN_EGGS) && isGoldenEgg) {
        player.goldenEggChance = 0 // getting a golden egg resets the stacked egg chance
      }
    }
  }
}

export class OnOverwriteBoardCommand extends Command<GameRoom> {
  execute({
    playerId,
    board
  }: {
    playerId: string
    board: IDetailledPokemon[]
  }) {
    const player = this.room.state.players.get(playerId)
    if (
      !player ||
      (player.role !== Role.ADMIN &&
        this.room.state.specialGameRule !== SpecialGameRule.PLAY_TEST)
    )
      return
    player.board.clear()
    board.forEach((p) => {
      const pokemon = PokemonFactory.createPokemonFromName(p.name, p)
      pokemon.positionX = p.x
      pokemon.positionY = p.y
      pokemon.addItems(p.items, player)
      player.board.set(pokemon.id, pokemon)
    })
    player.updateSynergies()
    player.boardSize = this.room.getTeamSize(player.board, player.blessings)
  }
}

/* Replays the lesson's rewind stage with the taught pick already gone, so the
   player has to build the same item from the other component. Only the item is
   undone, not the whole run: everything else the player did on this stage was
   correct and stays. */
export class OnGuideRewindCommand extends Command<GameRoom> {
  execute() {
    const lesson = getGuideLesson(this.state)
    const rewind = lesson?.rewind
    if (!rewind || this.state.stageLevel !== rewind.stage) return

    const player = schemaValues(this.state.players).find((p) => !p.isBot)
    if (!player) return

    const holderFamily = rewind.holder ? PkmFamily[rewind.holder] : null

    const takeItemOffBoard = (item: Item, family: Pkm | null): boolean => {
      let removed = false
      player.board.forEach((pokemon) => {
        if (removed) return
        if (family && PkmFamily[pokemon.name] !== family) return
        if (!pokemon.items.has(item)) return
        pokemon.removeItems([item], player)
        removed = true
      })
      return removed
    }

    /* Unwind what the stage produced, looking at the holder it was built onto
       before the bag. An earlier stage can have put the same component on
       another unit - Carnivine and the Rowlet line both end up with a
       GREEN_ORB here - and taking it off the win condition instead would be
       silent and unrecoverable. A named holder is never overreached past. */
    rewind.takeBack.forEach((item) => {
      if (holderFamily && takeItemOffBoard(item, holderFamily)) return
      if (player.items.includes(item)) {
        removeInArray(player.items, item)
        return
      }
      if (!holderFamily) takeItemOffBoard(item, null)
    })
    // and hand the components back so the other branch is actually craftable
    rewind.restore.forEach((item) => player.items.push(item))

    this.state.guideRewinding = true
    this.state.phase = GamePhaseState.TOWN
    this.room.miniGame.initialize(this.state, this.room)
    this.state.time = ITEM_CAROUSEL_BASE_DURATION
    this.state.updatePhaseNeeded = false
  }
}

export class OnDevCommand extends Command<GameRoom> {
  execute(msg: { action: string }) {
    if (msg.action === "skipStage") {
      // Advance synchronously so a follow-up skip cannot be overwritten by
      // the timer assigned while the next phase is being initialized.
      return [new OnUpdatePhaseCommand()]
    }
  }
}

export function onPokemonChangePosition({
  pokemon,
  newX,
  newY,
  player,
  oldX,
  oldY,
  state,
  room,
  doNotRemoveItems = false
}: {
  pokemon: Pokemon
  newX: number
  newY: number
  player: Player
  oldX: number
  oldY: number
  state: GameState
  room: GameRoom
  doNotRemoveItems?: boolean
}) {
  // called after manually changing position of the pokemon on board

  if (newY === 0 && !doNotRemoveItems) {
    const itemsToRemove = schemaValues(pokemon.items).filter((item) => {
      return (
        isIn(RemovableItems, item) ||
        ((state?.specialGameRule === SpecialGameRule.SLAMINGO ||
          player.blessings?.includes(Blessing.CROAGUNKS_AID)) &&
          item !== Item.RARE_CANDY)
      )
    })
    player.items.push(...itemsToRemove)
    pokemon.removeItems(itemsToRemove, player)

    if (pokemon.tm && TMPerAbility.has(pokemon.tm)) {
      // UNISON never consumed the TM, so giving it back would duplicate it
      if (player.blessings?.includes(Blessing.UNISON) === false) {
        player.items.push(TMPerAbility.get(pokemon.tm)!)
      }
      pokemon.tm = Ability.DEFAULT
      pokemon.skill = pokemon.baseSkill
      pokemon.maxPP = pokemon.baseMaxPP
    }
  }

  if (pokemon.passive !== Passive.NONE) {
    const hasLight = player.synergies.hasSynergyActive(Synergy.LIGHT)
    const inSpotlight =
      hasLight &&
      ((newX === player.lightX && newY === player.lightY) ||
        pokemon.items.has(Item.SHINY_STONE))

    PassiveEffects[pokemon.passive]?.forEach((effect) => {
      if (effect instanceof OnChangePositionEffect) {
        effect.apply({
          pokemon,
          player,
          state,
          room,
          oldX,
          oldY,
          newX,
          newY
        })
      }

      if (effect instanceof OnSpotlightChangeEffect) {
        effect.apply({
          pokemon,
          player,
          inSpotlight
        })
      }
    })
  }

  if (pokemon.name === Pkm.MANTYKE || pokemon.name === Pkm.REMORAID) {
    // can't be done as an OnChangePositionEffect because of circular dependency with evolution manager, so we do it here manually
    for (const pokemon of player.board.values()) {
      if (pokemon.name === Pkm.MANTYKE) {
        EvolutionManager.tryEvolve(pokemon, player, player.board)
      }
    }
  }
}
