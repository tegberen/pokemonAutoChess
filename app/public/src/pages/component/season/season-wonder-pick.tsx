import { useEffect, useRef, useState } from "react"
import type { Emotion } from "../../../../../types/enum/Emotion"
import { type Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { useAppDispatch } from "../../../hooks"
import { setErrorAlertMessage } from "../../../stores/NetworkStore"
import { cc } from "../../utils/jsx"
import SeasonCard, {
  SHINY_LANDING_MS,
  SPECIAL_CARD_PALETTES
} from "./season-card"
import SeasonSparkles, { SeasonSparkleBurst } from "./season-sparkles"

const CARD_COUNT = 5
const CARD_BACK_SRC = "assets/ui/pokecard.png"
const SHINY_CARD_BACK_SRC = "assets/ui/pokecard-prismatic.png"
const FLIP_DURATION_MS = 450
// a shiny or holo pick waits for the screen to dim before it flips
const SPOTLIGHT_LEAD_MS = 250
// after a shiny or holo lands: its sheen sweeps, then twinkles follow
const SHINY_SHEEN_AFTER_LANDING_MS = 100
const SHINY_TWINKLES_AFTER_LANDING_MS = 350
const GOLDEN_BURST_AFTER_LANDING_MS = 150
const FLIP_STAGGER_MS = 90
const GATHER_DURATION_MS = 350
const SWIRL_DURATION_MS = 1100
const DEAL_DURATION_MS = 420
const DEAL_STAGGER_MS = 70
// the cards left behind turn over once the pick has had its moment
const REVEAL_OTHERS_AFTER_PICK_MS = 1400
const REVEAL_OTHERS_AFTER_SPECIAL_PICK_MS = 2800

type WonderPickPhase = "choose" | "shuffling" | "shuffled" | "picked"

interface Offset {
  x: number
  y: number
}

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

export type WonderPickVariant = "casual" | "shiny"

export interface WonderPickCandidate {
  pokemon: Pkm
  holo: boolean
}

export interface WonderPickResult {
  pokemon: Pkm
  holo: boolean
  emotions: Emotion[]
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function swirlKeyframes(offset: Offset, radius: number, cardIndex: number) {
  const steps = 14
  const startAngle = (cardIndex / CARD_COUNT) * 2 * Math.PI
  return Array.from({ length: steps + 1 }, (_, step) => {
    const progress = step / steps
    const angle = startAngle + progress * 2.25 * 2 * Math.PI
    const distance = radius * Math.sin(Math.PI * progress)
    const x = offset.x + Math.cos(angle) * distance
    const y = offset.y + Math.sin(angle) * distance * 0.45
    return {
      transform: `translate(${x}px, ${y}px) rotate(${Math.sin(angle) * 14}deg)`
    }
  })
}

async function playShuffleAnimation(container: HTMLElement) {
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>(".season-wonder-card")
  )
  const containerBox = container.getBoundingClientRect()
  const centerX = containerBox.left + containerBox.width / 2
  const centerY = containerBox.top + containerBox.height / 2
  const offsetsToCenter = cards.map((card) => {
    const cardBox = card.getBoundingClientRect()
    return {
      x: centerX - (cardBox.left + cardBox.width / 2),
      y: centerY - (cardBox.top + cardBox.height / 2)
    }
  })
  const atCenter = (i: number) =>
    `translate(${offsetsToCenter[i].x}px, ${offsetsToCenter[i].y}px)`

  await Promise.all(
    cards.map(
      (card, i) =>
        card.animate(
          [
            { transform: "none" },
            { transform: `${atCenter(i)} rotate(${(i - 2) * 4}deg)` }
          ],
          { duration: GATHER_DURATION_MS, easing: "ease-in", fill: "forwards" }
        ).finished
    )
  )

  const swirlRadius = Math.min(containerBox.width / 3, 200)
  await Promise.all(
    cards.map(
      (card, i) =>
        card.animate(swirlKeyframes(offsetsToCenter[i], swirlRadius, i), {
          duration: SWIRL_DURATION_MS,
          easing: "ease-in-out",
          fill: "forwards"
        }).finished
    )
  )

  await Promise.all(
    cards.map(
      (card, i) =>
        card.animate([{ transform: atCenter(i) }, { transform: "none" }], {
          duration: DEAL_DURATION_MS,
          delay: i * DEAL_STAGGER_MS,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          fill: "forwards"
        }).finished
    )
  )

  for (const card of cards) {
    for (const animation of card.getAnimations()) animation.cancel()
  }
}

export default function SeasonWonderPick(props: {
  variant: WonderPickVariant
  candidates: WonderPickCandidate[]
  rerollsLeft: number
  picks: number
  onDraw: () => Promise<unknown>
  onReroll: () => Promise<unknown>
  onPick: () => Promise<WonderPickResult>
}) {
  const { variant, onDraw } = props
  const isShiny = variant === "shiny"
  const cardBackSrc = isShiny ? SHINY_CARD_BACK_SRC : CARD_BACK_SRC
  const dispatch = useAppDispatch()
  const [phase, setPhase] = useState<WonderPickPhase>("choose")
  // frozen once a pick starts: the server clears its draw as soon as it picks
  const [shownCandidates, setShownCandidates] =
    useState<WonderPickCandidate[]>()
  const [pickedSlot, setPickedSlot] = useState<number>()
  const [pickResult, setPickResult] = useState<WonderPickResult>()
  const [isWaitingForServer, setIsWaitingForServer] = useState(false)
  const [areOthersRevealed, setAreOthersRevealed] = useState(false)
  const cardsRef = useRef<HTMLDivElement>(null)
  const candidates = shownCandidates ?? props.candidates
  const hasCandidates = candidates.length > 0
  const hasNoDraw = props.candidates.length === 0
  const hasPicks = props.picks > 0

  useEffect(() => {
    if (!hasPicks || phase !== "choose" || !hasNoDraw) return
    onDraw().catch(() => {})
  }, [hasPicks, phase, hasNoDraw, onDraw])

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

  function startNextWonderPick() {
    setShownCandidates(undefined)
    setPickedSlot(undefined)
    setPickResult(undefined)
    setAreOthersRevealed(false)
    setPhase("choose")
  }

  function reroll() {
    if (props.rerollsLeft === 0 || props.picks === 0 || phase !== "choose") {
      return
    }
    runServerAction(props.onReroll)
  }

  async function startWonderPick() {
    if (phase !== "choose" || props.picks === 0 || !hasCandidates) return
    setShownCandidates(props.candidates)
    setPhase("shuffling")
    await wait(FLIP_DURATION_MS + FLIP_STAGGER_MS * (CARD_COUNT - 1))
    setShownCandidates((previous) => shuffled(previous ?? []))
    if (cardsRef.current && !prefersReducedMotion()) {
      await playShuffleAnimation(cardsRef.current)
    }
    setPhase("shuffled")
  }

  // the server draws the result; it is shown under the clicked card
  async function pick(slot: number) {
    if (phase !== "shuffled") return
    const result = await runServerAction(props.onPick)
    if (!result) return
    setShownCandidates((previous = []) => {
      const next = [...previous]
      const resultIndex = next.findIndex(
        (candidate) =>
          candidate.pokemon === result.pokemon && candidate.holo === result.holo
      )
      if (resultIndex === -1) {
        next[slot] = { pokemon: result.pokemon, holo: result.holo }
      } else {
        const clicked = next[slot]
        next[slot] = next[resultIndex]
        next[resultIndex] = clicked
      }
      return next
    })
    setPickedSlot(slot)
    setPickResult(result)
    setPhase("picked")
  }

  const pickedPokemon = pickResult?.pokemon
  const pickedEmotions = pickResult?.emotions ?? []
  const isSpecialPick = isShiny || (pickResult?.holo ?? false)
  const pickRevealDelayMs = isSpecialPick ? SPOTLIGHT_LEAD_MS : 0

  useEffect(() => {
    if (phase !== "picked") return
    const timeout = setTimeout(
      () => setAreOthersRevealed(true),
      isSpecialPick
        ? REVEAL_OTHERS_AFTER_SPECIAL_PICK_MS
        : REVEAL_OTHERS_AFTER_PICK_MS
    )
    return () => clearTimeout(timeout)
  }, [phase, isSpecialPick])

  const cardSlots: (WonderPickCandidate | null)[] = hasCandidates
    ? candidates
    : Array.from({ length: CARD_COUNT }, () => null)

  return (
    <div className={cc("season-wonder", variant)}>
      <div
        ref={cardsRef}
        className={cc(
          "season-wonder-cards",
          variant,
          phase,
          { unavailable: !hasPicks }
        )}
      >
        {cardSlots.map((candidate, slot) => {
          if (!candidate) {
            return (
              <span
                key={slot}
                className="season-booster-card season-wonder-card face-down"
              >
                <span className="season-booster-card-inner">
                  <img
                    className="season-booster-card-back"
                    src={cardBackSrc}
                    alt=""
                  />
                </span>
              </span>
            )
          }
          const isPicked = slot === pickedSlot
          // the last pick empties the wallet: its card must stay face up
          const isUnplayable = !hasPicks
          const isRevealedOther =
            !isPicked && phase === "picked" && areOthersRevealed
          const isFaceUp =
            isPicked ||
            isRevealedOther ||
            (!isUnplayable && phase === "choose")
          return (
            <SeasonCard
              key={slot}
              pokemon={candidate.pokemon}
              shiny={isShiny}
              holo={candidate.holo}
              backSrc={cardBackSrc}
              className={cc("season-wonder-card", {
                "face-down": !isFaceUp,
                picked: isPicked,
                missed: isRevealedOther,
                spotlit: isPicked && isSpecialPick
              })}
              isFaceUp={isFaceUp}
              // a single unlocked emote shows on the card itself
              emotion={
                isPicked && !isShiny && pickedEmotions.length === 1
                  ? pickedEmotions[0]
                  : undefined
              }
              flipDelayMs={
                phase === "shuffling" || isRevealedOther
                  ? slot * FLIP_STAGGER_MS
                  : isPicked
                    ? pickRevealDelayMs
                    : 0
              }
              sheenDelayMs={
                pickRevealDelayMs +
                SHINY_LANDING_MS +
                SHINY_SHEEN_AFTER_LANDING_MS
              }
              synergyIconSize="24px"
              disabled={!isPicked && (isUnplayable || isWaitingForServer)}
              isTiltable={isFaceUp}
              onClick={() => pick(slot)}
            >
              {isPicked && isSpecialPick && (
                <>
                  <SeasonSparkleBurst
                    delayMs={pickRevealDelayMs + SHINY_LANDING_MS}
                    colors={isShiny ? undefined : SPECIAL_CARD_PALETTES.holo}
                  />
                  {isShiny && (
                    <SeasonSparkleBurst
                      delayMs={
                        pickRevealDelayMs +
                        SHINY_LANDING_MS +
                        GOLDEN_BURST_AFTER_LANDING_MS
                      }
                      isGolden
                    />
                  )}
                  <SeasonSparkles
                    delayMs={
                      pickRevealDelayMs +
                      SHINY_LANDING_MS +
                      SHINY_TWINKLES_AFTER_LANDING_MS
                    }
                    colors={isShiny ? undefined : SPECIAL_CARD_PALETTES.holo}
                  />
                </>
              )}
            </SeasonCard>
          )
        })}
        {phase === "picked" && isSpecialPick && (
          <span className="season-card-spotlight" aria-hidden />
        )}
      </div>

      <div className="season-wonder-footer">
        {phase === "choose" && (
          <div className="season-wonder-actions">
            <button
              className="season-wonder-reroll"
              disabled={
                props.rerollsLeft === 0 ||
                props.picks === 0 ||
                isWaitingForServer
              }
              title="Reroll"
              onClick={reroll}
            >
              <img src="assets/ui/refresh.svg" width={24} height={24} alt="" />
              <span className="season-wonder-reroll-count">
                {props.rerollsLeft}
              </span>
            </button>
            <button
              className={
                isShiny ? "season-wonder-pick-button" : "season-shop-open"
              }
              disabled={props.picks === 0 || !hasCandidates}
              onClick={startWonderPick}
            >
              Wonder Pick
              <span className="season-shop-owned-count">{props.picks}</span>
            </button>
          </div>
        )}

        {phase === "picked" && pickedPokemon && isShiny && (
          <ul className="season-wonder-emotes">
            {pickedEmotions.map((emotion, i) => (
              <li key={emotion} style={{ animationDelay: `${i * 60}ms` }}>
                <img
                  src={getPortraitSrc(
                    PkmIndex[pickedPokemon],
                    isShiny,
                    emotion
                  )}
                  width={36}
                  height={36}
                  alt={emotion}
                  title={emotion}
                />
              </li>
            ))}
          </ul>
        )}

        {phase === "picked" && (
          <button
            className="season-shop-back season-wonder-next"
            aria-label="Next Wonder Pick"
            onClick={startNextWonderPick}
          >
            <img
              src="assets/ui/arrow-right.svg"
              width={20}
              height={20}
              alt=""
            />
            <span className="season-shop-owned-count">{props.picks}</span>
          </button>
        )}
      </div>
    </div>
  )
}
