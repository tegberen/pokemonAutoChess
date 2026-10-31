import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  getNextSpindaCafeOpening,
  getNextUtcMidnight,
  getNextUtcMonday,
  isSpindaCafeOpen,
  SEASON_MIN_STAGE_FOR_CHALLENGES
} from "../../../../../config/game/season"
import {
  canClaimSpindaGuest,
  getCurrentSpindaGuestSlot,
  getSpindaGuestPoints,
  getSpindaGuests,
  isSpindaGuestClaimed,
  SPINDA_GUEST_GOAL_POINTS,
  type SpindaGuest,
  type SpindaGuestSlot
} from "../../../../../config/game/spinda-guest"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import { PkmIndex } from "../../../../../types/enum/Pokemon"
import type { IUserMetadataUnpacked } from "../../../../../types/interfaces/UserMetadata"
import { useAppDispatch } from "../../../hooks"
import { claimSpindaGuest } from "../../../network"
import { setErrorAlertMessage } from "../../../stores/NetworkStore"
import { formatTimeLeft } from "../../utils/date"
import SeasonCard from "./season-card"

const MS_PER_DAY = 86_400_000

const SLOT_LABELS: Record<SpindaGuestSlot, string> = {
  saturday: "Saturday",
  sunday: "Sunday"
}

const GUEST_RULES =
  "A guest visits on Saturday and another on Sunday. A game played to stage " +
  `${SEASON_MIN_STAGE_FOR_CHALLENGES} that day gives 1 point, or 2 with the ` +
  `guest's family on your final team. It takes ${SPINDA_GUEST_GOAL_POINTS} ` +
  "points. A Unique, Legendary or Hatch guest on your final team gives all " +
  `${SPINDA_GUEST_GOAL_POINTS} points at once. Games played at the same ` +
  `time count once. ${SPINDA_GUEST_GOAL_POINTS} points unlock the guest's ` +
  "Holo and all its regular emotes."

function pickRandomFace(guest: SpindaGuest) {
  const emotions = getAvailableEmotions(PkmIndex[guest.pokemon], false)
  return emotions[Math.floor(Math.random() * emotions.length)]
}

// today's guest in front, the other day's card peeking out from behind it:
// tomorrow's as a teaser, and on Sunday yesterday's, only while it waits to be
// claimed. A click brings the card behind forward
export default function SpindaGuests(props: {
  profile: IUserMetadataUnpacked
  now: number
}) {
  const { profile, now } = props
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [isWaiting, setIsWaiting] = useState(false)
  const guests = getSpindaGuests(now)
  // a random face for each guest each time the tab opens, like Spinda's
  const [faces] = useState(() => ({
    saturday: pickRandomFace(guests.saturday),
    sunday: pickRandomFace(guests.sunday)
  }))
  const currentSlot = getCurrentSpindaGuestSlot(now)
  const [pickedSlot, setPickedSlot] = useState<SpindaGuestSlot | null>(null)
  const slot = pickedSlot ?? currentSlot ?? "saturday"
  const otherSlot = slot === "saturday" ? "sunday" : "saturday"
  const guest = guests[slot]
  const other = guests[otherSlot]

  const isOpen = isSpindaCafeOpen(now)
  // on Sunday the other card only shows while Saturday's guest waits to be
  // claimed, or to get back to the Sunday guest
  const hasPeek =
    currentSlot !== "sunday" ||
    slot === "saturday" ||
    canClaimSpindaGuest(profile.spindaCafe, "saturday", now)
  const hasArrived = (guestSlot: SpindaGuestSlot) =>
    isOpen && (guestSlot === "saturday" || currentSlot === "sunday")
  const cafe = profile.spindaCafe
  const points = getSpindaGuestPoints(cafe, slot, now)
  const isClaimed = isSpindaGuestClaimed(cafe, slot, now)
  const isReady = points >= guest.goalPoints
  const isVisitOver = slot === "saturday" && currentSlot === "sunday"
  const name = t(`pkm.${guest.pokemon}`)
  const line = !hasArrived(slot)
    ? `Arrives ${SLOT_LABELS[slot]}!`
    : isClaimed
      ? `${name} joined you!`
      : isReady
        ? `${name} wants to join you!`
        : isVisitOver
          ? `${name} has left.`
          : `${name} dropped by!`
  // points only count on the guest's own day, but a finished guest can be
  // claimed until the café closes on Monday
  const msUntilArrival =
    getNextSpindaCafeOpening(now) - now + (slot === "sunday" ? MS_PER_DAY : 0)
  const timerText = !isOpen
    ? `Arrives in ${formatTimeLeft(msUntilArrival)}`
    : slot === "sunday" && currentSlot === "saturday"
      ? `Arrives in ${formatTimeLeft(getNextUtcMidnight(now) - now)}`
      : slot === "saturday" && currentSlot === "saturday"
        ? `Visits for ${formatTimeLeft(getNextUtcMidnight(now) - now)}`
        : `Leaves in ${formatTimeLeft(getNextUtcMonday(now) - now)}`
  const faceOf = (guestSlot: SpindaGuestSlot) =>
    getAvailableEmotions(PkmIndex[guests[guestSlot].pokemon], false).includes(
      faces[guestSlot]
    )
      ? faces[guestSlot]
      : undefined

  async function claim() {
    if (isWaiting) return
    setIsWaiting(true)
    try {
      await claimSpindaGuest(slot)
    } catch (error) {
      dispatch(setErrorAlertMessage((error as Error).message))
    } finally {
      setIsWaiting(false)
    }
  }

  return (
    <div className="spinda-guest">
      <div className="spinda-guest-deck">
        {hasPeek && (
          <SeasonCard
            className="spinda-guest-peek"
            pokemon={other.pokemon}
            holo
            emotion={faceOf(otherSlot)}
            isFaceUp
            isTiltable={false}
            onClick={() => setPickedSlot(otherSlot)}
          />
        )}
        <SeasonCard
          className="spinda-guest-card"
          pokemon={guest.pokemon}
          holo
          emotion={faceOf(slot)}
          isFaceUp
        />
      </div>
      <div className="spinda-guest-info">
        <h3 className="spinda-guest-title">
          {SLOT_LABELS[slot]} Guest
          <span
            className="season-wonder-info"
            tabIndex={0}
            title={GUEST_RULES}
            aria-label={GUEST_RULES}
          >
            <img src="assets/ui/help.svg" width={16} height={16} alt="" />
          </span>
        </h3>
        <span className="season-muted spinda-guest-timer">
          <img src="assets/ui/clock.png" width={13} height={18} alt="" />
          {timerText}
        </span>
        <span className="season-croagunk-line">{line}</span>
        <div className="season-challenge-progress">
          <div className="season-challenge-bar">
            {Array.from({ length: guest.goalPoints }, (_, i) => (
              <span key={i} className={i < points ? "filled" : undefined} />
            ))}
          </div>
          <span>
            {points}/{guest.goalPoints}
          </span>
        </div>
        <button
          className="season-croagunk-button"
          disabled={!canClaimSpindaGuest(cafe, slot, now) || isWaiting}
          onClick={claim}
        >
          Claim
        </button>
      </div>
    </div>
  )
}
