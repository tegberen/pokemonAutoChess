import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Blessings } from "../../../../../config/game/blessings"
import { Blessing } from "../../../../../types/enum/Blessing"
import type { Item } from "../../../../../types/enum/Item"
import {
  type PrismaticQuest,
  PrismaticQuestDefinitions,
  PrismaticQuestsInOrder,
  getPrismaticQuestClaimedKey,
  getPrismaticQuestProgressKey
} from "../../../../../types/enum/PrismaticQuest"
import { SpecialGameRule } from "../../../../../types/enum/SpecialGameRule"
import { selectConnectedPlayer, useAppSelector } from "../../../hooks"
import { claimPrismaticQuest } from "../../../network"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { Modal } from "../modal/modal"
import "./game-prismatic-quests.css"

const QUEST_TOAST_DURATION = 3500
const NO_BLESSINGS: Blessing[] = []

function usePrismaticQuestState() {
  const connectedPlayer = useAppSelector(selectConnectedPlayer)
  const playerId = connectedPlayer?.id ?? ""
  const blessings = useAppSelector(
    (state) => state.game.blessingsByPlayerId[playerId] ?? NO_BLESSINGS
  )
  const questProgress = useAppSelector(
    (state) => state.game.blessingQuestProgressByPlayerId[playerId]
  )
  const progressOf = (quest: PrismaticQuest) =>
    questProgress?.[getPrismaticQuestProgressKey(quest)] ?? 0
  const claimsEveryQuest = useAppSelector(
    (state) => state.game.specialGameRule === SpecialGameRule.QUEST_BOARD
  )
  const isClaimed = (quest: PrismaticQuest) =>
    (questProgress?.[getPrismaticQuestClaimedKey(quest)] ?? 0) > 0
  return {
    unlocked: claimsEveryQuest || blessings.includes(Blessing.PRISMATIC_QUEST),
    claimsEveryQuest,
    progressOf,
    isComplete: (quest: PrismaticQuest) =>
      progressOf(quest) >= PrismaticQuestDefinitions[quest].target,
    isClaimed,
    canClaimMore: claimsEveryQuest || !PrismaticQuestsInOrder.some(isClaimed)
  }
}

export function GamePrismaticQuestsButton() {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const { unlocked, isComplete, isClaimed, canClaimMore } =
    usePrismaticQuestState()
  if (!unlocked) return null

  const claimableCount = canClaimMore
    ? PrismaticQuestsInOrder.filter(
        (quest) => isComplete(quest) && !isClaimed(quest)
      ).length
    : 0

  return (
    <>
      <button
        className="prismatic-quests-button"
        onClick={() => setShow(true)}
        title={t("prismatic_quests.title")}
      >
        <span className="prismatic-quests-button-label">
          {t("prismatic_quests.button")}
        </span>
        {claimableCount > 0 && (
          <span className="prismatic-quests-button-badge">
            {claimableCount}
          </span>
        )}
      </button>
      <PrismaticQuestsModal show={show} onClose={() => setShow(false)} />
    </>
  )
}

