import { useState } from "react"
import { flushSync } from "react-dom"
import { PATCHES, type PatchInfo } from "../../../../../config/game/patches"
import { PatchSummary } from "./patch-summary"
import { Poster } from "./poster"
import ServerGuide from "./server-guide"
import "./patchnotes.css"

export default function PatchNotes({
  onOpenInterface
}: {
  onOpenInterface: () => void
}) {
  const [showGuide, setShowGuide] = useState(true)
  const [selectedPatch, setSelectedPatch] = useState<PatchInfo | null>(null)

  const viewTransition = (transition: () => void) => {
    // Use View Transition API if available
    if (
      "startViewTransition" in document &&
      typeof document.startViewTransition === "function"
    ) {
      document.startViewTransition(() => {
        flushSync(() => {
          transition()
        })
      })
    } else {
      transition()
    }
  }

  const handlePosterClick = (patch: PatchInfo) =>
    viewTransition(() => {
      setSelectedPatch(selectedPatch?.v === patch.v ? null : patch)
    })

  const handleBackClick = () =>
    viewTransition(() => {
      setSelectedPatch(null)
    })

  if (showGuide) {
    return (
      <ServerGuide
        onArchive={() => setShowGuide(false)}
        onOpenInterface={onOpenInterface}
      />
    )
  }

  if (selectedPatch) {
    return (
      <div className="patchnotes-detail-view">
        <div className="detail-content">
          <div className="detail-poster">
            <Poster version={selectedPatch.v} isDetailed />
          </div>
          <div className="detail-notes">
            <button
              className="close-btn"
              onClick={handleBackClick}
              style={{ float: "right", marginLeft: "2em" }}
            >
              🗙
            </button>
            <PatchSummary patch={selectedPatch} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="patchnotes-archive">
      <button className="bubbly blue" onClick={() => setShowGuide(true)}>
        ← Back to Server Guide
      </button>
      <ul className="patchnotes-grid" role="list">
        {PATCHES.filter((patch) => patch.v !== "altmeta").map((patch) => (
          <li
            key={patch.v}
            style={{ viewTransitionName: `poster-${patch.v}` }}
            role="listitem"
          >
            <Poster
              version={patch.v}
              onClick={() => handlePosterClick(patch)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
