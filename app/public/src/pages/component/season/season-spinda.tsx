import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  getNextSpindaCafeOpening,
  getNextUtcMidnight,
  getSpindaCafeDish,
  getUtcDayKey,
  isSpindaCafeOpen
} from "../../../../../config/game/season"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import type { Emotion } from "../../../../../types/enum/Emotion"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import type { IUserMetadataUnpacked } from "../../../../../types/interfaces/UserMetadata"
import {
  getPokemonCustomFromAvatar,
  getPortraitSrc
} from "../../../../../utils/avatar"
import { useAppDispatch } from "../../../hooks"
import { tasteSpindaDish } from "../../../network"
import { setErrorAlertMessage } from "../../../stores/NetworkStore"
import { formatTimeLeft } from "../../utils/date"
import { cc } from "../../utils/jsx"
import SpindaGuests from "./season-spinda-guests"

// matches the three bites in season.css; "Nom nom nom..." shows meanwhile
const DISH_EATEN_MS = 1300
const SPINDA_EMOTIONS = getAvailableEmotions(PkmIndex[Pkm.SPINDA], false)

type DishPhase = "offered" | "eating" | "reacting"

// the emotes the player's current avatar does not own yet
function getAvatarReactions(profile: IUserMetadataUnpacked) {
  const avatar = getPokemonCustomFromAvatar(profile.avatar)
  const index = PkmIndex[avatar.name]
  if (!index) return null
  const item = profile.pokemonCollection.get(index)
  const getMissing = (shiny: boolean) => {
    const owned = (shiny ? item?.shinyEmotions : item?.emotions) ?? []
    return getAvailableEmotions(index, shiny).filter(
      (emotion) => !owned.includes(emotion)
    )
  }
  // same rule as the server: a complete shiny avatar reacts with its regular
  // emotes instead
  const shinyMissing = avatar.shiny ? getMissing(true) : []
  const shiny = shinyMissing.length > 0
  const missing = shiny ? shinyMissing : getMissing(false)
  const available = getAvailableEmotions(index, shiny)
  return { index, shiny, missing, available }
}

// Spinda's Café opens on weekends: one free dish a day, and the face the
// player makes tasting it joins their avatar's emotes
export default function SeasonSpinda(props: {
  profile: IUserMetadataUnpacked
  now: number
}) {
  const { profile, now } = props
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [isWaiting, setIsWaiting] = useState(false)
  const [spindaEmotion, setSpindaEmotion] = useState(
    () => SPINDA_EMOTIONS[Math.floor(Math.random() * SPINDA_EMOTIONS.length)]
  )
  const [dishPhase, setDishPhase] = useState<DishPhase>("offered")
  const isOpen = isSpindaCafeOpen(now)
  const dayKey = getUtcDayKey(now)
  const hasTasted = profile.spindaCafe?.tastedDayKey === dayKey
  const dish = getSpindaCafeDish(profile.uid, now)
  const dishName = t(`item.${dish}`)
  const reactions = getAvatarReactions(profile)
  const canReact = (reactions?.missing.length ?? 0) > 0
  const isSunday = new Date(now).getUTCDay() === 0

  // a new day starts over from the dish on the table
  useEffect(() => {
    setDishPhase("offered")
  }, [dayKey])

  useEffect(() => {
    if (dishPhase !== "eating") return
    const timeout = setTimeout(
      () => setDishPhase("reacting"),
      DISH_EATEN_MS
    )
    return () => clearTimeout(timeout)
  }, [dishPhase])

  // the portraits load while the dish is eaten, so the reactions appear whole
  function startEating() {
    if (reactions) {
      for (const emotion of reactions.available) {
        new Image().src = getPortraitSrc(
          reactions.index,
          reactions.shiny,
          emotion
        )
      }
    }
    setDishPhase("eating")
  }

  async function react(reaction: Emotion) {
    if (isWaiting || hasTasted) return
    setIsWaiting(true)
    try {
      await tasteSpindaDish(reaction)
      // Spinda answers with the same face, when Spinda has that portrait
      if (SPINDA_EMOTIONS.includes(reaction)) setSpindaEmotion(reaction)
    } catch (error) {
      dispatch(setErrorAlertMessage((error as Error).message))
    } finally {
      setIsWaiting(false)
    }
  }

  const isReacting = dishPhase === "reacting" && reactions && !hasTasted
  const msUntilChange = isOpen
    ? getNextUtcMidnight(now) - now
    : getNextSpindaCafeOpening(now) - now
  const spindaLine = !isOpen
    ? "Closed. Open Saturday & Sunday!"
    : hasTasted
      ? "WHOAAAAAAA!"
      : dishPhase === "eating"
        ? "Nom nom nom..."
        : !isReacting
          ? "Today's special!"
          : canReact
            ? "How was it?"
            : "You've made every face already! Come back as someone else!"

  return (
    // laid out like Croagunk's stall, whose classes it shares
    <div className="season-croagunk">
      <div className="season-title season-croagunk-title">
        <img
          className={cc({ "spinda-closed-portrait": !isOpen })}
          src={getPortraitSrc(PkmIndex[Pkm.SPINDA], false, spindaEmotion)}
          width={84}
          height={84}
          alt="Spinda"
        />
        <div>
          <h2>Spinda Café</h2>
          <span className="season-days-left">
            <img src="assets/ui/clock.png" width={13} height={18} alt="" />
            {isOpen
              ? isSunday
                ? `Closes in ${formatTimeLeft(msUntilChange)}`
                : `Next dish in ${formatTimeLeft(msUntilChange)}`
              : `Closed · Opens in ${formatTimeLeft(msUntilChange)}`}
          </span>
        </div>
      </div>
      <div
        className={cc("season-croagunk-deal dish-deal", {
          swapped: !isOpen || hasTasted
        })}
      >
        <span className="season-croagunk-line">{spindaLine}</span>
        <div className="season-croagunk-details">
          {isReacting ? (
            // every face of the avatar: the ones still to make react, the ones
            // already made are greyed out. With none left, nothing happens and
            // switching avatar opens new faces in place
            <ul className="season-croagunk-reactions">
              {reactions.available.map((emotion) => (
                <li key={emotion}>
                  <button
                    className={cc({
                      made: !reactions.missing.includes(emotion)
                    })}
                    disabled={
                      isWaiting || !reactions.missing.includes(emotion)
                    }
                    title={emotion}
                    onClick={() => react(emotion)}
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
          ) : (
            <>
              <span
                className={cc("season-croagunk-offer season-croagunk-dish", {
                  eaten: dishPhase === "eating"
                })}
              >
                <img
                  src={`assets/item/${dish}.png`}
                  width={64}
                  height={64}
                  alt={dishName}
                  title={dishName}
                />
              </span>
              <span className="season-croagunk-name">{dishName}</span>
              {hasTasted ? (
                <span className="season-croagunk-status">Tasted</span>
              ) : (
                <button
                  className="season-croagunk-button"
                  disabled={
                    // stays while the dish is eaten, so the box keeps its
                    // height
                    !isOpen || isWaiting || dishPhase !== "offered"
                  }
                  onClick={startEating}
                >
                  Taste
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="spinda-guest-column">
        <SpindaGuests profile={profile} now={now} />
      </div>
    </div>
  )
}
