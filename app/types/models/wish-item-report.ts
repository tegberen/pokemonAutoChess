import type { Item } from "../enum/Item"

export interface IWishItemReportRow {
  item: Item
  picks: number
  averagePlace: number
  firstRate: number
}

export interface IWishItemReportMode {
  games: number
  players: number
  rows: IWishItemReportRow[]
}

export interface IWishItemReport {
  updatedAt: string
  since: string
  solo: IWishItemReportMode
  duo: IWishItemReportMode
}
