import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Menu, MenuItem, type MenuItemProps, Sidebar } from "react-pro-sidebar"
import { useNavigate } from "react-router"
import pkg from "../../../../../../package.json"
import { GADGETS } from "../../../../../config/game/gadgets"
import { Role } from "../../../../../types"
import {
  selectConnectedPlayer,
  useAppDispatch,
  useAppSelector
} from "../../../hooks"
import { usePreferences } from "../../../preferences"
import { setSearchedUser } from "../../../stores/LobbyStore"
import { toggleFullScreen } from "../../utils/fullscreen"
import { cc } from "../../utils/jsx"
import AdminPanel from "../admin/admin-panel"
import Booster from "../booster/booster"
import TeamBuilderModal from "../bot-builder/team-builder-modal"
import PokemonCollection from "../collection/pokemon-collection"
import Jukebox from "../jukebox/jukebox"
import MetaReport from "../meta-report/meta-report"
import { Modal } from "../modal/modal"
import ModerationPanel from "../moderation/moderation-panel"
import GameOptionsModal from "../options/game-options-modal"
import Patchnotes from "../patchnotes/patchnotes"
import { usePatchVersion } from "../patchnotes/usePatchVersion"
import PokeGuesser from "../pokeguesser/pokeguesser"
import Profile from "../profile/profile"
import ServersList from "../servers/servers-list"
import SpriteTrackerModal from "../sprite-tracker/sprite-tracker-modal"
import SynergyWheelModal from "../synergy-wheel/synergy-wheel"
import TierListMakerModal from "../tier-list/tier-list-maker-modal"
import Wiki from "../wiki/wiki"

import "./main-sidebar.css"

export type Page = "main_lobby" | "preparation" | "game"

interface MainSidebarProps {
  page: Page
  leave: () => void
  leaveLabel: string
}

