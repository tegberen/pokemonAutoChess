import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { SHINY_WONDER_PICK_LEVEL_STEP } from "../../../../../config/game/experience"
import {
  getCasualPickCharges,
  getNextCasualPickChargeAt,
  SEASON_CASUAL_PICK_INTERVAL_MS,
  SEASON_CASUAL_PICK_MAX_CHARGES,
  type SeasonLearnGoal,
  type SeasonRewardKind
} from "../../../../../config/game/season"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import type { IUserMetadataUnpacked } from "../../../../../types/interfaces/UserMetadata"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import {
  claimSeasonSteps,
  claimSeasonWonderPickGift,
  drawCasualPick,
  drawWonderPick,
  pickCasualPick,
  pickWonderPick,
  recordSeasonLogin,
  rerollCasualPick,
  rerollWonderPick
} from "../../../network"
import { setErrorAlertMessage } from "../../../stores/NetworkStore"
import { cc } from "../../utils/jsx"
import SynergyIcon from "../icons/synergy-icon"
import SeasonCroagunk from "./season-croagunk"
import SeasonPelipper from "./season-pelipper"
import SeasonShop from "./season-shop"
import {
  getSeasonView,
  type SeasonChallenge,
  type SeasonRewardView,
  type SeasonState,
  type SeasonStep
} from "./season-view"
import SeasonWonderPick, {
  type WonderPickResult,
  type WonderPickVariant
} from "./season-wonder-pick"
import "./season.css"

const REWARD_ICONS: Record<SeasonRewardKind, string> = {
  booster: "assets/ui/booster.png",
  poke: "assets/icons/season_poke.svg",
  ticket: "assets/icons/season_ticket.svg"
}
// a rounded hexagon, drawn with a real stroke so its border is even all
// around
const HERO_HEXAGON_PATH =
  "M34 0L66 0Q75 0 79.5 7.79L95.5 35.51Q100 43.3 95.5 51.09L79.5 78.81" +
  "Q75 86.6 66 86.6L34 86.6Q25 86.6 20.5 78.81L4.5 51.09Q0 43.3 4.5 35.51" +
  "L20.5 7.79Q25 0 34 0Z"
const POKE_ICON = REWARD_ICONS.poke
const TICKET_ICON = REWARD_ICONS.ticket
const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 3_600_000
const MS_PER_DAY = 86_400_000

type StepStatus = "claimed" | "claimable" | "locked"

function formatTimeLeft(isoDate: string) {
  const msLeft = Math.max(0, new Date(isoDate).getTime() - Date.now())
  if (msLeft >= MS_PER_DAY) return `${Math.floor(msLeft / MS_PER_DAY)}d`
  return `${Math.max(1, Math.ceil(msLeft / MS_PER_HOUR))}h`
}

function formatCountdown(msLeft: number) {
  const days = Math.floor(msLeft / MS_PER_DAY)
  const hours = Math.floor((msLeft % MS_PER_DAY) / MS_PER_HOUR)
  const minutes = Math.floor((msLeft % MS_PER_HOUR) / MS_PER_MINUTE)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function pluralize(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function getRewardBadge(reward: SeasonRewardView) {
  if (reward.kind === "poke") return reward.amount
  if (reward.amount && reward.amount > 1) return `×${reward.amount}`
  return undefined
}

async function pickCasualCard(): Promise<WonderPickResult> {
  const { card } = await pickCasualPick()
  return {
    pokemon: card.name,
    holo: card.holo ?? false,
    emotions:
      card.unlockedEmotions.length > 0 ? card.unlockedEmotions : [card.emotion]
  }
}

async function pickShinyCard(): Promise<WonderPickResult> {
  const { picked } = await pickWonderPick()
  return {
    pokemon: picked,
    holo: false,
    emotions: getAvailableEmotions(PkmIndex[picked], true)
  }
}

export default function Season() {
  const profile = useAppSelector((state) => state.network.profile)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    recordSeasonLogin().catch(() => {})
    const interval = setInterval(() => setNow(Date.now()), MS_PER_MINUTE)
    return () => clearInterval(interval)
  }, [])

  const season = profile ? getSeasonView(profile, now) : null
  if (!profile || !season) {
    return (
      <div className="season-page">
        <section className="season-frame season-empty">
          The next season starts soon.
        </section>
      </div>
    )
  }
  return <SeasonGuild season={season} profile={profile} now={now} />
}

