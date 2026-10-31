import { useEffect, useRef, useState } from "react"
import type { SeasonCroagunkTradeItem } from "../../../../../config/game/season"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { useAppDispatch } from "../../../hooks"
import { buyCroagunkTrade, openCroagunkTrade } from "../../../network"
import { setErrorAlertMessage } from "../../../stores/NetworkStore"
import { cc } from "../../utils/jsx"
import type { SeasonState } from "./season-view"

const MS_PER_HOUR = 3_600_000
const MS_PER_MINUTE = 60_000
const CROAGUNK_EMOTIONS = getAvailableEmotions(PkmIndex[Pkm.CROAGUNK], false)

const ITEM_ART: Record<SeasonCroagunkTradeItem, string> = {
  "shiny-ticket": "assets/icons/season_ticket.svg",
  booster: "assets/ui/booster.png",
  "casual-pick": "assets/ui/pokecard.png"
}

function formatTimeLeft(msLeft: number) {
  const hours = Math.floor(msLeft / MS_PER_HOUR)
  const minutes = Math.floor((msLeft % MS_PER_HOUR) / MS_PER_MINUTE)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default function SeasonCroagunk(props: {
  season: SeasonState
  now: number
}) {
  const { season, now } = props
  const dispatch = useAppDispatch()
  const [isWaiting, setIsWaiting] = useState(false)
  const [croagunkEmotion] = useState(
    () =>
      CROAGUNK_EMOTIONS[Math.floor(Math.random() * CROAGUNK_EMOTIONS.length)]
  )
  const lastOpenedExpiryRef = useRef<number | null>(null)
  const trade = season.croagunkTrade
  const offer = season.croagunkOffer
  const isExpired = !trade || trade.expiresAt <= now
  const isPurchased = trade?.purchasedAt != null

  const showError = (error: Error) =>
    dispatch(setErrorAlertMessage(error.message))

  useEffect(() => {
    if (!isExpired) return
    const expiryKey = trade?.expiresAt ?? 0
    if (lastOpenedExpiryRef.current === expiryKey) return
    lastOpenedExpiryRef.current = expiryKey
    openCroagunkTrade().catch(showError)
  }, [isExpired, trade?.expiresAt])

  async function buy() {
    if (isWaiting || !offer || isExpired || isPurchased) return
    setIsWaiting(true)
    try {
      await buyCroagunkTrade()
    } catch (error) {
      showError(error as Error)
    } finally {
      setIsWaiting(false)
    }
  }

  async function refresh() {
    if (isWaiting) return
    setIsWaiting(true)
    try {
      await openCroagunkTrade()
    } catch (error) {
      showError(error as Error)
    } finally {
      setIsWaiting(false)
    }
  }

  const msUntilNextDeal = Math.max(0, (trade?.expiresAt ?? now) - now)
  const canAfford = offer ? season.pokeBalance >= offer.price : false

  return (
    <div className="season-croagunk">
      <div className="season-title season-croagunk-title">
        <img
          src={getPortraitSrc(PkmIndex[Pkm.CROAGUNK], false, croagunkEmotion)}
          width={84}
          height={84}
          alt="Croagunk"
        />
        <div>
          <h2>Croagunk Swap</h2>
          {!isExpired && (
            <span className="season-days-left">
              <img src="assets/ui/clock.png" width={13} height={18} alt="" />
              Next deal in {formatTimeLeft(msUntilNextDeal)}
            </span>
          )}
        </div>
      </div>
      <div
        className={cc("season-croagunk-deal", {
          swapped: isPurchased && !isExpired
        })}
      >
        {offer ? (
          <>
            <span className="season-croagunk-line">
              {isPurchased
                ? "Meh-heh-heh! Pleasure doing business."
                : "Meh-heh-heh... Want to swap?"}
            </span>
            <div className="season-croagunk-details">
              <span className="season-croagunk-offer">
                <img
                  src={ITEM_ART[offer.item]}
                  width={64}
                  height={64}
                  alt=""
                />
                <span className="season-croagunk-amount">
                  ×{offer.amount}
                </span>
              </span>
              <span className="season-croagunk-name">{offer.label}</span>
              <span className="season-croagunk-price">
                {offer.price}
                <img
                  src="assets/icons/season_poke.svg"
                  width={18}
                  height={18}
                  alt="Tickets"
                />
              </span>
              {isExpired ? (
                <button
                  className="season-croagunk-button"
                  disabled={isWaiting}
                  onClick={refresh}
                >
                  New deal
                </button>
              ) : isPurchased ? (
                <span className="season-croagunk-status">Swapped</span>
              ) : (
                <button
                  className="season-croagunk-button"
                  disabled={isWaiting || !canAfford}
                  title={canAfford ? undefined : "Not enough Tickets"}
                  onClick={buy}
                >
                  Trade
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="season-croagunk-line">
              Looking for a deal...
            </span>
            <div className="season-croagunk-details">
              <button
                className="season-croagunk-button"
                disabled={isWaiting}
                onClick={refresh}
              >
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
