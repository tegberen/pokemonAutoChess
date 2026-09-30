import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Blessings } from "../../../../../config/game/blessings"
import {
  type Blessing,
  BlessingTier,
  GOLDEN_FLIP_TOSS_MS
} from "../../../../../types/enum/Blessing"
import { DEPTH } from "../../../game/depths"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import { usePreference } from "../../../preferences"
import { endGoldenFlip } from "../../../stores/GameStore"
import { playSound, SOUNDS } from "../../utils/audio"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { BlessingDescription } from "../synergy/blessing-description"
import "./game-golden-flip.css"

const GOLDEN_FLIP_REVEAL_MS = 3200
const GOLDEN_FLIP_FULL_TURNS = 6

export default function GameGoldenFlip() {
  const dispatch = useAppDispatch()
  const goldenFlip = useAppSelector((state) => state.game.goldenFlip)
  const tier = goldenFlip?.tier
  const result = goldenFlip?.result
  const [tossed, setTossed] = useState(false)

  useEffect(() => {
    if (!tier) return
    setTossed(false)
    playSound(SOUNDS.BLESSING_FLIP)
    // the rotation is set one frame later so the browser animates it
    const frame = requestAnimationFrame(() => setTossed(true))
    return () => cancelAnimationFrame(frame)
  }, [tier])

  // the server grants the Wish as the coin lands, then sends it to reveal
  useEffect(() => {
    if (!result) return
    playSound(SOUNDS.BLESSING)
    const close = setTimeout(
      () => dispatch(endGoldenFlip()),
      GOLDEN_FLIP_REVEAL_MS
    )
    return () => clearTimeout(close)
  }, [result, dispatch])

  if (!tier) return null

  if (result) {
    return (
      <RevealedWish
        blessing={result}
        onClose={() => dispatch(endGoldenFlip())}
      />
    )
  }

  const finalAngle =
    GOLDEN_FLIP_FULL_TURNS * 360 + (tier === BlessingTier.PRISMATIC ? 180 : 0)

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
          <CoinFace tier={BlessingTier.SILVER} />
          <CoinFace tier={BlessingTier.PRISMATIC} back />
        </div>
      </div>
    </div>
  )
}

function CoinFace({
  tier,
  back = false
}: {
  tier: BlessingTier
  back?: boolean
}) {
  return (
    <div
      className={cc(
        "golden-flip-face",
        `blessing-tier-${tier.toLowerCase()}`,
        { back }
      )}
    >
      <div className="golden-flip-face-body">
        <img src="/assets/ui/game_modes/wishes_icon.svg" alt="" />
      </div>
    </div>
  )
}

// the same markup as the Wish choice screen, so the rolled Wish looks like one
function RevealedWish({
  blessing,
  onClose
}: {
  blessing: Blessing
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [showBlessingGlow] = usePreference("showBlessingGlow")
  const definition = Blessings[blessing]
  return (
    <div
      className="game-choice golden-flip-reveal"
      style={{ zIndex: DEPTH.MODAL }}
    >
      <div className="my-container">
        <h2>{t("blessing.GOLDEN_FLIP.name")}</h2>
        <div className="game-choice-items-list game-choice-blessings-list">
          <div className="game-choice-blessing-slot">
            <div
              className={cc(
                "my-box active clickable",
                `blessing-tier-${definition.tier.toLowerCase()}`,
                { "blessing-glow": showBlessingGlow }
              )}
              onClick={onClose}
            >
              <div className="blessing-body">
                <img
                  className="blessing-icon"
                  src={`/assets/blessings/${definition.icon}.svg`}
                  alt=""
                />
                <h3>
                  {addIconsToDescription(t(`blessing.${blessing}.name`))}
                </h3>
                <BlessingDescription blessing={blessing} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
