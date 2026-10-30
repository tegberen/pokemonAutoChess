import type { HydratedDocument } from "mongoose"
import { getBaseAltForm, PkmAltFormsByPkm } from "../config"
import {
  type SeasonCurrency,
  SEASON_BOOSTER_CARD_COUNT,
  SEASON_BOOSTER_HOLO_CHANCE,
  SEASON_BOOSTER_SHINY_CHANCE,
  SEASON_CASUAL_PICK_HOLO_CARDS,
  SEASON_CASUAL_PICK_INTERVAL_MS,
  SEASON_DUPLICATE_CARD_TICKETS,
  SEASON_SHOP_OFFERS,
  SEASON_WONDER_PICK_CARD_COUNT,
  SEASON_WONDER_PICK_FREE_REROLLS,
  getCasualPickCharges
} from "../config/game/season"
import { BoosterRarityProbability } from "../config/game/shop"
import { CollectionUtils } from "../core/collection"
import UserMetadata from "../models/mongo-models/user-metadata"
import { getAvailableEmotions } from "../models/precomputed/precomputed-emotions"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../models/precomputed/precomputed-rarity"
import { PokemonAnimations } from "../public/src/game/components/pokemon-animations"
import { Emotion } from "../types"
import type { SeasonBoosterCard } from "../types/Booster"
import { Ability } from "../types/enum/Ability"
import { Rarity } from "../types/enum/Game"
import { type Pkm, PkmIndex, Unowns } from "../types/enum/Pokemon"
import type {
  ICasualPick,
  IPokemonCollectionItemLean,
  IPokemonCollectionItemMongo,
  IUserMetadataLean,
  IUserMetadataMongo
} from "../types/interfaces/UserMetadata"
import {
  chance,
  pickNRandomIn,
  pickRandomIn,
  randomWeighted,
  shuffleArray
} from "../utils/random"
import { checkTitlesAfterEmotionUnlocked } from "./booster"
import { recordBoosterCreation } from "./booster-monitor"
import {
  ensureCurrentSeasonProgress,
  getCurrentSeasonForServer
} from "./season"

const PROFILE_FIELD_BY_CURRENCY: Record<SeasonCurrency, string> = {
  poke: "seasonTickets",
  ticket: "shinyTickets"
}

// a concurrent unlock of the same Pokemon makes the collection guard miss
const MAX_COLLECTION_UPDATE_ATTEMPTS = 5

// runs one player's collection updates one after another in this process, so
// rapid clicks never exhaust the guarded retries
const collectionUpdateQueueByUid = new Map<string, Promise<unknown>>()

function queueCollectionUpdate<T>(uid: string, task: () => Promise<T>) {
  const previous = collectionUpdateQueueByUid.get(uid) ?? Promise.resolve()
  const next = previous.then(task, task)
  collectionUpdateQueueByUid.set(uid, next)
  const removeIfLast = () => {
    if (collectionUpdateQueueByUid.get(uid) === next) {
      collectionUpdateQueueByUid.delete(uid)
    }
  }
  next.then(removeIfLast, removeIfLast)
  return next
}

const COLLECTIBLE_BASE_FORMS_BY_RARITY = new Map<Rarity, Pkm[]>(
  Object.values(Rarity).map((rarity) => [
    rarity,
    ((PRECOMPUTED_POKEMONS_PER_RARITY[rarity] ?? []) as Pkm[]).filter(
      (pokemon) =>
        !Unowns.includes(pokemon) &&
        getPokemonData(pokemon).skill !== Ability.DEFAULT &&
        getBaseAltForm(pokemon) === pokemon &&
        getAvailableEmotions(PkmIndex[pokemon], false).length > 0
    )
  ])
)

const ALL_COLLECTIBLE_BASE_FORMS = [
  ...COLLECTIBLE_BASE_FORMS_BY_RARITY.values()
].flat()

const LAST_CARD_BASE_FORMS = [
  ...(COLLECTIBLE_BASE_FORMS_BY_RARITY.get(Rarity.UNIQUE) ?? []),
  ...(COLLECTIBLE_BASE_FORMS_BY_RARITY.get(Rarity.LEGENDARY) ?? [])
]

function withAltForms(pokemon: Pkm): Pkm[] {
  return [pokemon, ...(PkmAltFormsByPkm[pokemon] ?? [])]
}

