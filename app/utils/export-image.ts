export interface ExportImageOptions {
  /** CSS selector for the element to capture */
  selector: string
  /** CSS selector for elements to remove from the clone before capture */
  excludeSelector?: string
  /** Foreground color for the captured image */
  foregroundColor?: string
  /** Background color for the captured image */
  backgroundColor?: string
  /** Scale factor for image quality (default: 2) */
  scale?: number
  /** Image quality for PNG (0-1, default: 0.95) */
  quality?: number
  /** Filename for fallback download (without extension) */
  filename?: string
  /** Whether to try clipboard first or go straight to download */
  preferClipboard?: boolean
}

export type ExportImageResult = "clipboard" | "download"

/**
 * Converts SVG images to canvas elements to fix html2canvas SVG rendering issues
 * @param element The element containing SVG images
 */
async function convertSvgsToPng(element: HTMLElement): Promise<void> {
  const svgImages = element.querySelectorAll(
    'img[src$=".svg"]'
  ) as NodeListOf<HTMLImageElement>

  const conversionPromises = Array.from(svgImages).map(async (img) => {
    try {
      // Get computed styles to preserve sizing
      const computedStyle = window.getComputedStyle(img)
      const width = parseInt(computedStyle.width) || img.offsetWidth || 48
      const height = parseInt(computedStyle.height) || img.offsetHeight || 48

      // Fetch SVG content
      const response = await fetch(img.src)
      if (!response.ok) throw new Error("Failed to fetch SVG")

      const svgText = await response.text()
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" })
      const svgUrl = URL.createObjectURL(svgBlob)

      // Create a temporary canvas to convert SVG to PNG
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size with higher resolution for quality
      const scale = 2
      canvas.width = width * scale
      canvas.height = height * scale

      // Load and draw the SVG
      const svgImg = new Image()
      await new Promise<void>((resolve, reject) => {
        svgImg.onload = () => {
          ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height)
          resolve()
        }
        svgImg.onerror = () => reject(new Error("Failed to load SVG"))
        svgImg.src = svgUrl
      })

      // Create replacement image element
      const newImg = document.createElement("img")
      newImg.src = canvas.toDataURL("image/png")
      newImg.style.width = `${width}px`
      newImg.style.height = `${height}px`
      newImg.className = img.className
      newImg.alt = img.alt

      // Copy other relevant attributes
      Array.from(img.attributes).forEach((attr) => {
        if (!["src", "width", "height"].includes(attr.name)) {
          newImg.setAttribute(attr.name, attr.value)
        }
      })

      // Replace the SVG image with PNG version
      img.parentNode?.replaceChild(newImg, img)

      // Clean up
      URL.revokeObjectURL(svgUrl)
    } catch (error) {
      console.warn("Failed to convert SVG to PNG:", img.src, error)
      // If conversion fails, try setting explicit dimensions as fallback
      if (!img.width && !img.height) {
        img.style.width = "48px"
        img.style.height = "48px"
      }
    }
  })

  await Promise.allSettled(conversionPromises)
}

const COLOR_FUNCTION_PROPERTIES = [
  "backgroundColor",
  "backgroundImage",
  "color",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "boxShadow"
] as const

function channelToByte(raw: string): number {
  const value = raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw)
  return Math.round(Math.min(Math.max(value, 0), 1) * 255)
}

function channelToAlpha(raw: string | undefined): number {
  if (raw === undefined) return 1
  const value = raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw)
  return Number.isNaN(value) ? 1 : Math.min(Math.max(value, 0), 1)
}

// html2canvas 1.4.1 parses only rgb/rgba/hsl/hsla, but the browser resolves every
// color-mix() to color(srgb ...), so anything using the blessing palette makes it
// throw "unsupported color function". Rewrite those to rgba before capture.
function downgradeModernColors(value: string): string {
  return value.replace(
    /color\(\s*[\w-]+\s+([^)]+)\)/g,
    (match, body: string) => {
      const [channels, alpha] = body.split("/")
      const parts = channels.trim().split(/\s+/)
      if (parts.length < 3) return match
      const bytes = parts.slice(0, 3).map(channelToByte)
      if (bytes.some(Number.isNaN)) return match
      return `rgba(${bytes[0]}, ${bytes[1]}, ${bytes[2]}, ${channelToAlpha(alpha?.trim())})`
    }
  )
}

function downgradeUnsupportedColors(root: HTMLElement): void {
  const elements = [root, ...Array.from(root.querySelectorAll("*"))]
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue
    const computed = window.getComputedStyle(element)
    for (const property of COLOR_FUNCTION_PROPERTIES) {
      const value = computed[property]
      if (value.includes("color(")) {
        element.style[property] = downgradeModernColors(value)
      }
    }
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png", quality)
  )
}

async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
    return true
  } catch (error) {
    console.error("Clipboard write failed:", error)
    return false
  }
}

/**
 * Exports a DOM element as an image, to the clipboard or as a file download
 * @param options Configuration options for the export
 * @returns where the image ended up, so callers can report it accurately
 */
export async function exportElementAsImage(
  options: ExportImageOptions
): Promise<ExportImageResult> {
  const {
    selector,
    excludeSelector,
    foregroundColor = "#ffffff",
    backgroundColor = "#1a1a1a",
    scale = 2,
    quality = 0.95,
    filename = "export",
    preferClipboard = true
  } = options

  const targetElement = document.querySelector(selector) as HTMLElement
  if (!targetElement) {
    throw new Error(`Element with selector "${selector}" not found`)
  }

  const clonedElement = targetElement.cloneNode(true) as HTMLElement
  if (excludeSelector) {
    clonedElement.querySelectorAll(excludeSelector).forEach((el) => el.remove())
  }

  const tempContainer = document.createElement("div")
  tempContainer.style.position = "absolute"
  tempContainer.style.left = "-9999px"
  tempContainer.style.top = "-9999px"
  tempContainer.style.background = backgroundColor
  tempContainer.style.padding = "20px"
  tempContainer.style.color = foregroundColor
  tempContainer.appendChild(clonedElement)
  document.body.appendChild(tempContainer)

  try {
    // convertSvgsToPng reads computed sizes, so the clone has to be laid out first
    await convertSvgsToPng(clonedElement)
    downgradeUnsupportedColors(clonedElement)

    const html2canvas = (await import("html2canvas")).default
    const canvas = await html2canvas(clonedElement, {
      backgroundColor,
      scale,
      useCORS: true,
      allowTaint: true
    })

    const blob = await canvasToBlob(canvas, quality)
    if (!blob) throw new Error("Canvas produced no image data")

    if (preferClipboard && (await copyBlobToClipboard(blob))) {
      return "clipboard"
    }
    downloadBlob(blob, filename)
    return "download"
  } catch (error) {
    console.error("Error capturing element:", error)
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to capture element as image: ${reason}`)
  } finally {
    tempContainer.remove()
  }
}

/**
 * Downloads a blob as a file
 * @param blob The blob to download
 * @param filename The filename without extension
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename.replace(/[^a-z0-9]/gi, "_")}.png`
  a.click()
  URL.revokeObjectURL(url)
}
