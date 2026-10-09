import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Blessings } from "../../../../../config/game/blessings"
import { type Blessing, BlessingTier } from "../../../../../types/enum/Blessing"
import { pickRandomIn, shuffleArray } from "../../../../../utils/random"
import { playSound, SOUNDS } from "../../utils/audio"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { LocalStoreKeys, localStore } from "../../utils/store"
import { Modal } from "../modal/modal"
import { BlessingDescription } from "../synergy/blessing-description"
import "./wish-quiz.css"

const ANSWERS_SHOWN = 4
const RECENT_WISHES_SKIPPED = 30
const TIERS = [BlessingTier.SILVER, BlessingTier.GOLD, BlessingTier.PRISMATIC]

// the Badge, Crest, Crown and Gym Trainer series share one icon and one
// templated text each, so their members could never be told apart
const QUIZ_WISHES = (Object.keys(Blessings) as Blessing[]).filter(
  (blessing) => Blessings[blessing].family === undefined
)

type Round = {
  wish: Blessing
  answers: Blessing[]
  picked: Blessing | null
}

export default function WishQuiz(props: {
  show: boolean
  handleClose: Dispatch<SetStateAction<void>>
}) {
  const { t } = useTranslation()
  const [tierFilter, setTierFilter] = useState<BlessingTier | null>(null)
  const [recentWishes, setRecentWishes] = useState<Blessing[]>([])
  const [round, setRound] = useState<Round | null>(null)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState<number>(
    () => localStore.get(LocalStoreKeys.WISH_QUIZ_BEST_STREAK) ?? 0
  )

  const startRound = (tier: BlessingTier | null, recent: Blessing[]) => {
    const inTier = QUIZ_WISHES.filter(
      (blessing) => tier === null || Blessings[blessing].tier === tier
    )
    const unseen = inTier.filter((blessing) => !recent.includes(blessing))
    const wish = pickRandomIn(unseen.length > 0 ? unseen : inTier)
    // wrong answers share the tier, so the card frame gives nothing away, and
    // never the icon, or two options would look the same
    const decoys: Blessing[] = []
    for (const candidate of shuffleArray(
      QUIZ_WISHES.filter(
        (blessing) =>
          blessing !== wish &&
          Blessings[blessing].tier === Blessings[wish].tier
      )
    )) {
      if (decoys.length === ANSWERS_SHOWN - 1) break
      const icon = Blessings[candidate].icon
      const isDuplicate = [wish, ...decoys].some(
        (shown) => Blessings[shown].icon === icon
      )
      if (!isDuplicate) decoys.push(candidate)
    }
    setRound({ wish, answers: shuffleArray([wish, ...decoys]), picked: null })
    setRecentWishes([wish, ...recent].slice(0, RECENT_WISHES_SKIPPED))
  }

  const answer = (blessing: Blessing) => {
    if (!round || round.picked) return
    setRound({ ...round, picked: blessing })
    if (blessing === round.wish) {
      playSound(SOUNDS.BLESSING)
      const nextStreak = streak + 1
      setStreak(nextStreak)
      if (nextStreak > bestStreak) {
        setBestStreak(nextStreak)
        localStore.set(LocalStoreKeys.WISH_QUIZ_BEST_STREAK, nextStreak)
      }
    } else {
      playSound(SOUNDS.BLESSING_FLIP)
      setStreak(0)
    }
  }

  const nextRound = () => startRound(tierFilter, recentWishes)

  useEffect(() => {
    if (props.show) startRound(tierFilter, recentWishes)
  }, [props.show, tierFilter])

  // Modal renders nothing while hidden, but React builds its children first
  if (!props.show || !round) return null

  const tier = Blessings[round.wish].tier

  return (
    <Modal
      show={props.show}
      onClose={props.handleClose}
      className="wish-quiz-modal"
      header={t("gadget.wish_quiz")}
    >
      <div className="wish-quiz-toolbar">
        <div className="wish-quiz-tiers">
          <button
            className={cc("bubbly", tierFilter === null ? "blue" : "")}
            onClick={() => setTierFilter(null)}
          >
            {t("wish_quiz.all_tiers")}
          </button>
          {TIERS.map((filter) => (
            <button
              key={filter}
              className={cc(
                "bubbly",
                tierFilter === filter
                  ? `wiki-blessings-tier-shortcut ${filter.toLowerCase()}`
                  : ""
              )}
              onClick={() => setTierFilter(filter)}
            >
              {t(`blessing_tier.${filter}`)}
            </button>
          ))}
        </div>
        <p className="wish-quiz-score">
          <span>{t("wish_quiz.streak", { count: streak })}</span>
          <span>{t("wish_quiz.best", { count: bestStreak })}</span>
        </p>
      </div>

      <div
        // a new card per Wish, so the next question shows at once instead
        // of fading back from the answer
        key={round.wish}
        className={cc(
          "wish-quiz-card",
          `blessing-tier-${tier.toLowerCase()}`,
          { revealed: round.picked !== null }
        )}
      >
        <div className="wish-quiz-face">
          <div className="wish-quiz-face-panel">
            <div className="wish-quiz-side">
              <p className="wish-quiz-question">{t("wish_quiz.question")}</p>
              <BlessingDescription blessing={round.wish} />
            </div>
            <div className="wish-quiz-side wish-quiz-side-answer">
              <img
                className="wish-quiz-icon"
                src={`/assets/blessings/${Blessings[round.wish].icon}.svg`}
                alt=""
              />
              <h2>{addIconsToDescription(t(`blessing.${round.wish}.name`))}</h2>
            </div>
          </div>
        </div>
      </div>

      <ol className="wish-quiz-answers">
        {round.answers.map((blessing) => (
          <li key={blessing}>
            <button
              className={cc("my-box wish-quiz-answer", {
                revealed: round.picked !== null,
                correct: round.picked !== null && blessing === round.wish,
                wrong: round.picked === blessing && blessing !== round.wish
              })}
              disabled={round.picked !== null}
              onClick={() => answer(blessing)}
            >
              <img
                className="wish-quiz-icon"
                src={`/assets/blessings/${Blessings[blessing].icon}.svg`}
                alt=""
              />
              <span className="wish-quiz-answer-name">
                {addIconsToDescription(t(`blessing.${blessing}.name`))}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <button
        className={cc("bubbly blue wish-quiz-next", {
          revealed: round.picked !== null
        })}
        disabled={round.picked === null}
        onClick={nextRound}
      >
        {t("wish_quiz.next")}
      </button>

    </Modal>
  )
}
