import { useEffect, useState } from "react"
import {
  BlessingTier,
  GOLDEN_FLIP_TOSS_MS
} from "../../../../../types/enum/Blessing"
import { DEPTH } from "../../../game/depths"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import { setEpicCommitmentFlip } from "../../../stores/GameStore"
import { playSound, SOUNDS } from "../../utils/audio"
import { cc } from "../../utils/jsx"
import "./game-golden-flip.css"

const FULL_TURNS = 6
const LANDED_HOLD_MS = 1000

export default function GameEpicCommitmentFlip() {
  const dispatch = useAppDispatch()
  const flip = useAppSelector((state) => state.game.epicCommitmentFlip)
  const [tossed, setTossed] = useState(false)

  useEffect(() => {
    if (!flip) return
    setTossed(false)
    playSound(SOUNDS.BLESSING_FLIP)
    // the rotation is set one frame later so the browser animates it
    const frame = requestAnimationFrame(() => setTossed(true))
    const landed = setTimeout(
      () => playSound(SOUNDS.BLESSING),
      GOLDEN_FLIP_TOSS_MS
    )
    const close = setTimeout(
      () => dispatch(setEpicCommitmentFlip(null)),
      GOLDEN_FLIP_TOSS_MS + LANDED_HOLD_MS
    )
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(landed)
      clearTimeout(close)
    }
  }, [flip, dispatch])

  if (!flip) return null

  const finalAngle = FULL_TURNS * 360 + (flip === "HEADS" ? 0 : 180)

  return (
    <div className="game-golden-flip" style={{ zIndex: DEPTH.MODAL }}>
      <div
        className={cc("golden-flip-toss", { tossed })}
        style={{ animationDuration: `${GOLDEN_FLIP_TOSS_MS}ms` }}
      >
        <div
          className="golden-flip-coin"
          style={{
            transform: `rotateX(${tossed ? finalAngle : 0}deg)`,
            transitionDuration: `${GOLDEN_FLIP_TOSS_MS}ms`
          }}
        >
          <CoinFace icon="/assets/icons/GOLD.svg" />
          <CoinFace icon="/assets/blessings/epic_commitment.svg" back />
        </div>
      </div>
    </div>
  )
}

function CoinFace({ icon, back = false }: { icon: string; back?: boolean }) {
  return (
    <div
      className={cc(
        "golden-flip-face",
        `blessing-tier-${BlessingTier.SILVER.toLowerCase()}`,
        { back }
      )}
    >
      <div className="golden-flip-face-body">
        <img src={icon} alt="" />
      </div>
    </div>
  )
}
