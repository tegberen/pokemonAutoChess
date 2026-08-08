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

const SEEDS_BEFORE_BAG_APPEARS = 2

/* the deduped list cannot see a second copy of a seed you already hold, so the
   new-seed alert counts every seed item instead */
function useSeedCount(): number {
  const player = useAppSelector(selectConnectedPlayer)
  if (!player?.items) return 0
  return schemaValues(player.items).filter((i): i is Item => isIn(Seeds, i))
    .length
}

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
  const seedCount = useSeedCount()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [hasNewSeed, setHasNewSeed] = useState(false)
  // bumped on every gain so remounting the sweep replays its animation
  const [shineKey, setShineKey] = useState(0)
  const previousSeedCount = useRef(seedCount)

  useEffect(() => {
    if (seedCount > previousSeedCount.current) {
      setHasNewSeed(true)
      setShineKey((key) => key + 1)
    }
    previousSeedCount.current = seedCount
  }, [seedCount])

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

  /* a single seed is held and used directly, so the bag only earns its place in
     the shop row once there is a second one to choose between */
  if (seedCount < SEEDS_BEFORE_BAG_APPEARS) return null

  return (
    <div className="game-seed-bag-icon" ref={ref}>
      <button
        className="bubbly blue game-seed-bag-button"
        title={t("seed_bag.title")}
        onClick={() => {
          setHasNewSeed(false)
          setOpen((o) => !o)
        }}
      >
        <img src="assets/icons/SEED_BAG.svg" draggable="false" alt="Seed Bag" />
        {shineKey > 0 && (
          <span key={shineKey} className="game-seed-bag-shine" />
        )}
        {hasNewSeed && <span className="game-seed-bag-new">!</span>}
      </button>
      {open && (
        <div className="game-seed-bag-popover">
          <GameSeedBag />
        </div>
      )}
    </div>
  )
}
