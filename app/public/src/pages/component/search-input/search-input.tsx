import type React from "react"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import "./search-input.css"

const SEARCH_SHORTCUT_KEYS = ["/", "f"]

export function SearchInput({
  value,
  onChange,
  placeholder,
  onKeyDown,
  onFocus,
  onBlur,
  children
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  // the key alone, no modifier: it must not fire while the user is typing into
  // a field, and must leave browser shortcuts like ctrl+f alone
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const input = inputRef.current
      if (
        !input ||
        !SEARCH_SHORTCUT_KEYS.includes(event.key.toLowerCase()) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      )
        return
      // a search box on a hidden tab must not take the key from the shown one
      if (input.offsetParent === null) return
      event.preventDefault()
      // or F would buy experience in the game running behind the wiki
      event.stopPropagation()
      input.focus()
    }
    // capture phase on window: the sidebar and the phaser scene both listen
    // for keydown and would otherwise consume it first
    window.addEventListener("keydown", focusSearch, true)
    return () => window.removeEventListener("keydown", focusSearch, true)
  }, [])

  return (
    <div className="search-input">
      <input
        ref={inputRef}
        type="search"
        value={value}
        placeholder={placeholder ?? t("search")}
        title={t("search_shortcut_hint")}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {value === "" && <kbd aria-hidden="true">F</kbd>}
      {children}
    </div>
  )
}