function canBeShiny(pokemon: Pkm) {
  return (
    PokemonAnimations[pokemon]?.shinyUnavailable !== true &&
    getAvailableEmotions(PkmIndex[pokemon], true).length > 0
  )
}

// reads the bits directly: CollectionUtils.hasUnlocked reports every emote as
// owned while UNLOCK_ALL_COLLECTION is on
function ownsEmotion(mask: Uint8Array, emotion: Emotion, shiny: boolean) {
  const emotionBit = CollectionUtils.getEmotionMask(
    shiny ? [] : [emotion],
    shiny ? [emotion] : []
  )
  return emotionBit.some((byte, i) => (mask[i] & byte) !== 0)
}

function toBuffer(unlocked: IPokemonCollectionItemLean["unlocked"]) {
  if (unlocked === undefined) return undefined
  if (unlocked instanceof Uint8Array) return Buffer.from(unlocked)
  return Buffer.from(unlocked.buffer)
}

// works on copies of the masks, then writes them back guarded by the values it
// read, so two concurrent unlocks never overwrite each other
class CollectionDraft {
  private readonly originalMasks = new Map<string, Buffer | undefined>()
  private readonly existingIndexes = new Set<string>()
  private readonly workingMasks = new Map<string, Buffer>()
  private readonly collection: Record<string, IPokemonCollectionItemLean>
  private readonly ownedHoloIndexes: string[]
  private readonly newHoloIndexes = new Set<string>()

  constructor(user: IUserMetadataLean) {
    this.collection = user.pokemonCollection ?? {}
    this.ownedHoloIndexes = user.holoIndexes ?? []
  }

  getMask(index: string): Buffer {
    let mask = this.workingMasks.get(index)
    if (!mask) {
      const item = this.collection[index]
      const original = item ? toBuffer(item.unlocked) : undefined
      if (item) this.existingIndexes.add(index)
      this.originalMasks.set(index, original)
      mask = original ? Buffer.from(original) : Buffer.alloc(5, 0)
      this.workingMasks.set(index, mask)
    }
    return mask
  }

  owns(pokemon: Pkm, emotion: Emotion, shiny: boolean) {
    return ownsEmotion(this.getMask(PkmIndex[pokemon]), emotion, shiny)
  }

  isMissingShinies(pokemon: Pkm) {
    return getAvailableEmotions(PkmIndex[pokemon], true).some(
      (emotion) => !this.owns(pokemon, emotion, true)
    )
  }

  hasHolo(pokemon: Pkm) {
    const index = PkmIndex[pokemon]
    return (
      this.ownedHoloIndexes.includes(index) || this.newHoloIndexes.has(index)
    )
  }

  addHolo(pokemon: Pkm) {
    this.newHoloIndexes.add(PkmIndex[pokemon])
  }

  unlock(pokemon: Pkm, emotion: Emotion, shiny: boolean) {
    CollectionUtils.unlockEmotion(
      this.getMask(PkmIndex[pokemon]),
      emotion,
      shiny
    )
  }

  getGuards() {
    const guards: Record<string, unknown> = {}
    for (const [index, original] of this.originalMasks) {
      if (!this.existingIndexes.has(index)) {
        guards[`pokemonCollection.${index}`] = { $exists: false }
      } else {
        guards[`pokemonCollection.${index}.unlocked`] = original ?? {
          $exists: false
        }
      }
    }
    if (this.newHoloIndexes.size > 0) {
      guards.holoIndexes = { $nin: [...this.newHoloIndexes] }
    }
    return guards
  }

  toUpdate(increments: Record<string, number> = {}) {
    const update: Record<string, unknown> = {}
    const sets = this.getSets()
    if (Object.keys(sets).length > 0) update.$set = sets
    if (Object.keys(increments).length > 0) update.$inc = increments
    if (this.newHoloIndexes.size > 0) {
      update.$addToSet = { holoIndexes: { $each: [...this.newHoloIndexes] } }
    }
    return update
  }

  private getSets() {
    const sets: Record<string, unknown> = {}
    for (const [index, mask] of this.workingMasks) {
      const original = this.originalMasks.get(index)
      if (original && original.equals(mask)) continue
      if (this.existingIndexes.has(index)) {
        sets[`pokemonCollection.${index}.unlocked`] = mask
      } else {
        const newItem: IPokemonCollectionItemMongo = {
          id: index,
          unlocked: mask,
          dust: 0,
          selectedEmotion: Emotion.NORMAL,
          selectedShiny: false,
          played: 0
        }
        sets[`pokemonCollection.${index}`] = newItem
      }
    }
    return sets
  }
}

