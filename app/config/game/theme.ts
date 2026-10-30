import { Title } from "../../types"
import type { IUserMetadataUnpacked } from "../../types/interfaces/UserMetadata"
import { invertKeysValues, values } from "../../utils/object"
import { GADGETS } from "./gadgets"
import { SEASONS } from "./season"
import { isHalloweenGhostSeason } from "./town-encounters"

export const THEMES = [
  "default",
  "modernclassic",
  "super",
  "lilac",
  "rainbow",
  "unown",
  "origin",
  "umbra",
  "autumn",
  "redsea",
  "zengarden",
  "deerling",
  "beyondtheforecast",
  "diancie",
  "rock",
  "hotspring",
  "bazaar",
  "whimsicott",
  "wishfestival",
  "hot",
  "embersofthepast",
  "wailord",
  "ikebana",
  "derpy",
  "artist",
  "duelist",
  "halloween",
  "onsen",
  "newjourney"
] as const

export type Theme = (typeof THEMES)[number]

export const VIDEO_BG_THEMES: Theme[] = [
  "umbra",
  "autumn",
  "redsea",
  "zengarden",
  "deerling"
]

export const TITLE_BY_THEME = {
  rainbow: Title.HARLEQUIN,
  autumn: Title.POKEMON_RANGER,
  umbra: Title.DELINQUENT,
  redsea: Title.FISHERMAN,
  origin: Title.MUSEUM_DIRECTOR,
  zengarden: Title.NATURAL,
  deerling: Title.AMATEUR,
  whimsicott: Title.WHIMSY,
  wishfestival: Title.STARRY,
  hot: Title.HOT_STREAK,
  embersofthepast: Title.ANCIENT,
  wailord: Title.WHALE,
  ikebana: Title.IKEBANA,
  derpy: Title.DERPY,
  artist: Title.ARTIST,
  duelist: Title.DUELIST
} satisfies Partial<Record<Theme, Title>>

export const THEME_BY_TITLE = invertKeysValues(TITLE_BY_THEME)

export const TITLES_UNLOCKING_THEMES = values(TITLE_BY_THEME)
export type TitleUnlockingTheme = (typeof TITLES_UNLOCKING_THEMES)[number]

const PURCHASABLE_THEMES: Theme[] = SEASONS.map(
  (season) => season.mysteryTheme
)

export function isThemeUnlocked(
  theme: Theme,
  profile: IUserMetadataUnpacked
): boolean {
  if (theme === "halloween" && !isHalloweenGhostSeason()) return false
  if (profile.unlockedThemes?.includes(theme)) return true
  if (PURCHASABLE_THEMES.includes(theme)) return false
  if (profile.level < GADGETS.palette.levelRequired) return false
  const requiredTitle = TITLE_BY_THEME[theme]
  if (!requiredTitle) return true
  return profile.titles.includes(requiredTitle)
}
