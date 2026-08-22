import { type CSSProperties, Fragment, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { RarityColor } from "../../../../../config"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import {
  FossilUnlocks,
  type FossilUnlockDefinition
} from "../../../../../types/enum/FossilUnlock"
import type { Pkm } from "../../../../../types/enum/Pokemon"
import {
  selectConnectedPlayer,
  selectFossilUnlocks,
  useAppSelector
} from "../../../hooks"
import { FossilUnlockCondition } from "./fossil-unlock-condition"
import SynergyIcon from "../icons/synergy-icon"
import { Modal } from "../modal/modal"
import { GameFossilRestoration } from "./game-fossil-restoration"
import { getCachedPortrait } from "./game-pokemon-portrait"
import "./game-fossil-unlocks.css"

export function GameFossilUnlocksIcon() {
  const [show, setShow] = useState(false)
  const revealed = useAppSelector(selectFossilUnlocks).revealed

  if (!revealed) return null

  return (
    <>
      <button
        className="fossil-unlocks-button"
        onClick={() => setShow(true)}
        aria-label="Open Fossil Unlocks"
        title="Fossil Unlocks"
      >
        <img
          className="fossil-unlocks-button-icon"
          src="/assets/icons/FOSSIL_OPEN_ICON.svg"
          alt=""
          aria-hidden="true"
          draggable="false"
        />
        <span className="fossil-unlocks-button-label">Unlocks</span>
      </button>
      <FossilUnlocksModal show={show} onClose={() => setShow(false)} />
    </>
  )
}

function FossilUnlocksModal(props: { show: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [trackedPokemon, setTrackedPokemon] = useState<Set<Pkm>>(new Set())
  const connectedPlayer = useAppSelector(selectConnectedPlayer)
  const unlockState = useAppSelector(selectFossilUnlocks)
  const progressOf = (unlock: FossilUnlockDefinition) =>
    unlockState.progress[unlock.pokemon] ?? 0
  const isUnlocked = (unlock: FossilUnlockDefinition) =>
    unlockState.unlocked.includes(unlock.pokemon)
  const visibleUnlocks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return FossilUnlocks.filter((unlock) =>
      `${t(`pkm.${unlock.pokemon}`)} ${t(`fossil_unlocks.conditions.${unlock.conditionKey}`)}`
        .toLowerCase()
        .includes(query)
    ).sort((a, b) => {
      const aUnlocked = isUnlocked(a)
      const bUnlocked = isUnlocked(b)

      if (aUnlocked !== bUnlocked) return aUnlocked ? 1 : -1
      if (!aUnlocked) {
        return progressOf(b) / b.target - progressOf(a) / a.target
      }
      return t(`pkm.${a.pokemon}`).localeCompare(t(`pkm.${b.pokemon}`))
    })
  }, [search, unlockState, t])
  const sortedUnlocks = useMemo(
    () => [
      ...visibleUnlocks.filter((unlock) => trackedPokemon.has(unlock.pokemon)),
      ...visibleUnlocks.filter((unlock) => !trackedPokemon.has(unlock.pokemon))
    ],
    [trackedPokemon, visibleUnlocks]
  )

  function toggleTracked(pokemon: Pkm) {
    setTrackedPokemon((current) => {
      const next = new Set(current)
      if (next.has(pokemon)) next.delete(pokemon)
      else next.add(pokemon)
      return next
    })
  }

  return (
    <Modal
      show={props.show}
      onClose={props.onClose}
      className="fossil-unlocks-modal"
      header={
        <div className="fossil-unlocks-heading">
          <img
            src="/assets/icons/FOSSIL_UNLOCK_BUTTON.svg"
            alt=""
            aria-hidden="true"
            draggable="false"
          />
          <div>
            <h2>{t("fossil_unlocks.title")}</h2>
            <p>{t("fossil_unlocks.subtitle")}</p>
          </div>
        </div>
      }
    >
      <div className="fossil-unlocks-content">
        <GameFossilRestoration />
        <section className="fossil-unlocks-catalog">
          <div className="fossil-unlocks-toolbar">
            <label>
              <span aria-hidden="true">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Pokémon or condition..."
                aria-label="Search Fossil Unlocks"
              />
            </label>
          </div>

          {visibleUnlocks.length > 0 ? (
            <div className="fossil-unlocks-grid">
              {sortedUnlocks.map((unlock, index) => {
                const cardPokemon = getPokemonData(unlock.pokemon)
                const progress = progressOf(unlock)
                const unlocked = isUnlocked(unlock)
                const tracked = trackedPokemon.has(unlock.pokemon)
                const firstUntrackedIndex = sortedUnlocks.findIndex(
                  (item) => !trackedPokemon.has(item.pokemon)
                )
                return (
                  <Fragment key={unlock.pokemon}>
                    {index === 0 && tracked && (
                      <h3 className="fossil-unlocks-section-title">
                        {t("fossil_unlocks.tracked")}
                      </h3>
                    )}
                    {index === firstUntrackedIndex &&
                      firstUntrackedIndex > 0 && (
                        <h3 className="fossil-unlocks-section-title">
                          {t("fossil_unlocks.all_unlocks")}
                        </h3>
                      )}
                    <article
                      className={`fossil-unlock-card ${unlocked ? "is-unlocked" : ""} ${tracked ? "is-tracked" : ""}`}
                      style={
                        {
                          "--rarity-color": RarityColor[cardPokemon.rarity]
                        } as CSSProperties
                      }
                    >
                      <div
                        className="fossil-unlock-portrait"
                        style={{
                          backgroundImage: `url("${getCachedPortrait(cardPokemon.index, connectedPlayer?.pokemonCustoms)}")`
                        }}
                      >
                        {/* one row so the badge and the pin share a baseline
                            whatever their own font sizes are */}
                        <div className="fossil-unlock-portrait-footer">
                          <span className="fossil-unlock-state">
                            <img
                              src={`/assets/icons/${unlocked ? "FOSSIL_OPEN_ICON" : "FOSSIL_CLOSE_ICON"}.svg`}
                              alt=""
                              aria-hidden="true"
                              draggable="false"
                            />
                            {t(
                              unlocked
                                ? "fossil_unlocks.unlocked"
                                : "fossil_unlocks.locked"
                            )}
                          </span>
                          {/* shown even once unlocked, so a card pinned before
                              the unlock can still be unpinned */}
                          <button
                            type="button"
                            className="fossil-unlock-track"
                            aria-pressed={tracked}
                            aria-label={t(
                              tracked
                                ? "fossil_unlocks.untrack"
                                : "fossil_unlocks.track"
                            )}
                            title={t(
                              tracked
                                ? "fossil_unlocks.untrack"
                                : "fossil_unlocks.track"
                            )}
                            onClick={() => toggleTracked(unlock.pokemon)}
                          >
                            <img
                              src="/assets/icons/FOSSIL_PIN_ICON.svg"
                              alt=""
                              aria-hidden="true"
                              draggable="false"
                            />
                          </button>
                        </div>
                      </div>
                      <div className="fossil-unlock-details">
                        <div className="fossil-unlock-title-row">
                          <div>
                            <h3>{t(`pkm.${unlock.pokemon}`)}</h3>
                          </div>
                          <ul>
                            {Array.from(cardPokemon.types).map((type) => (
                              <li key={type}>
                                <SynergyIcon type={type} />
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="fossil-unlock-condition">
                          <FossilUnlockCondition
                            conditionKey={unlock.conditionKey}
                          />
                        </p>
                        <div className="fossil-unlock-progress-label">
                          <span>{t("fossil_unlocks.progress")}</span>
                          <strong>
                            {progress} / {unlock.target}
                          </strong>
                        </div>
                        <div className="fossil-unlock-progress">
                          <i
                            style={{
                              width: `${Math.min(100, (progress / unlock.target) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </article>
                  </Fragment>
                )
              })}
            </div>
          ) : (
            <div className="fossil-unlocks-empty">
              No discoveries match “{search}”.
            </div>
          )}
        </section>
      </div>
    </Modal>
  )
}
