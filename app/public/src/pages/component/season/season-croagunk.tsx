import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { SeasonCroagunkTradeItem } from "../../../../../config/game/season"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import type { Emotion } from "../../../../../types/enum/Emotion"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import type { IUserMetadataUnpacked } from "../../../../../types/interfaces/UserMetadata"
import {
  getPokemonCustomFromAvatar,
  getPortraitSrc
} from "../../../../../utils/avatar"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import { buyCroagunkTrade, openCroagunkTrade } from "../../../network"
import { setErrorAlertMessage } from "../../../stores/NetworkStore"
import { cc } from "../../utils/jsx"
import type { SeasonState } from "./season-view"

const MS_PER_HOUR = 3_600_000
const MS_PER_MINUTE = 60_000
const DISH_EATEN_MS = 700
const CROAGUNK_EMOTIONS = getAvailableEmotions(PkmIndex[Pkm.CROAGUNK], false)

const ITEM_ART: Record<
  Exclude<SeasonCroagunkTradeItem, "spinda-dish">,
  string
> = {
  "shiny-ticket": "assets/icons/season_ticket.svg",
  booster: "assets/ui/booster.png",
  "casual-pick": "assets/ui/pokecard.png"
}

type DishPhase = "offered" | "eating" | "reacting"

function formatTimeLeft(msLeft: number) {
  const hours = Math.floor(msLeft / MS_PER_HOUR)
  const minutes = Math.floor((msLeft % MS_PER_HOUR) / MS_PER_MINUTE)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// the emotes the player's current avatar does not own yet
function getAvatarReactions(profile: IUserMetadataUnpacked | undefined) {
  if (!profile) return null
  const avatar = getPokemonCustomFromAvatar(profile.avatar)
  const index = PkmIndex[avatar.name]
  if (!index) return null
  const shiny = avatar.shiny ?? false
  const item = profile.pokemonCollection.get(index)
  const owned = (shiny ? item?.shinyEmotions : item?.emotions) ?? []
  const missing = getAvailableEmotions(index, shiny).filter(
    (emotion) => !owned.includes(emotion)
  )
  return { index, shiny, missing }
}

export default function SeasonCroagunk(props: {
  season: SeasonState
  now: number
}) {
  const { season, now } = props
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const profile = useAppSelector((state) => state.network.profile)
  const [isWaiting, setIsWaiting] = useState(false)
  const [croagunkEmotion, setCroagunkEmotion] = useState(
    () =>
      CROAGUNK_EMOTIONS[Math.floor(Math.random() * CROAGUNK_EMOTIONS.length)]
  )
  const [dishPhase, setDishPhase] = useState<DishPhase>("offered")
  const lastOpenedExpiryRef = useRef<number | null>(null)
  const trade = season.croagunkTrade
  const offer = season.croagunkOffer
  const isExpired = !trade || trade.expiresAt <= now
  const isPurchased = trade?.purchasedAt != null
  const isDishOffer = offer?.item === "spinda-dish" && trade?.dish != null
  const reactions = getAvatarReactions(profile)
  const canReact = (reactions?.missing.length ?? 0) > 0

  const showError = (error: Error) =>
    dispatch(setErrorAlertMessage(error.message))

  useEffect(() => {
    if (!isExpired) return
    const expiryKey = trade?.expiresAt ?? 0
    if (lastOpenedExpiryRef.current === expiryKey) return
    lastOpenedExpiryRef.current = expiryKey
    openCroagunkTrade().catch(showError)
  }, [isExpired, trade?.expiresAt])

  // a new deal starts over from the dish on the counter
  useEffect(() => {
    setDishPhase("offered")
  }, [trade?.chosenAt])

  useEffect(() => {
    if (dishPhase !== "eating") return
    const timeout = setTimeout(
      () => setDishPhase("reacting"),
      prefersReducedMotion() ? 0 : DISH_EATEN_MS
    )
    return () => clearTimeout(timeout)
  }, [dishPhase])

  async function buy(reaction?: Emotion) {
    if (isWaiting || !offer || isExpired || isPurchased) return
    setIsWaiting(true)
    try {
      await buyCroagunkTrade(reaction)
      // Croagunk answers with the same face, when Croagunk has that portrait
      if (reaction && CROAGUNK_EMOTIONS.includes(reaction)) {
        setCroagunkEmotion(reaction)
      }
    } catch (error) {
      showError(error as Error)
    } finally {
      setIsWaiting(false)
    }
  }

  // the portraits load while the dish is eaten, so the reactions appear whole
  function startEatingDish() {
    if (reactions) {
      for (const emotion of reactions.missing) {
        new Image().src = getPortraitSrc(
          reactions.index,
          reactions.shiny,
          emotion
        )
      }
    }
    setDishPhase("eating")
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
  const dishName = trade?.dish ? t(`item.${trade.dish}`) : ""

  function renderDishDeal() {
    if (!offer || !trade?.dish) return null
    if (dishPhase === "reacting" && reactions && !isPurchased) {
      return (
        <>
          <span className="season-croagunk-line">
            How do you react?
          </span>
          <ul className="season-croagunk-reactions">
            {reactions.missing.map((emotion) => (
              <li key={emotion}>
                <button
                  disabled={isWaiting}
                  title={emotion}
                  onClick={() => buy(emotion)}
                >
                  <img
                    src={getPortraitSrc(
                      reactions.index,
                      reactions.shiny,
                      emotion
                    )}
                    width={48}
                    height={48}
                    alt={emotion}
                  />
                </button>
              </li>
            ))}
          </ul>
        </>
      )
    }
    return (
      <>
        <span className="season-croagunk-line">
          {isPurchased
            ? "Meh-heh-heh! Pleasure doing business."
            : dishPhase === "eating"
              ? "Nom nom nom..."
              : "Meh-heh-heh... Spinda just came by from the café and " +
                "gave me this. Want to trade?"}
        </span>
        {!isPurchased && (
          <span
            className={cc("season-croagunk-offer season-croagunk-dish", {
              eaten: dishPhase === "eating"
            })}
          >
            <img
              src={`assets/item/${trade.dish}.png`}
              width={64}
              height={64}
              alt={dishName}
              title={dishName}
            />
          </span>
        )}
        {!isPurchased && (
          <span className="season-croagunk-name">{dishName}</span>
        )}
        {!isPurchased && (
          <>
            <span className="season-croagunk-price">
              {offer.price}
              <img
                src="assets/icons/season_poke.svg"
                width={18}
                height={18}
                alt="Tickets"
              />
            </span>
            <button
              className="season-croagunk-button"
              disabled={
                // stays while the dish is eaten, so the box keeps its height
                isWaiting || !canAfford || !canReact || dishPhase !== "offered"
              }
              title={
                !canReact
                  ? "Your avatar already has every emote"
                  : canAfford
                    ? undefined
                    : "Not enough Tickets"
              }
              onClick={startEatingDish}
            >
              Trade
            </button>
          </>
        )}
        {isPurchased && (
          <span className="season-croagunk-status">Swapped</span>
        )}
      </>
    )
  }

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
          "dish-deal": isDishOffer && !isExpired
        })}
      >
        {offer && isDishOffer && !isExpired ? (
          renderDishDeal()
        ) : offer && offer.item !== "spinda-dish" ? (
          <>
            <span className="season-croagunk-offer">
              <img
                src={ITEM_ART[offer.item]}
                width={64}
                height={64}
                alt=""
              />
              <span className="season-croagunk-amount">×{offer.amount}</span>
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
                onClick={() => buy()}
              >
                Trade
              </button>
            )}
          </>
        ) : (
          <>
            <span className="season-croagunk-status">
              Looking for a deal...
            </span>
            <button
              className="season-croagunk-button"
              disabled={isWaiting}
              onClick={refresh}
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