async function checkTitlesAfterUnlocks(
  userDoc: HydratedDocument<IUserMetadataMongo>,
  cards: SeasonBoosterCard[]
) {
  checkTitlesAfterEmotionUnlocked(
    userDoc,
    cards.flatMap((card) =>
      card.unlockedEmotions.map((emotion) => ({
        name: card.name,
        emotion,
        shiny: card.shiny
      }))
    )
  )
  await userDoc.save()
}

export async function buySeasonOffer(uid: string, offerId: unknown) {
  const offer = SEASON_SHOP_OFFERS.find((offer) => offer.id === offerId)
  if (!offer) return null

  const balanceField = PROFILE_FIELD_BY_CURRENCY[offer.price.currency]
  const filter: Record<string, unknown> = {
    uid,
    [balanceField]: { $gte: offer.price.amount }
  }
  const increments: Record<string, number> = {
    [balanceField]: -offer.price.amount
  }
  const addToSet: Record<string, unknown> = {}
  const grant = (field: string) => {
    increments[field] = (increments[field] ?? 0) + 1
  }

  if (offer.seasonExclusive) {
    const season = getCurrentSeasonForServer()
    if (!season) return null
    await ensureCurrentSeasonProgress(uid, season)
    filter["season.id"] = season.id
    filter["season.purchasedOfferIds"] = { $ne: offer.id }
    addToSet["season.purchasedOfferIds"] = offer.id
    if (offer.item === "portrait") {
      filter.seasonPortraits = { $nin: season.mysteryGiftPortraitIds }
      addToSet.seasonPortraits = { $each: season.mysteryGiftPortraitIds }
    } else if (offer.item === "theme") {
      filter.unlockedThemes = { $ne: season.mysteryTheme }
      addToSet.unlockedThemes = season.mysteryTheme
    }
  }

  if (offer.item === "booster") grant("booster")
  else if (offer.item === "wonder-pick") grant("wonderPicks")

  const update: Record<string, unknown> = { $inc: increments }
  if (Object.keys(addToSet).length > 0) update.$addToSet = addToSet
  return UserMetadata.findOneAndUpdate(filter, update, {
    returnDocument: "after"
  })
}

function drawShinyCard(
  draft: CollectionDraft,
  pool: Pkm[]
): SeasonBoosterCard | null {
  const isEligible = (pokemon: Pkm) =>
    canBeShiny(pokemon) && draft.isMissingShinies(pokemon)
  let candidates = pool.flatMap(withAltForms).filter(isEligible)
  if (candidates.length === 0) {
    candidates = ALL_COLLECTIBLE_BASE_FORMS.flatMap(withAltForms).filter(
      isEligible
    )
  }
  if (candidates.length === 0) return null
  return unlockAllShinyEmotions(draft, pickRandomIn(candidates))
}

function unlockAllShinyEmotions(
  draft: CollectionDraft,
  pokemon: Pkm
): SeasonBoosterCard {
  const emotions = getAvailableEmotions(PkmIndex[pokemon], true)
  for (const emotion of emotions) draft.unlock(pokemon, emotion, true)
  return {
    name: pokemon,
    shiny: true,
    emotion: emotions.includes(Emotion.NORMAL) ? Emotion.NORMAL : emotions[0],
    new: true,
    unlockedEmotions: emotions
  }
}

function drawNormalCard(
  draft: CollectionDraft,
  pool: Pkm[]
): SeasonBoosterCard {
  return unlockNextNormalEmotion(
    draft,
    pickRandomIn(withAltForms(pickRandomIn(pool)))
  )
}

function unlockNextNormalEmotion(
  draft: CollectionDraft,
  pokemon: Pkm
): SeasonBoosterCard {
  const emotions = getAvailableEmotions(PkmIndex[pokemon], false)
  const newEmotions = emotions.filter(
    (emotion) => !draft.owns(pokemon, emotion, false)
  )
  if (newEmotions.length === 0) {
    return {
      name: pokemon,
      shiny: false,
      emotion: pickRandomIn(emotions) ?? Emotion.NORMAL,
      new: false,
      unlockedEmotions: []
    }
  }
  const emotion = newEmotions.includes(Emotion.NORMAL)
    ? Emotion.NORMAL
    : pickRandomIn(newEmotions)
  draft.unlock(pokemon, emotion, false)
  return {
    name: pokemon,
    shiny: false,
    emotion,
    new: true,
    unlockedEmotions: [emotion]
  }
}

