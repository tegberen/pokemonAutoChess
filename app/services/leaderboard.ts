import { getDoubleUpChampionUids } from "../models/mongo-models/double-up-champions"
import { getSmeargleScribbleChampionUid } from "../models/mongo-models/smeargle-scribble-champion"
import UserMetadata from "../models/mongo-models/user-metadata"
import type {
  ILeaderboardBotInfo,
  ILeaderboardInfo
} from "../types/interfaces/LeaderboardInfo"
import { logger } from "../utils/logger"
import { fetchBotsList } from "./bots"

let leaderboard = new Array<ILeaderboardInfo>()
let levelLeaderboard = new Array<ILeaderboardInfo>()
let botLeaderboard = new Array<ILeaderboardBotInfo>()
let eventLeaderboard = new Array<ILeaderboardInfo>()
let doubleUpChampions = new Array<ILeaderboardInfo>()
let smeargleScribbleChampion = new Array<ILeaderboardInfo>()

export function fetchLeaderboards() {
  logger.info("Refreshing leaderboards...")
  return Promise.all([
    fetchUserLeaderboard(),
    fetchBotsLeaderboard(),
    fetchLevelLeaderboard(),
    fetchEventLeaderboard(),
    fetchDoubleUpChampions(),
    fetchSmeargleScribbleChampion()
  ])
}

export async function fetchUserLeaderboard() {
  const users = await UserMetadata.find(
    {},
    ["displayName", "avatar", "elo", "uid", "twitchLogin", "twitchDisplayName"],
    { limit: 100, sort: { elo: -1 } }
  ).lean()

  if (users) {
    leaderboard = users.map((user, i) => ({
      name: user.displayName,
      rank: i + 1,
      avatar: user.avatar,
      value: user.elo,
      id: user.uid,
      twitchLogin: user.twitchLogin,
      twitchDisplayName: user.twitchDisplayName
    }))
  }
  return leaderboard
}

export async function fetchLevelLeaderboard() {
  const levelUsers = await UserMetadata.find(
    {},
    [
      "displayName",
      "avatar",
      "level",
      "uid",
      "twitchLogin",
      "twitchDisplayName"
    ],
    { limit: 100, sort: { level: -1 } }
  ).lean()

  if (levelUsers) {
    levelLeaderboard = levelUsers.map((user, i) => ({
      name: user.displayName,
      rank: i + 1,
      avatar: user.avatar,
      value: user.level,
      id: user.uid,
      twitchLogin: user.twitchLogin,
      twitchDisplayName: user.twitchDisplayName
    }))
  }

  return levelLeaderboard
}

export async function fetchBotsLeaderboard() {
  botLeaderboard = []
  const bots = await fetchBotsList(true)
  bots
    .sort((a, b) => b.elo - a.elo)
    .forEach((bot, i) => {
      botLeaderboard.push({
        name: bot.name,
        avatar: bot.avatar,
        rank: i + 1,
        value: bot.elo,
        author: bot.author
      })
    })
  return botLeaderboard
}

export async function fetchEventLeaderboard() {
  const users = await UserMetadata.find(
    { eventPoints: { $gt: 0 } },
    [
      "displayName",
      "avatar",
      "eventPoints",
      "eventFinishTime",
      "uid",
      "twitchLogin",
      "twitchDisplayName"
    ],
    { limit: 100, sort: { eventPoints: -1, eventFinishTime: 1 } }
  ).lean()

  if (users) {
    eventLeaderboard = users.map((user, i) => ({
      name: user.displayName,
      rank: i + 1,
      avatar: user.avatar,
      value: user.eventPoints,
      eventFinishTime: user.eventFinishTime,
      id: user.uid,
      twitchLogin: user.twitchLogin,
      twitchDisplayName: user.twitchDisplayName
    }))
  }
  return eventLeaderboard
}

export async function fetchDoubleUpChampions() {
  const uids = (await getDoubleUpChampionUids()).filter((uid) => uid !== "")
  const users = await UserMetadata.find(
    { uid: { $in: uids } },
    ["displayName", "avatar", "elo", "uid", "twitchLogin", "twitchDisplayName"]
  ).lean()

  // preserve the admin-chosen slot order (left, right)
  doubleUpChampions = uids
    .map((uid, i): ILeaderboardInfo | null => {
      const user = users.find((u) => u.uid === uid)
      if (!user) return null
      return {
        name: user.displayName,
        rank: i + 1,
        avatar: user.avatar,
        value: user.elo,
        id: user.uid,
        twitchLogin: user.twitchLogin,
        twitchDisplayName: user.twitchDisplayName
      }
    })
    .filter((info): info is ILeaderboardInfo => info != null)

  return doubleUpChampions
}

export async function fetchSmeargleScribbleChampion() {
  const uid = await getSmeargleScribbleChampionUid()
  smeargleScribbleChampion = []
  if (uid) {
    const user = await UserMetadata.findOne(
      { uid },
      ["displayName", "avatar", "elo", "uid", "twitchLogin", "twitchDisplayName"]
    ).lean()
    if (user) {
      smeargleScribbleChampion = [
        {
          name: user.displayName,
          rank: 1,
          avatar: user.avatar,
          value: user.elo,
          id: user.uid,
          twitchLogin: user.twitchLogin,
          twitchDisplayName: user.twitchDisplayName
        }
      ]
    }
  }
  return smeargleScribbleChampion
}

export function getLeaderboard() {
  return {
    leaderboard,
    botLeaderboard,
    levelLeaderboard,
    eventLeaderboard,
    doubleUpChampions,
    smeargleScribbleChampion
  }
}
