import { type CSSProperties, Fragment } from "react"
import { useTranslation } from "react-i18next"
import { Item } from "../../../../../types/enum/Item"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import "./itemization-theory.css"

// a build is a list of slots joined by "+". a slot holds the alternatives that
// are interchangeable in that spot, and an alternative can itself be several
// items that only make sense together
type Alternative = Item[]
type Slot = Alternative[]

const builds: { role: string; accent: string; options: Slot[][] }[] = [
  {
    role: "Bruiser",
    accent: "#ff8a65",
    options: [
      [
        [[Item.ROCKY_HELMET]],
        [
          [Item.MUSCLE_BAND, Item.SHELL_BELL],
          [Item.SOUL_DEW, Item.STAR_DUST]
        ]
      ],
      [[[Item.FLAME_ORB]], [[Item.STAR_DUST]]]
    ]
  },
  {
    role: "Attacker",
    accent: "#ffd166",
    options: [
      [[[Item.UPGRADE]], [[Item.PUNCHING_GLOVE]]],
      [[[Item.XRAY_VISION]], [[Item.RED_ORB]]]
    ]
  },
  {
    role: "Caster",
    accent: "#9d8bff",
    options: [
      [[[Item.COVERT_CLOAK]], [[Item.POKEMONOMICON]]],
      [[[Item.SOUL_DEW]], [[Item.PROTECTIVE_PADS], [Item.AQUA_EGG]]]
    ]
  },
  {
    role: "Assassin",
    accent: "#ff6b9d",
    options: [[[[Item.LOADED_DICE]], [[Item.RED_ORB]]]]
  },
  {
    role: "Scaler",
    accent: "#5ecbf7",
    options: [[[[Item.WIDE_LENS]], [[Item.GRIP_CLAW], [Item.RAZOR_FANG]]]]
  }
]

function ItemName({ item }: { item: Item }) {
  const { t } = useTranslation()
  return (
    <span
      className="itemization-item"
      data-tooltip-id="item-detail-tooltip"
      data-tooltip-content={item}
      tabIndex={0}
    >
      <img src={`assets/item/${item}.png`} alt="" />
      {t(`item.${item}`)}
    </span>
  )
}

function SlotView({ slot, showPlus }: { slot: Slot; showPlus: boolean }) {
  return (
    <span className="itemization-slot">
      {showPlus && <span className="itemization-plus">+</span>}
      {slot.map((alternative, index) => (
        <Fragment key={alternative.join()}>
          {index > 0 && <span className="itemization-or">or</span>}
          <span
            className={cc("itemization-group", {
              "itemization-group-tied": alternative.length > 1
            })}
          >
            {alternative.map((item) => (
              <ItemName key={item} item={item} />
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  )
}

export function ItemizationTheory() {
  const { t } = useTranslation()
  return (
    <div className="itemization-theory">
      <p className="itemization-intro">
        Building Pairs before stage 10 saves health. Do not sit on items, unless
        you know exactly what you are doing. Most people don't know what they
        are doing. Play the game. Make items.
      </p>
      <div className="my-box itemization-table-scroll">
        <table className="itemization-table">
          <caption>Building Pairs</caption>
          <tbody>
            {builds.map(({ role, accent, options }) => (
              <tr
                key={role}
                style={{ "--role-accent": accent } as CSSProperties}
              >
                <th scope="row">{role}</th>
                <td>
                  <ul className="itemization-options">
                    {options.map((option, index) => (
                      <li className="itemization-option" key={index}>
                        {options.length > 1 && (
                          <span className="itemization-index">{index + 1}</span>
                        )}
                        {option.map((slot, slotIndex) => (
                          <SlotView
                            key={slot.join()}
                            slot={slot}
                            showPlus={slotIndex > 0}
                          />
                        ))}
                      </li>
                    ))}
                  </ul>
                  <details className="itemization-effects">
                    <summary>Item effects</summary>
                    <dl>
                      {[...new Set(options.flat(3))].map((item) => (
                        <div key={item}>
                          <dt>
                            <ItemName item={item} />
                          </dt>
                          <dd>
                            {addIconsToDescription(
                              t(`item_description.${item}`)
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="itemization-outro">
        If your intuition tells you that you can replace one of these items with
        a different item, do it. Your intuition is right. These sets only serve
        as examples: they provide consistent damage throughout the early game
        and set a literally healthy foundation for the mid game. Don't lose
        health when you could have made items. A lot of items are
        interchangeable. Experiment around!
      </p>
      <ItemDetailTooltip />
    </div>
  )
}
