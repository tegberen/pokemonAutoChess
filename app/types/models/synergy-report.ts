import type { Synergy } from "../enum/Synergy"

export interface ISynergyReportStats {
  boards: number
  playRate: number
  averagePlace: number
  firstRate: number
  boardsPerPlace: number[]
}

export interface ISynergyReportTier extends ISynergyReportStats {
  threshold: number
}

export interface ISynergyReportRow extends ISynergyReportStats {
  synergy: Synergy
  tiers: ISynergyReportTier[]
}

export interface ISynergyReportMode {
  games: number
  players: number
  rows: ISynergyReportRow[]
}

export interface ISynergyReport {
  updatedAt: string
  since: string
  solo: ISynergyReportMode
  duo: ISynergyReportMode
}
