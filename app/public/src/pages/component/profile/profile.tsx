import firebase from "firebase/compat/app"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import type { IGameRecord } from "../../../../../models/colyseus-models/game-record"
import { type ISuggestionUser, Role, Title } from "../../../../../types"
import type { IUserMetadataUnpacked } from "../../../../../types/interfaces/UserMetadata"
import { debounce } from "../../../../../utils/function"
import {
  canManageTournaments,
  getGivableTitles,
  hasModeratorRights
} from "../../../../../utils/roles"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import {
  ban,
  giveRole,
  giveTitle,
  searchById,
  setDoubleUpChampion,
  setSmeargleScribbleChampion,
  unban
} from "../../../network"
import { setSearchedUser } from "../../../stores/LobbyStore"
import { AccountTab } from "./account-tab"
import { CosmeticsTab } from "./cosmetics-tab"
import { EloTab } from "./elo-tab"
import GameHistory from "./game-history"
import PlayerBox from "./player-box"
import { ProfileChatHistory } from "./profile-chat-history"
import { SearchBar } from "./search-bar"
import SearchResults from "./search-results"
import { TitleTab } from "./title-tab"
import "./profile.css"

// Admin and Bot are never handed out by hand
const GIVABLE_ROLES = [
  Role.BASIC,
  Role.MODERATOR,
  Role.ORGANIZER,
  Role.BOT_MANAGER
]

