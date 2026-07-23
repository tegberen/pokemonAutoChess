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

// The Seed Bag is just the seeds already sitting in the player's items (they
// persist across fights now). `activeSeed` (the armed seed) comes from
// state.game.activeSeed, pushed by the server via Transfer.SELECT_SEED
// (activeSeed is a plain, non-schema field). Clicking a seed arms it.
function useOwnedSeeds(): Item[] {
  const player = useAppSelector(selectConnectedPlayer)
  return player?.items
    ? schemaValues(player.items).filter((i): i is Item => isIn(Seeds, i))
    : []
}

export function GameSeedBag() {
  const { t } = useTranslation()
  const ownedSeeds = useOwnedSeeds()
  const activeSeed = useAppSelector((state) => state.game.activeSeed)

  const arm = (seed: Item) => {
    if (seed === activeSeed) return
    playSound(SOUNDS.BUTTON_CLICK)
    selectSeed(seed)
  }

  const activeIsValid = activeSeed !== "" && isIn(Seeds, activeSeed)

  return (
    <div className="game-seed-bag">
      <h2>{t("seed_bag.title")}</h2>
      <p className="help">{t("seed_bag.hint")}</p>
      <div className="game-seed-bag-grid">
        {ownedSeeds.map((seed, index) => (
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
      {/* fixed-height so switching seeds doesn't resize (and jump) the popover */}
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

  // close the popover on outside click or Escape (it stays open while
  // interacting inside it, e.g. clicking a seed to arm it)
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

  // the icon only appears once the player owns at least one seed
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
