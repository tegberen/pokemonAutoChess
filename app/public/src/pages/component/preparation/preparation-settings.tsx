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
  setBlessingsEnabled,
  setScribbleExtended,
  setSpecialRule
} from "../../../network"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { Modal } from "../modal/modal"
import { BotSelectModal } from "./bot-select-modal"
import "./preparation-menu.css"

const unavailableScribbleRules: SpecialGameRule[] = [
  SpecialGameRule.DO_IT_ALL_YOURSELF,
  SpecialGameRule.HALLOWEEN
]

/* not translated, unlike the scribble rule names: the room list shows one name
   to everyone, so it should not read differently per viewer's locale */
// TEMP we will remove this at some point
const BLESSINGS_BETA_ROOM_NAME = "[Wish Festival - Beta]"

export default function PreparationSettings() {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState<string>("")
  const [showBotSelectModal, setShowBotSelectModal] = useState(false)
  const [showRulePicker, setShowRulePicker] = useState(false)
  const [ruleQuery, setRuleQuery] = useState("")
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
  const blessingsEnabled = useAppSelector(
    (state) => state.preparation.blessingsEnabled
  )
  const whimsy = useAppSelector((state) => state.preparation.whimsy)
  const gameMode = useAppSelector((state) => state.preparation.gameMode)
  const isOwner = useAppSelector(
    (state) => state.preparation.ownerId === state.network.uid
  )

  const isAdmin = user?.role === Role.ADMIN
  const isModerator = user?.role === Role.MODERATOR
  const canEditRoom = isOwner || isModerator || isAdmin
  const isCustomLobby = gameMode === GameMode.CUSTOM_LOBBY
  // Double Up gets the custom-room controls, minus the rule picker: its scribble
  // rule is rolled at game start
  const hasCustomLobbySettings =
    isCustomLobby || gameMode === GameMode.DOUBLE_UP

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

  const changeBlessingsEnabled = (enabled: boolean) => {
    setBlessingsEnabled(enabled)
    // TEMP we will remove this at some point
    if (enabled) {
      changeRoomName(BLESSINGS_BETA_ROOM_NAME)
    }
  }

  const pickRandomRule = () => {
    const rules = Object.values(SpecialGameRule).filter(
      (rule) =>
        unavailableScribbleRules.includes(rule) === false &&
        rule !== specialGameRule
    )
    changeSpecialRule(pickRandomIn(rules))
  }

  const roomNameSetting = hasCustomLobbySettings &&
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

  const privacySetting = hasCustomLobbySettings && (isOwner || isAdmin) && (
    <div className="lobby-setting">
      <span className="setting-label">{t("lobby_visibility")}</span>
      <div className="setting-control">
        {password &&
          (() => {
            // highlight the word "private" in red (falls back gracefully if a
            // localized string doesn't contain it)
            const label = t("room_password")
            const idx = label.toLowerCase().indexOf("private")
            return (
              <span className="room-password">
                {idx === -1 ? (
                  label
                ) : (
                  <>
                    {label.slice(0, idx)}
                    <span className="private-word">
                      {label.slice(idx, idx + "private".length)}
                    </span>
                    {label.slice(idx + "private".length)}
                  </>
                )}
                : <b>{password}</b>
              </span>
            )
          })()}
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

  // blessings are not playtested alongside a scribble rule, so only one shows
  const scribbleRuleSetting = isCustomLobby &&
    isOwner &&
    noElo &&
    !blessingsEnabled && (
    <div className="lobby-setting">
      <span className="setting-label">{t("game_modes.SCRIBBLE")}</span>
      <div className="setting-control">
        <button
          className="rule-pick-button"
          onClick={() => setShowRulePicker(true)}
          title={t("scribble_pick_rule_hint")}
        >
          {specialGameRule ? t(`scribble.${specialGameRule}`) : t("no_rule")}
        </button>
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

  const pickRule = (rule: SpecialGameRule | "none") => {
    changeSpecialRule(rule)
    setShowRulePicker(false)
  }

  // newest rules first (the enum lists them chronologically, so reverse it)
  const filteredRules = [...keys(SpecialGameRule)].reverse().filter((rule) => {
    if (unavailableScribbleRules.includes(rule as SpecialGameRule)) return false
    const q = ruleQuery.trim().toLowerCase()
    if (!q) return true
    return (
      t(`scribble.${rule}`).toLowerCase().includes(q) ||
      t(`scribble_description.${rule}`).toLowerCase().includes(q)
    )
  })

  const rulePickerModal = (
    <Modal
      show={showRulePicker}
      onClose={() => setShowRulePicker(false)}
      className="rule-picker"
      header={t("game_modes.SCRIBBLE")}
      body={
        <>
          <div className="rule-picker-toolbar">
            <input
              type="text"
              className="rule-search"
              placeholder={t("search")}
              value={ruleQuery}
              onChange={(e) => setRuleQuery(e.target.value)}
            />
            <button
              className="bubbly blue"
              onClick={() => {
                pickRandomRule()
                setShowRulePicker(false)
              }}
              title={t("random_rule_hint")}
            >
              {t("random_rule")}
            </button>
          </div>
          <ul className="rule-list">
            <li
              className={cc("my-box", "rule-card", "no-rule", {
                selected: specialGameRule == null
              })}
              onClick={() => pickRule("none")}
            >
              <h3>{t("no_rule")}</h3>
            </li>
            {filteredRules.map((rule) => (
              <li
                key={rule}
                className={cc("my-box", "rule-card", {
                  selected: specialGameRule === rule
                })}
                onClick={() => pickRule(rule as SpecialGameRule)}
              >
                <h3>{t(`scribble.${rule}`)}</h3>
                <p>
                  {addIconsToDescription(
                    t(`scribble_description.${rule}`, {
                      type: "(random Synergy)"
                    })
                  )}
                </p>
              </li>
            ))}
          </ul>
        </>
      }
    />
  )

  const playerHpSetting = (gameMode === GameMode.SCRIBBLE ||
    (hasCustomLobbySettings && (isOwner || isAdmin))) && (
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

  // Whimsy Weekend always rolls a scribble rule, so blessings are not offered
  // TEMP we will remove this at some point: owners see it only during the beta
  const blessingsSetting = hasCustomLobbySettings &&
    !whimsy &&
    (isOwner || isAdmin) && (
    <div className="lobby-setting" title={t("blessings_enabled_hint")}>
      <span className="setting-label">
        {t("blessings_enabled_label")}
        <img
          src="assets/ui/blessing_event_icon.jpg"
          alt=""
          className="setting-icon setting-icon-round"
        />
      </span>
      <div className="setting-control">
        <select
          value={blessingsEnabled ? "on" : "off"}
          onChange={(e) => changeBlessingsEnabled(e.target.value === "on")}
        >
          <option value="off">{t("blessings_enabled_off")}</option>
          <option value="on">{t("blessings_enabled_on")}</option>
        </select>
      </div>
    </div>
  )

  const botSetting = hasCustomLobbySettings &&
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
          {blessingsSetting}
          {privacySetting}
        </div>
      ) : (
        <p className="no-settings">{t("wait_for_players_hint")}</p>
      )}

      {rulePickerModal}

      {isOwner && showBotSelectModal && (
        <BotSelectModal
          botsSelected={users.filter((u) => u.isBot).map((u) => u.uid)}
          close={() => setShowBotSelectModal(false)}
        />
      )}
    </div>
  )
}
