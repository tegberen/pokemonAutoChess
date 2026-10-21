import type { IWishReport } from "../../../types/models/wish-report"

export type {
  IWishReport,
  IWishReportMode,
  IWishReportRow
} from "../../../types/models/wish-report"

export async function fetchWishReport(): Promise<IWishReport> {
  const response = await fetch(`/meta/wishes?t=${new Date().getUTCDate()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch wish report: ${response.status}`)
  }
  return response.json()
}
