import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import type { SeasonBoosterCard } from "../../../../../types/Booster"
import { Ability } from "../../../../../types/enum/Ability"
import { Pkm, PkmIndex, Unowns } from "../../../../../types/enum/Pokemon"
import type { IUserMetadataUnpacked } from "../../../../../types/interfaces/UserMetadata"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { values } from "../../../../../utils/object"
import { PokemonAnimations } from "../../../game/components/pokemon-animations"
import { useAppDispatch } from "../../../hooks"
import { sendPartyInvitation } from "../../../network"
import { setErrorAlertMessage } from "../../../stores/NetworkStore"
import { PokemonTypeahead } from "../typeahead/pokemon-typeahead"
import SeasonCard, { SHINY_LANDING_MS } from "./season-card"
import SeasonSparkles, { SeasonSparkleBurst } from "./season-sparkles"

const CONFIRM_TIMEOUT_MS = 3000
// the guest's card waits face down a moment, then turns like a booster shiny
const GUEST_ARRIVAL_MS = 300
const SHINY_SHEEN_AFTER_LANDING_MS = 100
const GOLDEN_BURST_AFTER_LANDING_MS = 150
const SHINY_TWINKLES_AFTER_LANDING_MS = 350
const PHOTOS_AFTER_LANDING_MS = 450
const PHOTO_STAGGER_MS = 50
// as many 44px photos as fit the letter's width
const PHOTOS_PER_ROW_MAX = 7

// the same guests the server accepts (season-shop.ts), minus the Pokemon whose
// shinies the player already owns
function getInvitableGuests(profile: IUserMetadataUnpacked) {
  return values(Pkm).filter((pokemon) => {
    if (
      getPokemonData(pokemon).skill === Ability.DEFAULT ||
      Unowns.includes(pokemon) ||
      PokemonAnimations[pokemon]?.shinyUnavailable === true
    ) {
      return false
    }
    const shinyEmotions = getAvailableEmotions(PkmIndex[pokemon], true)
    if (shinyEmotions.length === 0) return false
    const owned =
      profile.pokemonCollection.get(PkmIndex[pokemon])?.shinyEmotions ?? []
    return shinyEmotions.some((emotion) => !owned.includes(emotion))
  })
}

export default function SeasonPelipper(props: {
  profile: IUserMetadataUnpacked
}) {
  const { profile } = props
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [guest, setGuest] = useState<Pkm | "">("")
  const [isConfirming, setIsConfirming] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [arrivedGuest, setArrivedGuest] = useState<SeasonBoosterCard>()
  const [hasGuestArrived, setHasGuestArrived] = useState(false)
  const invitations = profile.partyInvitations ?? 0
  const guests = useMemo(
    () => getInvitableGuests(profile),
    [profile.pokemonCollection]
  )

  useEffect(() => {
    if (!isConfirming) return
    const timeout = setTimeout(
      () => setIsConfirming(false),
      CONFIRM_TIMEOUT_MS
    )
    return () => clearTimeout(timeout)
  }, [isConfirming])

  useEffect(() => {
    if (!arrivedGuest) return
    const timeout = setTimeout(() => setHasGuestArrived(true), GUEST_ARRIVAL_MS)
    return () => clearTimeout(timeout)
  }, [arrivedGuest])

  function chooseGuest(pokemon: Pkm | "") {
    setGuest(pokemon)
    setIsConfirming(false)
  }

  async function sendInvitation() {
    if (!guest || isWaiting) return
    if (!isConfirming) {
      setIsConfirming(true)
      return
    }
    setIsConfirming(false)
    setIsWaiting(true)
    try {
      const { card } = await sendPartyInvitation(guest)
      setHasGuestArrived(false)
      setArrivedGuest(card)
    } catch (error) {
      dispatch(setErrorAlertMessage((error as Error).message))
    } finally {
      setIsWaiting(false)
    }
  }

  function startNextInvitation() {
    setArrivedGuest(undefined)
    setHasGuestArrived(false)
    setGuest("")
  }

  const pelipperLine = arrivedGuest
    ? `${t(`pkm.${arrivedGuest.name}`)} came to your party!`
    : "Who do you invite to your victory party?"
  // rows as even as possible: 16 photos are 6, 6 and 4, not 7, 7 and 2
  const photoCount = arrivedGuest?.unlockedEmotions.length ?? 1
  const photoColumns = Math.ceil(
    photoCount / Math.ceil(photoCount / PHOTOS_PER_ROW_MAX)
  )

  return (
    <div className="season-pelipper">
      <div className="season-title season-pelipper-title">
        <img
          src={getPortraitSrc(PkmIndex[Pkm.PELIPPER])}
          width={84}
          height={84}
          alt="Pelipper"
        />
        <div>
          <h2>Pelipper Post</h2>
        </div>
      </div>
      <div className="season-pelipper-letter">
        <span className="season-pelipper-line">{pelipperLine}</span>
        {arrivedGuest ? (
          <>
            <div className="season-booster-reveal season-pelipper-card">
              <SeasonCard
                pokemon={arrivedGuest.name}
                shiny
                isFaceUp={hasGuestArrived}
                backSrc="assets/ui/pokecard-prismatic.png"
                sheenDelayMs={SHINY_LANDING_MS + SHINY_SHEEN_AFTER_LANDING_MS}
                synergyIconSize="22px"
              >
                {hasGuestArrived && (
                  <>
                    <SeasonSparkleBurst delayMs={SHINY_LANDING_MS} />
                    <SeasonSparkleBurst
                      delayMs={
                        SHINY_LANDING_MS + GOLDEN_BURST_AFTER_LANDING_MS
                      }
                      isGolden
                    />
                    <SeasonSparkles
                      delayMs={
                        SHINY_LANDING_MS + SHINY_TWINKLES_AFTER_LANDING_MS
                      }
                    />
                  </>
                )}
              </SeasonCard>
            </div>
            <div className="season-booster-emotes-slot">
              {hasGuestArrived && (
                <ul
                  className="season-booster-shiny-emotes"
                  style={{
                    gridTemplateColumns: `repeat(${photoColumns}, auto)`
                  }}
                >
                  {arrivedGuest.unlockedEmotions.map((emotion, i) => (
                    <li
                      key={emotion}
                      style={{
                        animationDelay: `${
                          SHINY_LANDING_MS +
                          PHOTOS_AFTER_LANDING_MS +
                          i * PHOTO_STAGGER_MS
                        }ms`
                      }}
                    >
                      <img
                        src={getPortraitSrc(
                          PkmIndex[arrivedGuest.name],
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
            {invitations > 0 && (
              <button
                className="season-shop-open"
                disabled={!hasGuestArrived}
                onClick={startNextInvitation}
              >
                Send another invitation
              </button>
            )}
          </>
        ) : invitations > 0 ? (
          <>
            <PokemonTypeahead
              value={guest}
              options={guests}
              onChange={chooseGuest}
            />
            <div className="season-pelipper-card">
              <SeasonCard
                pokemon={guest || Pkm.PELIPPER}
                shiny
                isFaceUp={guest !== ""}
                backSrc="assets/ui/pokecard-prismatic.png"
                synergyIconSize="22px"
              />
            </div>
            <button
              className="season-shop-open"
              disabled={!guest || isWaiting}
              onClick={sendInvitation}
            >
              <span className="season-avatar-button-labels">
                <span hidden={isConfirming}>Send invitation</span>
                <span hidden={!isConfirming}>Confirm</span>
              </span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
