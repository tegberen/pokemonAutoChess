import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  EVOLUTION_LAB_REWARD_EXP,
  EVOLUTION_LAB_REWARD_GOLD,
  EVOLUTION_LAB_REWARD_REROLLS
} from "../../../../../config"
import type { PlayerChoice } from "../../../../../models/colyseus-models/player-choice"
import {
  Item,
  ShinyItems,
  SynergyGems,
  SynergyGivenByGem
} from "../../../../../types/enum/Item"
import {
  type Pkm,
  PkmDuo,
  PkmDuos,
  PkmFamily
} from "../../../../../types/enum/Pokemon"
import { SpecialGameRule } from "../../../../../types/enum/SpecialGameRule"
import { isIn } from "../../../../../utils/array"
import { DEPTH } from "../../../game/depths"
import { selectConnectedPlayer, useAppSelector } from "../../../hooks"
import { usePreference } from "../../../preferences"
import type { IDetailledPokemon } from "../../../models/bot-v2"
import { pickChoice, pickArmoryGift, rerollChoice } from "../../../network"
import { Blessings } from "../../../../../config/game/blessings"
import type { Blessing } from "../../../../../types/enum/Blessing"
import { getGameScene } from "../../game"
import { playSound, SOUNDS } from "../../utils/audio"
import { addIconsToDescription, iconRegExp } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { LocalStoreKeys, localStore } from "../../utils/store"
import GamePokemonDuoPortrait from "./game-pokemon-duo-portrait"
import GamePokemonPortrait from "./game-pokemon-portrait"
import GameSmearglePack from "./game-smeargle-pack"
import { ScribbleShapeGlyph } from "./game-scribble-sketchbook"
import "./game-choice.css"
import { ArmoryOptions, ArmoryOptionsPrice } from "../../../../../types/enum/ArmoryOptions"

function isPokemonChoice(choice: PlayerChoice): boolean {
  return choice.pokemons.length > 0
}

