import type { Blessing } from "../enum/Blessing"

export interface IWishReportRow {
  blessing: Blessing
  picks: number
  pickRate: number
  averagePlace: number
  firstRate: number
}

export interface IWishReportMode {
  games: number
  players: number
  rows: IWishReportRow[]
}

export interface IWishReport {
  updatedAt: string
  since: string
  solo: IWishReportMode
  duo: IWishReportMode
}
