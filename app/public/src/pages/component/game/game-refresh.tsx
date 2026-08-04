import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import { getRerollCost } from "../../../../../config"
import {
  BAZAAR_SHOP_INTERVAL,
  SpecialGameRule
} from "../../../../../types/enum/SpecialGameRule"
import {
  Blessing,
  BERSERKER_HORDES_SHOP_INTERVAL
} from "../../../../../types/enum/Blessing"
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

  // BERSERKER_HORDES: same countdown, keyed on the same shop number the
  // blessing uses to decide when the shop turns all-Wild
  const connectedPlayerId = useAppSelector(
    (state) => selectConnectedPlayer(state)?.id
  )
  const blessingsByPlayerId = useAppSelector(
    (state) => state.game.blessingsByPlayerId
  )
  const hasBerserkerHordes = connectedPlayerId
    ? (blessingsByPlayerId[connectedPlayerId] ?? []).includes(
        Blessing.BERSERKER_HORDES
      )
    : false
  const shopsUntilBerserker =
    BERSERKER_HORDES_SHOP_INTERVAL -
    ((stageLevel + rerollCount) % BERSERKER_HORDES_SHOP_INTERVAL)
  const onBerserkerShop =
    (stageLevel + rerollCount) % BERSERKER_HORDES_SHOP_INTERVAL === 0

  return (
    <>
      <button
        className={cc("bubbly blue refresh-button", {
          shimmer: shopFreeRolls > 0
        })}
        title={
          isBazaar || hasBerserkerHordes ? undefined : t("refresh_gold_hint")
        }
        data-tooltip-id={
          isBazaar
            ? "next-bazaar-tooltip"
            : hasBerserkerHordes
              ? "next-berserker-tooltip"
              : undefined
        }
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
      {!isBazaar && hasBerserkerHordes && (
        <Tooltip
          id="next-berserker-tooltip"
          className="custom-theme-tooltip"
          place="top"
        >
          <p className="help">
            {onBerserkerShop
              ? t("berserker_current_hint")
              : t("next_berserker_hint", { count: shopsUntilBerserker })}
          </p>
        </Tooltip>
      )}
    </>
  )
}
