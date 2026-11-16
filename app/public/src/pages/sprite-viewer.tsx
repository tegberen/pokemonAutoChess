import { t } from "i18next"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { PkmAltForms } from "../../../config"
import { getPokemonData } from "../../../models/precomputed/precomputed-pokemon-data"
import { Ability } from "../../../types/enum/Ability"
import { Orientation } from "../../../types/enum/Game"
import type { Item } from "../../../types/enum/Item"
import { Pkm } from "../../../types/enum/Pokemon"
import { Status } from "../../../types/enum/Status"
import { values } from "../../../utils/object"
import {
  hasMegaEvolutionAnimation
} from "../game/components/mega-evolution-animation"
import { AbilitiesAnimations } from "../game/components/abilities-animations"
import PokemonSprite from "../game/components/pokemon"
import { Checkbox } from "./component/checkbox/checkbox"
import DebugScene from "./component/debug/debug-scene"
import { MainSidebar } from "./component/main-sidebar/main-sidebar"
import { PokemonTypeahead } from "./component/typeahead/pokemon-typeahead"
import { cc } from "./utils/jsx"
import "./sprite-viewer.css"

const REPLAY_SPEEDS = [1, 0.5, 0.25]

// animations no Pokemon casts as its own ability, like Unison follow-ups
const EFFECT_ANIMATIONS = Object.keys(AbilitiesAnimations)
  .filter((key) => !values(Ability).includes(key as Ability))
  .sort()

// one caster per ability, a regular form when there is one
function getAbilityCasters() {
  const casters = new Map<Exclude<Ability, Ability.DEFAULT>, Pkm>()
  values(Pkm).forEach((pkm) => {
    const ability = getPokemonData(pkm).skill
    if (ability === Ability.DEFAULT) return
    const current = casters.get(ability)
    const replacesAltForm =
      current !== undefined &&
      PkmAltForms.includes(current) &&
      !PkmAltForms.includes(pkm)
    if (!current || replacesAltForm) casters.set(ability, pkm)
  })
  return casters
}

function readEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  return value !== null && allowed.includes(value as T)
    ? (value as T)
    : fallback
}