export default function GameChoice() {
  const { t } = useTranslation()
  const connectedPlayer = useAppSelector(selectConnectedPlayer)
  const specialGameRule = useAppSelector((state) => state.game.specialGameRule)

  const life = connectedPlayer?.life ?? 0
  const choices = connectedPlayer?.choices ?? []

  const board = getGameScene()?.board
  const hasPokemonChoice = choices.some(isPokemonChoice)
  const containsDuo = choices.some((choice) =>
    choice.pokemons.some((pokemon) => pokemon in PkmDuo)
  )
  const isBenchFull =
    board && hasPokemonChoice && board.getBenchSize() >= (containsDuo ? 7 : 8)

  const [teamPlanner, setTeamPlanner] = useState<IDetailledPokemon[]>(
    localStore.get(LocalStoreKeys.TEAM_PLANNER)
  )

  useEffect(() => {
    const updateTeamPlanner = (event: StorageEvent) => {
      if (event.key === LocalStoreKeys.TEAM_PLANNER) {
        setTeamPlanner(localStore.get(LocalStoreKeys.TEAM_PLANNER))
      }
    }

    window.addEventListener("storage", updateTeamPlanner)

    return () => {
      window.removeEventListener("storage", updateTeamPlanner)
    }
  }, [])

  const [visible, setVisible] = useState(true)
  const [showBlessingGlow] = usePreference("showBlessingGlow")
  const previousBlessings = useRef<Blessing[]>([])

  useEffect(() => {
    previousBlessings.current = [...(choices[0]?.blessings ?? [])]
  })

  // item icons inside blessing descriptions load later than the text, so warm
  // them for every blessing before any of them can be shown
  useEffect(() => {
    const itemNames = new Set(Object.keys(Item))
    const itemsInDescriptions = new Set<string>()
    ;(Object.keys(Blessings) as Blessing[]).forEach((blessing) => {
      const description = t(`blessing.${blessing}.description`)
      for (const token of description.match(iconRegExp) ?? []) {
        if (itemNames.has(token)) itemsInDescriptions.add(token)
      }
    })
    itemsInDescriptions.forEach((item) => {
      const preloaded = new Image()
      preloaded.src = `assets/item/${item}.png`
      // decoding up front, otherwise the icon still paints a frame after the text
      preloaded.decode().catch(() => undefined)
    })
  }, [t])

  if (choices.length === 0 || life <= 0) {
    return null
  }

  const choice = choices[0] // only display one choice at a time, the others will be displayed after the first one is picked

  // a reroll replaces exactly one blessing, a new selection replaces them all
  const isSingleSlotChange =
    previousBlessings.current.length === choice.blessings.length &&
    choice.blessings.filter(
      (blessing, index) => previousBlessings.current[index] !== blessing
    ).length === 1

  if (
    choice.type === "starter" &&
    choice.pokemons.length > 0 &&
    specialGameRule === SpecialGameRule.SMEARGLE_PACK
  ) {
    return (
      <GameSmearglePack
        key={choice.id}
        choice={choice}
        disabled={isBenchFull}
      />
    )
  }

  let message: string | null = null
  if (choice.type === "addPick") {
    message = t("player_choices.choose_add_pick")
  } else if (choice.type === "starter") {
    message =
      specialGameRule === SpecialGameRule.FIRST_PARTNER
        ? t("player_choices.choose_first_partner")
        : t("player_choices.choose_starter")
  } else if (choice.type === "mission_order") {
    message = t("player_choices.choose_mission_order")
  } else if (choice.type === "unique") {
    message = t("player_choices.choose_unique")
  } else if (choice.type === "legendary") {
    message = t("player_choices.choose_legendary")
  } else if (choice.type === "item") {
    message = t("player_choices.choose_item")
  } else if (choice.type === "wand") {
    message = t("player_choices.choose_wand")
  } else if (choice.type === "armory_assist") {
    message = t("player_choices.choose_armory")
  } else if (choice.type === "scribble_shape") {
    message = t("player_choices.choose_scribble_shape")
  } else if (choice.type === "evolution_lab_reward") {
    message = t("player_choices.choose_evolution_lab_reward")
  } else if (choice.type === "blessing") {
    message = t("player_choices.choose_blessing")
  } else if (choice.type === "singularity") {
    message = t("player_choices.choose_singularity")
  } else if (choice.type === "starter_choice") {
    message = t("player_choices.choose_starter_choice")
  }

  return (
    <div className="game-choice" style={{ zIndex: DEPTH.MODAL }}>
      <div
        className="my-container"
        style={{ visibility: visible ? "visible" : "hidden" }}
      >
        {message && <h2>{message}</h2>}
        {choices.length > 1 && (
          <p style={{ textAlign: "center", opacity: 0.7, fontSize: "0.9em" }}>
            {t("player_choices.more_choices", { count: choices.length - 1 })}
          </p>
        )}

        {choice.type === "blessing" ? (
          <div className="game-choice-items-list game-choice-blessings-list">
            {choice.blessings.map((blessing, index) => {
              const blessingDefinition = Blessings[blessing]
              const wasRerolled =
                isSingleSlotChange &&
                previousBlessings.current[index] !== blessing
              const blockedByFullBench =
                blessingDefinition.grantsPokemonImmediately &&
                (board?.getBenchSize() ?? 0) >= 8
              return (
              <div
                key={`blessing-slot-${index}`}
                className="game-choice-blessing-slot"
              >
              <div
                className={cc(
                  "my-box",
                  `blessing-tier-${blessingDefinition.tier.toLowerCase()}`,
                  {
                    "active clickable": !blockedByFullBench,
                    "blessing-glow": showBlessingGlow
                  }
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  if (blockedByFullBench) return
                  playSound(SOUNDS.BUTTON_CLICK)
                  pickChoice(choice.id, index)
                }}
              >
                <div
                  className={cc("blessing-body", {
                    "blessing-body-flip": wasRerolled
                  })}
                  key={blessing}
                >
                  <img
                    className="blessing-icon"
                    src={`/assets/blessings/${blessingDefinition.icon}.svg`}
                    alt=""
                  />
                  <h3>{t(`blessing.${blessing}.name`)}</h3>
                  <p>
                    {addIconsToDescription(
                      t(`blessing.${blessing}.description`)
                    )}
                  </p>
                </div>
              </div>
              <button
                className="bubbly blue blessing-reroll-button"
                disabled={choice.rerollableSlots[index] !== true}
                onClick={(event) => {
                  event.stopPropagation()
                  playSound(SOUNDS.BUTTON_CLICK)
                  rerollChoice(choice.id, index)
                }}
              >
                <img src="/assets/ui/refresh.svg" alt="" />
                {t("player_choices.reroll_blessing")}
              </button>
              </div>
              )
            })}
          </div>
        ) : choice.type === "evolution_lab_reward" ? (
          <div className="game-choice-items-list game-choice-reward-list">
            {choice.rewards.map((reward, index) => {
              const icon =
                reward === "gem"
                  ? "assets/icons/SYNERGY_GEM.svg"
                  : reward === "components"
                    ? "assets/icons/COMPONENT_BOX.svg"
                    : reward === "gold"
                      ? "assets/icons/GOLD.svg"
                      : reward === "rerolls"
                        ? "/assets/ui/refresh.svg"
                        : "assets/icons/EXP.svg"
              const gem = choice.items[0]
              const synergy =
                gem && isIn(SynergyGems, gem)
                  ? SynergyGivenByGem[gem]
                  : undefined
              const label =
                reward === "gem" ? (
                  synergy ? (
                    addIconsToDescription(
                      t("player_choices.evolution_lab_gem", { synergy })
                    )
                  ) : (
                    t(`item.${gem}`)
                  )
                ) : reward === "components" ? (
                  t("player_choices.evolution_lab_components", {
                    count: choice.items2.length
                  })
                ) : reward === "gold" ? (
                  <span className="evolution-lab-label">
                    +{EVOLUTION_LAB_REWARD_GOLD}
                    <img
                      className="icon-money"
                      src="/assets/icons/money.svg"
                      alt="$"
                      style={{ width: "1.2em", height: "1.2em" }}
                    />
                  </span>
                ) : reward === "rerolls" ? (
                  t("player_choices.evolution_lab_rerolls", {
                    count: EVOLUTION_LAB_REWARD_REROLLS
                  })
                ) : (
                  t("player_choices.evolution_lab_exp", {
                    count: EVOLUTION_LAB_REWARD_EXP
                  })
                )
              return (
                <div
                  key={`${choice.id}-${index}`}
                  className="my-box active clickable"
                  onClick={(event) => {
                    event.stopPropagation()
                    playSound(SOUNDS.BUTTON_CLICK)
                    pickChoice(choice.id, index)
                  }}
                >
                  <img
                    style={{ width: "4rem", height: "4rem" }}
                    src={icon}
                  />
                  <p style={{ margin: "0.25em 0" }}>{label}</p>
                </div>
              )
            })}
          </div>
        ) : choice.pokemons.length > 0 ? (
          <div className="game-choice-pokemons-list">
            {choice.pokemons.map((proposition, index) => {
              const item = choice.items[index]
              const item2 = choice.items2[index]
              const canRerollPokemonSlot =
                choice.type === "addPick" &&
                choice.rerollableSlots[index] === true
              const canRerollItemSlot =
                choice.type === "addPick" &&
                choice.rerollableItemSlots[index] === true
              // keep both buttons mounted once granted, so spending one does not shift the row
              const hasSlotRerolls =
                choice.type === "addPick" &&
                choice.rerollableSlots.length > 0
              return (
                <div key={`${choice.id}-${index}`} className="game-choice-add-pick-slot">
                <div
                  className="my-box active clickable"
                  onClick={(event) => {
                    event.stopPropagation()
                    playSound(SOUNDS.BUTTON_CLICK)
                    pickChoice(choice.id, index)
                  }}
                >
                  {proposition in PkmDuos ? (
                    <GamePokemonDuoPortrait
                      key={`proposition-${choice.id}-${index}`}
                      origin="proposition"
                      index={index}
                      duo={proposition as PkmDuo}
                      inPlanner={
                        teamPlanner?.some(
                          (pokemon) =>
                            pokemon.name === proposition[0] ||
                            pokemon.name === proposition[1]
                        ) ?? false
                      }
                    />
                  ) : (
                    <GamePokemonPortrait
                      key={`proposition-${choice.id}-${index}`}
                      origin="proposition"
                      index={index}
                      pokemon={proposition as Pkm}
                      inPlanner={
                        teamPlanner?.some((pokemon) => {
                          if (proposition in PkmDuos) {
                            return PkmDuos[proposition].includes(pokemon.name)
                          }

                          return PkmFamily[pokemon.name] === proposition
                        }) ?? false
                      }
                    />
                  )}

                  {item && isIn(ShinyItems, item) === false && (
                    <div className="choice-additional-item">
                      <span
                        style={{
                          fontSize: "2rem",
                          verticalAlign: "middle"
                        }}
                      >
                        +
                      </span>
                      <img
                        style={{
                          width: "2rem",
                          height: "2rem",
                          verticalAlign: "middle"
                        }}
                        src={"assets/item/" + item + ".png"}
                      />
                      {choice.type !== "addPick" && (
                        <p>
                          {addIconsToDescription(t(`item_description.${item}`))}
                        </p>
                      )}
                      {item2 && isIn(ShinyItems, item2) === false && (
                        <>
                          <hr
                            style={{
                              border: "none",
                              borderTop: "1px solid var(--color-fg-primary)",
                              opacity: 0.25,
                              margin: "0.4em auto",
                              width: "80%"
                            }}
                          />
                          <img
                            style={{
                              width: "2rem",
                              height: "2rem",
                              verticalAlign: "middle"
                            }}
                            src={"assets/item/" + item2 + ".png"}
                          />
                          {choice.type !== "addPick" && (
                            <p>
                              {addIconsToDescription(
                                t(`item_description.${item2}`)
                              )}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {hasSlotRerolls && (
                  <div className="add-pick-reroll-row">
                    <button
                      className="bubbly blue active add-pick-reroll-button"
                      disabled={!canRerollPokemonSlot}
                      title={t("player_choices.reroll_add_pick_pokemon")}
                      onClick={(event) => {
                        event.stopPropagation()
                        playSound(SOUNDS.BUTTON_CLICK)
                        rerollChoice(choice.id, index)
                      }}
                    >
                      <img src="/assets/ui/pokeball.svg" alt="" />
                      <img
                        className="add-pick-reroll-badge"
                        src="/assets/ui/refresh.svg"
                        alt=""
                      />
                    </button>
                    <button
                      className="bubbly blue active add-pick-reroll-button"
                      disabled={!canRerollItemSlot || !item}
                      title={t("player_choices.reroll_add_pick_item")}
                      onClick={(event) => {
                        event.stopPropagation()
                        playSound(SOUNDS.BUTTON_CLICK)
                        rerollChoice(choice.id, choice.pokemons.length + index)
                      }}
                    >
                      <img
                        src={
                          item
                            ? `assets/item/${item}.png`
                            : "/assets/ui/refresh.svg"
                        }
                        alt=""
                      />
                      <img
                        className="add-pick-reroll-badge"
                        src="/assets/ui/refresh.svg"
                        alt=""
                      />
                    </button>
                  </div>
                )}
                </div>
              )
            })}
          </div>
        ) : choice.scribbleShapes.length > 0 ? (
          <div className="game-choice-items-list">
            {choice.scribbleShapes.map((shapeType, index) => {
              const isCollected =
                connectedPlayer?.scribbleShapesCollected.includes(shapeType) ??
                false
              return (
                <div
                  className="my-box active clickable game-choice-scribble-shape"
                  key={`${choice.id}-${index}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    playSound(SOUNDS.BUTTON_CLICK)
                    pickChoice(choice.id, index)
                  }}
                >
                  <div className="game-choice-scribble-shape-glyph">
                    <ScribbleShapeGlyph shapeType={shapeType} collected={true} />
                  </div>
                  <h3 style={{ margin: "0.25em 0" }}>
                    {t(`scribble_shape.${shapeType}`)}
                  </h3>
                  <p style={{ marginBottom: "0.5em" }}>
                    {addIconsToDescription(
                      t(`scribble_shape_effect.${shapeType}`)
                    )}
                  </p>
                  <p
                    className="help"
                    style={{
                      marginBottom: "0.5em",
                      color: isCollected ? "gold" : undefined
                    }}
                  >
                    {isCollected
                      ? t("scribble_shape_already_collected")
                      : t("scribble_shape_not_collected")}
                  </p>
                </div>
              )
            })}
          </div>
        ) : choice.items.length > 0 ? (
          <div className="game-choice-items-list">
            {choice.items.map((item: Item, index) => {
              const item2 = choice.items2[index]
              return (
                <div
                  className="my-box active clickable"
                  key={`${choice.id}-${index}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    playSound(SOUNDS.BUTTON_CLICK)
                    pickChoice(choice.id, index)
                  }}
                >
                  <img
                    style={{ width: "4rem", height: "4rem" }}
                    src={"assets/item/" + item + ".png"}
                  />
                  <h3 style={{ margin: "0.25em 0" }}>{t(`item.${item}`)}</h3>
                  <p style={{ marginBottom: "0.5em" }}>
                    {addIconsToDescription(t(`item_description.${item}`))}
                  </p>
                  {item2 && (
                    <>
                      <hr
                        style={{
                          border: "none",
                          borderTop: "1px solid var(--color-fg-primary)",
                          opacity: 0.25,
                          margin: "0.4em auto",
                          width: "80%"
                        }}
                      />
                      <img
                        style={{ width: "4rem", height: "4rem" }}
                        src={"assets/item/" + item2 + ".png"}
                      />
                      <h3 style={{ margin: "0.25em 0" }}>
                        {t(`item.${item2}`)}
                      </h3>
                      <p style={{ marginBottom: "0.5em" }}>
                        {addIconsToDescription(t(`item_description.${item2}`))}
                      </p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ) : <div className="game-choice-items-list">
            {choice.armoryOptions.map((option: ArmoryOptions, index) => (
              <div
                className="my-box active clickable"
                key={`${choice.id}-${index}`}
                onClick={(event) => {
                  event.stopPropagation()
                  playSound(SOUNDS.BUTTON_CLICK)
                  pickArmoryGift(choice.id, index)
                }}
              >
                {<img
                  style={{ width: "4rem", height: "4rem" }}
                  src={"assets/item/" + option + ".png"}
                />}
                <h3 style={{ margin: "0.25em 0" }}>{t(`armory.${option}`)}</h3>
                <p style={{ marginBottom: "0.5em" }}>
                  {addIconsToDescription(t(`armory_description.${option}`))}
                </p>
                <p style={{ marginBottom: "0.5em", fontWeight: "bold", fontSize: "1.5rem"}}>
                  {ArmoryOptionsPrice[option]} 
                  <img className="icon-money" src="/assets/icons/money.svg" alt="$" style={{ marginLeft: "0.25em", width: "1.5rem", height: "1.5rem" }}/>
                </p>
              </div>
            ))}
          </div>
        }

        {choice.type === "addPick" &&
          choice.canReroll &&
          choice.rerollableSlots.length === 0 && (
            <button
              className="bubbly blue active"
              onClick={(event) => {
                event.stopPropagation()
                playSound(SOUNDS.BUTTON_CLICK)
                rerollChoice(choice.id)
              }}
            >
              <img src="/assets/ui/refresh.svg" alt="" />
              {t("player_choices.reroll_add_pick_all")}
            </button>
          )}

        {isBenchFull && choice.pokemons.length > 0 && (
          <p>{t("player_choices.free_slot_hint")}</p>
        )}
      </div>

      <div className="show-hide-action">
        <button
          className="bubbly orange active"
          onClick={() => {
            setVisible(!visible)
          }}
        >
          {visible ? t("hide") : t("show")}
        </button>
      </div>
    </div>
  )
}