export function MainSidebar(props: MainSidebarProps) {
  const { page, leave, leaveLabel } = props
  const [collapsed, setCollapsed] = useState(true)
  const navigate = useNavigate()
  const [modal, setModal] = useState<Modals>()
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false)
  const changeModal = useCallback(
    (nextModal: Modals) => setModal(nextModal),
    []
  )
  const sidebarRef = useRef<HTMLHtmlElement>(null)

  const { t } = useTranslation()
  /* only level and role are read, and subscribing to the whole profile
     re-rendered the sidebar whenever any unrelated field changed */
  const profileLevel = useAppSelector(
    (state) => state.network.profile?.level ?? 0
  )
  const profileRole = useAppSelector((state) => state.network.profile?.role)
  const [preferences] = usePreferences()

  const { isNewPatch, updateVersionChecked } = usePatchVersion()

  const version = pkg.version

  useEffect(() => {
    if (!sidebarRef.current) {
      return
    }

    const ref = sidebarRef.current

    const extendSidebar = () => setCollapsed(false)
    const collapseSidebar = () => setCollapsed(true)

    ref.addEventListener("mouseenter", extendSidebar)
    ref.addEventListener("mouseleave", collapseSidebar)

    return () => {
      if (ref) {
        ref.removeEventListener("mouseenter", extendSidebar)
        ref.removeEventListener("mouseleave", collapseSidebar)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      //if event occurs in an input, textarea or select, ignore it
      if (
        ["INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(
          (e.target as HTMLElement).tagName
        )
      ) {
        return
      }
      const key = e.key.toUpperCase()
      const keybindings = preferences.keybindings

      if (key === keybindings.wiki) {
        e.preventDefault()
        setModal((current) => (current === "wiki" ? undefined : "wiki"))
      } else if (key === keybindings.meta_report) {
        e.preventDefault()
        setModal((current) => (current === "meta" ? undefined : "meta"))
      } else if (
        key === keybindings.team_planner &&
        profileLevel >= GADGETS.team_planner.levelRequired
      ) {
        e.preventDefault()
        setModal((current) =>
          current === "team-builder" ? undefined : "team-builder"
        )
      }
    }

    window.addEventListener("keydown", handleKeydown)
    return () => {
      window.removeEventListener("keydown", handleKeydown)
    }
  }, [preferences.keybindings, profileLevel])

  /* both are read only inside onClickLeave. Selecting the player object
     re-rendered the whole sidebar on every field change, and createSelector
     built a fresh selector each render so it never memoized - it returned a new
     array every time. Primitives compare by value */
  const isPlayerAlive = useAppSelector(
    (state) => (selectConnectedPlayer(state)?.life ?? 0) > 0
  )
  const nbPlayersAlive = useAppSelector(
    (state) => state.game.players.filter((p) => p.life > 0).length
  )
  function onClickLeave() {
    if (isPlayerAlive && nbPlayersAlive > 1) {
      setShowSurrenderConfirm(true)
    } else {
      leave()
    }
  }

  return (
    <Sidebar
      collapsed={collapsed}
      className="sidebar"
      ref={sidebarRef}
      backgroundColor="transparent"
    >
      <Menu>
        <div className="sidebar-logo" onClick={() => setCollapsed(!collapsed)}>
          <img src={`assets/ui/colyseus-icon.png`} />
          <div>
            <h1>Pokemon Auto Chess</h1>
            <small>v{version}</small>
          </div>
        </div>

        <NavLink
          location="news"
          icon={
            <img
              width={32}
              height={32}
              src="assets/icons/SERVER_GUIDE.svg"
              alt=""
            />
          }
          handleClick={(newModal) => {
            changeModal(newModal)
            if (isNewPatch) {
              updateVersionChecked()
            }
          }}
          shimmer={isNewPatch}
        >
          Server Guide
        </NavLink>

        {page === "main_lobby" && (
          <NavLink location="profile" svg="profile" handleClick={changeModal}>
            {t("profile.title")}
          </NavLink>
        )}

        {page === "main_lobby" && profileLevel >= GADGETS.bag.levelRequired && (
          <NavLink
            location="collection"
            svg="collection"
            className="blue"
            handleClick={changeModal}
          >
            {t("collection.title")}
          </NavLink>
        )}
        <NavLink
          location="wiki"
          svg="wiki"
          className="green"
          handleClick={changeModal}
        >
          {t("wiki.title")}
        </NavLink>
        <NavLink
          icon={
            <img
              width={32}
              height={32}
              src="assets/icons/BOOKMARK_ICON.svg"
              alt=""
            />
          }
          className="green"
          location="meta"
          handleClick={changeModal}
        >
          {t("guide.bookmark_tab")}
        </NavLink>

        {profileLevel >= GADGETS.team_planner.levelRequired && (
          <NavLink
            svg="team-builder"
            location="team-builder"
            handleClick={changeModal}
          >
            {t("team_builder")}
          </NavLink>
        )}

        {page !== "game" &&
          ((!GADGETS.pokeguesser.disabled &&
            profileLevel >= GADGETS.pokeguesser.levelRequired) ||
            profileRole === Role.ADMIN) && (
            <NavLink
              svg="pokeguesser"
              location="pokeguesser"
              handleClick={changeModal}
            >
              {t("gadget.pokeguesser")}
            </NavLink>
          )}

        {((!GADGETS.synergy_wheel.disabled &&
          profileLevel >= GADGETS.synergy_wheel.levelRequired) ||
          profileRole === Role.ADMIN) && (
          <NavLink
            svg="synergy-wheel"
            location="synergy-wheel"
            handleClick={changeModal}
          >
            {t("gadget.synergy_wheel")}
          </NavLink>
        )}

        {page !== "game" &&
          ((!GADGETS.bot_builder.disabled &&
            profileLevel >= GADGETS.bot_builder.levelRequired) ||
            profileRole === Role.ADMIN) && (
            <NavLink svg="bot" onClick={() => navigate("/bot-builder")}>
              {t("bot_builder")}
            </NavLink>
          )}

        {page !== "game" &&
          ((!GADGETS.gameboy.disabled &&
            profileLevel >= GADGETS.gameboy.levelRequired) ||
            profileRole === Role.ADMIN) && (
            <NavLink svg="gameboy" onClick={() => navigate("/gameboy")}>
              {t("gadget.gameboy")}
            </NavLink>
          )}

        {((!GADGETS.tier_list_maker.disabled &&
          profileLevel >= GADGETS.tier_list_maker.levelRequired) ||
          profileRole === Role.ADMIN) && (
          <NavLink
            svg="tier-list"
            location="tier-list"
            handleClick={changeModal}
          >
            {t("gadget.tier_list_maker")}
          </NavLink>
        )}

        {((!GADGETS.sprite_tracker.disabled &&
          profileLevel >= GADGETS.sprite_tracker.levelRequired) ||
          profileRole === Role.ADMIN) && (
          <NavLink
            svg="pokemon-sprite"
            location="sprite-tracker"
            handleClick={changeModal}
          >
            {t("gadget.sprite_tracker")}
          </NavLink>
        )}

        {page !== "game" &&
          (profileRole === Role.MODERATOR || profileRole === Role.ADMIN) && (
            <NavLink
              svg="hammer"
              location="moderation"
              handleClick={changeModal}
            >
              Moderation
            </NavLink>
          )}

        {page !== "game" && profileRole === Role.ADMIN && (
          <>
            <NavLink svg="admin" location="admin" handleClick={changeModal}>
              {t("admin_panel.title")}
            </NavLink>
            <NavLink
              svg="pokemon-sprite"
              onClick={() => navigate("/sprite-viewer")}
            >
              Sprite Viewer
            </NavLink>
            <NavLink svg="map" onClick={() => navigate("/map-viewer")}>
              Map Viewer
            </NavLink>
          </>
        )}

        {page === "game" && profileLevel >= GADGETS.jukebox.levelRequired && (
          <NavLink
            svg="compact-disc"
            location="jukebox"
            handleClick={changeModal}
          >
            {t("gadget.jukebox")}
          </NavLink>
        )}

        <NavLink svg="options" location="options" handleClick={changeModal}>
          {t("options.title")}
        </NavLink>

        {page === "game" && document.fullscreenEnabled && (
          <NavLink svg="fullscreen" onClick={toggleFullScreen}>
            {t("toggle_fullscreen")}
          </NavLink>
        )}

        <div className="spacer"></div>

        {page !== "game" && (
          <NavLink
            svg="players"
            className="community-servers"
            location="servers"
            handleClick={changeModal}
          >
            {t("servers_list.title")}
          </NavLink>
        )}

        {page !== "game" && (
          <NavLink
            svg="discord"
            className="discord"
            onClick={() => window.open(process.env.DISCORD_SERVER, "_blank")}
          >
            Discord
          </NavLink>
        )}

        <NavLink svg="exit-door" className="red logout" onClick={onClickLeave}>
          {leaveLabel}
        </NavLink>
      </Menu>

      <Modals modal={modal} setModal={setModal} page={page} />
      <Modal
        show={showSurrenderConfirm}
        header={t("game-surrender-modal-title")}
        body={t("game-surrender-modal-body")}
        onClose={() => setShowSurrenderConfirm(false)}
        footer={
          <>
            <button className="bubbly green" onClick={leave}>
              {t("yes")}
            </button>
            <button
              className="bubbly red"
              onClick={() => {
                setShowSurrenderConfirm(false)
              }}
            >
              {t("no")}
            </button>
          </>
        }
      ></Modal>
    </Sidebar>
  )
}

