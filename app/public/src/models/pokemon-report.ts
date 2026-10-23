import type {
  IPokemonItemsReport,
  IPokemonReport
} from "../../../types/models/pokemon-report"

export type {
  IPokemonItemsMode,
  IPokemonItemsReport,
  IPokemonReport,
  IPokemonReportForm,
  IPokemonReportLine,
  IPokemonReportMode,
  IPokemonTopItem
} from "../../../types/models/pokemon-report"

export async function fetchPokemonReport(): Promise<IPokemonReport> {
  const response = await fetch(
    `/meta/wish-pokemons?t=${new Date().getUTCDate()}`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon report: ${response.status}`)
  }
  return response.json()
}

export async function fetchPokemonItemsReport(): Promise<IPokemonItemsReport> {
  const response = await fetch(
    `/meta/pokemon-items?t=${new Date().getUTCDate()}`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon items: ${response.status}`)
  }
  return response.json()
}