function pickHoloPokemon(draft: CollectionDraft, pool: Pkm[]): Pkm | null {
  const isEligible = (pokemon: Pkm) =>
    !draft.hasHolo(pokemon) &&
    getAvailableEmotions(PkmIndex[pokemon], false).length > 0
  let candidates = pool.flatMap(withAltForms).filter(isEligible)
  if (candidates.length === 0) {
    candidates = ALL_COLLECTIBLE_BASE_FORMS.flatMap(withAltForms).filter(
      isEligible
    )
  }
  return candidates.length > 0 ? pickRandomIn(candidates) : null
}

function drawHoloCard(
  draft: CollectionDraft,
  pool: Pkm[]
): SeasonBoosterCard | null {
  const pokemon = pickHoloPokemon(draft, pool)
  return pokemon ? unlockHolo(draft, pokemon) : null
}

// a holo of a Pokemon not owned yet also unlocks its Normal portrait
function unlockHolo(draft: CollectionDraft, pokemon: Pkm): SeasonBoosterCard {
  draft.addHolo(pokemon)
  const ownsNormal = draft.owns(pokemon, Emotion.NORMAL, false)
  if (!ownsNormal) draft.unlock(pokemon, Emotion.NORMAL, false)
  return {
    name: pokemon,
    shiny: false,
    emotion: Emotion.NORMAL,
    new: true,
    holo: true,
    unlockedEmotions: ownsNormal ? [] : [Emotion.NORMAL]
  }
}

function pickBoosterSlotPool(isLastSlot: boolean) {
  const rarity =
    randomWeighted<Rarity>(BoosterRarityProbability) ?? Rarity.COMMON
  const rarityPool = isLastSlot
    ? LAST_CARD_BASE_FORMS
    : (COLLECTIBLE_BASE_FORMS_BY_RARITY.get(rarity) ?? [])
  return rarityPool.length > 0 ? rarityPool : ALL_COLLECTIBLE_BASE_FORMS
}

function drawSeasonBooster(draft: CollectionDraft): SeasonBoosterCard[] {
  const cards: SeasonBoosterCard[] = []
  let hasShiny = false
  const holoSlot = chance(SEASON_BOOSTER_HOLO_CHANCE)
    ? Math.floor(Math.random() * SEASON_BOOSTER_CARD_COUNT)
    : -1
  for (let slot = 0; slot < SEASON_BOOSTER_CARD_COUNT; slot++) {
    const pool = pickBoosterSlotPool(slot === SEASON_BOOSTER_CARD_COUNT - 1)
    const shinyCard =
      !hasShiny && chance(SEASON_BOOSTER_SHINY_CHANCE)
        ? drawShinyCard(draft, pool)
        : null
    if (shinyCard) hasShiny = true
    const holoCard =
      !shinyCard && slot === holoSlot ? drawHoloCard(draft, pool) : null
    cards.push(shinyCard ?? holoCard ?? drawNormalCard(draft, pool))
  }
  return cards
}

export function openSeasonBooster(uid: string) {
  return queueCollectionUpdate(uid, () => openSeasonBoosterNow(uid))
}

async function openSeasonBoosterNow(uid: string) {
  for (let attempt = 0; attempt < MAX_COLLECTION_UPDATE_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({
      uid,
      booster: { $gt: 0 }
    }).lean<IUserMetadataLean>()
    if (!user) return null

    const draft = new CollectionDraft(user)
    const cards = drawSeasonBooster(draft)
    const duplicateCount = cards.filter((card) => !card.new).length
    const increments: Record<string, number> = { booster: -1 }
    if (duplicateCount > 0) {
      increments.seasonTickets = duplicateCount * SEASON_DUPLICATE_CARD_TICKETS
    }

    const userDoc = await UserMetadata.findOneAndUpdate(
      { uid, booster: { $gt: 0 }, ...draft.getGuards() },
      draft.toUpdate(increments),
      { returnDocument: "after" }
    )
    if (userDoc) {
      recordBoosterCreation(cards)
      await checkTitlesAfterUnlocks(userDoc, cards)
      return { userDoc, cards }
    }
  }
  return null
}

export function catchUnownWanderer(uid: string, unown: Pkm, shiny: boolean) {
  return queueCollectionUpdate(uid, () =>
    catchUnownWandererNow(uid, unown, shiny)
  )
}

