import { Blessings } from "../config/game/blessings"
import Dendrogram from "../models/mongo-models/dendrogram"
import DetailledStatisticV2 from "../models/mongo-models/detailled-statistic-v2"
import ItemsStatistic from "../models/mongo-models/items-statistic-v2"
import MetaV2 from "../models/mongo-models/meta-v2"
import PokemonsStatistics from "../models/mongo-models/pokemons-statistic-v2"
import RegionStatistic from "../models/mongo-models/regions-statistic"
import ReportMetadata from "../models/mongo-models/report-metadata"
import UserMetadata from "../models/mongo-models/user-metadata"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import type { Blessing, BlessingTier } from "../types/enum/Blessing"
import type { EloRank } from "../types/enum/EloRank"
import { GameMode } from "../types/enum/Game"
import {
  CraftableItems,
  type Item,
  ShinyItems,
  Tools
} from "../types/enum/Item"
import { NonPkm, type Pkm, PkmFamily } from "../types/enum/Pokemon"
import type { Synergy } from "../types/enum/Synergy"
import type { ITypeStatistics } from "../types/meta"
import type { IDendrogram } from "../types/models/dendrogram"
import type {
  IGameActivity,
  IGameActivityDay
} from "../types/models/game-activity"
import type { IItemsStatisticV2 } from "../types/models/items-statistic-v2"
import type { IMetaV2 } from "../types/models/meta-v2"
import type {
  IPlayerRankDistribution,
  IPlayerRankDistributionBucket
} from "../types/models/player-rank-distribution"
import type {
  IPokemonItemsMode,
  IPokemonItemsReport,
  IPokemonReport,
  IPokemonReportForm,
  IPokemonReportLine,
  IPokemonReportMode
} from "../types/models/pokemon-report"
import type { IPokemonsStatisticV2 } from "../types/models/pokemons-statistic-v2"
import type { IRegionStatistic } from "../types/models/regions-statistic"
import type { IReportMetadata } from "../types/models/report-metadata"
import type {
  IWishItemReport,
  IWishItemReportMode,
  IWishItemReportRow
} from "../types/models/wish-item-report"
import type {
  IWishReport,
  IWishReportMode,
  IWishReportRow
} from "../types/models/wish-report"
import { logger } from "../utils/logger"
import { mapToObj } from "../utils/map"

const PLAYER_RANK_BUCKET_START = 600
const PLAYER_RANK_BUCKET_SIZE = 25
const PLAYER_RANK_COUNTING_SLOW_MS = 5000

export async function fetchMetaReports() {
  logger.info("Refreshing meta reports...")
  const data = await Promise.all([
    fetchMetadata(),
    fetchMetaItems(),
    fetchMetaPokemons(),
    fetchMetaRegions(),
    fetchMetaV2(),
    fetchDendrogramData(),
    fetchPlayerRankDistribution(),
    fetchGameActivity(),
    fetchWishReport()
  ])
  logger.info("Meta reports refreshed")
  return data
}

let metadata = new Array<IReportMetadata>()
let metaItems = new Array<IItemsStatisticV2>()
let metaPokemons = new Array<IPokemonsStatisticV2>()
let metaRegions = new Array<IRegionStatistic>()
let metaV2 = new Array<IMetaV2>()
let dendrogram: IDendrogram | null = null
let gameActivity: IGameActivity = {
  updatedAt: new Date(0).toISOString(),
  days: []
}
const emptyWishReportMode: IWishReportMode = { games: 0, players: 0, rows: [] }
let wishReport: IWishReport = {
  updatedAt: new Date(0).toISOString(),
  since: new Date(0).toISOString(),
  solo: emptyWishReportMode,
  duo: emptyWishReportMode
}
const emptyPokemonReportMode: IPokemonReportMode = {
  games: 0,
  players: 0,
  lines: []
}
let pokemonReport: IPokemonReport = {
  updatedAt: new Date(0).toISOString(),
  since: new Date(0).toISOString(),
  solo: emptyPokemonReportMode,
  duo: emptyPokemonReportMode
}
const emptyPokemonItemsMode: IPokemonItemsMode = { forms: {}, lines: {} }
let pokemonItemsReport: IPokemonItemsReport = {
  updatedAt: new Date(0).toISOString(),
  solo: emptyPokemonItemsMode,
  duo: emptyPokemonItemsMode
}
const emptyWishItemReportMode: IWishItemReportMode = {
  games: 0,
  players: 0,
  rows: []
}
let wishItemReport: IWishItemReport = {
  updatedAt: new Date(0).toISOString(),
  since: new Date(0).toISOString(),
  solo: emptyWishItemReportMode,
  duo: emptyWishItemReportMode
}
let playerRankDistribution: IPlayerRankDistribution = {
  updatedAt: new Date(0).toISOString(),
  totalPlayers: 0,
  bucketSize: PLAYER_RANK_BUCKET_SIZE,
  bucketStart: PLAYER_RANK_BUCKET_START,
  buckets: []
}

