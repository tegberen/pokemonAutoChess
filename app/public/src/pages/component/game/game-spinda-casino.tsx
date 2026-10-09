import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  SPINDA_CASINO_PULL_MS,
  SPINDA_CASINO_REWARD,
  SPINDA_CASINO_SLOTS,
  type SpindaCasinoSlot
} from "../../../../../types/enum/Blessing"
import { DEPTH } from "../../../game/depths"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import { setSpindaCasinoPulls } from "../../../stores/GameStore"
import { playSound, SOUNDS } from "../../utils/audio"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import "./game-spinda-casino.css"

const SLOT_ICONS: { [slot in SpindaCasinoSlot]: string } = {
  FREE_ROLLS: "/assets/ui/refresh.svg",
  GOLD: "/assets/icons/GOLD.svg",
  XP: "/assets/icons/EXP.svg",
  JACKPOT: "/assets/item/NUGGET.png"
}
const REEL_STOP_MS = [900, 1250, 1600]
const REEL_LENGTH = 20
// the reel's stop animation ends on this symbol, so the result is placed there
const REEL_TARGET_INDEX = 3
const RESULT_HOLD_MS = 1200

function buildReel(target: SpindaCasinoSlot) {
  return Array.from({ length: REEL_LENGTH }, (_, index) =>
    index === REEL_TARGET_INDEX
      ? target
      : SPINDA_CASINO_SLOTS[
          Math.floor(Math.random() * SPINDA_CASINO_SLOTS.length)
        ]
  )
}

export default function GameSpindaCasino() {
  const dispatch = useAppDispatch()
  const pulls = useAppSelector((state) => state.game.spindaCasinoPulls)
  const { t: tBase } = useTranslation()
  const t = tBase as any
  const [pullIndex, setPullIndex] = useState(0)
  const [stoppedReels, setStoppedReels] = useState(0)
  const slot = pulls?.[pullIndex]
  const landed = stoppedReels === REEL_STOP_MS.length

  useEffect(() => {
    if (!pulls) return
    setStoppedReels(0)
    playSound(SOUNDS.BLESSING_FLIP)
    const isLastPull = pullIndex >= pulls.length - 1
    const timers = REEL_STOP_MS.map((delay, reel) =>
      setTimeout(() => setStoppedReels(reel + 1), delay)
    )
    timers.push(
      setTimeout(
        () => {
          if (isLastPull) {
            setPullIndex(0)
            dispatch(setSpindaCasinoPulls(null))
          } else {
            setStoppedReels(0)
            setPullIndex(pullIndex + 1)
          }
        },
        SPINDA_CASINO_PULL_MS + (isLastPull ? RESULT_HOLD_MS : 0)
      )
    )
    return () => timers.forEach(clearTimeout)
  }, [pulls, pullIndex, dispatch])

  useEffect(() => {
    if (landed) playSound(SOUNDS.BLESSING)
  }, [landed])

  const reels = useMemo(
    () => (slot ? REEL_STOP_MS.map(() => buildReel(slot)) : []),
    [slot]
  )

  if (!pulls || !slot) return null

  return (
    <div className="game-spinda-casino" style={{ zIndex: DEPTH.MODAL }}>
      <h2>{t("blessing.SPINDA_CASINO.name")}</h2>
      <div className="spinda-slot-machine">
        {reels.map((symbols, reel) => (
          <div
            key={`${pullIndex}-${reel}`}
            className={cc(
              "spinda-reel",
              reel < stoppedReels ? "stopping" : "spinning"
            )}
          >
            <div className="spinda-reel-symbols">
              {symbols.map((symbol, index) => (
                <div key={index} className="spinda-symbol">
                  <img src={SLOT_ICONS[symbol]} alt="" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className={cc("spinda-result", { landed })}>
        {addIconsToDescription(
          t(`spinda_casino.${slot}`, { count: SPINDA_CASINO_REWARD })
        )}
      </p>
    </div>
  )
}
