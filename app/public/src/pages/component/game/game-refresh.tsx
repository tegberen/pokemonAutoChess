import { useTranslation } from "react-i18next"
import { getRerollCost } from "../../../../../config"
import { useAppSelector } from "../../../hooks"
import { getGameScene } from "../../game"
import { cc } from "../../utils/jsx"
import { Money } from "../icons/money"

export default function GameRefresh() {
  const { t } = useTranslation()
  const shopFreeRolls = useAppSelector((state) => state.game.shopFreeRolls)
  const specialGameRule = useAppSelector((state) => state.game.specialGameRule)
  const cost = shopFreeRolls > 0 ? 0 : getRerollCost(specialGameRule)
  return (
    <button
      className={cc("bubbly blue refresh-button", {
        shimmer: shopFreeRolls > 0
      })}
      title={t("refresh_gold_hint")}
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
  )
}
