import type { Item } from "../enum/Item"
import type { Pkm } from "../enum/Pokemon"

export interface IPokemonReportForm {
  pkm: Pkm
  picks: number
  averagePlace: number
  firstRate: number
}

export interface IPokemonReportLine extends IPokemonReportForm {
  forms: IPokemonReportForm[]
}

export interface IPokemonReportMode {
  games: number
  players: number
  lines: IPokemonReportLine[]
}

export interface IPokemonReport {
  updatedAt: string
  since: string
  solo: IPokemonReportMode
  duo: IPokemonReportMode
}

export interface IPokemonTopItem {
  item: Item
  share: number
}

export interface IPokemonItemsMode {
  forms: Record<string, IPokemonTopItem[]>
  lines: Record<string, IPokemonTopItem[]>
}

export interface IPokemonItemsReport {
  updatedAt: string
  solo: IPokemonItemsMode
  duo: IPokemonItemsMode
}
