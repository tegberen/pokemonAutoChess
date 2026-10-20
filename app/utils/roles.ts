import { Role, Title } from "../types"

// an Organizer also moderates, on top of running tournaments
export function hasModeratorRights(role: Role | undefined): boolean {
  return (
    role === Role.ADMIN || role === Role.MODERATOR || role === Role.ORGANIZER
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
