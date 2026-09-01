import type { RoomAvailable } from "@colyseus/sdk"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { type IPreparationMetadata, Role, Transfer } from "../../../../../types"
import { GameMode, type RoomRequest } from "../../../../../types/enum/Game"
import { block, throttle } from "../../../../../utils/function"
import { joinExistingPreparationRoom } from "../../../game/lobby-logic"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import { rooms } from "../../../network"
import { GameModeIcon } from "../icons/game-mode-icon"
import { IngameRoomsList } from "./game-rooms-menu"
import RoomItem from "./room-item"
import { RoomSelectionMenu } from "./room-selection-menu"
import "./room-menu.css"

export default function RoomMenu() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const preparationRooms: RoomAvailable[] = useAppSelector(
    (state) => state.lobby.preparationRooms
    // a guide lobby exists for the instant it takes to auto-start, and belongs
    // to one player, so it never belongs in the room list
  ).filter((r) => r.metadata?.gameMode !== GameMode.GUIDE)
  const gameRooms: RoomAvailable[] = useAppSelector(
    (state) => state.lobby.gameRooms
  )
  const ccu = useAppSelector((state) => state.lobby.ccu)
  const user = useAppSelector((state) => state.network.profile)
  const [showRoomSelectionMenu, setShowRoomSelectionMenu] =
    useState<boolean>(false)

  const requestRoom = throttle(async function (gameMode: RoomRequest) {
    if (rooms.lobby) {
      rooms.lobby.send(Transfer.REQUEST_ROOM, gameMode)
      setShowRoomSelectionMenu(false)
    }
  }, 1000)

  const requestJoiningExistingRoom = block(async function join(
    selectedRoom: RoomAvailable<IPreparationMetadata>
  ) {
    const passwordProtected = selectedRoom.metadata?.passwordProtected

    if (rooms.lobby) {
      let password: string | undefined
      if (
        passwordProtected &&
        user?.role !== Role.ADMIN &&
        user?.role !== Role.MODERATOR
      ) {
        const inputPassword = prompt(t("room_menu.room_is_private"))
        if (!inputPassword) return
        password = inputPassword
      }

      await joinExistingPreparationRoom(
        selectedRoom.roomId,
        dispatch,
        navigate,
        password
      )
    }
  })

  const onRoomAction = (
    room: RoomAvailable<IPreparationMetadata>,
    action: string
  ) => {
    if (action === "join") {
      requestJoiningExistingRoom(room)
    } else if (action === "delete" && user?.role === Role.ADMIN) {
      confirm("Delete room ?") &&
        rooms.lobby?.send(Transfer.DELETE_ROOM, room.roomId)
    }
  }

  const hasTournamentLobbies = gameRooms.some(
    (r) => r.metadata.gameMode === GameMode.TOURNAMENT
  )
  const hasDoubleUpLobbies = gameRooms.some(
    (r) => r.metadata.gameMode === GameMode.DOUBLE_UP && !r.metadata.whimsy
  )
  const hasWhimsyLobbies = gameRooms.some((r) => r.metadata.whimsy)
  const hasCustomLobbies = gameRooms.some(
    (r) => r.metadata.gameMode === GameMode.CUSTOM_LOBBY
  )

  return (
    <Tabs className="my-container room-menu custom-bg hidden-scrollable">
      <h2>{t("rooms")}</h2>
      <p style={{ position: "absolute", right: "10px", top: "10px" }}>
        {t("players", { count: ccu })},{" "}
        {t("rooms", { count: preparationRooms.length })}
      </p>
      <TabList>
        <Tab>{t("available_rooms")}</Tab>
        <Tab>
          <span>{t("in_game")}</span>
        </Tab>

        {hasTournamentLobbies && (
          <Tab>
            <GameModeIcon gameMode={GameMode.TOURNAMENT} />
            <span>{t(`game_modes.${GameMode.TOURNAMENT}`)}</span>
          </Tab>
        )}
        {hasDoubleUpLobbies && (
          <Tab>
            <GameModeIcon gameMode={GameMode.DOUBLE_UP} />
            <span>{t(`game_modes.${GameMode.DOUBLE_UP}`)}</span>
          </Tab>
        )}
        {hasWhimsyLobbies && (
          <Tab>
            <img
              src="/assets/ui/whimsy_weekend.png"
              alt={t("whimsy_weekend")}
              title={t("whimsy_weekend")}
              className="gamemode icon"
              draggable="false"
            />
            <span>{t("whimsy_weekend")}</span>
          </Tab>
        )}
        {hasCustomLobbies && (
          <Tab>
            <GameModeIcon gameMode={GameMode.CUSTOM_LOBBY} />
            <span>{t(`game_modes.${GameMode.CUSTOM_LOBBY}`)}</span>
          </Tab>
        )}
      </TabList>
      {!user && <p className="subtitle">{t("loading")}</p>}

      <TabPanel>
        <RoomList onRoomAction={onRoomAction} />
      </TabPanel>
      <TabPanel>
        <IngameRoomsList />
      </TabPanel>
      {hasTournamentLobbies && (
        <TabPanel>
          <IngameRoomsList gameMode={GameMode.TOURNAMENT} />
        </TabPanel>
      )}
      {hasDoubleUpLobbies && (
        <TabPanel>
          <IngameRoomsList gameMode={GameMode.DOUBLE_UP} whimsy={false} />
        </TabPanel>
      )}
      {hasWhimsyLobbies && (
        <TabPanel>
          <IngameRoomsList whimsy={true} />
        </TabPanel>
      )}
      {hasCustomLobbies && (
        <TabPanel>
          <IngameRoomsList gameMode={GameMode.CUSTOM_LOBBY} />
        </TabPanel>
      )}

      <RoomSelectionMenu
        show={showRoomSelectionMenu}
        onClose={() => setShowRoomSelectionMenu(false)}
        onSelectMode={(mode) => requestRoom(mode)}
      />
      <button
        onClick={() => setShowRoomSelectionMenu(true)}
        className="bubbly green play-button"
      >
        {t("new_game")}
      </button>
    </Tabs>
  )
}

export function RoomList({
  gameMode,
  onRoomAction
}: {
  gameMode?: GameMode
  onRoomAction: (room: RoomAvailable, action: string) => void
}) {
  const preparationRooms: RoomAvailable[] = useAppSelector(
    (state) => state.lobby.preparationRooms
  )
  //preparationRooms.push(...mockRooms)

  return (
    <ul className="room-list hidden-scrollable">
      {preparationRooms
        .filter((r) => !gameMode || r.metadata.gameMode === gameMode)
        .map((r) => (
          <li key={r.roomId}>
            <RoomItem room={r} click={(action) => onRoomAction(r, action)} />
          </li>
        ))}
    </ul>
  )
}
