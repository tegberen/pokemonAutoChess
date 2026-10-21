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
import type { IPokemonsStatisticV2 } from "../types/models/pokemons-statistic-v2"
import type { IRegionStatistic } from "../types/models/regions-statistic"
import type { IReportMetadata } from "../types/models/report-metadata"
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

type WishReportGame = {
  gameMode: GameMode
  players: { rank: number; blessings: Blessing[] | null }[]
}

export function getWishReport() {
  return wishReport
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
          players: { $push: { rank: "$rank", blessings: "$blessings" } }
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

    wishReport = {
      updatedAt: new Date().toISOString(),
      since: new Date(since).toISOString(),
      solo: summarizeWishes(
        games.filter((game) => game.gameMode !== GameMode.DOUBLE_UP)
      ),
      duo: summarizeWishes(
        games.filter((game) => game.gameMode === GameMode.DOUBLE_UP)
      )
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
