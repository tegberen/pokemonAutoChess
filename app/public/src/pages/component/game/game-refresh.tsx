import { useEffect, useReducer } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import {
  getRerollCostForBlessings,
  SynergyTiersThresholds,
  UNOWN_PSY3_NB_SHOPS_INTERVAL,
  UNOWN_PSY5_NB_SHOPS_INTERVAL,
  UNOWN_PSY7_NB_SHOPS_INTERVAL
} from "../../../../../config"
import {
  BERSERKER_HORDES_SHOP_INTERVAL,
  Blessing
} from "../../../../../types/enum/Blessing"
import { GamePhaseState } from "../../../../../types/enum/Game"
import { Pkm, Unowns } from "../../../../../types/enum/Pokemon"
import { Synergy } from "../../../../../types/enum/Synergy"
import {
  BAZAAR_SHOP_INTERVAL,
  SpecialGameRule
} from "../../../../../types/enum/SpecialGameRule"
import {
  selectConnectedPlayer,
  selectIsBlessingChoicePending,
  useAppSelector
} from "../../../hooks"
import { getGameScene } from "../../game"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { useGuideActionAllowed } from "../guide/use-guide-action"
import { Money } from "../icons/money"

// kept outside the component so a remount keeps the Transcendence count
const shopRefreshTrackers = new Map<
  string,
  { shop: Pkm[]; rerollCount: number; refreshes: number }
>()

