import {
  type Dispatch,
  type SetStateAction,
  useMemo,
  useState
} from "react"
import { useTranslation } from "react-i18next"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import {
  FOSSIL_RESTORATION_SYNERGY_LEVEL,
  GalarFossil,
  getRestoredPokemon
} from "../../../../../types/enum/FossilUnlock"
import { Synergy } from "../../../../../types/enum/Synergy"
import {
  selectConnectedPlayer,
  selectFossilUnlocks,
  useAppSelector
} from "../../../hooks"
import { restoreFossil } from "../../../network"
import { getCachedPortrait } from "./game-pokemon-portrait"
import "./game-fossil-restoration.css"

type Slot = 0 | 1
/* where a dragged fossil came from, so a drop between slots can swap the two
   rather than overwrite one and lose the other */
type DragSource = Slot | "tray"

function encodeDrag(fossil: GalarFossil, from: DragSource): string {
  return `${from}:${fossil}`
}

function decodeDrag(
  payload: string
): { fossil: GalarFossil; from: DragSource } | null {
  const separator = payload.indexOf(":")
  if (separator < 0) return null
  const origin = payload.slice(0, separator)
  const fossil = payload.slice(separator + 1) as GalarFossil
  if (!Object.values(GalarFossil).includes(fossil)) return null
  return { fossil, from: origin === "tray" ? "tray" : (Number(origin) as Slot) }
}

/* The Restoration half of the Fossil Unlock menu: pair two discovered Galar
   fossils to bring one Pokemon back. Only one restored Pokemon exists at a time,
   so restoring again swaps the board one out. Drag and drop is plain HTML5 DnD
   rather than the board's phaser drag system, since nothing here leaves the
   modal; left click a fossil to slot it and a slot to take it back, or drag it
   around. Right click on a slot takes it back too. */
export function GameFossilRestoration() {
  const { t } = useTranslation()
  const player = useAppSelector(selectConnectedPlayer)
  const { galarFossils, restoredPokemon } = useAppSelector(selectFossilUnlocks)
  const fossilLevel = player?.synergies.get(Synergy.FOSSIL) ?? 0
  const [slots, setSlots] = useState<(GalarFossil | null)[]>([null, null])

  const result = useMemo(
    () => getRestoredPokemon(slots[0], slots[1]),
    [slots]
  )
  const isCurrentlyRestored = result !== null && result === restoredPokemon

  function place(slot: Slot, fossil: GalarFossil, from: DragSource) {
    if (!galarFossils.includes(fossil)) return
    setSlots((current) => {
      const next = [...current]
      if (from === "tray") {
        // a fossil is only ever in one place, so clear any stale copy
        const other: Slot = slot === 0 ? 1 : 0
        if (next[other] === fossil) next[other] = null
        next[slot] = fossil
      } else if (from !== slot) {
        // slot to slot: trade places, keeping whatever was already there
        next[slot] = current[from]
        next[from] = current[slot]
      }
      return next
    })
  }

  function placeInFirstFreeSlot(fossil: GalarFossil) {
    place(slots[0] === null ? 0 : 1, fossil, "tray")
  }

  if (
    galarFossils.length === 0 ||
    fossilLevel < FOSSIL_RESTORATION_SYNERGY_LEVEL
  ) {
    return null
  }

  return (
    <section className="fossil-restoration">
      <header className="fossil-restoration-header">
        <h3>{t("fossil_unlocks.restoration_title")}</h3>
        <p>{t("fossil_unlocks.restoration_hint")}</p>
      </header>

      <div className="fossil-restoration-panels">
        <div className="fossil-restoration-panel">
          <h4>{t("fossil_unlocks.your_fossils")}</h4>
          <ul className="fossil-restoration-inventory">
            {Object.values(GalarFossil)
              .filter((fossil) => !slots.includes(fossil))
              .map((fossil) => {
                const discovered = galarFossils.includes(fossil)
                return (
                  <li
                    key={fossil}
                    className={`fossil-restoration-fossil ${discovered ? "" : "is-undiscovered"}`}
                    draggable={discovered}
                    onDragStart={(event) =>
                      event.dataTransfer.setData(
                        "text/plain",
                        encodeDrag(fossil, "tray")
                      )
                    }
                    onClick={() => discovered && placeInFirstFreeSlot(fossil)}
                  >
                    <img src={`assets/item/${fossil}.webp`} alt={fossil} />
                  </li>
                )
              })}
          </ul>
        </div>

        <div className="fossil-restoration-panel fossil-restoration-combine">
          <h4>{t("fossil_unlocks.combine")}</h4>
          <div className="fossil-restoration-bench">
            <FossilSlot
              slot={0}
              fossil={slots[0]}
              onDrop={(fossil, from) => place(0, fossil, from)}
              onClear={() => clearSlot(setSlots, 0)}
            />
            <span className="fossil-restoration-operator">+</span>
            <FossilSlot
              slot={1}
              fossil={slots[1]}
              onDrop={(fossil, from) => place(1, fossil, from)}
              onClear={() => clearSlot(setSlots, 1)}
            />
            <span className="fossil-restoration-operator">=</span>
            <div
              className={`fossil-restoration-result ${result ? "is-valid" : ""}`}
              title={result ? t(`pkm.${result}`) : undefined}
            >
              {result ? (
                <img
                  src={getCachedPortrait(
                    getPokemonData(result).index,
                    player?.pokemonCustoms
                  )}
                  alt={t(`pkm.${result}`)}
                />
              ) : (
                <span aria-hidden="true">?</span>
              )}
            </div>
          </div>

          <button
            className="bubbly green"
            disabled={result === null || isCurrentlyRestored}
            onClick={() => {
              if (!result || isCurrentlyRestored) return
              restoreFossil([slots[0] as GalarFossil, slots[1] as GalarFossil])
              setSlots([null, null])
            }}
          >
            {t(
              isCurrentlyRestored
                ? "fossil_unlocks.already_restored"
                : "fossil_unlocks.restore"
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

function clearSlot(
  setSlots: Dispatch<SetStateAction<(GalarFossil | null)[]>>,
  slot: Slot
) {
  setSlots((current) => {
    const next = [...current]
    next[slot] = null
    return next
  })
}

function FossilSlot(props: {
  slot: Slot
  fossil: GalarFossil | null
  onDrop: (fossil: GalarFossil, from: DragSource) => void
  onClear: () => void
}) {
  return (
    <div
      className={`fossil-restoration-slot ${props.fossil ? "is-filled" : ""}`}
      draggable={props.fossil !== null}
      onDragStart={(event) =>
        props.fossil &&
        event.dataTransfer.setData(
          "text/plain",
          encodeDrag(props.fossil, props.slot)
        )
      }
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const dragged = decodeDrag(event.dataTransfer.getData("text/plain"))
        if (dragged) props.onDrop(dragged.fossil, dragged.from)
      }}
      onClick={() => props.onClear()}
      onContextMenu={(event) => {
        event.preventDefault()
        props.onClear()
      }}
    >
      {props.fossil && (
        <img src={`assets/item/${props.fossil}.webp`} alt={props.fossil} />
      )}
    </div>
  )
}