type NavLinkProps = MenuItemProps &
  NavPageLink & {
    svg?: string
    png?: string
    shimmer?: boolean
    className?: string
  }

type NavPageLink = {
  location?: Modals
  handleClick?: (update: Modals) => void
}

function NavLink(props: NavLinkProps) {
  const {
    children,
    location,
    handleClick,
    shimmer = false,
    svg,
    png,
    icon,
    className = "default",
    onClick
  } = props

  return (
    <MenuItem
      className={cc("menu-item", className, shimmer ? "shimmer" : "")}
      onClick={(e) => {
        onClick?.(e)
        if (location) {
          handleClick?.(location)
        }
      }}
      icon={
        <div className="icon">
          {shimmer && (
            <span className="notification">
              <img width={10} height={10} src="assets/ui/pokeball.svg" />
            </span>
          )}
          {svg ? (
            <img width={32} height={32} src={`assets/ui/${svg}.svg`} />
          ) : png ? (
            <img height={32} src={`assets/ui/${png}.png`} />
          ) : (
            icon
          )}
        </div>
      }
    >
      {children}
    </MenuItem>
  )
}

export type Modals =
  | "announcement"
  | "booster"
  | "moderation"
  | "admin"
  | "collection"
  | "jukebox"
  | "keybinds"
  | "meta"
  | "news"
  | "options"
  | "pokeguesser"
  | "profile"
  | "servers"
  | "sprite-tracker"
  | "synergy-wheel"
  | "team-builder"
  | "tier-list"
  | "wiki"