export function SpriteDebug() {
  const navigate = useNavigate()
  // every setting lives in the URL, so a reload after a rebuild keeps the view
  const [searchParams, setSearchParams] = useSearchParams()
  const [pkm, setPkm] = useState<Pkm>(
    readEnumParam(searchParams.get("pkm"), values(Pkm), Pkm.RATTATA)
  )
  const [shiny, setShiny] = useState<boolean>(
    searchParams.get("shiny") === "1"
  )
  const [orientation, setOrientation] = useState<Orientation>(
    readEnumParam(
      searchParams.get("orientation"),
      values(Orientation),
      Orientation.UPRIGHT
    )
  )
  const [animationType, setAnimType] = useState<string>(
    searchParams.get("anim") ?? "Idle"
  )
  const [status, setStatus] = useState<Status | "">(
    (searchParams.get("status") as Status | null) ?? ""
  )
  const [awakening, setAwakening] = useState<Item | "">(
    (searchParams.get("awakening") as Item | null) ?? ""
  )
  const [replaySpeed, setReplaySpeed] = useState<number>(
    Number(searchParams.get("speed")) || 1
  )
  const [showBoard, setShowBoard] = useState<boolean>(
    searchParams.get("board") !== "0"
  )
  const [effect, setEffect] = useState<string>(
    readEnumParam(searchParams.get("effect"), EFFECT_ANIMATIONS, "")
  )
  const isMegaEvolution = animationType === "MegaEvolution"
  const pokemonOptions = Object.values(Pkm)
    .filter((option) => !isMegaEvolution || hasMegaEvolutionAnimation(option))
    .sort((a, b) => t(`pkm.${a}`).localeCompare(t(`pkm.${b}`)))
  const abilityCasters = useMemo(getAbilityCasters, [])
  const abilityOptions = useMemo(
    () =>
      [...abilityCasters.keys()].sort((a, b) =>
        t(`ability.${a}`).localeCompare(t(`ability.${b}`))
      ),
    [abilityCasters]
  )

  useEffect(() => {
    const params: Record<string, string> = { pkm, anim: animationType }
    if (shiny) params.shiny = "1"
    if (orientation !== Orientation.UPRIGHT) params.orientation = orientation
    if (status) params.status = status
    if (awakening) params.awakening = awakening
    if (replaySpeed !== 1) params.speed = String(replaySpeed)
    if (!showBoard) params.board = "0"
    if (effect) params.effect = effect
    setSearchParams(params, { replace: true })
  }, [
    effect,
    pkm,
    animationType,
    shiny,
    orientation,
    status,
    awakening,
    replaySpeed,
    showBoard,
    setSearchParams
  ])

  return (
    <div className="sprite-viewer-root">
      <MainSidebar
        page="main_lobby"
        leave={() => navigate("/lobby")}
        leaveLabel={t("back_to_lobby")}
      />
      <div className="sprite-viewer-container">
        <div className="sprite-viewer-toolbar my-box">
          <label htmlFor="pokemon-typeahead">Pokemon</label>
          <PokemonTypeahead
            value={pkm}
            options={pokemonOptions}
            onChange={(pkm) => {
              if (pkm) {
                setPkm(pkm)
                setEffect("")
              }
            }}
          />
          <label htmlFor="sprite-viewer-ability">Ability</label>
          <select
            id="sprite-viewer-ability"
            value={effect || getPokemonData(pkm).skill}
            onChange={(e) => {
              const value = e.currentTarget.value
              setAnimType("Ability")
              if (EFFECT_ANIMATIONS.includes(value)) {
                setEffect(value)
                return
              }
              const caster = abilityCasters.get(
                value as Exclude<Ability, Ability.DEFAULT>
              )
              if (!caster) return
              setPkm(caster)
              setEffect("")
            }}
          >
            {getPokemonData(pkm).skill === Ability.DEFAULT && (
              <option value={Ability.DEFAULT}>-</option>
            )}
            <optgroup label="Abilities">
              {abilityOptions.map((ability) => (
                <option value={ability} key={ability}>
                  {t(`ability.${ability}`)}
                </option>
              ))}
            </optgroup>
            <optgroup label="Effects">
              {EFFECT_ANIMATIONS.map((key) => (
                <option value={key} key={key}>
                  {key}
                </option>
              ))}
            </optgroup>
          </select>
          <Checkbox
            checked={shiny}
            onToggle={setShiny}
            label={t("shiny")}
            isDark
          />

          <label htmlFor="sprite-viewer-orientation">Orientation</label>
          <select
            id="sprite-viewer-orientation"
            value={orientation}
            onChange={(e) =>
              setOrientation(e.currentTarget.value as Orientation)
            }
          >
            {Object.entries(Orientation).map(([k, v]) => (
              <option value={v} key={v}>
                {k}
              </option>
            ))}
          </select>

          <label htmlFor="sprite-viewer-anim-type">Anim type</label>
          <select
            id="sprite-viewer-anim-type"
            value={animationType}
            onChange={(e) => {
              const nextAnimationType = e.currentTarget.value
              setAnimType(nextAnimationType)
              if (
                nextAnimationType === "MegaEvolution" &&
                !hasMegaEvolutionAnimation(pkm)
              ) {
                setPkm(Pkm.MEGA_ABSOL)
              }
            }}
          >
            <option value="Idle">Idle</option>
            <option value="Walk">Walk</option>
            <option value="Sleep">Sleep</option>
            <option value="Eat">Eat</option>
            <option value="Hurt">Hurt</option>
            <option value="Hop">Hop</option>
            <option value="Attack">Attack</option>
            <option value="Ability">Ability</option>
            <option value="Emote">Emote</option>
            <option value="MegaEvolution">Mega Evolution</option>
          </select>

          <label htmlFor="sprite-viewer-status">Status</label>
          <select
            id="sprite-viewer-status"
            value={status}
            onChange={(e) => setStatus(e.currentTarget.value as Status)}
          >
            <option value="">None</option>
            {Object.entries(Status).map(([k, v]) => (
              <option value={v} key={v}>
                {k}
              </option>
            ))}
            <option value="POISONNED_BADLY">Poisonned badly</option>
            <option value="BALM_MUSHROOM">Balm Mushroom</option>
            <option value="BOOST/ATK">Boost Attack</option>
            <option value="BOOST/DEF">Boost Defense</option>
            <option value="BOOST/SPE_DEF">Boost Special Defense</option>
            <option value="BOOST/SHIELD">Boost Shield</option>
            <option value="BOOST/SPEED">Boost Speed</option>
            <option value="BOOST/AP">Boost AP</option>
          </select>

          <label htmlFor="sprite-viewer-awakening">Awakening</label>
          <select
            id="sprite-viewer-awakening"
            value={awakening}
            onChange={(e) => setAwakening(e.currentTarget.value as Item | "")}
          >
            <option value="">None</option>
            {(Object.keys(PokemonSprite.AWAKENING_COLORS) as Item[]).map(
              (rock) => (
                <option value={rock} key={rock}>
                  {t(`item.${rock}`)}
                </option>
              )
            )}
          </select>

          <Checkbox
            checked={showBoard}
            onToggle={setShowBoard}
            label="Board"
            isDark
          />

          <span className="sprite-viewer-speeds">
            {REPLAY_SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                className={cc("bubbly", { blue: replaySpeed === speed })}
                onClick={() => setReplaySpeed(speed)}
              >
                {speed === 1 ? "1×" : `${speed}×`}
              </button>
            ))}
          </span>
        </div>
        <div className="sprite-viewer-sprite">
          <DebugScene
            pkm={pkm}
            orientation={orientation}
            animationType={animationType}
            shiny={shiny}
            status={status}
            awakening={awakening}
            timeScale={replaySpeed}
            showBoard={showBoard}
            effect={animationType === "Ability" ? effect : ""}
            width={1950}
            height={1000}
          />
        </div>
      </div>
    </div>
  )
}
