import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import type { IRecentVictory } from "../../../../../types/interfaces/RecentVictory"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import {
  setBotLeaderboard,
  setEventLeaderboard,
  setLeaderboard,
  setLevelLeaderboard,
  setRecentVictories,
  setTabIndex
} from "../../../stores/LobbyStore"
import Newspaper from "../newspaper/newspaper"
import LevelLeaderboard from "./level-leaderboard"
import PlayerLeaderboard from "./player-leaderboard"
import "./leaderboard-menu.css"

export default function LeaderboardMenu() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const tabIndex: number = useAppSelector((state) => state.lobby.tabIndex)

  useEffect(() => {
    fetch("/leaderboards")
      .then((res) => res.json())
      .then((data) => {
        dispatch(setLeaderboard(data.leaderboard))
        dispatch(setBotLeaderboard(data.botLeaderboard))
        dispatch(setLevelLeaderboard(data.levelLeaderboard))
        dispatch(setEventLeaderboard(data.eventLeaderboard))
      })

    // the newspaper refreshes with the lobby, no polling
    fetch("/recent-victories")
      .then((res) => (res.ok ? res.json() : []))
      .then((victories: IRecentVictory[]) =>
        dispatch(
          setRecentVictories(
            Array.isArray(victories)
              ? victories.filter((v) => (v?.winners?.length ?? 0) > 0)
              : []
          )
        )
      )
      .catch(() => dispatch(setRecentVictories([])))
  }, [])

  return (
    <Tabs
      className="my-container user-menu custom-bg hidden-scrollable"
      selectedIndex={tabIndex}
      onSelect={(i: number) => {
        dispatch(setTabIndex(i))
      }}
    >
      <h2>{t("community")}</h2>
      <TabList>
        <Tab>{t("newspaper.tab")}</Tab>
        <Tab>{t("level")}</Tab>
        <Tab>{t("players")}</Tab>
      </TabList>
      <TabPanel>
        <Newspaper />
      </TabPanel>
      <TabPanel>
        <LevelLeaderboard />
      </TabPanel>
      <TabPanel>
        <PlayerLeaderboard />
      </TabPanel>
    </Tabs>
  )
}