export default function Profile() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.network.profile)
  const [suggestions, setSuggestions] = useState<ISuggestionUser[]>([])
  const searchedUser = useAppSelector((state) => state.lobby.searchedUser)

  const profile = searchedUser ?? user
  const [gameHistory, setGameHistory] = useState<IGameRecord[]>([])
  const [rightPanel, setRightPanel] = useState<"chat" | "game">("game")

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)

  async function searchName(query: string) {
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current
    setLoading(true)
    setError("")
    try {
      const token = await firebase.auth().currentUser?.getIdToken()
      const res = await fetch(`/players?name=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        signal
      })
      if (res.ok) {
        const suggestions = await res.json()
        if (suggestions.length === 0) {
          setError(t("no_results_found"))
        } else {
          setSuggestions(suggestions)
          setError("")
        }
      } else {
        setError(res.statusText)
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message)
      }
    }
    setLoading(false)
  }

  const debouncedSearchName = useRef(debounce(searchName, 500)).current

  function onSearchQueryChange(query: string) {
    abortControllerRef.current?.abort()
    if (query) {
      debouncedSearchName(query)
    } else {
      resetSearch()
    }
  }

  const resetSearch = useCallback(
    (user = searchedUser) => {
      dispatch(setSearchedUser(user))
      setSuggestions([])
      setError("")
    },
    [dispatch]
  )

  return (
    <div className="profile-modal">
      <div className="profile-box">
        <h2>
          {profile?.displayName ?? ""} {t("profile.title")}
        </h2>
        {profile && <PlayerBox user={profile} history={gameHistory} />}
      </div>

      <SearchBar onChange={onSearchQueryChange} />

      <div className="profile-actions">
        {loading ? (
          <div className="loading">{t("loading")}</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : suggestions.length > 0 ? (
          <SearchResults
            suggestions={suggestions}
            onSelect={(suggestion) => {
              resetSearch()
              searchById(suggestion.id)
            }}
          />
        ) : searchedUser ? (
          <OtherProfileActions
            gameHistory={gameHistory}
            rightPanel={rightPanel}
            setRightPanel={setRightPanel}
          />
        ) : (
          user && <MyProfileMenu user={user} gameHistory={gameHistory} />
        )}
      </div>

      {rightPanel === "game" && profile && (
        <GameHistory uid={profile.uid} onUpdate={setGameHistory} />
      )}
      {rightPanel === "chat" && profile && (
        <ProfileChatHistory uid={profile.uid} />
      )}
    </div>
  )
}

function MyProfileMenu({
  gameHistory,
  user
}: {
  gameHistory: IGameRecord[]
  user: IUserMetadataUnpacked
}) {
  const { t } = useTranslation()
  return (
    <Tabs>
      <TabList>
        <Tab>Record</Tab>
        <Tab>{t("title_label")}</Tab>
        <Tab>Cosmetics</Tab>
        <Tab>{t("profile.account.title")}</Tab>
      </TabList>

      <TabPanel>
        <EloTab user={user} gameHistory={gameHistory} />
      </TabPanel>
      <TabPanel>
        <TitleTab />
      </TabPanel>
      <TabPanel>
        <CosmeticsTab />
      </TabPanel>
      <TabPanel>
        <AccountTab />
      </TabPanel>
    </Tabs>
  )
}

function OtherProfileActions(props: {
  gameHistory: IGameRecord[]
  rightPanel: "game" | "chat"
  setRightPanel: React.Dispatch<React.SetStateAction<"game" | "chat">>
}) {
  const { t } = useTranslation()
  const currentUid = useAppSelector((state) => state.network.profile?.uid)
  const role = useAppSelector((state) => state.network.profile?.role)
  const user = useAppSelector((state) => state.lobby.searchedUser)
  const givableTitles = getGivableTitles(role)
  const [title, setTitle] = useState<Title>(
    givableTitles.includes(user?.title as Title)
      ? (user?.title as Title)
      : (givableTitles[0] ?? Title.ACE_TRAINER)
  )
  const [roleToGive, setRoleToGive] = useState<Role>(user?.role ?? Role.BASIC)
  useEffect(
    () => setRoleToGive(user?.role ?? Role.BASIC),
    [user?.uid, user?.role]
  )

  if (!user) return null
  const isAdmin = role === Role.ADMIN
  const isOtherPlayer = !!currentUid && user.uid !== currentUid

  return (
    <>
      <Tabs>
        <TabList>
          <Tab>Record</Tab>
        </TabList>
        <TabPanel>
          <EloTab user={user} gameHistory={props.gameHistory} />
        </TabPanel>
      </Tabs>
      {hasModeratorRights(role) && (
        <div className="profile-staff-tools my-container">
          {isOtherPlayer && (
            <button
              className="profile-back-link"
              onClick={() => searchById(currentUid)}
            >
              ← {t("back_to_my_profile")}
            </button>
          )}

          <div className="profile-staff-row">
            <span className="profile-staff-label">Moderation</span>
            <div className="profile-staff-controls">
              {props.rightPanel === "game" ? (
                <button
                  className="bubbly blue"
                  onClick={() => props.setRightPanel("chat")}
                >
                  {t("see_chat_history")}
                </button>
              ) : (
                <button
                  className="bubbly blue"
                  onClick={() => props.setRightPanel("game")}
                >
                  {t("see_game_history")}
                </button>
              )}
              {user.banned ? (
                <button
                  className="bubbly red"
                  onClick={() => {
                    const reason = prompt("Reason for the unban:")
                    if (reason === null) return
                    unban({ uid: user.uid, reason })
                  }}
                >
                  {t("unban_user")}
                </button>
              ) : (
                <button
                  className="bubbly red"
                  onClick={() => {
                    const reason = prompt("Reason for the ban:")
                    if (reason === null) return
                    ban({ uid: user.uid, reason })
                  }}
                >
                  {t("ban_user")}
                </button>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="profile-staff-row">
              <span className="profile-staff-label">Role</span>
              <div className="profile-staff-controls">
                <select
                  value={roleToGive}
                  onChange={(e) => setRoleToGive(e.target.value as Role)}
                >
                  {GIVABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(`role.${r}`)}
                    </option>
                  ))}
                </select>
                <button
                  className="bubbly blue"
                  disabled={roleToGive === user.role}
                  onClick={() => {
                    giveRole({ uid: user.uid, role: roleToGive })
                    const roleName = t(`role.${roleToGive}`)
                    alert(`${roleName} given to ${user.displayName}`)
                  }}
                >
                  Give
                </button>
              </div>
            </div>
          )}

          {canManageTournaments(role) && (
            <>
              <div className="profile-staff-row">
                <span className="profile-staff-label">Title</span>
                <div className="profile-staff-controls">
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value as Title)}
                  >
                    {givableTitles.map((ti) => (
                      <option key={ti} value={ti}>
                        {ti}
                      </option>
                    ))}
                  </select>
                  <button
                    className="bubbly blue"
                    onClick={() => {
                      giveTitle({ uid: user.uid, title })
                      alert(`Title ${title} given to ${user.displayName}`)
                    }}
                  >
                    Give
                  </button>
                </div>
              </div>

              <div className="profile-staff-row">
                <span className="profile-staff-label">Champion</span>
                <div className="profile-staff-controls">
                  <button
                    className="bubbly dark"
                    onClick={() => {
                      setDoubleUpChampion({ uid: user.uid, slot: 0 })
                      alert(
                        `${user.displayName} set as Double-Up Champion (Left)`
                      )
                    }}
                  >
                    Double Up left
                  </button>
                  <button
                    className="bubbly dark"
                    onClick={() => {
                      setDoubleUpChampion({ uid: user.uid, slot: 1 })
                      alert(
                        `${user.displayName} set as Double-Up Champion (Right)`
                      )
                    }}
                  >
                    Double Up right
                  </button>
                  <button
                    className="bubbly dark"
                    onClick={() => {
                      setSmeargleScribbleChampion({ uid: user.uid })
                      alert(
                        `${user.displayName} set as Smeargle Scribble Champion`
                      )
                    }}
                  >
                    Smeargle Scribble
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