function SeasonGuild(props: {
  season: SeasonState
  profile: IUserMetadataUnpacked
  now: number
}) {
  const { season, profile, now } = props
  const dispatch = useAppDispatch()
  const showError = (error: Error) =>
    dispatch(setErrorAlertMessage(error.message))
  const [mascotEmotion] = useState(() => {
    const emotions = getAvailableEmotions(PkmIndex[season.mascot], false)
    return emotions[Math.floor(Math.random() * emotions.length)]
  })
  const lastStepIndex = season.steps.length
  const nextShinyPickInfo =
    `Next Shiny Wonder Pick at level ${season.nextShinyPickLevel}`
  const currentStepIndex = Math.min(season.stepsReached, lastStepIndex)
  // tomorrow's step anchors the hero: what the next login brings
  const nextStepIndex = season.stepsReached + 1
  const bonusStepIndex = lastStepIndex + 1
  const [selectedStepIndex, setSelectedStepIndex] = useState(() =>
    nextStepIndex > lastStepIndex ? bonusStepIndex : nextStepIndex
  )
  const [trackTab, setTrackTab] = useState<
    "pass" | "wonder-pick" | "croagunk" | "shop" | "pelipper"
  >("pass")
  // a secret tab: only there while an invitation waits, or while it is open
  const isPelipperShown =
    (profile.partyInvitations ?? 0) > 0 || trackTab === "pelipper"
  const [wonderPickVariant, setWonderPickVariant] =
    useState<WonderPickVariant>("casual")
  const trackRef = useRef<HTMLOListElement>(null)
  const [trackOverflow, setTrackOverflow] = useState({
    left: false,
    right: false
  })

  function updateTrackOverflow() {
    const track = trackRef.current
    if (!track) return
    setTrackOverflow({
      left: track.scrollLeft > 2,
      right: track.scrollLeft + track.clientWidth < track.scrollWidth - 2
    })
  }

  function scrollTrack(direction: -1 | 1) {
    const track = trackRef.current
    if (!track) return
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    })
  }

  useEffect(() => {
    trackRef.current
      ?.querySelector(".season-step.current")
      ?.scrollIntoView({ block: "nearest", inline: "center" })
    updateTrackOverflow()
    window.addEventListener("resize", updateTrackOverflow)
    return () => window.removeEventListener("resize", updateTrackOverflow)
  }, [])

  const msUntilSeasonEnds = Math.max(0, new Date(season.endsAt).getTime() - now)
  const msUntilNextCasualPick = getNextCasualPickChargeAt(now) - now

  function getStepStatus(step: SeasonStep): StepStatus {
    if (season.claimedSteps.includes(step.index)) return "claimed"
    if (step.index <= season.stepsReached) return "claimable"
    return "locked"
  }

  function claimSteps(stepsToClaim: SeasonStep[]) {
    const claimable = stepsToClaim.filter(
      (step) => getStepStatus(step) === "claimable"
    )
    if (claimable.length === 0) return
    claimSeasonSteps(claimable.map((step) => step.index)).catch(showError)
  }

  const isLastStepReached = season.stepsReached >= lastStepIndex
  const wonderPickGiftStatus: StepStatus = season.isWonderPickGiftClaimed
    ? "claimed"
    : isLastStepReached
      ? "claimable"
      : "locked"

  function claimWonderPickGift() {
    if (wonderPickGiftStatus !== "claimable") {
      setTrackTab("wonder-pick")
      return
    }
    claimSeasonWonderPickGift().catch(showError)
  }

  const casualPicks = getCasualPickCharges(profile.casualPick, now)
  const casualPickPipsTitle =
    `${casualPicks}/${SEASON_CASUAL_PICK_MAX_CHARGES} Wonder Picks ready`
  const casualPickCountLabel =
    casualPicks > SEASON_CASUAL_PICK_MAX_CHARGES
      ? `${casualPicks} ready`
      : `${casualPicks}/${SEASON_CASUAL_PICK_MAX_CHARGES} ready`
  const casualPickInfo =
    `Picks refill every ${SEASON_CASUAL_PICK_INTERVAL_MS / MS_PER_HOUR} ` +
    "hours on the UTC clock (00:00, 04:00, 08:00...). You can hold up to " +
    `${SEASON_CASUAL_PICK_MAX_CHARGES}, and they stay until used.`
  const shinyPickInfo =
    "Shiny Pokémon are incredibly rare. The only way to obtain them is " +
    "through Shiny Wonder Pick (or a super lucky Booster). There is one " +
    "guaranteed Shiny Wonder Pick per season and per " +
    `${SHINY_WONDER_PICK_LEVEL_STEP} user levels. The cards change every ` +
    "day at 00:00 UTC."

  const bonusStep: SeasonStep = {
    index: bonusStepIndex,
    reward: {
      kind: "poke",
      amount: season.pokePerLoginAfterLastStep,
      label: `${season.pokePerLoginAfterLastStep} Tickets per login`
    },
    milestone: false
  }
  const isBonusSelected = selectedStepIndex === bonusStepIndex
  const selectedStep = isBonusSelected
    ? bonusStep
    : (season.steps.find((step) => step.index === selectedStepIndex) ??
      season.steps[0])
  const selectedStepStatus = isBonusSelected
    ? "bonus"
    : getStepStatus(selectedStep)
  const loginsUntilSelectedStep = selectedStep.index - season.stepsReached

  return (
    <div className="season-page">
      <section className="season-stage season-frame">
        <div className="season-tabs">
          <button
            className={cc("season-tab", { active: trackTab === "pass" })}
            onClick={() => setTrackTab("pass")}
          >
            Pass
          </button>
          <button
            className={cc("season-tab", { active: trackTab === "wonder-pick" })}
            onClick={() => setTrackTab("wonder-pick")}
          >
            <img
              src={getPortraitSrc(PkmIndex[Pkm.CHIMECHO])}
              className="season-tab-portrait"
              width={26}
              height={26}
              alt=""
            />
            Chimecho Assembly
          </button>
          <button
            className={cc("season-tab", { active: trackTab === "croagunk" })}
            onClick={() => setTrackTab("croagunk")}
          >
            <img
              src={getPortraitSrc(PkmIndex[Pkm.CROAGUNK])}
              className="season-tab-portrait"
              width={26}
              height={26}
              alt=""
            />
            Croagunk Swap
          </button>
          <button
            className={cc("season-tab", { active: trackTab === "shop" })}
            onClick={() => setTrackTab("shop")}
          >
            <img
              src={getPortraitSrc(PkmIndex[Pkm.KECLEON])}
              className="season-tab-portrait"
              width={26}
              height={26}
              alt=""
            />
            Kecleon Shop
          </button>
          {isPelipperShown && (
            <button
              className={cc("season-tab", { active: trackTab === "pelipper" })}
              onClick={() => setTrackTab("pelipper")}
            >
              <img
                src={getPortraitSrc(PkmIndex[Pkm.PELIPPER])}
                className="season-tab-portrait"
                width={26}
                height={26}
                alt=""
              />
              Pelipper Post
            </button>
          )}
          <div className="season-tabs-balance">
            <span title="Tickets">
              <img src={POKE_ICON} width={24} height={24} alt="" />
              {season.pokeBalance}
            </span>
            <span title="Shiny Tickets">
              <img src={TICKET_ICON} width={24} height={24} alt="" />
              {season.ticketBalance}
            </span>
          </div>
        </div>
        <div className="season-stage-panels">
          <div
            className="season-stage-panel"
            hidden={trackTab !== "pass"}
            inert={trackTab !== "pass"}
          >
            <div
              className="season-hero"
              style={{ backgroundImage: `url("${season.bannerSrc}")` }}
            >
              <div className="season-hero-info">
                <div className="season-title">
                  <img
                    src={getPortraitSrc(
                      PkmIndex[season.mascot],
                      false,
                      mascotEmotion
                    )}
                    width={84}
                    height={84}
                    alt=""
                  />
                  <div>
                    <h2>{season.name}</h2>
                    <span className="season-days-left">
                      <img
                        src="assets/ui/clock.png"
                        width={13}
                        height={18}
                        alt=""
                      />
                      {formatCountdown(msUntilSeasonEnds)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={cc("season-hero-art", selectedStepStatus)}>
                <svg
                  className="season-hero-art-shape"
                  viewBox="-2 -2 104 90.6"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d={HERO_HEXAGON_PATH}
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <img
                  src={REWARD_ICONS[selectedStep.reward.kind]}
                  width={112}
                  height={112}
                  alt=""
                />
              </div>

              <div className="season-hero-reward">
                <span className="season-muted">
                  {selectedStep.index === nextStepIndex &&
                  selectedStepStatus === "locked"
                    ? "Tomorrow, "
                    : ""}
                  Step {selectedStep.index}
                  {isBonusSelected && "+"}
                </span>
                <h3>{selectedStep.reward.label}</h3>
                <div className="season-hero-action">
                  {selectedStepStatus === "locked" && (
                    <span className="season-hero-status">
                      Unlocks in {pluralize(loginsUntilSelectedStep, "login")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div
              className={cc("season-track-box", {
                "more-left": trackOverflow.left,
                "more-right": trackOverflow.right
              })}
            >
              {trackOverflow.left && (
                <button
                  className="bubbly blue season-track-arrow left"
                  onClick={() => scrollTrack(-1)}
                  aria-label="Previous steps"
                >
                  <span className="season-arrow-icon left" />
                </button>
              )}
              {trackOverflow.right && (
                <button
                  className="bubbly blue season-track-arrow right"
                  onClick={() => scrollTrack(1)}
                  aria-label="Next steps"
                >
                  <span className="season-arrow-icon right" />
                </button>
              )}
              <ol
                className="season-track"
                ref={trackRef}
                onScroll={updateTrackOverflow}
                onWheel={(event) => {
                  if (event.deltaY === 0) return
                  event.currentTarget.scrollLeft += event.deltaY
                }}
              >
                {season.steps.map((step) => (
                  <SeasonStepTile
                    key={step.index}
                    step={step}
                    status={getStepStatus(step)}
                    isCurrent={step.index === currentStepIndex}
                    isReached={step.index <= season.stepsReached}
                    isNext={step.index === nextStepIndex}
                    isSelected={step.index === selectedStepIndex}
                    onClick={() => {
                      setSelectedStepIndex(step.index)
                      claimSteps([step])
                    }}
                  />
                ))}
                <li
                  className={cc(
                    "season-step",
                    wonderPickGiftStatus,
                    { reached: isLastStepReached }
                  )}
                  title="Shiny Wonder Pick"
                >
                  <button
                    className="season-step-card"
                    onClick={claimWonderPickGift}
                  >
                    <img
                      src="assets/ui/pokecard-prismatic.png"
                      width={40}
                      height={40}
                      alt=""
                    />
                  </button>
                  {wonderPickGiftStatus === "claimable" ? (
                    <span
                      className="season-step-node season-step-claim"
                      aria-hidden
                    >
                      <img src="assets/ui/exclamationmark.svg" alt="" />
                    </span>
                  ) : (
                    // reached together with the last step, so it shares no
                    // number with it
                    <span className="season-step-node">★</span>
                  )}
                </li>
                <li
                  className={cc("season-step bonus", {
                    selected: isBonusSelected
                  })}
                >
                  <button
                    className="season-step-card"
                    title={bonusStep.reward.label}
                    onClick={() => setSelectedStepIndex(bonusStepIndex)}
                  >
                    <img src={POKE_ICON} width={40} height={40} alt="" />
                    <span className="season-step-badge">
                      {season.pokePerLoginAfterLastStep}/day
                    </span>
                  </button>
                  <span className="season-step-node">{lastStepIndex + 1}+</span>
                </li>
              </ol>
            </div>
          </div>
          <div
            className="season-stage-panel season-stage-banner"
            hidden={trackTab !== "wonder-pick"}
            inert={trackTab !== "wonder-pick"}
            style={{ backgroundImage: `url("${season.bannerSrc}")` }}
          >
            {wonderPickVariant === "casual" &&
              casualPicks < SEASON_CASUAL_PICK_MAX_CHARGES && (
                <span className="season-days-left season-wonder-clock">
                  <img
                    src="assets/ui/clock.png"
                    width={13}
                    height={18}
                    alt=""
                  />
                  Next free pick in {formatCountdown(msUntilNextCasualPick)}
                </span>
              )}
            <div className="season-wonder-modes">
              <button
                className={cc(
                  "bubbly season-wonder-mode",
                  wonderPickVariant === "casual" ? "blue" : ""
                )}
                onClick={() => setWonderPickVariant("casual")}
              >
                Wonder Pick
              </button>
              <button
                className={cc(
                  "bubbly season-wonder-mode",
                  wonderPickVariant === "shiny" ? "blue" : ""
                )}
                onClick={() => setWonderPickVariant("shiny")}
              >
                Shiny Wonder Pick
              </button>
            </div>
            {wonderPickVariant === "casual" && (
              <div className="season-wonder-status">
                <span
                  className="season-wonder-pips"
                  title={casualPickPipsTitle}
                >
                  {Array.from(
                    { length: SEASON_CASUAL_PICK_MAX_CHARGES },
                    (_, i) => (
                      <img
                        key={i}
                        src="assets/ui/pokecard.png"
                        className={cc({ filled: i < casualPicks })}
                        alt=""
                      />
                    )
                  )}
                </span>
                <span className="season-wonder-refill">
                  {casualPickCountLabel}
                </span>
                <span
                  className="season-wonder-info"
                  tabIndex={0}
                  title={casualPickInfo}
                  aria-label={casualPickInfo}
                >
                  <img src="assets/ui/help.svg" width={16} height={16} alt="" />
                </span>
              </div>
            )}
            {wonderPickVariant === "shiny" && (
              <div className="season-wonder-status">
                <img
                  className="season-wonder-shiny-icon"
                  src="assets/ui/pokecard-prismatic.png"
                  alt=""
                />
                <span
                  className="season-wonder-info"
                  tabIndex={0}
                  title={shinyPickInfo}
                  aria-label={shinyPickInfo}
                >
                  <img src="assets/ui/help.svg" width={16} height={16} alt="" />
                </span>
              </div>
            )}
            <div className="season-stage-panels">
              <div
                className="season-stage-panel"
                hidden={wonderPickVariant !== "casual"}
                inert={wonderPickVariant !== "casual"}
              >
                <SeasonWonderPick
                  variant="casual"
                  candidates={profile.casualPick?.candidates ?? []}
                  rerollsLeft={profile.casualPick?.rerollsLeft ?? 0}
                  picks={casualPicks}
                  onDraw={drawCasualPick}
                  onReroll={rerollCasualPick}
                  onPick={pickCasualCard}
                />
              </div>
              <div
                className="season-stage-panel"
                hidden={wonderPickVariant !== "shiny"}
                inert={wonderPickVariant !== "shiny"}
              >
                <SeasonWonderPick
                  variant="shiny"
                  candidates={(profile.wonderPickDraw?.candidates ?? []).map(
                    (pokemon) => ({ pokemon, holo: false })
                  )}
                  rerollsLeft={profile.wonderPickDraw?.rerollsLeft ?? 0}
                  picks={season.extraWonderPicks}
                  onDraw={drawWonderPick}
                  onReroll={rerollWonderPick}
                  onPick={pickShinyCard}
                />
              </div>
            </div>
          </div>
          <div
            className="season-stage-panel season-stage-banner"
            hidden={trackTab !== "croagunk"}
            inert={trackTab !== "croagunk"}
            style={{ backgroundImage: `url("${season.bannerSrc}")` }}
          >
            <SeasonCroagunk season={season} now={now} />
          </div>
          <div
            className="season-stage-panel season-stage-banner"
            hidden={trackTab !== "shop"}
            inert={trackTab !== "shop"}
            style={{ backgroundImage: `url("${season.bannerSrc}")` }}
          >
            <SeasonShop season={season} />
          </div>
          {isPelipperShown && (
            <div
              className="season-stage-panel season-stage-banner"
              hidden={trackTab !== "pelipper"}
              inert={trackTab !== "pelipper"}
              style={{
                backgroundImage: 'url("assets/ui/pelipper-post.webp")'
              }}
            >
              <SeasonPelipper profile={profile} />
            </div>
          )}
        </div>
      </section>

      <div
        className={cc("season-panels", {
          "season-panels-hidden": trackTab !== "pass"
        })}
      >
        <section className="season-challenges season-frame">
          <h3 className="season-heading">
            Challenges
            <span className="season-muted">
              <img src="assets/ui/clock.png" width={13} height={18} alt="" />
              Daily {formatTimeLeft(season.dailyResetsAt)}, weekly{" "}
              {formatTimeLeft(season.weeklyResetsAt)}
            </span>
          </h3>
          <ul>
            {season.challenges.map((challenge) => (
              <ChallengeRow key={challenge.id} challenge={challenge} />
            ))}
          </ul>
        </section>

        <section className="season-poke season-frame">
          <h3 className="season-heading">Inventory</h3>
          <ul className="season-inventory">
            <li
              title="Boosters"
              className={cc({ empty: season.boosterBalance === 0 })}
            >
              <img src={REWARD_ICONS.booster} width={40} height={40} alt="" />
              <span className="season-shop-owned-count">
                {season.boosterBalance}
              </span>
            </li>
            <li
              title={`${pluralize(casualPicks, "Wonder Pick")} ready`}
              className={cc({ empty: casualPicks === 0 })}
            >
              <img src="assets/ui/pokecard.png" width={40} height={40} alt="" />
              <span className="season-shop-owned-count">{casualPicks}</span>
            </li>
            <li
              title="Shiny Wonder Pick"
              className={cc({ empty: season.extraWonderPicks === 0 })}
            >
              <img
                src="assets/ui/pokecard-prismatic.png"
                width={40}
                height={40}
                alt=""
              />
              <span className="season-shop-owned-count">
                {season.extraWonderPicks}
              </span>
            </li>
          </ul>
          <div className="season-level-rewards">
            <div className="season-level-rewards-top">
              <span>Level {season.level}</span>
              <span
                className="season-wonder-info"
                tabIndex={0}
                title={nextShinyPickInfo}
                aria-label={nextShinyPickInfo}
              >
                <img src="assets/ui/help.svg" width={16} height={16} alt="" />
              </span>
            </div>
            <div className="season-level-rewards-bar">
              <span
                style={{
                  width: `${Math.round(
                    season.shinyPickMilestoneProgress * 100
                  )}%`
                }}
              />
            </div>
          </div>
          <button
            className="season-shop-row"
            onClick={() => setTrackTab("shop")}
          >
            <img
              src={getPortraitSrc(PkmIndex[Pkm.KECLEON])}
              className="season-tab-portrait"
              width={32}
              height={32}
              alt=""
            />
            <span>Kecleon Shop</span>
            <img
              src="assets/ui/arrow-right.svg"
              width={16}
              height={16}
              alt=""
            />
          </button>
        </section>
      </div>
    </div>
  )
}

function SeasonStepTile(props: {
  step: SeasonStep
  status: StepStatus
  isCurrent: boolean
  isNext: boolean
  isReached: boolean
  isSelected: boolean
  onClick: () => void
}) {
  const { step, status } = props
  const badge = getRewardBadge(step.reward)
  return (
    <li
      className={cc("season-step", status, {
        current: props.isCurrent,
        next: props.isNext,
        reached: props.isReached,
        selected: props.isSelected
      })}
    >
      <button
        className="season-step-card"
        title={
          status === "claimable"
            ? `Claim ${step.reward.label}`
            : step.reward.label
        }
        onClick={props.onClick}
      >
        <img
          src={REWARD_ICONS[step.reward.kind]}
          width={40}
          height={40}
          alt={step.reward.label}
        />
        {badge !== undefined && (
          <span className="season-step-badge">{badge}</span>
        )}
      </button>
      {status === "claimable" ? (
        <span className="season-step-node season-step-claim" aria-hidden>
          <img src="assets/ui/exclamationmark.svg" alt="" />
        </span>
      ) : (
        <span className="season-step-node">{step.index}</span>
      )}
    </li>
  )
}

function LearnGoalLabel({ goal }: { goal: SeasonLearnGoal }) {
  const { t } = useTranslation()
  if (goal.kind === "synergy") {
    return (
      <>
        Finish a game with <SynergyIcon type={goal.synergy} size="20px" />{" "}
        synergy at its highest tier
      </>
    )
  }
  return (
    <>
      Finish a game holding{" "}
      <img
        className="season-challenge-item"
        src={`assets/item/${goal.item}.png`}
        width={20}
        height={20}
        alt={t(`item.${goal.item}`)}
      />
    </>
  )
}

function ChallengeRow({ challenge }: { challenge: SeasonChallenge }) {
  const isDone = challenge.progress >= challenge.goal
  return (
    <li className={cc("season-challenge", { done: isDone })}>
      <div className="season-challenge-top">
        <span className={cc("season-challenge-period", challenge.period)}>
          {challenge.period === "daily" ? "Daily" : "Weekly"}
        </span>
        <span className="season-challenge-label" title={challenge.label}>
          {challenge.learnGoal ? (
            <LearnGoalLabel goal={challenge.learnGoal} />
          ) : (
            challenge.label
          )}
        </span>
        <span className="season-chip">
          +{challenge.reward.amount}
          <img
            src={REWARD_ICONS[challenge.reward.kind]}
            width={16}
            height={16}
            alt={challenge.reward.kind}
          />
        </span>
      </div>
      <div className="season-challenge-progress">
        <div className="season-challenge-bar">
          {Array.from({ length: challenge.goal }, (_, i) => (
            <span key={i} className={cc({ filled: i < challenge.progress })} />
          ))}
        </div>
        <span>
          {challenge.progress}/{challenge.goal}
        </span>
      </div>
    </li>
  )
}
