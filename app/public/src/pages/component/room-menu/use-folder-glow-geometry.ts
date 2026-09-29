import { useLayoutEffect, useRef } from "react"

// A multi-coloured glow cannot trace the folder's stepped outline in CSS, so
// it is two rings: one around the tab, one around the mode strip and card.
// Their placement needs the tab's size and the step under it, which only
// layout knows, so they are measured onto the folder as CSS variables.
export function useFolderGlowGeometry<T extends HTMLElement>(enabled: boolean) {
  const folderRef = useRef<T>(null)

  useLayoutEffect(() => {
    const folder = folderRef.current
    if (!enabled || !folder) return

    const measure = () => {
      const tab = folder.querySelector<HTMLElement>(".room-folder-tab")
      const modeStrip = folder.querySelector<HTMLElement>(".room-mode")
      if (!tab || !modeStrip) return
      const folderBox = folder.getBoundingClientRect()
      const tabBox = tab.getBoundingClientRect()
      const modeStripBox = modeStrip.getBoundingClientRect()
      folder.style.setProperty("--glow-folder-width", `${folderBox.width}px`)
      folder.style.setProperty("--glow-folder-height", `${folderBox.height}px`)
      folder.style.setProperty("--glow-tab-width", `${tabBox.width}px`)
      folder.style.setProperty("--glow-tab-height", `${tabBox.height}px`)
      folder.style.setProperty(
        "--glow-step",
        `${modeStripBox.top - folderBox.top}px`
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(folder)
    return () => observer.disconnect()
  }, [enabled])

  return folderRef
}