function Modals({
  modal,
  setModal,
  page
}: {
  modal?: Modals
  setModal: (nextModal?: Modals) => void
  page: Page
}) {
  const { t } = useTranslation()
  const searchedUser = useAppSelector((state) => state.lobby.searchedUser)
  const [optionsTab, setOptionsTab] = useState<"sound" | "interface">("sound")
  const [metaTab, setMetaTab] = useState<string>()

  useEffect(() => {
    if (modal !== "options") setOptionsTab("sound")
    if (modal !== "meta") setMetaTab(undefined)
  }, [modal])

  const dispatch = useAppDispatch()

  const closeModal = useCallback(() => setModal(undefined), [setModal])

  useEffect(() => {
    if (searchedUser && modal !== "profile") {
      setModal("profile")
    }
  }, [modal, searchedUser, setModal])

  return (
    <>
      <Modal
        onClose={closeModal}
        show={modal === "news"}
        header="Server Guide"
        className="patchnotes"
      >
        <Patchnotes
          onOpenInterface={() => {
            setOptionsTab("interface")
            setModal("options")
          }}
          onOpenBookmarks={(tab) => {
            setMetaTab(tab)
            setModal("meta")
          }}
        />
      </Modal>
      <Modal
        onClose={() => {
          closeModal()
          dispatch(setSearchedUser(undefined))
        }}
        show={modal === "profile"}
        header={t("profile.title")}
      >
        <Profile />
      </Modal>
      <Modal
        onClose={closeModal}
        show={modal === "collection"}
        header={t("collection.title")}
        className="anchor-top"
      >
        <PokemonCollection />
      </Modal>
      <Modal
        onClose={closeModal}
        show={modal === "booster"}
        className="custom-bg boosters-modal"
      >
        <Booster />
      </Modal>
      <Modal
        onClose={closeModal}
        show={modal === "wiki"}
        className="wiki-modal"
        header={t("wiki.title")}
      >
        <Wiki inGame={page === "game"} />
      </Modal>
      <Modal
        show={modal === "meta"}
        header={t("guide.bookmark_tab")}
        onClose={closeModal}
      >
        <MetaReport key={metaTab ?? "default"} initialTab={metaTab} />
      </Modal>
      <Modal
        onClose={closeModal}
        show={modal === "servers"}
        className="servers-modal"
        header={t("servers_list.title")}
      >
        <ServersList />
      </Modal>
      <TeamBuilderModal
        show={modal === "team-builder"}
        handleClose={closeModal}
      />
      <TierListMakerModal
        show={modal === "tier-list"}
        handleClose={closeModal}
      />
      <SpriteTrackerModal
        show={modal === "sprite-tracker"}
        handleClose={closeModal}
      />
      <GameOptionsModal
        show={modal === "options"}
        initialTab={optionsTab}
        page={page}
        hideModal={closeModal}
      />
      <Modal
        onClose={closeModal}
        show={modal === "moderation"}
        header="Moderation"
      >
        <ModerationPanel />
      </Modal>
      <Modal onClose={closeModal} show={modal === "admin"} header="Admin">
        <AdminPanel />
      </Modal>
      <Jukebox show={modal === "jukebox"} handleClose={closeModal} />
      <PokeGuesser show={modal === "pokeguesser"} handleClose={closeModal} />
      <SynergyWheelModal
        show={modal === "synergy-wheel"}
        handleClose={closeModal}
      />
    </>
  )
}
