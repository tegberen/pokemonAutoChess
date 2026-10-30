import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  SEASON_DUPLICATE_CARD_TICKETS,
  type SeasonCurrency,
  type SeasonShopOffer
} from "../../../../../config/game/season"
import type { SeasonBoosterCard } from "../../../../../types/Booster"
import { PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { useAppDispatch } from "../../../hooks"
import { buySeasonOffer, openSeasonBooster } from "../../../network"
import { savePreferences } from "../../../preferences"
import { setErrorAlertMessage } from "../../../stores/NetworkStore"
import { cc } from "../../utils/jsx"
import SeasonCard, {
  SHINY_LANDING_MS,
  SPECIAL_CARD_PALETTES
} from "./season-card"
import SeasonSparkles, { SeasonSparkleBurst } from "./season-sparkles"
import type { SeasonState } from "./season-view"

const OFFER_CONFIRM_TIMEOUT_MS = 3000
const DEAL_STAGGER_MS = 60
const SPARKLE_AFTER_FLIP_MS = 350
// after a shiny or holo lands: its sheen sweeps, then twinkles and a shiny's
// emotes follow
const SHINY_SHEEN_AFTER_LANDING_MS = 100
const SHINY_TWINKLES_AFTER_LANDING_MS = 350
const SHINY_EMOTES_AFTER_LANDING_MS = 450
const GOLDEN_BURST_AFTER_LANDING_MS = 150
const MYSTERY_PORTRAITS_AFTER_FLIP_MS = 900
const SHINY_EMOTE_STAGGER_MS = 50
const SHINY_EMOTES_PER_ROW_MAX = 10
const CURRENCY_ICONS: Record<SeasonCurrency, string> = {
  poke: "assets/icons/season_poke.svg",
  ticket: "assets/icons/season_ticket.svg"
}

function getBalancedColumnCount(itemCount: number) {
  const rowCount = Math.ceil(itemCount / SHINY_EMOTES_PER_ROW_MAX)
  return Math.ceil(itemCount / rowCount)
}

export default function SeasonShop(props: { season: SeasonState }) {
  const { season } = props
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [isWaitingForServer, setIsWaitingForServer] = useState(false)
  const [openedCards, setOpenedCards] = useState<SeasonBoosterCard[]>([])
  const [openedBoosterCount, setOpenedBoosterCount] = useState(0)
  const [flippedCards, setFlippedCards] = useState<boolean[]>([])
  const [isMysteryGiftOpen, setIsMysteryGiftOpen] = useState(false)
  const [isMysteryGiftFlipped, setIsMysteryGiftFlipped] = useState(false)
  const [isMysteryThemeOpen, setIsMysteryThemeOpen] = useState(false)
  const isRevealing =
    openedCards.length > 0 || isMysteryGiftOpen || isMysteryThemeOpen
  const areAllCardsFlipped = flippedCards.every((flipped) => flipped)
  const [confirmingOfferId, setConfirmingOfferId] = useState<string>()

  useEffect(() => {
    if (!confirmingOfferId) return
    const timeout = setTimeout(
      () => setConfirmingOfferId(undefined),
      OFFER_CONFIRM_TIMEOUT_MS
    )
    return () => clearTimeout(timeout)
  }, [confirmingOfferId])

  function getBalance(currency: SeasonCurrency) {
    return currency === "poke" ? season.pokeBalance : season.ticketBalance
  }

  function getOfferArt(offer: SeasonShopOffer) {
    if (offer.item === "portrait") {
      return "assets/icons/season_mystery_gift.svg"
    }
    if (offer.item === "theme") return "assets/icons/season_palette.svg"
    if (offer.item === "wonder-pick") {
      return "assets/ui/pokecard-prismatic.png"
    }
    return "assets/ui/booster.png"
  }

  async function runServerAction<T>(action: () => Promise<T>) {
    if (isWaitingForServer) return null
    setIsWaitingForServer(true)
    try {
      return await action()
    } catch (error) {
      dispatch(setErrorAlertMessage((error as Error).message))
      return null
    } finally {
      setIsWaitingForServer(false)
    }
  }

  async function openBooster() {
    if (season.boosterBalance === 0) return
    const result = await runServerAction(openSeasonBooster)
    if (!result) return
    setIsMysteryGiftOpen(false)
    setIsMysteryThemeOpen(false)
    setOpenedCards(result.cards)
    setOpenedBoosterCount((previous) => previous + 1)
    setFlippedCards(new Array(result.cards.length).fill(false))
  }

  const shinyCardIndex = openedCards.findIndex((card) => card.shiny)
  const shinyCard = openedCards[shinyCardIndex]
  const isShinyRevealed =
    shinyCard !== undefined &&
    flippedCards[shinyCardIndex] &&
    shinyCard.unlockedEmotions.length > 0

  async function onClickOffer(offer: SeasonShopOffer) {
    if (confirmingOfferId !== offer.id) {
      setConfirmingOfferId(offer.id)
      return
    }
    setConfirmingOfferId(undefined)
    const result = await runServerAction(() => buySeasonOffer(offer.id))
    if (!result) return
    if (offer.item === "portrait") {
      setOpenedCards([])
      setIsMysteryThemeOpen(false)
      setIsMysteryGiftFlipped(false)
      setIsMysteryGiftOpen(true)
    }
    if (offer.item === "theme") {
      setOpenedCards([])
      setIsMysteryGiftOpen(false)
      setIsMysteryThemeOpen(true)
    }
  }

  function closeReveal() {
    setOpenedCards([])
    setFlippedCards([])
    setIsMysteryGiftOpen(false)
    setIsMysteryThemeOpen(false)
  }

  function onClickOpen() {
    if (isMysteryGiftOpen && !isMysteryGiftFlipped) {
      setIsMysteryGiftFlipped(true)
    } else {
      openBooster()
    }
  }

  return (
    <div className="season-shop">
      {isMysteryThemeOpen ? (
        <div className="season-booster-stage">
          <div className="season-theme-reveal">
            <img
              src={`assets/theme/${season.mysteryTheme}/custombg.jpg`}
              alt=""
            />
            <SeasonSparkles delayMs={SPARKLE_AFTER_FLIP_MS} />
          </div>
          <div className="season-theme-reveal-footer">
            <span>{t(`theme.${season.mysteryTheme}`)}</span>
            <button
              className="season-shop-open"
              onClick={() => savePreferences({ theme: season.mysteryTheme })}
            >
              Apply
            </button>
          </div>
        </div>
      ) : isMysteryGiftOpen ? (
        <div className="season-booster-stage">
          <div className="season-mystery-reveal">
            <SeasonCard
              pokemon={season.mysteryGiftPortraits[0].pokemon}
              portraitSrc={season.mysteryGiftPortraits[0].src}
              isFaceUp={isMysteryGiftFlipped}
              synergyIconSize="20px"
              onClick={() => setIsMysteryGiftFlipped(true)}
            >
              {isMysteryGiftFlipped && (
                <SeasonSparkles delayMs={SPARKLE_AFTER_FLIP_MS} />
              )}
            </SeasonCard>
          </div>
          <div className="season-booster-emotes-slot">
            {isMysteryGiftFlipped && (
              <ul
                className="season-booster-shiny-emotes"
                style={{
                  gridTemplateColumns: `repeat(${
                    season.mysteryGiftPortraits.length
                  }, auto)`
                }}
              >
                {season.mysteryGiftPortraits.map((portrait, i) => (
                  <li
                    key={portrait.id}
                    style={{
                      animationDelay: `${
                        MYSTERY_PORTRAITS_AFTER_FLIP_MS +
                        i * SHINY_EMOTE_STAGGER_MS
                      }ms`
                    }}
                  >
                    <img
                      src={portrait.src}
                      width={44}
                      height={44}
                      alt={portrait.label}
                      title={portrait.label}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : openedCards.length > 0 ? (
        <div key={openedBoosterCount} className="season-booster-stage">
          <div className="season-booster-reveal">
            {openedCards.map((card, i) => (
              <SeasonCard
                key={i}
                pokemon={card.name}
                shiny={card.shiny}
                holo={card.holo}
                sheenDelayMs={SHINY_LANDING_MS + SHINY_SHEEN_AFTER_LANDING_MS}
                emotion={card.emotion}
                isFaceUp={flippedCards[i]}
                synergyIconSize="20px"
                style={{ animationDelay: `${i * DEAL_STAGGER_MS}ms` }}
                onClick={() =>
                  setFlippedCards((previous) => previous.with(i, true))
                }
                footer={
                  !card.new ? (
                    <span className="season-booster-duplicate">
                      +{SEASON_DUPLICATE_CARD_TICKETS}
                      <img
                        src={CURRENCY_ICONS.poke}
                        width={18}
                        height={18}
                        alt="Tickets"
                      />
                    </span>
                  ) : undefined
                }
              >
                {(card.shiny || card.holo) && flippedCards[i] && (
                  <>
                    <SeasonSparkleBurst
                      delayMs={SHINY_LANDING_MS}
                      colors={
                        card.shiny ? undefined : SPECIAL_CARD_PALETTES.holo
                      }
                    />
                    {card.shiny && (
                      <SeasonSparkleBurst
                        delayMs={
                          SHINY_LANDING_MS + GOLDEN_BURST_AFTER_LANDING_MS
                        }
                        isGolden
                      />
                    )}
                    <SeasonSparkles
                      delayMs={
                        SHINY_LANDING_MS + SHINY_TWINKLES_AFTER_LANDING_MS
                      }
                      colors={
                        card.shiny ? undefined : SPECIAL_CARD_PALETTES.holo
                      }
                    />
                  </>
                )}
              </SeasonCard>
            ))}
          </div>
          <div className="season-booster-emotes-slot">
            {isShinyRevealed && (
              <ul
                className="season-booster-shiny-emotes"
                style={{
                  gridTemplateColumns: `repeat(${getBalancedColumnCount(
                    shinyCard.unlockedEmotions.length
                  )}, auto)`
                }}
              >
                {shinyCard.unlockedEmotions.map((emotion, i) => (
                  <li
                    key={emotion}
                    style={{
                      animationDelay: `${
                        SHINY_LANDING_MS +
                        SHINY_EMOTES_AFTER_LANDING_MS +
                        i * SHINY_EMOTE_STAGGER_MS
                      }ms`
                    }}
                  >
                    <img
                      src={getPortraitSrc(
                        PkmIndex[shinyCard.name],
                        true,
                        emotion
                      )}
                      width={44}
                      height={44}
                      alt={emotion}
                      title={emotion}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <ul className="season-shop-offers">
          {season.shopOffers.map((offer) => {
            const isOwned =
              offer.oneTime && season.purchasedOfferIds.includes(offer.id)
            const canAfford =
              getBalance(offer.price.currency) >= offer.price.amount
            return (
              <li key={offer.id}>
                <button
                  className={cc("season-shop-offer", {
                    owned: isOwned,
                    confirming: confirmingOfferId === offer.id
                  })}
                  disabled={isOwned || !canAfford || isWaitingForServer}
                  title={offer.label}
                  onClick={() => onClickOffer(offer)}
                >
                  <span className="season-shop-offer-art">
                    <img
                      src={getOfferArt(offer)}
                      width={56}
                      height={56}
                      alt=""
                    />
                  </span>
                  <span className="season-shop-offer-name">{offer.label}</span>
                  <span className="season-shop-price">
                    {isOwned ? (
                      "Owned"
                    ) : confirmingOfferId === offer.id ? (
                      "Confirm"
                    ) : (
                      <>
                        {offer.price.amount}
                        <img
                          src={CURRENCY_ICONS[offer.price.currency]}
                          width={18}
                          height={18}
                          alt={offer.price.currency}
                        />
                      </>
                    )}
                  </span>
                  {offer.seasonExclusive && (
                    <img
                      className="season-shop-exclusive"
                      src="assets/ui/clock.png"
                      width={13}
                      height={18}
                      alt="Season exclusive"
                      title="Season exclusive"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="season-shop-dock">
        <span className="season-shop-dock-booster">
          <img src="assets/ui/booster.png" width={56} height={56} alt="" />
          <span className="season-shop-owned-count">
            {season.boosterBalance}
          </span>
        </span>
        <button
          className="season-shop-open"
          // every card is turned by hand: the next booster waits for the last
          disabled={
            isWaitingForServer ||
            !areAllCardsFlipped ||
            season.boosterBalance === 0
          }
          onClick={onClickOpen}
        >
          Open
        </button>
        {isRevealing && (
          <button
            className="bubbly blue season-shop-back"
            aria-label="Back to shop"
            // like Open, it waits for the last card to be turned by hand
            disabled={
              !areAllCardsFlipped ||
              (isMysteryGiftOpen && !isMysteryGiftFlipped)
            }
            onClick={closeReveal}
          >
            <span className="season-arrow-icon left" />
          </button>
        )}
      </div>
    </div>
  )
}