export default function GameRefresh() {
  const { t } = useTranslation()
  const shopFreeRolls = useAppSelector((state) => state.game.shopFreeRolls)
  const specialGameRule = useAppSelector((state) => state.game.specialGameRule)
  const stageLevel = useAppSelector((state) => state.game.stageLevel)
  const phase = useAppSelector((state) => state.game.phase)

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
  const connectedBlessings = connectedPlayerId
    ? (blessingsByPlayerId[connectedPlayerId] ?? [])
    : []
  const thinkFastActiveByPlayerId = useAppSelector(
    (state) => state.game.thinkFastActiveByPlayerId
  )
  const thinkFastActive =
    phase === GamePhaseState.PICK &&
    (connectedPlayerId
      ? (thinkFastActiveByPlayerId[connectedPlayerId] ?? false)
      : false)
  const cost =
    shopFreeRolls > 0 || thinkFastActive
      ? 0
      : getRerollCostForBlessings(
          connectedBlessings,
          specialGameRule,
          stageLevel
        )
  const hasBerserkerHordes = connectedPlayerId
    ? connectedBlessings.includes(Blessing.BERSERKER_HORDES)
    : false
  const shopsUntilBerserker =
    BERSERKER_HORDES_SHOP_INTERVAL -
    ((stageLevel + rerollCount) % BERSERKER_HORDES_SHOP_INTERVAL)
  const onBerserkerShop =
    (stageLevel + rerollCount) % BERSERKER_HORDES_SHOP_INTERVAL === 0

  // PSYCHIC: Transcendence's counter is server-only, so it is counted here
  const psychicLevel = useAppSelector(
    (state) =>
      selectConnectedPlayer(state)?.synergies.get(Synergy.PSYCHIC) ?? 0
  )
  const [precognition, aura, transcendence] =
    SynergyTiersThresholds[Synergy.PSYCHIC]
  const shop = useAppSelector((state) => state.game.shop)
  // a lone Unown in the last slot is a lower tier's, not a Unown shop
  const hasUnownShop =
    shop.slice(0, 5).some((pkm) => Unowns.includes(pkm)) &&
    shop.every((pkm) => Unowns.includes(pkm) || pkm === Pkm.DEFAULT)
  const hasUnownCountdown = psychicLevel >= precognition
  const hasTranscendence = psychicLevel >= transcendence
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  const tracker = connectedPlayerId
    ? shopRefreshTrackers.get(connectedPlayerId)
    : undefined
  useEffect(() => {
    if (!connectedPlayerId) return
    const previous = shopRefreshTrackers.get(connectedPlayerId)
    // shop refreshes, not rerolls: buying a Unown also refreshes the shop.
    // Like the server, nothing is counted below PSYCHIC 7
    const isNewGame =
      previous !== undefined && rerollCount < previous.rerollCount
    let refreshes = isNewGame ? 0 : (previous?.refreshes ?? 0)
    if (hasTranscendence) {
      if (hasUnownShop) refreshes = 0
      else if (previous && !isNewGame) {
        const rerolls = rerollCount - previous.rerollCount
        const swapped = previous.shop.some(
          (pkm, index) =>
            pkm !== Pkm.DEFAULT &&
            shop[index] !== Pkm.DEFAULT &&
            shop[index] !== pkm
        )
        refreshes += Math.max(rerolls, swapped ? 1 : 0)
      } else refreshes = 0
    }
    shopRefreshTrackers.set(connectedPlayerId, {
      shop: [...shop],
      rerollCount,
      refreshes
    })
    if (refreshes !== previous?.refreshes) rerender()
  }, [connectedPlayerId, hasTranscendence, hasUnownShop, shop, rerollCount])
  const rerollsUntilUnown = (interval: number) =>
    interval - ((stageLevel + rerollCount) % interval)
  const unownCountdowns = [
    { tier: precognition, interval: UNOWN_PSY3_NB_SHOPS_INTERVAL },
    { tier: aura, interval: UNOWN_PSY5_NB_SHOPS_INTERVAL }
  ].filter(({ tier }) => psychicLevel >= tier)
  const onUnownSlot = Unowns.includes(shop[5])
  const rerollsUntilUnownShop =
    hasUnownShop || !tracker
      ? UNOWN_PSY7_NB_SHOPS_INTERVAL
      : Math.max(1, UNOWN_PSY7_NB_SHOPS_INTERVAL - tracker.refreshes)
  const showsUnownHint = !isBazaar && !hasBerserkerHordes && hasUnownCountdown

  const guideAllowsReroll = useGuideActionAllowed("reroll")
  const blessingChoicePending = useAppSelector(selectIsBlessingChoicePending)
  const rerollAllowed = guideAllowsReroll && !blessingChoicePending

  return (
    <>
      <button
        className={cc("bubbly blue refresh-button", {
          shimmer: shopFreeRolls > 0 || thinkFastActive
        })}
        disabled={!rerollAllowed}
        title={
          isBazaar || hasBerserkerHordes || showsUnownHint
            ? undefined
            : t("refresh_gold_hint")
        }
        data-tooltip-id={
          isBazaar
            ? "next-bazaar-tooltip"
            : hasBerserkerHordes
              ? "next-berserker-tooltip"
              : showsUnownHint
                ? "next-unown-tooltip"
                : undefined
        }
        onClick={() => {
          if (!rerollAllowed) return
          getGameScene()?.refreshShop()
        }}
      >
        <img src={`/assets/ui/refresh.svg`} />
        {cost === 0 && shopFreeRolls === 0 && !thinkFastActive ? (
          t("refresh")
        ) : cost === 0 ? (
          `${t("refresh")} (${thinkFastActive ? "∞" : shopFreeRolls})`
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
      {showsUnownHint && (
        <Tooltip
          id="next-unown-tooltip"
          className="custom-theme-tooltip"
          place="top"
        >
          {hasUnownShop ? (
            <p className="help">{t("unown_shop_current_hint")}</p>
          ) : (
            onUnownSlot && <p className="help">{t("unown_current_hint")}</p>
          )}
          {unownCountdowns.map(({ tier, interval }, index) => (
            <p
              key={tier}
              className={cc("help", {
                "is-main":
                  !hasTranscendence && index === unownCountdowns.length - 1
              })}
            >
              {addIconsToDescription(
                t("next_unown_rerolls_hint", {
                  tier: `PSYCHIC (${tier})`,
                  count: rerollsUntilUnown(interval)
                })
              )}
            </p>
          ))}
          {hasTranscendence && (
            <p className="help is-main">
              {addIconsToDescription(
                t("next_unown_shop_hint", {
                  tier: `PSYCHIC (${transcendence})`,
                  count: rerollsUntilUnownShop
                })
              )}
            </p>
          )}
        </Tooltip>
      )}
    </>
  )
}
