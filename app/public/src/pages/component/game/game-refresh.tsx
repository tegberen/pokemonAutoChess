import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import { getRerollCost } from "../../../../../config"
import {
  BAZAAR_SHOP_INTERVAL,
  SpecialGameRule
} from "../../../../../types/enum/SpecialGameRule"
import { selectConnectedPlayer, useAppSelector } from "../../../hooks"
import { getGameScene } from "../../game"
import { cc } from "../../utils/jsx"
import { Money } from "../icons/money"

export default function GameRefresh() {
  const { t } = useTranslation()
  const shopFreeRolls = useAppSelector((state) => state.game.shopFreeRolls)
  const specialGameRule = useAppSelector((state) => state.game.specialGameRule)
  const stageLevel = useAppSelector((state) => state.game.stageLevel)
  const cost =
    shopFreeRolls > 0 ? 0 : getRerollCost(specialGameRule, stageLevel)

  // BAZAAR: show how many shops away the next bazaar is. It appears when
  // (stage + rerolls) is a multiple of BAZAAR_SHOP_INTERVAL — the same numbers
  // the player sees on screen — so the countdown is easy to reason about.
  const isBazaar = specialGameRule === SpecialGameRule.BAZAAR
  const rerollCount = useAppSelector(
    (state) => selectConnectedPlayer(state)?.gameStats?.rerollCount ?? 0
  )
  const bazaarOffers = useAppSelector((state) => state.game.bazaarOffers)
  const onBazaar = bazaarOffers.some(Boolean)
  const shopsUntilBazaar =
    BAZAAR_SHOP_INTERVAL - ((stageLevel + rerollCount) % BAZAAR_SHOP_INTERVAL)

  return (
    <>
      <button
        className={cc("bubbly blue refresh-button", {
          shimmer: shopFreeRolls > 0
        })}
        title={isBazaar ? undefined : t("refresh_gold_hint")}
        data-tooltip-id={isBazaar ? "next-bazaar-tooltip" : undefined}
        onClick={() => {
          getGameScene()?.refreshShop()
        }}
      >
        <img src={`/assets/ui/refresh.svg`} />
        {cost === 0 ? (
          `${t("refresh")} (${shopFreeRolls})`
        ) : (
          <Money value={`${t("refresh")} ${cost}`} />
        )}
      </button>
      {isBazaar && (
        <Tooltip
          id="next-bazaar-tooltip"
          className="custom-theme-tooltip"
          place="top"
        >
          <p className="help">
            {onBazaar
              ? t("bazaar_current_hint")
              : t("next_bazaar_hint", { count: shopsUntilBazaar })}
          </p>
        </Tooltip>
      )}
    </>
  )
}
