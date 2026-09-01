import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import { getLevelUpCost } from "../../../../../models/colyseus-models/experience-manager"
import { Blessing } from "../../../../../types/enum/Blessing"
import {
  selectConnectedPlayer,
  selectSpectatedPlayer,
  useAppSelector
} from "../../../hooks"
import { levelClick, skipStage } from "../../../network"
import { playSound, SOUNDS } from "../../utils/audio"
import { addIconsToDescription } from "../../utils/descriptions"
import { useGuideActionAllowed } from "../guide/use-guide-action"
import { Money } from "../icons/money"

export default function GameExperience() {
  const { t } = useTranslation()

  const experienceManager = useAppSelector(
    (state) => state.game.experienceManager
  )
  const isLevelMax = experienceManager.level >= experienceManager.maxLevel
  const specialGameRule = useAppSelector((state) => state.game.specialGameRule)
  const levelUpCost = getLevelUpCost(specialGameRule)
  const goldToLevelUp = isLevelMax
    ? null
    : Math.ceil(
        (experienceManager.expNeeded - experienceManager.experience) /
          levelUpCost
      ) * levelUpCost
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const connectedPlayer = useAppSelector(selectConnectedPlayer)
  const blessingsByPlayerId = useAppSelector(
    (state) => state.game.blessingsByPlayerId
  )
  const wiseSpending = connectedPlayer
    ? (blessingsByPlayerId[connectedPlayer.id] ?? []).includes(
        Blessing.WISE_SPENDING
      )
    : false
  const canLevelup =
    !wiseSpending &&
    !isLevelMax &&
    spectatedPlayer &&
    spectatedPlayer.money >= levelUpCost

  const levelUpAllowed = useGuideActionAllowed("levelup")

  return (
    <div className="game-experience">
      <span>
        {t("lvl")} {experienceManager.level}
      </span>
      {process.env.MODE === "dev" && (
        <button
          className="bubbly orange skip-stage-button"
          title="Skip stage (dev only)"
          onClick={() => skipStage()}
        >
          SKIP
        </button>
      )}
      <button
        className="bubbly orange buy-xp-button"
        title={
          wiseSpending
            ? t("blessing.WISE_SPENDING.description")
            : t("buy_xp_tooltip", { cost: levelUpCost })
        }
        disabled={wiseSpending || !levelUpAllowed}
        data-no-click-sound=""
        onClick={() => {
          if (!levelUpAllowed) return
          if (canLevelup) playSound(SOUNDS.GOLD_TO_LEVEL)
          levelClick()
        }}
      >
        <Money value={t("buy_xp", { cost: levelUpCost })} />
      </button>
      <div className="progress-bar" data-tooltip-id="gold-to-levelup-tooltip">
        <progress
          className="my-progress"
          value={isLevelMax ? 0 : experienceManager.experience}
          max={experienceManager.expNeeded}
        ></progress>
        <span>
          {isLevelMax
            ? "Max Level"
            : experienceManager.experience + "/" + experienceManager.expNeeded}
        </span>
      </div>
      <Tooltip
        id="gold-to-levelup-tooltip"
        className="custom-theme-tooltip"
        place="top"
      >
        <p className="help">
          {isLevelMax ? (
            t("max_level_reached")
          ) : (
            <>
              {t("gold_needed_to_level_up")}
              <b
                style={{
                  color: canLevelup
                    ? "var(--color-fg-green, green)"
                    : "var(--color-fg-red, red)"
                }}
              >
                {addIconsToDescription(`${goldToLevelUp} GOLD`)}
              </b>
              ({t("clicks", { count: goldToLevelUp! / levelUpCost })})
            </>
          )}
        </p>
      </Tooltip>
    </div>
  )
}
