import { useTranslation } from "react-i18next"
import {
  AVATAR_COSMETIC_BLESSINGS,
  getUnlockedAvatarCosmetics
} from "../../../../../types/enum/AvatarCosmetic"
import {
  AVATAR_COSMETIC_CATEGORY_NAMES,
  AVATAR_COSMETICS,
  type AvatarCosmeticCategory
} from "../../../cosmetics/avatar-cosmetics"
import { useAppSelector } from "../../../hooks"
import { usePreferences } from "../../../preferences"
import "./cosmetics-tab.css"

export function CosmeticsTab() {
  const { t } = useTranslation()
  const profile = useAppSelector((state) => state.network.profile)
  const [preferences, setPreferences] = usePreferences()
  const unlocked = getUnlockedAvatarCosmetics(profile)
  const equipped = unlocked.has(preferences.avatarCosmetic)
    ? preferences.avatarCosmetic
    : "none"
  const unlockedCount = AVATAR_COSMETICS.filter(
    (cosmetic) => cosmetic.id !== "none" && unlocked.has(cosmetic.id)
  ).length
  const categories = Object.keys(
    AVATAR_COSMETIC_CATEGORY_NAMES
  ) as AvatarCosmeticCategory[]

  return (
    <section className="cosmetics-tab" aria-label="Avatar cosmetics">
      <header className="cosmetics-heading">
        <div>
          <h3>Avatar cosmetics</h3>
          <p>Win with a Wish to unlock it. Equip one at a time.</p>
        </div>
        <span>
          {unlockedCount} / {AVATAR_COSMETICS.length - 1} unlocked
        </span>
      </header>
      {categories.map((category) => {
        const cosmetics = AVATAR_COSMETICS.filter(
          (cosmetic) => cosmetic.category === category
        )
        if (cosmetics.length === 0) return null
        return (
          <section className="cosmetics-group" key={category}>
            <h4>{AVATAR_COSMETIC_CATEGORY_NAMES[category]}</h4>
            <ul className="cosmetics-list">
              {cosmetics.map((cosmetic) => {
                const available =
                  cosmetic.id === "none" || unlocked.has(cosmetic.id)
                const isEquipped = equipped === cosmetic.id
                return (
                  <li
                    key={cosmetic.id}
                    className={`cosmetics-row${isEquipped ? " is-equipped" : ""}`}
                  >
                    <div className="cosmetics-details">
                      <h4>{cosmetic.name}</h4>
                      <p>
                        {cosmetic.id === "none" ? (
                          "Always available."
                        ) : (
                          <>
                            Win a game with the{" "}
                            <strong>
                              {t(
                                `blessing.${AVATAR_COSMETIC_BLESSINGS[cosmetic.id]}.name`
                              )}
                            </strong>{" "}
                            Wish.
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bubbly"
                      disabled={!available || isEquipped}
                      aria-label={`${isEquipped ? "Equipped" : available ? "Equip" : "Locked"}: ${cosmetic.name}`}
                      onClick={() =>
                        setPreferences({ avatarCosmetic: cosmetic.id })
                      }
                    >
                      {isEquipped ? "Equipped" : available ? "Equip" : "Locked"}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </section>
  )
}