function PrismaticQuestsModal(props: { show: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { progressOf, isComplete, isClaimed, canClaimMore, claimsEveryQuest } =
    usePrismaticQuestState()
  const isClaimable = (quest: PrismaticQuest) =>
    canClaimMore && isComplete(quest) && !isClaimed(quest)
  const completion = (quest: PrismaticQuest) =>
    Math.min(1, progressOf(quest) / PrismaticQuestDefinitions[quest].target)
  const sortedQuests = [...PrismaticQuestsInOrder].sort(
    (a, b) =>
      Number(isClaimable(b)) - Number(isClaimable(a)) ||
      Number(isClaimed(b)) - Number(isClaimed(a)) ||
      completion(b) - completion(a)
  )

  return (
    <Modal
      show={props.show}
      onClose={props.onClose}
      className="prismatic-quests-modal"
      header={
        <div className="prismatic-quests-heading">
          <h2>{t("prismatic_quests.title")}</h2>
          <p>
            {t(
              claimsEveryQuest
                ? "prismatic_quests.subtitle_every"
                : "prismatic_quests.subtitle"
            )}
          </p>
        </div>
      }
    >
      <ul className="prismatic-quests-list">
        {sortedQuests.map((quest) => {
          const definition = PrismaticQuestDefinitions[quest]
          const progress = Math.min(progressOf(quest), definition.target)
          const complete = isComplete(quest)
          const claimed = isClaimed(quest)
          return (
            <li
              key={quest}
              className={cc("prismatic-quest", {
                "is-complete": complete,
                "is-claimed": claimed,
                "is-closed": !canClaimMore && !claimed
              })}
            >
              <span className="prismatic-quest-icon">
                <img src={`/assets/blessings/${definition.icon}.svg`} alt="" />
              </span>
              <div className="prismatic-quest-details">
                <strong>{t(`prismatic_quests.quests.${quest}.name`)}</strong>
                <span>
                  {addIconsToDescription(
                    t(`prismatic_quests.quests.${quest}.condition`)
                  )}
                </span>
                <div className="prismatic-quest-progress">
                  <i style={{ width: `${completion(quest) * 100}%` }} />
                </div>
              </div>
              <span
                className="prismatic-quest-count"
                title={
                  definition.tracksBest
                    ? t("prismatic_quests.best_hint")
                    : undefined
                }
              >
                {definition.tracksBest && (
                  <small>{t("prismatic_quests.best")}</small>
                )}
                {Math.floor(progress)}/{definition.target}
              </span>
              <img
                className="prismatic-quest-reward"
                src={`/assets/item/${definition.reward}.png`}
                alt={t(`item.${definition.reward}`)}
                title={t(`item.${definition.reward}`)}
              />
              {claimed && (
                <span className="prismatic-quest-claimed">
                  {t("prismatic_quests.claimed")}
                </span>
              )}
              {isClaimable(quest) && (
                <button
                  className="bubbly green prismatic-quest-claim"
                  onClick={() => claimPrismaticQuest(quest)}
                >
                  {t("prismatic_quests.claim")}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}

interface QuestToast {
  id: string
  title: string
  detail: string
  icon: string
  reward?: Item
  expiresAt: number
}

export function GamePrismaticQuestNotifications() {
  const { t } = useTranslation()
  const { unlocked, isComplete, isClaimed, canClaimMore } =
    usePrismaticQuestState()
  const [toasts, setToasts] = useState<QuestToast[]>([])
  const completedQuests = PrismaticQuestsInOrder.filter(isComplete)
  const completedKey = completedQuests.join(",")
  // undefined until the first state arrives, so a reconnect does not replay
  // every quest the player already saw complete
  const seen = useRef<{ unlocked: boolean; completed: string[] } | undefined>(
    undefined
  )

  useEffect(() => {
    const previous = seen.current
    seen.current = { unlocked, completed: completedQuests }
    if (!previous) return
    const expiresAt = Date.now() + QUEST_TOAST_DURATION
    const fresh: QuestToast[] = []
    if (unlocked && !previous.unlocked) {
      fresh.push({
        id: "unlocked",
        title: t("prismatic_quests.unlocked"),
        detail: t("prismatic_quests.subtitle"),
        icon: Blessings[Blessing.PRISMATIC_QUEST].icon,
        expiresAt
      })
    }
    if (canClaimMore) {
      completedQuests
        .filter(
          (quest) => !previous.completed.includes(quest) && !isClaimed(quest)
        )
        .forEach((quest) =>
          fresh.push({
            id: quest,
            title: t("prismatic_quests.complete"),
            detail: t(`prismatic_quests.quests.${quest}.name`),
            icon: PrismaticQuestDefinitions[quest].icon,
            reward: PrismaticQuestDefinitions[quest].reward,
            expiresAt
          })
        )
    }
    if (fresh.length > 0) setToasts((current) => [...current, ...fresh])
  }, [unlocked, completedKey])

  const nextExpiry = toasts.length
    ? Math.min(...toasts.map((toast) => toast.expiresAt))
    : undefined
  useEffect(() => {
    if (nextExpiry === undefined) return
    const timer = setTimeout(
      () =>
        setToasts((current) =>
          current.filter((toast) => toast.expiresAt > Date.now())
        ),
      Math.max(0, nextExpiry - Date.now())
    )
    return () => clearTimeout(timer)
  }, [nextExpiry])

  if (toasts.length === 0) return null

  return (
    <div className="prismatic-quest-toasts">
      {toasts.map((toast) => (
        <div key={toast.id} className="prismatic-quest-toast" role="status">
          <span className="prismatic-quest-toast-icon">
            <img src={`/assets/blessings/${toast.icon}.svg`} alt="" />
          </span>
          <div>
            <strong>{toast.title}</strong>
            <span>{toast.detail}</span>
          </div>
          {toast.reward && (
            <img
              className="prismatic-quest-toast-reward"
              src={`/assets/item/${toast.reward}.png`}
              alt={t(`item.${toast.reward}`)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
