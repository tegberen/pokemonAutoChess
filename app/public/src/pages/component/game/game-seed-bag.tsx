import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { type Item, Seeds } from "../../../../../types/enum/Item"
import { isIn } from "../../../../../utils/array"
import { schemaValues } from "../../../../../utils/schemas"
import { selectConnectedPlayer, useAppSelector } from "../../../hooks"
import { selectSeed } from "../../../network"
import { playSound, SOUNDS } from "../../utils/audio"
import { addIconsToDescription } from "../../utils/descriptions"
import "./game-seed-bag.css"

function useOwnedSeeds(): Item[] {
  const player = useAppSelector(selectConnectedPlayer)
  if (!player?.items) return []
  const seeds = schemaValues(player.items).filter((i): i is Item =>
    isIn(Seeds, i)
  )
  return seeds.filter((s, idx) => seeds.indexOf(s) === idx)
}

export function GameSeedBag() {
  const { t } = useTranslation()
  const ownedSeeds = useOwnedSeeds()
  const derivedActive: Item | "" = ownedSeeds[0] ?? ""

  const [pendingActive, setPendingActive] = useState<Item | "">("")
  const activeSeed: Item | "" = pendingActive || derivedActive

  useEffect(() => {
    if (pendingActive && pendingActive === derivedActive) setPendingActive("")
  }, [pendingActive, derivedActive])

  const arm = (seed: Item) => {
    if (seed === activeSeed) return
    playSound(SOUNDS.BUTTON_CLICK)
    setPendingActive(seed)
    selectSeed(seed)
  }

  const activeIsValid = isIn(Seeds, activeSeed)

  const displaySeeds = Seeds.filter((s) => ownedSeeds.includes(s))

  return (
    <div className="game-seed-bag">
      <h2>{t("seed_bag.title")}</h2>
      <p className="help">{t("seed_bag.hint")}</p>
      <div className="game-seed-bag-grid">
        {displaySeeds.map((seed, index) => (
          <div
            key={`seed-bag-${seed}-${index}`}
            className={
              "game-seed-bag-slot" + (seed === activeSeed ? " active" : "")
            }
            onClick={() => arm(seed)}
            title={t(`item.${seed}`)}
          >
            <img src={"assets/item/" + seed + ".png"} alt={t(`item.${seed}`)} />
          </div>
        ))}
      </div>
      <div className="game-seed-bag-active-desc">
        {activeIsValid && (
          <>
            <h3>{t(`item.${activeSeed}`)}</h3>
            <p>{addIconsToDescription(t(`item_description.${activeSeed}`))}</p>
          </>
        )}
      </div>
    </div>
  )
}

export function GameSeedBagIcon() {
  const { t } = useTranslation()
  const ownedSeeds = useOwnedSeeds()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (ownedSeeds.length === 0) return null

  return (
    <div className="game-seed-bag-icon" ref={ref}>
      <button
        className="bubbly blue game-seed-bag-button"
        title={t("seed_bag.title")}
        onClick={() => setOpen((o) => !o)}
      >
        <img src="assets/icons/SEED_BAG.svg" draggable="false" alt="Seed Bag" />
      </button>
      {open && (
        <div className="game-seed-bag-popover">
          <GameSeedBag />
        </div>
      )}
    </div>
  )
}