async function catchUnownWandererNow(
  uid: string,
  unown: Pkm,
  shiny: boolean
) {
  for (let attempt = 0; attempt < MAX_COLLECTION_UPDATE_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
    if (!user) return null

    const draft = new CollectionDraft(user)
    const card =
      shiny && canBeShiny(unown) && draft.isMissingShinies(unown)
        ? unlockAllShinyEmotions(draft, unown)
        : unlockNextNormalEmotion(draft, unown)
    const increments: Record<string, number> = card.new
      ? {}
      : { seasonTickets: SEASON_DUPLICATE_CARD_TICKETS }

    const userDoc = await UserMetadata.findOneAndUpdate(
      { uid, ...draft.getGuards() },
      draft.toUpdate(increments),
      { returnDocument: "after" }
    )
    if (userDoc) {
      await checkTitlesAfterUnlocks(userDoc, [card])
      return { userDoc, card }
    }
  }
  return null
}

function drawWonderPickCandidates(draft: CollectionDraft, exclude: Pkm[]) {
  const eligible = ALL_COLLECTIBLE_BASE_FORMS.flatMap(withAltForms).filter(
    (pokemon) => canBeShiny(pokemon) && draft.isMissingShinies(pokemon)
  )
  const fresh = eligible.filter((pokemon) => !exclude.includes(pokemon))
  return pickNRandomIn(
    fresh.length >= SEASON_WONDER_PICK_CARD_COUNT ? fresh : eligible,
    SEASON_WONDER_PICK_CARD_COUNT
  )
}

export async function getOrCreateWonderPickDraw(uid: string) {
  const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
  if (!user) return null
  if (!user.wonderPickDraw?.candidates?.length) {
    const draft = new CollectionDraft(user)
    const candidates = drawWonderPickCandidates(draft, [])
    if (candidates.length === 0) return null
    await UserMetadata.updateOne(
      { uid, wonderPickDraw: null },
      {
        $set: {
          wonderPickDraw: {
            candidates,
            rerollsLeft: SEASON_WONDER_PICK_FREE_REROLLS
          }
        }
      }
    )
  }
  return UserMetadata.findOne({ uid })
}

export async function rerollWonderPickDraw(uid: string) {
  const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
  const draw = user?.wonderPickDraw
  if (!user || !draw || draw.rerollsLeft <= 0) return null
  if ((user.wonderPicks ?? 0) <= 0) return null
  const draft = new CollectionDraft(user)
  const candidates = drawWonderPickCandidates(draft, draw.candidates)
  if (candidates.length === 0) return null
  return UserMetadata.findOneAndUpdate(
    {
      uid,
      wonderPicks: { $gt: 0 },
      "wonderPickDraw.candidates": draw.candidates,
      "wonderPickDraw.rerollsLeft": { $gt: 0 }
    },
    {
      $set: { "wonderPickDraw.candidates": candidates },
      $inc: { "wonderPickDraw.rerollsLeft": -1 }
    },
    { returnDocument: "after" }
  )
}

// the cards are shuffled face down, so whichever slot is clicked, the result
// is a uniform draw among the candidates
export function pickWonderPick(uid: string) {
  return queueCollectionUpdate(uid, () => pickWonderPickNow(uid))
}

async function pickWonderPickNow(uid: string) {
  for (let attempt = 0; attempt < MAX_COLLECTION_UPDATE_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({
      uid,
      wonderPicks: { $gt: 0 }
    }).lean<IUserMetadataLean>()
    const draw = user?.wonderPickDraw
    if (!user || !draw?.candidates?.length) return null

    const draft = new CollectionDraft(user)
    const stillMissing = draw.candidates.filter((pokemon) =>
      draft.isMissingShinies(pokemon)
    )
    if (stillMissing.length === 0) {
      await UserMetadata.updateOne(
        { uid, "wonderPickDraw.candidates": draw.candidates },
        { $unset: { wonderPickDraw: "" } }
      )
      return null
    }
    const picked = pickRandomIn(stillMissing)
    const card = unlockAllShinyEmotions(draft, picked)

    const userDoc = await UserMetadata.findOneAndUpdate(
      {
        uid,
        wonderPicks: { $gt: 0 },
        "wonderPickDraw.candidates": draw.candidates,
        ...draft.getGuards()
      },
      {
        ...draft.toUpdate({ wonderPicks: -1 }),
        $unset: { wonderPickDraw: "" }
      },
      { returnDocument: "after" }
    )
    if (userDoc) {
      await checkTitlesAfterUnlocks(userDoc, [card])
      return { userDoc, picked }
    }
  }
  return null
}

