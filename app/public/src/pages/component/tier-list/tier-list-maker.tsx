import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Blessing } from "../../../../../types/enum/Blessing"
import type { ITierList } from "../../../../../types/interfaces/TierList"
import { exportElementAsImage } from "../../../../../utils/export-image"
import { LocalStoreKeys, localStore } from "../../utils/store"
import ItemPicker from "../bot-builder/item-picker"
import PokemonPicker from "../bot-builder/pokemon-picker"
import {
  BlessingStages,
  BlessingTooltipCard,
  blessingTierClass
} from "../synergy/blessing-tooltip-card"
import TierList from "./tier-list"
import "./tier-list-maker.css"
import TierListRapidSorter from "./tier-list-rapid-sorter"

const PREVIEW_WIDTH = 620
const PREVIEW_GAP = 6

export default function TierListMaker() {
  const { t } = useTranslation()

  function getInitialTierList(): ITierList {
    return {
      name: t("tier_list.title"),
      rows: [
        { name: "S", color: "#ff7f7f", items: [] },
        { name: "A", color: "#ffbf7f", items: [] },
        { name: "B", color: "#FFDF7F", items: [] },
        { name: "C", color: "#FFFF7F", items: [] },
        { name: "D", color: "#BFFF7F", items: [] }
      ]
    }
  }

  const [tierList, setTierList] = useState<ITierList>(
    localStore.get(LocalStoreKeys.TIER_LIST) ?? getInitialTierList()
  )
  useEffect(() => {
    localStore.set(LocalStoreKeys.TIER_LIST, tierList)
  }, [tierList])

  const [sorting, setSorting] = useState(false)
  const makerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<{
    blessing: Blessing
    top: number
    left: number
    tableTop: number
    tableBottom: number
  } | null>(null)

  // the card goes in the table's empty space beside the hovered row, in maker
  // coordinates because it is absolutely positioned inside the scrolling maker
  function previewBlessing(blessing: Blessing | null, anchor?: DOMRect) {
    const maker = makerRef.current
    const table = maker?.querySelector(".tier-list-table")
    const actions = maker?.querySelector(".tier-list-actions-column")
    if (!blessing || !anchor || !maker || !table) return setPreview(null)

    const makerBox = maker.getBoundingClientRect()
    const tableBox = table.getBoundingClientRect()
    const actionsWidth = actions?.getBoundingClientRect().width ?? 0
    const toMakerX = (x: number) => x - makerBox.left + maker.scrollLeft
    const toMakerY = (y: number) => y - makerBox.top + maker.scrollTop

    const firstLeft = toMakerX(tableBox.left)
    const lastLeft = toMakerX(tableBox.right - actionsWidth) - PREVIEW_WIDTH

    setPreview({
      blessing,
      top: toMakerY(anchor.top),
      left: Math.min(
        Math.max(toMakerX(anchor.right) + PREVIEW_GAP, firstLeft),
        Math.max(firstLeft, lastLeft)
      ),
      tableTop: toMakerY(tableBox.top),
      tableBottom: toMakerY(tableBox.bottom)
    })
  }

  // the card's height depends on the description, so clamp it once rendered
  useLayoutEffect(() => {
    const node = previewRef.current
    if (!preview || !node) return
    const top = Math.max(
      preview.tableTop,
      Math.min(preview.top, preview.tableBottom - node.offsetHeight)
    )
    if (top !== preview.top) setPreview({ ...preview, top })
  }, [preview])

  function saveFile() {
    const blob = new Blob([JSON.stringify(tierList)], {
      type: "application/json"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tierlist.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function loadFile() {
    // load from local JSON file
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"
    input.addEventListener("change", async (e) => {
      if (!input.files) return
      const file = input.files![0]
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (!e.target) return
        try {
          const data = JSON.parse(e.target.result as string)
          if (!data) {
            throw new Error("Invalid file content")
          } else {
            setTierList({ ...data })
          }
        } catch (e) {
          alert("Invalid file")
        }
      }
      reader.readAsText(file)
    })
    input.click()
  }

  function captureOptions(preferClipboard: boolean) {
    return {
      selector: ".tier-list-table",
      excludeSelector: ".tier-list-actions-column",
      filename: tierList.name,
      preferClipboard
    }
  }

  function reportCaptureFailure(error: unknown) {
    const reason = error instanceof Error ? error.message : String(error)
    alert(`${t("tier_list.image_failed")}\n\n${reason}`)
  }

  async function downloadImage() {
    try {
      await exportElementAsImage(captureOptions(false))
    } catch (error) {
      reportCaptureFailure(error)
    }
  }

  async function copyImage() {
    try {
      const result = await exportElementAsImage(captureOptions(true))
      if (result === "download") {
        alert(t("tier_list.image_clipboard_unavailable"))
      }
    } catch (error) {
      reportCaptureFailure(error)
    }
  }

  function reset() {
    setTierList(getInitialTierList())
  }

  function addRow() {
    const newRows = [
      ...tierList.rows,
      {
        name: `Tier ${tierList.rows.length + 1}`,
        color: "#7f7f7f", // Default gray color for new rows
        items: []
      }
    ]
    setTierList({ ...tierList, rows: newRows })
  }

  return (
    <div id="tier-list-maker" ref={makerRef}>
      <div className="actions">
        {!sorting && (
          <button
            className="bubbly green tier-list-rapid-sort"
            onClick={() => setSorting(true)}
            type="button"
          >
            <img src="assets/icons/blessing_stats.svg" alt="" />{" "}
            {t("tier_list.rank_wishes")}
          </button>
        )}
        <button
          className="bubbly tier-list-add-row"
          onClick={addRow}
          type="button"
        >
          ＋{t("tier_list.add_row")}
        </button>
        <button className="bubbly" onClick={loadFile}>
          <img src="assets/ui/load.svg" /> {t("load")}
        </button>
        <button className="bubbly" onClick={saveFile}>
          <img src="assets/ui/save.svg" /> {t("save")}
        </button>
        <button className="bubbly blue" onClick={downloadImage}>
          <img src="assets/ui/photo.svg" /> {t("tier_list.download_image")}
        </button>
        <button className="bubbly blue" onClick={copyImage}>
          <img src="assets/ui/share.svg" /> {t("tier_list.copy_image")}
        </button>
        <button className="bubbly red" onClick={reset}>
          <img src="assets/ui/trash.svg" /> {t("reset")}
        </button>
      </div>
      <TierList
        tierList={tierList}
        onUpdate={setTierList}
        onPreviewBlessing={previewBlessing}
      />
      {preview && (
        <div
          ref={previewRef}
          className={`tier-list-preview ${blessingTierClass(preview.blessing)}`}
          style={{ top: preview.top, left: preview.left }}
        >
          <BlessingTooltipCard blessing={preview.blessing}>
            <BlessingStages blessing={preview.blessing} />
          </BlessingTooltipCard>
        </div>
      )}
      {sorting ? (
        <TierListRapidSorter
          tierList={tierList}
          onUpdate={setTierList}
          onClose={() => setSorting(false)}
        />
      ) : (
        <>
          <ItemPicker origin="tier-list" showUnholdableItems={true} />
          <PokemonPicker showBlessings />
        </>
      )}
    </div>
  )
}
