import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  EVOLUTION_LAB_REWARD_EXP,
  EVOLUTION_LAB_REWARD_REROLLS
} from "../../../../../config"
import type { PlayerChoice } from "../../../../../models/colyseus-models/player-choice"
import { type Item, ShinyItems } from "../../../../../types/enum/Item"
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
import type { IDetailledPokemon } from "../../../models/bot-v2"
import { pickChoice, pickArmoryGift } from "../../../network"
import { getGameScene } from "../../game"
import { playSound, SOUNDS } from "../../utils/audio"
import { addIconsToDescription } from "../../utils/descriptions"
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

  if (choices.length === 0 || life <= 0) {
    return null
  }

  const choice = choices[0] // only display one choice at a time, the others will be displayed after the first one is picked

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

        {choice.type === "evolution_lab_reward" ? (
          <div className="game-choice-items-list game-choice-reward-list">
            <div
              className="my-box active clickable"
              onClick={(event) => {
                event.stopPropagation()
                playSound(SOUNDS.BUTTON_CLICK)
                pickChoice(choice.id, 0)
              }}
            >
              <img
                style={{ width: "4rem", height: "4rem" }}
                src={"assets/item/" + choice.items[0] + ".png"}
              />
              <h3 style={{ margin: "0.25em 0" }}>
                {t(`item.${choice.items[0]}`)}
              </h3>
              <p style={{ marginBottom: "0.5em" }}>
                {addIconsToDescription(t(`item_description.${choice.items[0]}`))}
              </p>
            </div>

            <div
              className="my-box active clickable"
              onClick={(event) => {
                event.stopPropagation()
                playSound(SOUNDS.BUTTON_CLICK)
                pickChoice(choice.id, 1)
              }}
            >
              <div style={{ display: "flex", gap: "0.25em" }}>
                {choice.items2.map((component, i) => (
                  <img
                    key={i}
                    style={{ width: "3rem", height: "3rem" }}
                    src={"assets/item/" + component + ".png"}
                  />
                ))}
              </div>
              <p style={{ margin: "0.25em 0" }}>
                {t("player_choices.evolution_lab_components", {
                  count: choice.items2.length
                })}
              </p>
            </div>

            <div
              className="my-box active clickable"
              onClick={(event) => {
                event.stopPropagation()
                playSound(SOUNDS.BUTTON_CLICK)
                pickChoice(choice.id, 2)
              }}
            >
              <img
                style={{ width: "4rem", height: "4rem" }}
                src={"/assets/ui/refresh.svg"}
              />
              <p style={{ margin: "0.25em 0" }}>
                {t("player_choices.evolution_lab_rerolls", {
                  count: EVOLUTION_LAB_REWARD_REROLLS
                })}
              </p>
            </div>

            <div
              className="my-box active clickable"
              onClick={(event) => {
                event.stopPropagation()
                playSound(SOUNDS.BUTTON_CLICK)
                pickChoice(choice.id, 3)
              }}
            >
              <img
                style={{ width: "4rem", height: "4rem" }}
                src={"assets/icons/EXP.svg"}
              />
              <p style={{ margin: "0.25em 0" }}>
                {t("player_choices.evolution_lab_exp", {
                  count: EVOLUTION_LAB_REWARD_EXP
                })}
              </p>
            </div>
          </div>
        ) : choice.pokemons.length > 0 ? (
          <div className="game-choice-pokemons-list">
            {choice.pokemons.map((proposition, index) => {
              const item = choice.items[index]
              const item2 = choice.items2[index]
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
                      <p>
                        {addIconsToDescription(t(`item_description.${item}`))}
                      </p>
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
                          <p>
                            {addIconsToDescription(
                              t(`item_description.${item2}`)
                            )}
                          </p>
                        </>
                      )}
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