function drawCasualPickCandidates(draft: CollectionDraft) {
  const regularCount =
    SEASON_WONDER_PICK_CARD_COUNT - SEASON_CASUAL_PICK_HOLO_CARDS
  const candidates: ICasualPick["candidates"] = []
  for (let i = 0; i < regularCount; i++) {
    const pool = pickBoosterSlotPool(false)
    const pokemon = pickRandomIn(withAltForms(pickRandomIn(pool)))
    candidates.push({ pokemon, holo: false })
  }
  for (let i = 0; i < SEASON_CASUAL_PICK_HOLO_CARDS; i++) {
    const pokemon = pickHoloPokemon(draft, pickBoosterSlotPool(false))
    if (pokemon) {
      draft.addHolo(pokemon)
      candidates.push({ pokemon, holo: true })
    }
  }
  return shuffleArray(candidates)
}

export async function getOrCreateCasualPick(uid: string) {
  const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
  if (!user) return null
  if (!user.casualPick?.candidates?.length) {
    const candidates = drawCasualPickCandidates(new CollectionDraft(user))
    if (user.casualPick) {
      await UserMetadata.updateOne(
        { uid, "casualPick.candidates.0": { $exists: false } },
        {
          $set: {
            "casualPick.candidates": candidates,
            "casualPick.rerollsLeft": SEASON_WONDER_PICK_FREE_REROLLS
          }
        }
      )
    } else {
      const casualPick: ICasualPick = {
        charges: 0,
        chargeWindow: 0,
        candidates,
        rerollsLeft: SEASON_WONDER_PICK_FREE_REROLLS
      }
      await UserMetadata.updateOne(
        { uid, casualPick: null },
        { $set: { casualPick } }
      )
    }
  }
  return UserMetadata.findOne({ uid })
}

export async function rerollCasualPick(uid: string) {
  const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
  const casualPick = user?.casualPick
  if (!user || !casualPick?.candidates?.length) return null
  if (casualPick.rerollsLeft <= 0) return null
  if (getCasualPickCharges(casualPick) < 1) return null
  const candidates = drawCasualPickCandidates(new CollectionDraft(user))
  return UserMetadata.findOneAndUpdate(
    {
      uid,
      "casualPick.candidates": casualPick.candidates,
      "casualPick.rerollsLeft": { $gt: 0 }
    },
    {
      $set: { "casualPick.candidates": candidates },
      $inc: { "casualPick.rerollsLeft": -1 }
    },
    { returnDocument: "after" }
  )
}

export function pickCasualPick(uid: string, now = Date.now()) {
  return queueCollectionUpdate(uid, () => pickCasualPickNow(uid, now))
}

async function pickCasualPickNow(uid: string, now: number) {
  for (let attempt = 0; attempt < MAX_COLLECTION_UPDATE_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
    const casualPick = user?.casualPick
    if (!user || !casualPick?.candidates?.length) return null
    const charges = getCasualPickCharges(casualPick, now)
    if (charges < 1) return null

    const draft = new CollectionDraft(user)
    const picked = pickRandomIn(casualPick.candidates)
    const card =
      picked.holo && !draft.hasHolo(picked.pokemon)
        ? unlockHolo(draft, picked.pokemon)
        : unlockNextNormalEmotion(draft, picked.pokemon)
    const update = draft.toUpdate(
      card.new ? {} : { seasonTickets: SEASON_DUPLICATE_CARD_TICKETS }
    )
    update.$set = {
      ...(update.$set as object),
      "casualPick.charges": charges - 1,
      "casualPick.chargeWindow": Math.floor(
        now / SEASON_CASUAL_PICK_INTERVAL_MS
      ),
      "casualPick.candidates": [],
      "casualPick.rerollsLeft": 0
    }

    const userDoc = await UserMetadata.findOneAndUpdate(
      {
        uid,
        "casualPick.candidates": casualPick.candidates,
        "casualPick.charges": casualPick.charges,
        "casualPick.chargeWindow": casualPick.chargeWindow,
        ...draft.getGuards()
      },
      update,
      { returnDocument: "after" }
    )
    if (userDoc) {
      await checkTitlesAfterUnlocks(userDoc, [card])
      return { userDoc, card }
    }
  }
  return null
}
