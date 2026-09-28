import { VIDEO_BG_THEMES } from "../../config/game/theme"
import { subscribeToPreference } from "./preferences"

const THEME_LINK_ID = "pac-theme"

// buttons.css repaints the main buttons only for a theme that defines
// --theme-button, which can only be read once its stylesheet has loaded
function markThemedButtons() {
  const themeButton = getComputedStyle(document.documentElement)
    .getPropertyValue("--theme-button")
    .trim()
  document.documentElement.toggleAttribute(
    "data-themed-buttons",
    themeButton !== ""
  )
}

export function applyTheme(theme: string) {
  document.getElementById("videobg")?.remove()
  document.documentElement.removeAttribute("data-themed-buttons")
  let link = document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null
  if (!theme || theme === "default") {
    link?.remove()
    return
  }
  if (!link) {
    link = document.createElement("link")
    link.id = THEME_LINK_ID
    link.rel = "stylesheet"
    link.addEventListener("load", markThemedButtons)
    document.head.appendChild(link)
  }
  const href = `themes/${theme}.css`
  // the same stylesheet again fires no load event, it is already applied
  if (link.getAttribute("href") === href) markThemedButtons()
  else link.href = href

  if (VIDEO_BG_THEMES.includes(theme as any)) {
    const videoElement = document.createElement("video")
    videoElement.id = "videobg"
    videoElement.src = `/assets/theme/${theme}/videobg.mp4`
    videoElement.autoplay = true
    videoElement.muted = true
    videoElement.loop = true
    document.body.prepend(videoElement)
  }
}

subscribeToPreference("theme", applyTheme, true)
