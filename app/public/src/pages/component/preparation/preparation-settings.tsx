import { useState } from "react"
import { useTranslation } from "react-i18next"
import { BOTS_ENABLED } from "../../../../../config"
import { Role } from "../../../../../types"
import { BotDifficulty, GameMode } from "../../../../../types/enum/Game"
import { SpecialGameRule } from "../../../../../types/enum/SpecialGameRule"
import { pickRandomIn } from "../../../../../utils/random"
import { keys } from "../../../../../utils/object"
import { useAppSelector } from "../../../hooks"
import {
  addBot,
  changeRoomName,
  changeRoomPassword,
  setScribbleExtended,
  setSpecialRule
} from "../../../network"
import { BotSelectModal } from "./bot-select-modal"
import "./preparation-menu.css"

export default function PreparationSettings() {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState<string>("")
  const [showBotSelectModal, setShowBotSelectModal] = useState(false)
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(
    BotDifficulty.REGULAR
  )

  const users = useAppSelector((state) => state.preparation.users)
  const user = useAppSelector((state) => state.preparation.user)
  const name = useAppSelector((state) => state.preparation.name)
  const password = useAppSelector((state) => state.preparation.password)
  const noElo = useAppSelector((state) => state.preparation.noElo)
  const specialGameRule = useAppSelector(
    (state) => state.preparation.specialGameRule
  )
  const scribbleExtended = useAppSelector(
    (state) => state.preparation.scribbleExtended
  )
  const gameMode = useAppSelector((state) => state.preparation.gameMode)
  const isOwner = useAppSelector(
    (state) => state.preparation.ownerId === state.network.uid
  )

  const isAdmin = user?.role === Role.ADMIN
  const isModerator = user?.role === Role.MODERATOR
  const canEditRoom = isOwner || isModerator || isAdmin
  const isCustomLobby = gameMode === GameMode.CUSTOM_LOBBY

  function togglePrivate() {
    if (password === null || password === undefined) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      const randomBytes = new Uint8Array(4)
      crypto.getRandomValues(randomBytes)
      const newPassword = Array.from(
        randomBytes,
        (b) => chars[b % chars.length]
      ).join("")
      changeRoomPassword(newPassword)
    } else {
      changeRoomPassword(null)
    }
  }

  const changeSpecialRule = (rule: SpecialGameRule | "none") => {
    setSpecialRule(rule === "none" ? null : rule)
    if (rule !== "none") {
      changeRoomName(t(`scribble.${rule}`))
    }
  }

  const pickRandomRule = () => {
    const rules = Object.values(SpecialGameRule).filter(
      (rule) => rule !== SpecialGameRule.PLAY_TEST && rule !== specialGameRule
    )
    changeSpecialRule(pickRandomIn(rules))
  }

  const roomNameSetting = (isCustomLobby ||
    gameMode === GameMode.DOUBLE_UP) &&
    canEditRoom &&
    user &&
    !user.anonymous && (
      <div className="lobby-setting">
        <span className="setting-label">{t("change_room_name")}</span>
        <div className="setting-control">
          <input
            maxLength={30}
            type="text"
            placeholder={name}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            className="bubbly blue"
            onClick={() => changeRoomName(inputValue)}
          >
            {t("save")}
          </button>
        </div>
      </div>
    )

  const privacySetting = isCustomLobby && (isOwner || isAdmin) && (
    <div className="lobby-setting">
      <span className="setting-label">{t("lobby_visibility")}</span>
      <div className="setting-control">
        {password && (
          <span className="room-password">
            {t("room_password")}: <b>{password}</b>
          </span>
        )}
        <button
          className="bubbly blue"
          onClick={togglePrivate}
          title={
            password ? t("make_room_public_hint") : t("make_room_private_hint")
          }
        >
          {password ? t("make_room_public") : t("make_room_private")}
        </button>
      </div>
    </div>
  )

  const scribbleRuleSetting = isCustomLobby && isOwner && noElo && (
    <div className="lobby-setting">
      <span className="setting-label">{t("game_modes.SCRIBBLE")}</span>
      <div className="setting-control">
        <select
          onChange={(e) => changeSpecialRule(e.target.value as SpecialGameRule)}
          value={specialGameRule ?? "none"}
        >
          <option value="none">{t("no_rule")}</option>
          {keys(SpecialGameRule).map((rule) => (
            <option key={rule} value={rule}>
              {t(`scribble.${rule}`)}
            </option>
          ))}
        </select>
        <button
          className="bubbly blue"
          onClick={pickRandomRule}
          title={t("random_rule_hint")}
        >
          {t("random_rule")}
        </button>
      </div>
    </div>
  )

  const playerHpSetting = (gameMode === GameMode.SCRIBBLE ||
    (isCustomLobby && (isOwner || isAdmin))) && (
    <div className="lobby-setting" title={t("scribble_extended_hint")}>
      <span className="setting-label">
        {t("scribble_extended_label")}
        <img src="assets/icons/HP.png" alt="HP" className="setting-icon" />
      </span>
      <div className="setting-control">
        <select
          value={scribbleExtended ? "extended" : "standard"}
          onChange={(e) => setScribbleExtended(e.target.value === "extended")}
        >
          <option value="standard">{t("scribble_extended_off")}</option>
          <option value="extended">{t("scribble_extended_on")}</option>
        </select>
      </div>
    </div>
  )

  const botSetting = (isCustomLobby || gameMode === GameMode.DOUBLE_UP) &&
    (isOwner || isAdmin) &&
    (BOTS_ENABLED || isAdmin) && (
      <div className="lobby-setting">
        <span className="setting-label">{t("add_bot")}</span>
        <div className="setting-control">
          <select
            value={botDifficulty}
            onChange={(e) => setBotDifficulty(parseInt(e.target.value, 10))}
          >
            <option value={BotDifficulty.REGULAR}>{t("regular_bot")}</option>
            <option value={BotDifficulty.NEWBIE}>{t("newbie_bot")}</option>
            <option value={BotDifficulty.EASY}>{t("easy_bot")}</option>
            <option value={BotDifficulty.MEDIUM}>{t("normal_bot")}</option>
            <option value={BotDifficulty.HARD}>{t("hard_bot")}</option>
            <option value={BotDifficulty.EXTREME}>{t("extreme_bot")}</option>
            <option value={BotDifficulty.MASTER}>
              {t("bot_difficulty.MASTER")}
            </option>
            <option value={BotDifficulty.SHINY}>{t("shiny_bot")}</option>
            <option value={BotDifficulty.UNREALISTIC}>
              {t("unrealistic_bot")}
            </option>
            <option value={BotDifficulty.CUSTOM}>{t("custom_bot")}</option>
          </select>
          <button
            className="bubbly blue"
            onClick={() => {
              if (botDifficulty === BotDifficulty.CUSTOM) {
                setShowBotSelectModal(true)
              } else {
                addBot(botDifficulty)
              }
            }}
          >
            {t("add")}
          </button>
        </div>
      </div>
    )

  const hasSettings =
    roomNameSetting ||
    privacySetting ||
    scribbleRuleSetting ||
    playerHpSetting ||
    botSetting

  return (
    <div className="preparation-settings">
      {hasSettings ? (
        <div className="lobby-settings">
          {roomNameSetting}
          {botSetting}
          {scribbleRuleSetting}
          {playerHpSetting}
          {privacySetting}
        </div>
      ) : (
        <p className="no-settings">{t("wait_for_players_hint")}</p>
      )}

      {isOwner && showBotSelectModal && (
        <BotSelectModal
          botsSelected={users.filter((u) => u.isBot).map((u) => u.uid)}
          close={() => setShowBotSelectModal(false)}
        />
      )}
    </div>
  )
}
