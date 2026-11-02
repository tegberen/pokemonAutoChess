import type { ISynergyReport } from "../../../types/models/synergy-report"

export type {
  ISynergyReport,
  ISynergyReportMode,
  ISynergyReportRow,
  ISynergyReportStats
} from "../../../types/models/synergy-report"

export async function fetchSynergyReport(): Promise<ISynergyReport> {
  const response = await fetch(`/meta/synergies?t=${new Date().getUTCDate()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch synergy report: ${response.status}`)
  }
  return response.json()
}
