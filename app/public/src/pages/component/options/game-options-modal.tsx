import Phaser from "phaser"
import type { Dispatch, SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { isThemeUnlocked, THEMES } from "../../../../../config"
import { GADGETS } from "../../../../../config/game/gadgets"
import { Language } from "../../../../../types/enum/Language"
import { LanguageNames } from "../../../../dist/client/locales"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import { usePreferences } from "../../../preferences"
import { selectLanguage } from "../../../stores/NetworkStore"
import { resetAvatar } from "../../../network"
import { getGameScene } from "../../game"
import { Checkbox } from "../checkbox/checkbox"
import type { Page } from "../main-sidebar/main-sidebar"
import { Modal } from "../modal/modal"
import GameFiles from "./game-files"
import KeybindInfo from "./keybind-info"
import "./game-options-modal.css"

export default function GameOptionsModal(props: {
  show: boolean
  hideModal: Dispatch<SetStateAction<void>>
  page: Page
}) {
  const [preferences, setPreferences] = usePreferences()
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const language = useAppSelector(
    (state) => state.network.profile?.language ?? i18n.language
  )
  const profile = useAppSelector((state) => state.network.profile)
  const profileLevel = profile?.level ?? 0

  const renderers = {
    [Phaser.AUTO]: "Auto",
    [Phaser.WEBGL]: "WebGL",
    [Phaser.CANVAS]: "Canvas"
  }

  /* Modal renders nothing while hidden, but React builds these children first,
     and this stays mounted for the whole session behind the sidebar */
  if (!props.show) return null

  return (
    <Modal
      show={props.show}
      onClose={props.hideModal}
      header={t("options.title")}
      className="game-options-modal anchor-top"
    >
      <Tabs>
        <TabList>
          <Tab key="sound">{t("options.sound")}</Tab>
          <Tab key="interface">{t("options.interface")}</Tab>
          <Tab key="hotkeys">{t("options.hotkeys")}</Tab>
          <Tab key="files">{t("options.game_files")}</Tab>
        </TabList>

        <TabPanel>
          <label style={{ width: "100%" }}>
            {t("jukebox.music_volume")}: {preferences.musicVolume} %
            <input
              type="range"
              min="0"
              max="100"
              value={preferences.musicVolume}
              onInput={(e) =>
                setPreferences({
                  musicVolume: Number.parseFloat(
                    (e.target as HTMLInputElement).value
                  )
                })
              }
            ></input>
          </label>
          <label style={{ width: "100%" }}>
            {t("options.sfx_volume")}: {preferences.sfxVolume} %
            <input
              type="range"
              min="0"
              max="100"
              value={preferences.sfxVolume}
              onInput={(e) =>
                setPreferences({
                  sfxVolume: Number.parseFloat(
                    (e.target as HTMLInputElement).value
                  )
                })
              }
            ></input>
          </label>
          <p>
            <Checkbox
              isDark
              checked={preferences.playInBackground}
              onToggle={(checked) =>
                setPreferences({ playInBackground: checked })
              }
              label={t("options.play_music_in_background")}
            />
          </p>
        </TabPanel>

        <TabPanel className="interface-options">
          <div className="interface-options__selectors">
          {props.page === "main_lobby" && (
            <div className="interface-options__field">
              <label>
                <span>{t("options.language")}</span>
                <select
                  className="is-light"
                  value={language}
                  onChange={(e) => {
                    dispatch(selectLanguage(e.target.value as Language))
                    i18n.changeLanguage(e.target.value as Language)
                  }}
                >
                  {Object.keys(Language).map((lng) => (
                    <option key={lng} value={lng}>
                      {LanguageNames[lng]}
                    </option>
                  ))}
                </select>
              </label>
              <p className="info interface-options__hint">
                {t("options.community_translations")}{" "}
                <a
                  href="https://discord.com/channels/737230355039387749/1488242758232834282"
                  target="_blank"
                >
                  Discord
                </a>
              </p>
            </div>
          )}

          {profile && profileLevel >= GADGETS.palette.levelRequired && (
            <div className="interface-options__field">
              <label>
                <span>{t("options.theme")}</span>
                <select
                  className="is-light"
                  value={preferences.theme}
                  onChange={(e) => setPreferences({ theme: e.target.value })}
                >
                  {THEMES.filter((theme) =>
                    isThemeUnlocked(theme, profile)
                  ).map((theme) => (
                    <option key={theme} value={theme}>
                      {t(`theme.${theme}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          </div>

          <div className="interface-options__toggles">
          <p>
            <Checkbox
              isDark
              checked={preferences.showDetailsOnHover}
              onToggle={(checked) =>
                setPreferences({ showDetailsOnHover: checked })
              }
              label={t("options.show_details_on_hover")}
            />
          </p>
          <p>
            <Checkbox
              isDark
              checked={preferences.outlineShopUpgrades}
              onToggle={(checked) =>
                setPreferences({ outlineShopUpgrades: checked })
              }
              label={t("options.outline_shop_upgrades")}
            />
          </p>
          <p>
            <Checkbox
              isDark
              checked={preferences.showBlessingGlow}
              onToggle={(checked) =>
                setPreferences({ showBlessingGlow: checked })
              }
              label={t("options.show_blessing_glow")}
            />
          </p>
          <p>
            <Checkbox
              isDark
              checked={preferences.showDamageNumbers}
              onToggle={(checked) =>
                setPreferences({ showDamageNumbers: checked })
              }
              label={t("options.show_damage_numbers")}
            />
          </p>
          <p>
            <Checkbox
              isDark
              checked={preferences.disableAnimatedTilemap}
              onToggle={(checked) => {
                setPreferences({ disableAnimatedTilemap: checked })
                const gameScene = getGameScene()
                if (gameScene) {
                  gameScene.toggleTilesetAnimation(checked)
                }
              }}
              label={t("options.disable_animated_tilemap")}
            />
          </p>
          <p>
            <Checkbox
              isDark
              checked={preferences.disableCameraShake}
              onToggle={(checked) => {
                setPreferences({ disableCameraShake: checked })
              }}
              label={t("options.disable_camera_shake")}
            />
          </p>
          <p>
            <Checkbox
              isDark
              checked={preferences.walkingAvatar}
              onToggle={(checked) => {
                setPreferences({ walkingAvatar: checked })
                /* switching it off leaves the avatar wherever it wandered, which
                   makes the toggle look like it did nothing */
                if (!checked) resetAvatar()
              }}
              label={t("options.walking_avatar")}
            />
          </p>
          <p>
            <Checkbox
              isDark
              checked={preferences.antialiasing}
              onToggle={(checked) => setPreferences({ antialiasing: checked })}
              label={t("options.antialiasing")}
            />
          </p>
          <p>
            <Checkbox
              isDark
              checked={preferences.colorblindMode}
              onToggle={(checked) =>
                setPreferences({ colorblindMode: checked })
              }
              label={t("options.colorblind_mode")}
            />
          </p>
          </div>
          {props.page === "main_lobby" && (
            <div className="interface-options__renderer">
              <label>
                <span>{t("options.renderer")}</span>
                <select
                  className="is-light"
                  value={preferences.renderer}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value)
                    if (!isNaN(parsed)) {
                      setPreferences({ renderer: parsed })
                    }
                  }}
                >
                  {Object.keys(renderers).map((r) => (
                    <option key={r} value={r}>
                      {renderers[r]}
                    </option>
                  ))}
                </select>
              </label>
              <p className="info">{t("options.renderer_info")}</p>
            </div>
          )}
        </TabPanel>

        <TabPanel>
          <KeybindInfo />
        </TabPanel>

        <TabPanel>
          <GameFiles />
        </TabPanel>
      </Tabs>
    </Modal>
  )
}
