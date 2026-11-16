import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  BOT_DIFFICULTY_CHOICES,
  DEFAULT_BOT_DIFFICULTY,
  getBotEloRange,
  isEloInRange
} from "../../../../../config/game/bots"
import { BotDifficulty } from "../../../../../types/enum/Game"
import { addBot, fillWithBots } from "../../../network"
import { cc } from "../../utils/jsx"

export const BOT_DIFFICULTY_LABEL_KEYS = {
  [BotDifficulty.EASY]: "easy_bot",
  [BotDifficulty.HARD]: "hard_bot",
  [BotDifficulty.EXTREME]: "extreme_bot"
} as const

const BOT_DIFFICULTY_SHORT_KEYS = {
  [BotDifficulty.EASY]: "bot_difficulty_short.EASY",
  [BotDifficulty.HARD]: "bot_difficulty_short.HARD",
  [BotDifficulty.EXTREME]: "bot_difficulty_short.EXTREME"
} as const

type ApprovedBot = { id: string; elo: number }

let approvedBotsRequest: Promise<ApprovedBot[]> | null = null
export function fetchApprovedBots() {
  approvedBotsRequest ??= fetch(`/bots?approved=true&t=${Date.now()}`)
    .then((response) => response.json())
    .catch(() => {
      approvedBotsRequest = null
      return []
    })
  return approvedBotsRequest
}

export function BotDifficultyToggles(props: {
  value: BotDifficulty | null
  onChange: (difficulty: BotDifficulty) => void
  counts?: Map<BotDifficulty, number>
}) {
  const { t } = useTranslation()
  return (
    <div className="bot-difficulty-toggles">
      {BOT_DIFFICULTY_CHOICES.map((difficulty) => (
        <button
          key={difficulty}
          type="button"
          className={cc("bubbly", { blue: props.value === difficulty })}
          title={t(BOT_DIFFICULTY_LABEL_KEYS[difficulty])}
          onClick={() => props.onChange(difficulty)}
        >
          {t(BOT_DIFFICULTY_SHORT_KEYS[difficulty])}
          {props.counts && (
            <span className="bot-difficulty-count">
              {props.counts.get(difficulty) ?? 0}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function BotAdder(props: {
  seatedBotIds: string[]
  seatsLeft: number
  onPickCustom: (difficulty: BotDifficulty) => void
}) {
  const { t } = useTranslation()
  const [difficulty, setDifficulty] = useState(DEFAULT_BOT_DIFFICULTY)
  const [approvedBots, setApprovedBots] = useState<ApprovedBot[]>([])
  useEffect(() => {
    fetchApprovedBots().then(setApprovedBots)
  }, [])

  // bots still free for each range, so an emptied range shows before a click
  const counts = useMemo(() => {
    const free = approvedBots.filter(
      (bot) => !props.seatedBotIds.includes(bot.id)
    )
    return new Map(
      BOT_DIFFICULTY_CHOICES.map((choice) => [
        choice,
        free.filter((bot) => isEloInRange(bot.elo, getBotEloRange(choice)))
          .length
      ])
    )
  }, [approvedBots, props.seatedBotIds])

  const isFull = props.seatsLeft <= 0
  return (
    <div className="bot-adder">
      <BotDifficultyToggles
        value={difficulty}
        onChange={setDifficulty}
        counts={counts}
      />
      <button
        type="button"
        className="bubbly blue"
        disabled={isFull}
        onClick={() => addBot(difficulty)}
      >
        {t("add")}
      </button>
      <button
        type="button"
        className="bubbly green"
        disabled={isFull}
        onClick={() => fillWithBots(difficulty, props.seatsLeft)}
      >
        {t("fill_with_bots", { count: Math.max(0, props.seatsLeft) })}
      </button>
      <button
        type="button"
        className="bubbly"
        disabled={isFull}
        onClick={() => props.onPickCustom(difficulty)}
      >
        {t("custom_bot")}
      </button>
    </div>
  )
}
