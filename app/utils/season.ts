export type Season = "spring" | "summer" | "autumn" | "winter"

export const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"]

// Northern Hemisphere, by precise date:
// Spring Mar 20 - Jun 21, Summer Jun 22 - Sep 22,
// Autumn Sep 23 - Dec 20, Winter Dec 21 - Mar 19
export function getCurrentSeason(now = new Date()): Season {
  const year = now.getFullYear()
  const date = new Date(year, now.getMonth(), now.getDate())
  if (date >= new Date(year, 2, 20) && date < new Date(year, 5, 22)) {
    return "spring"
  }
  if (date >= new Date(year, 5, 22) && date < new Date(year, 8, 23)) {
    return "summer"
  }
  if (date >= new Date(year, 8, 23) && date < new Date(year, 11, 21)) {
    return "autumn"
  }
  return "winter"
}