function makeBucketLabel(minElo: number, maxElo: number) {
  return `${minElo}-${maxElo}`
}

async function fetchPlayerRankDistribution() {
  const countingStartedAt = Date.now()

  const hasEloFilter = {
    elo: { $ne: null }
  } as const

  let totalPlayers = 0
  const bucketStart = PLAYER_RANK_BUCKET_START
  let highestBucketIndex = -1

  try {
    totalPlayers = await UserMetadata.countDocuments(hasEloFilter).exec()

    const highestEloPlayer = await UserMetadata.findOne(hasEloFilter)
      .sort({ elo: -1 })
      .select({ elo: 1 })
      .lean()
      .exec()

    const highestElo =
      typeof highestEloPlayer?.elo === "number" ? highestEloPlayer.elo : null

    if (highestElo !== null && highestElo >= bucketStart) {
      highestBucketIndex = Math.floor(
        (highestElo - bucketStart) / PLAYER_RANK_BUCKET_SIZE
      )
    }
  } catch (error) {
    logger.error(
      "Failed to refresh player rank distribution counts; keeping previous snapshot",
      error
    )
    return playerRankDistribution
  }

  const buckets: IPlayerRankDistributionBucket[] = []

  let rangeBucketQueryCount = 0

  try {
    // Underflow bucket: all players below bucketStart (600)
    const underflowCount = await UserMetadata.countDocuments({
      elo: { $ne: null, $lt: bucketStart }
    }).exec()

    rangeBucketQueryCount += 1

    buckets.push({
      bucketLabel: `<${bucketStart}`,
      count: underflowCount,
      percentage: totalPlayers > 0 ? (underflowCount / totalPlayers) * 100 : 0,
      topPercent: 0,
      minElo: null,
      maxElo: bucketStart - 1,
      isUnderflow: true
    })

    for (let i = 0; i <= highestBucketIndex; i += 1) {
      const minElo = bucketStart + i * PLAYER_RANK_BUCKET_SIZE
      const maxElo = minElo + PLAYER_RANK_BUCKET_SIZE - 1

      const count = await UserMetadata.countDocuments({
        elo: {
          $gte: minElo,
          $lte: maxElo
        }
      }).exec()

      rangeBucketQueryCount += 1

      buckets.push({
        bucketLabel: makeBucketLabel(minElo, maxElo),
        count,
        percentage: totalPlayers > 0 ? (count / totalPlayers) * 100 : 0,
        topPercent: 0,
        minElo,
        maxElo,
        isUnderflow: false
      })
    }
  } catch (error) {
    logger.error(
      "Failed to refresh player rank distribution bucket counts; keeping previous snapshot",
      error
    )
    return playerRankDistribution
  }

  const countingDurationMs = Date.now() - countingStartedAt

  if (countingDurationMs >= PLAYER_RANK_COUNTING_SLOW_MS) {
    logger.warn("Player rank distribution per-bucket counting is slow", {
      countingDurationMs,
      rangeBucketQueryCount,
      slowThresholdMs: PLAYER_RANK_COUNTING_SLOW_MS
    })
  } else {
    logger.info("Player rank distribution per-bucket counting runtime", {
      countingDurationMs,
      rangeBucketQueryCount
    })
  }

  let cumulativeFromTop = 0
  for (let i = buckets.length - 1; i >= 0; i -= 1) {
    cumulativeFromTop += buckets[i].count
    buckets[i].topPercent =
      totalPlayers > 0 ? (cumulativeFromTop / totalPlayers) * 100 : 0
  }

  playerRankDistribution = {
    updatedAt: new Date().toISOString(),
    totalPlayers,
    bucketSize: PLAYER_RANK_BUCKET_SIZE,
    bucketStart,
    buckets
  }

  return playerRankDistribution
}

async function fetchMetaItems() {
  metaItems = await ItemsStatistic.find().lean().exec()
  return metaItems
}

async function fetchMetaPokemons() {
  metaPokemons = await PokemonsStatistics.find().lean().exec()
  return metaPokemons
}

async function fetchMetadata() {
  metadata = await ReportMetadata.find().lean().exec()
  return metadata
}

async function fetchMetaRegions() {
  metaRegions = await RegionStatistic.find().lean().exec()
  return metaRegions
}

