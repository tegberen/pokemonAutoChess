import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { PARTNER_MESSAGE_MAX_LENGTH } from "../../../../../config"
import { Transfer } from "../../../../../types"
import { DEPTH } from "../../../game/depths"
import {
  selectConnectedPlayer,
  useAppDispatch,
  useAppSelector
} from "../../../hooks"
import { rooms } from "../../../network"
import { usePreference } from "../../../preferences"
import { setPartnerChatMuted } from "../../../stores/GameStore"
import { cc } from "../../utils/jsx"
import "./game-partner-chat.css"

type NavigatorWithKeyboardLock = Navigator & {
  keyboard?: { lock(keys: string[]): Promise<void>; unlock(): void }
}

const VISIBLE_LINES = 4
const LINE_LIFETIME_MS = 8000

export default function GamePartnerChat() {
  const { t } = useTranslation()
  const connectedPlayer = useAppSelector(selectConnectedPlayer)
  const partnerName = useAppSelector(
    (state) =>
      state.game.players.find(
        (p) => p.id === connectedPlayer?.doubleUpPartnerId
      )?.name
  )
  const messages = useAppSelector((state) => state.game.partnerMessages)
  const [keybindings] = usePreference("keybindings")
  const [dismissedAt, setDismissedAt] = useState(0)
  const [isTyping, setTyping] = useState(false)
  const [text, setText] = useState("")
  const dispatch = useAppDispatch()
  const isPartnerMuted = useAppSelector((state) => state.game.partnerChatMuted)
  const [now, setNow] = useState(() => Date.now())
  const [closedAt, setClosedAt] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canUsePartnerChat = useAppSelector(
    (state) => state.game.partnerChatAvailable
  )

  const recentMessages = messages
    .filter((m) => !isPartnerMuted || m.authorId === connectedPlayer?.id)
    .slice(-VISIBLE_LINES)
  // lines seen while typing stay a full lifetime after closing, then fade
  const shownFor = (m: { time: number }) => now - Math.max(m.time, closedAt)
  const visibleMessages = isTyping
    ? recentMessages
    : recentMessages.filter(
        (m) => shownFor(m) < LINE_LIFETIME_MS && m.time > dismissedAt
      )
  const hasVisibleMessages = canUsePartnerChat && visibleMessages.length > 0

  useEffect(() => {
    if (!canUsePartnerChat) return
    const openOnChatKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingElsewhere = ["INPUT", "TEXTAREA", "SELECT"].includes(
        target?.tagName ?? ""
      )
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey
      if (
        event.key.toUpperCase() === keybindings.chat &&
        !isTypingElsewhere &&
        !hasModifier
      ) {
        event.preventDefault()
        setTyping(true)
      } else if (event.key === "Escape" && !isTypingElsewhere) {
        if (hasVisibleMessages) setDismissedAt(Date.now())
        else if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        }
      }
    }
    window.addEventListener("keydown", openOnChatKey)
    return () => window.removeEventListener("keydown", openOnChatKey)
  }, [canUsePartnerChat, keybindings.chat, hasVisibleMessages])

  useEffect(() => {
    if (isTyping) inputRef.current?.focus()
  }, [isTyping])

  // the game canvas swallows mousedown, so the input never blurs on a board click
  const clickOutsideCloses = isTyping || hasVisibleMessages
  useEffect(() => {
    if (!clickOutsideCloses) return
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return
      setText("")
      setTyping(false)
      setClosedAt(Date.now())
      setDismissedAt(Date.now())
    }
    window.addEventListener("pointerdown", closeOnOutsidePress, true)
    return () =>
      window.removeEventListener("pointerdown", closeOnOutsidePress, true)
  }, [clickOutsideCloses])

  // in fullscreen the chat owns Esc and leaves fullscreen itself (Chromium only)
  useEffect(() => {
    const keyboard = (navigator as NavigatorWithKeyboardLock).keyboard
    if (!canUsePartnerChat || !keyboard) return
    const syncLock = () => {
      if (document.fullscreenElement) keyboard.lock(["Escape"]).catch(() => {})
      else keyboard.unlock()
    }
    syncLock()
    document.addEventListener("fullscreenchange", syncLock)
    return () => {
      document.removeEventListener("fullscreenchange", syncLock)
      keyboard.unlock()
    }
  }, [canUsePartnerChat])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!canUsePartnerChat) return null

  const closeInput = () => {
    setText("")
    setTyping(false)
    setClosedAt(Date.now())
  }

  const sendAndClose = () => {
    if (!isPartnerMuted && text.trim() !== "") {
      rooms.game?.send(Transfer.NEW_MESSAGE, text)
    }
    closeInput()
  }

  return (
    <div
      ref={containerRef}
      className={cc("game-partner-chat", {
        typing: isTyping,
        muted: isPartnerMuted
      })}
      style={{ zIndex: DEPTH.PARTNER_CHAT }}
    >
      {visibleMessages.length > 0 && (
        <ul
          className={cc("game-partner-chat-lines my-box", {
            fading:
              !isTyping &&
              visibleMessages.every(
                (m) => shownFor(m) > LINE_LIFETIME_MS - 2000
              )
          })}
        >
          {visibleMessages.map((message) => (
            <li
              key={message.id}
              className={cc({ mine: message.authorId === connectedPlayer?.id })}
            >
              <b>{message.author}</b> {message.payload}
            </li>
          ))}
        </ul>
      )}
      {!isTyping && (
        <p
          className="game-partner-chat-hint my-box"
          onClick={() => setTyping(true)}
        >
          <img src="assets/icons/LOBBY_CHAT.svg" alt={t("chat")} />
          <kbd>{keybindings.chat}</kbd>
        </p>
      )}
      {isTyping && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendAndClose()
          }}
        >
          <input
            ref={inputRef}
            type="text"
            maxLength={PARTNER_MESSAGE_MAX_LENGTH}
            value={isPartnerMuted ? "" : text}
            readOnly={isPartnerMuted}
            placeholder={
              isPartnerMuted
                ? t("partner_chat_muted")
                : t("partner_chat_placeholder")
            }
            onChange={(e) => setText(e.target.value)}
            onBlur={closeInput}
            // keeps typing from reaching the in-game keyboard shortcuts
            onKeyUp={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === "Escape") closeInput()
            }}
          />
          <button
            className="bubbly blue"
            disabled={isPartnerMuted}
            // fires before the input blurs and unmounts the form
            onMouseDown={(e) => e.preventDefault()}
          >
            {t("send")}
          </button>
          <button
            type="button"
            className="bubbly game-partner-chat-mute"
            title={t(isPartnerMuted ? "partner_chat_unmute" : "partner_chat_mute", {
              name: partnerName ?? ""
            })}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => dispatch(setPartnerChatMuted(!isPartnerMuted))}
          >
            <img
              src={`assets/icons/${isPartnerMuted ? "SPEAKER_OFF" : "SPEAKER"}.svg`}
              alt=""
            />
          </button>
        </form>
      )}
    </div>
  )
}
