import { Role, Title } from "../types"

// Organizers and Bot Managers also moderate, on top of their own duties
export function hasModeratorRights(role: Role | undefined): boolean {
  return (
    role === Role.ADMIN ||
    role === Role.MODERATOR ||
    role === Role.ORGANIZER ||
    role === Role.BOT_MANAGER
  )
}

export function canManageTournaments(role: Role | undefined): boolean {
  return role === Role.ADMIN || role === Role.ORGANIZER
}

// an Organizer only hands out the tournament winner titles
const ORGANIZER_TITLES: Title[] = [
  Title.CHAMPION,
  Title.THE_SCRIBBLER,
  Title.THE_MISFIT
]

export function getGivableTitles(role: Role | undefined): Title[] {
  if (role === Role.ADMIN) return Object.values(Title)
  if (role === Role.ORGANIZER) return ORGANIZER_TITLES
  return []
}