async function fetchMetaV2() {
  metaV2 = await MetaV2.find().lean().exec()
  return metaV2
}

export function getMetaPokemons() {
  return metaPokemons
}

export function getMetaItems() {
  return metaItems
}

export function getMetadata() {
  return metadata
}

export function getMetaRegions() {
  return metaRegions
}

export function getMetaV2() {
  return metaV2
}

export function getPlayerRankDistribution() {
  return playerRankDistribution
}

export function getGameActivity() {
  return gameActivity
}

async function fetchGameActivity() {
  const DAYS = 30
  const since = Date.now() - DAYS * 24 * 60 * 60 * 1000

  try {
    const rows: { _id: string; gameCount: number }[] =
      await DetailledStatisticV2.aggregate([
        { $match: { time: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$time" } }
            },
            gameCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).exec()

    const days: IGameActivityDay[] = rows
      .map((row) => ({
        date: row._id,
        gameCount: row.gameCount
      }))
      .slice(1, -1) // Remove first and last day (incomplete data at edges)

    gameActivity = { updatedAt: new Date().toISOString(), days }
  } catch (error) {
    logger.error(
      "Failed to refresh game activity; keeping previous snapshot",
      error
    )
  }

  return gameActivity
}

const WISH_REPORT_DAYS = 30
// placements are only comparable between lobbies of the same size
const WISH_REPORT_PLAYERS = 8

const POKEMON_REPORT_TOP_ITEMS = 3

type WishReportGame = {
  gameMode: GameMode
  players: {
    rank: number
    blessings: Blessing[] | null
    pokemons: { name: Pkm; items: Item[] | null }[] | null
  }[]
}

export function getWishReport() {
  return wishReport
}

export function getWishItemReport() {
  return wishItemReport
}

export function getPokemonReport() {
  return pokemonReport
}

export function getPokemonItemsReport() {
  return pokemonItemsReport
}

async function fetchWishReport() {
  const since = Date.now() - WISH_REPORT_DAYS * 24 * 60 * 60 * 1000
  const startedAt = Date.now()
  try {
    // records exist for humans only, so a game had no bots when its record
    // count equals its player count; Scribble and Guide games are not recorded
    const games: WishReportGame[] = await DetailledStatisticV2.aggregate([
      {
        $match: {
          time: { $gte: since },
          gameId: { $type: "string" },
          nbplayers: WISH_REPORT_PLAYERS,
          specialGameRule: null,
          gameMode: { $nin: [GameMode.SCRIBBLE, GameMode.GUIDE] }
        }
      },
      {
        $group: {
          _id: "$gameId",
          records: { $sum: 1 },
          gameMode: { $first: "$gameMode" },
          wishes: { $sum: { $size: { $ifNull: ["$blessings", []] } } },
          players: {
            $push: {
              rank: "$rank",
              blessings: "$blessings",
              pokemons: {
                $map: {
                  input: { $ifNull: ["$pokemons", []] },
                  as: "pokemon",
                  in: { name: "$$pokemon.name", items: "$$pokemon.items" }
                }
              }
            }
          }
        }
      },
      {
        $match: {
          records: WISH_REPORT_PLAYERS,
          wishes: { $gt: 0 }
        }
      },
      { $project: { _id: 0, gameMode: 1, players: 1 } }
    ])
      .allowDiskUse(true)
      .exec()

    const soloGames = games.filter(
      (game) => game.gameMode !== GameMode.DOUBLE_UP
    )
    const duoGames = games.filter(
      (game) => game.gameMode === GameMode.DOUBLE_UP
    )
    wishReport = {
      updatedAt: new Date().toISOString(),
      since: new Date(since).toISOString(),
      solo: summarizeWishes(soloGames),
      duo: summarizeWishes(duoGames)
    }
    pokemonReport = {
      updatedAt: wishReport.updatedAt,
      since: wishReport.since,
      solo: summarizePokemons(soloGames),
      duo: summarizePokemons(duoGames)
    }
    wishItemReport = {
      updatedAt: wishReport.updatedAt,
      since: wishReport.since,
      solo: summarizeItems(soloGames),
      duo: summarizeItems(duoGames)
    }
    pokemonItemsReport = {
      updatedAt: wishReport.updatedAt,
      solo: summarizePokemonItems(soloGames),
      duo: summarizePokemonItems(duoGames)
    }
    logger.info(
      `Wish report: ${games.length} games in ${Date.now() - startedAt}ms`
    )
  } catch (error) {
    logger.error(
      "Failed to refresh wish report; keeping previous snapshot",
      error
    )
  }

  return wishReport
}

// a lobby is offered one tier at a time, so a pick rate compares Wishes of the
// same tier
function summarizeWishes(games: WishReportGame[]): IWishReportMode {
  const totals = new Map<
    Blessing,
    { picks: number; placeSum: number; firsts: number }
  >()
  const picksByTier = new Map<BlessingTier, number>()
  let players = 0
  games.forEach((game) =>
    game.players.forEach(({ rank, blessings }) => {
      players++
      new Set(blessings ?? []).forEach((blessing) => {
        if (!Blessings[blessing]) return
        const total = totals.get(blessing) ?? {
          picks: 0,
          placeSum: 0,
          firsts: 0
        }
        total.picks++
        total.placeSum += rank
        if (rank === 1) total.firsts++
        totals.set(blessing, total)
        const tier = Blessings[blessing].tier
        picksByTier.set(tier, (picksByTier.get(tier) ?? 0) + 1)
      })
    })
  )

  const rows: IWishReportRow[] = [...totals].map(([blessing, total]) => ({
    blessing,
    picks: total.picks,
    pickRate: total.picks / (picksByTier.get(Blessings[blessing].tier) ?? 1),
    averagePlace: total.placeSum / total.picks,
    firstRate: total.firsts / total.picks
  }))
  return { games: games.length, players, rows }
}

type PickTotal = { picks: number; placeSum: number; firsts: number }

function addPick<Key>(totals: Map<Key, PickTotal>, key: Key, rank: number) {
  const total = totals.get(key) ?? { picks: 0, placeSum: 0, firsts: 0 }
  total.picks++
  total.placeSum += rank
  if (rank === 1) total.firsts++
  totals.set(key, total)
}

function toPickStats(total: PickTotal) {
  return {
    picks: total.picks,
    averagePlace: total.placeSum / total.picks,
    firstRate: total.firsts / total.picks
  }
}

const REPORTED_ITEMS = new Set<Item>([
  ...CraftableItems,
  ...Tools,
  ...ShinyItems
])

// an item counts once per player team, whichever Pokémon held it
function summarizeItems(games: WishReportGame[]): IWishItemReportMode {
  const totals = new Map<Item, PickTotal>()
  let players = 0
  games.forEach((game) =>
    game.players.forEach(({ rank, pokemons }) => {
      players++
      const held = new Set<Item>()
      ;(pokemons ?? []).forEach((pokemon) =>
        (pokemon.items ?? []).forEach((item) => held.add(item))
      )
      held.forEach((item) => {
        if (REPORTED_ITEMS.has(item)) addPick(totals, item, rank)
      })
    })
  )
  const rows: IWishItemReportRow[] = [...totals].map(([item, total]) => ({
    item,
    ...toPickStats(total)
  }))
  return { games: games.length, players, rows }
}

function isReportablePokemon(name: Pkm) {
  return PkmFamily[name] !== undefined && !NonPkm.includes(name)
}

// a Pokémon counts once per player however many copies they fielded, and a
// line adds up its forms, so a player with two forms counts twice in it
function summarizePokemons(games: WishReportGame[]): IPokemonReportMode {
  const formTotals = new Map<Pkm, PickTotal>()
  let players = 0
  games.forEach((game) =>
    game.players.forEach(({ rank, pokemons }) => {
      players++
      new Set(
        (pokemons ?? [])
          .map((pokemon) => pokemon.name)
          .filter(isReportablePokemon)
      ).forEach((name) => addPick(formTotals, name, rank))
    })
  )

  const formsByFamily = new Map<Pkm, IPokemonReportForm[]>()
  formTotals.forEach((total, pkm) => {
    const family = PkmFamily[pkm]
    formsByFamily.set(family, [
      ...(formsByFamily.get(family) ?? []),
      { pkm, ...toPickStats(total) }
    ])
  })
  const lines: IPokemonReportLine[] = [...formsByFamily].map(
    ([family, forms]) => {
      const picks = forms.reduce((sum, form) => sum + form.picks, 0)
      return {
        pkm: family,
        picks,
        averagePlace:
          forms.reduce((sum, form) => sum + form.averagePlace * form.picks, 0) /
          picks,
        firstRate:
          forms.reduce((sum, form) => sum + form.firstRate * form.picks, 0) /
          picks,
        forms: forms.sort(
          (a, b) =>
            getPokemonData(a.pkm).stars - getPokemonData(b.pkm).stars ||
            b.picks - a.picks
        )
      }
    }
  )
  return { games: games.length, players, lines }
}

function summarizePokemonItems(games: WishReportGame[]): IPokemonItemsMode {
  const formHolders = new Map<Pkm, number>()
  const lineHolders = new Map<Pkm, number>()
  const formItems = new Map<Pkm, Map<Item, number>>()
  const lineItems = new Map<Pkm, Map<Item, number>>()
  const bump = <Key>(map: Map<Key, number>, key: Key) =>
    map.set(key, (map.get(key) ?? 0) + 1)
  const bumpItem = (
    owners: Map<Pkm, Map<Item, number>>,
    owner: Pkm,
    item: Item
  ) => {
    const counts = owners.get(owner) ?? new Map<Item, number>()
    bump(counts, item)
    owners.set(owner, counts)
  }

  games.forEach((game) =>
    game.players.forEach(({ pokemons }) => {
      const formsSeen = new Set<Pkm>()
      const linesSeen = new Set<Pkm>()
      const formItemsSeen = new Set<string>()
      const lineItemsSeen = new Set<string>()
      ;(pokemons ?? []).forEach(({ name, items }) => {
        if (!isReportablePokemon(name)) return
        const family = PkmFamily[name]
        if (!formsSeen.has(name)) bump(formHolders, name)
        if (!linesSeen.has(family)) bump(lineHolders, family)
        formsSeen.add(name)
        linesSeen.add(family)
        new Set(items ?? []).forEach((item) => {
          if (!formItemsSeen.has(`${name}|${item}`)) {
            bumpItem(formItems, name, item)
            formItemsSeen.add(`${name}|${item}`)
          }
          if (!lineItemsSeen.has(`${family}|${item}`)) {
            bumpItem(lineItems, family, item)
            lineItemsSeen.add(`${family}|${item}`)
          }
        })
      })
    })
  )

  const topItems = (
    owners: Map<Pkm, Map<Item, number>>,
    holders: Map<Pkm, number>
  ) =>
    Object.fromEntries(
      [...owners].map(([owner, counts]) => [
        owner,
        [...counts]
          .sort((a, b) => b[1] - a[1])
          .slice(0, POKEMON_REPORT_TOP_ITEMS)
          .map(([item, count]) => ({
            item,
            share: count / (holders.get(owner) ?? 1)
          }))
      ])
    )
  return {
    forms: topItems(formItems, formHolders),
    lines: topItems(lineItems, lineHolders)
  }
}

async function fetchDendrogramData() {
  dendrogram = await Dendrogram.findOne().lean().exec()
  return dendrogram
}

export function getDendrogram() {
  return dendrogram
}

export function computeSynergyAverages() {
  const rankPerTierAndSynergy: Map<EloRank, Map<Synergy, number>> = new Map()
  const countPerTierAndSynergy: Map<EloRank, Map<Synergy, number>> = new Map()
  metaPokemons.forEach((pokemonStat) => {
    Object.values(pokemonStat.pokemons).forEach((pkm) => {
      const tier = pokemonStat.tier
      if (!rankPerTierAndSynergy.has(tier)) {
        rankPerTierAndSynergy.set(tier, new Map())
        countPerTierAndSynergy.set(tier, new Map())
      }

      const pokemon = getPokemonData(pkm.name)
      for (const synergy of pokemon.types) {
        const count = pkm.count
        const rank = pkm.rank

        const ranksPerSynergy = rankPerTierAndSynergy.get(tier)!
        const countsPerSynergy = countPerTierAndSynergy.get(tier)!
        if (!ranksPerSynergy.has(synergy)) {
          ranksPerSynergy.set(synergy, 0)
          countsPerSynergy.set(synergy, 0)
        }
        ranksPerSynergy.set(
          synergy,
          ranksPerSynergy.get(synergy)! + rank * count
        )
        countsPerSynergy.set(synergy, countsPerSynergy.get(synergy)! + count)
      }
    })
  })

  const synergyAveragesPerTier: Map<
    EloRank,
    { [type in Synergy]: { average_rank: number; count: number } }
  > = new Map()
  rankPerTierAndSynergy.forEach((ranksPerSynergy, tier) => {
    const countsPerSynergy = countPerTierAndSynergy.get(tier)!
    const averagesPerSynergy: Map<
      Synergy,
      { average_rank: number; count: number }
    > = new Map()
    ranksPerSynergy.forEach((totalRank, synergy) => {
      const totalCount = countsPerSynergy.get(synergy)!
      averagesPerSynergy.set(synergy, {
        average_rank: totalRank / totalCount,
        count: totalCount
      })
    })
    synergyAveragesPerTier.set(tier, mapToObj(averagesPerSynergy))
  })

  // return json
  return mapToObj(synergyAveragesPerTier) as ITypeStatistics
}
