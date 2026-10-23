import type { IWishItemReport } from "../../../types/models/wish-item-report"

export type {
  IWishItemReport,
  IWishItemReportMode,
  IWishItemReportRow
} from "../../../types/models/wish-item-report"

export async function fetchWishItemReport(): Promise<IWishItemReport> {
  const response = await fetch(`/meta/wish-items?t=${new Date().getUTCDate()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch item report: ${response.status}`)
  }
  return response.json()
}
