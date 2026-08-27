import { useTranslation } from "react-i18next"
import { RarityColor } from "../../../../../config"
import { EXPLORER_BONUS_TIERS } from "../../../../../core/seeds"
import { Seeds } from "../../../../../types/enum/Item"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { addIconsToDescription } from "../../utils/descriptions"
import { ItemList } from "./wiki-items"

export function WikiLetterDelivery(props: {
  heading?: "h2" | "h3"
  showSeeds?: boolean
}) {
  const { t } = useTranslation()
  const Heading = props.heading ?? "h2"
  const percentage = new Intl.NumberFormat(navigator.language, {
    style: "percent",
    maximumSignificantDigits: 2
  })

  return (
    <section
      className={`wiki-letter-delivery${props.showSeeds ? " wiki-letter-delivery-card my-box" : ""}`}
    >
      <header className="wiki-letter-delivery-header">
        <div>
          <Heading>{t("wiki.data.explorer_bonus_rate")}</Heading>
          <p>{t("wiki.data.explorer_bonus_rate_description")}</p>
        </div>
      </header>
      <div className="wiki-letter-delivery-table-wrap">
        <table id="wiki-data-explorer-bonus-rate">
          <thead>
            <tr>
              <th></th>
              <th>{t("item.NUGGET")}</th>
              <th>{t("item.COIN")}</th>
              <th>{t("wiki.data.component")}</th>
              <th>{t("wiki.data.nothing")}</th>
            </tr>
          </thead>
          <tbody>
            {EXPLORER_BONUS_TIERS.map(({ rarities, rewards }) => {
              const firstRarity = rarities[0]
              const lastRarity = rarities[rarities.length - 1] ?? firstRarity
              return (
                <tr key={firstRarity}>
                  <th scope="row" style={{ color: RarityColor[firstRarity] }}>
                    {t(`rarity.${firstRarity}`)}–{t(`rarity.${lastRarity}`)}
                  </th>
                  <td>{percentage.format(rewards.nugget)}</td>
                  <td>{percentage.format(rewards.rustyCoin)}</td>
                  <td>{percentage.format(rewards.component)}</td>
                  <td>{percentage.format(rewards.nothing)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {props.showSeeds && (
        <div className="wiki-letter-delivery-seeds">
          <hr />
          <div className="wiki-letter-delivery-seed-callout">
            <div className="wiki-letter-delivery-seed-heading">
              <img
                className="wiki-letter-delivery-seed-icon"
                src="/assets/icons/SEED_BAG.svg"
                alt=""
              />
              <h4>{t("seed_bag.title")}</h4>
            </div>
            <p>{addIconsToDescription(t("wiki.items.seeds_description"))}</p>
          </div>
          <ul aria-label={t("seed_bag.title")}>
            <ItemList items={Seeds} />
          </ul>
          <ItemDetailTooltip />
        </div>
      )}
    </section>
  )
}
