import {
  type CSSProperties,
  type DragEvent,
  type PointerEvent,
  type ReactNode,
  useState
} from "react"
import { useTranslation } from "react-i18next"
import { RarityColor } from "../../../../../config"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { Emotion } from "../../../../../types/enum/Emotion"
import { Rarity } from "../../../../../types/enum/Game"
import {
  Pkm,
  PkmFamily,
  PkmIndex,
  Unowns
} from "../../../../../types/enum/Pokemon"
import { Synergy } from "../../../../../types/enum/Synergy"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { clamp } from "../../../../../utils/number"
import { cc } from "../../utils/jsx"
import SynergyIcon from "../icons/synergy-icon"

// a shiny turns over one and a half times in the flip's own direction, fast
// then settling; the burst, sheen and emotes are timed to when it lands
const SHINY_TURN_MS = 1200
export const SHINY_LANDING_MS = 950

const HOLO_MAX_TILT_DEG = 14
// a press held longer than this only tilts the card, it does not open it
const HOLO_HOLD_THRESHOLD_MS = 250
const HOLO_LIGHT_PROPERTIES = [
  "--holo-x",
  "--holo-y",
  "--holo-tilt-x",
  "--holo-tilt-y"
]

// extra tilt the card can still gain past its edge, as a share of the edge tilt
const HOLO_OUTSIDE_TILT_SHARE = 1

// linear over the card, then easing off without ever stopping, so a pointer
// dragged far away keeps the card moving
function getTiltOffset(position: number) {
  const offset = position - 0.5
  const outside = Math.abs(offset) - 0.5
  if (outside <= 0) return offset
  const eased = 0.5 + 0.5 * HOLO_OUTSIDE_TILT_SHARE * (outside / (1 + outside))
  return Math.sign(offset) * eased
}

interface CardPress {
  box: DOMRect
  pointerX: number
  pointerY: number
  frame: number | null
}

// the card is measured once per press, untilted, and redrawn at most once
// per frame: pointer events fire faster than frames on high rate mice
const cardPresses = new WeakMap<HTMLButtonElement, CardPress>()

function queueHoloTilt(event: PointerEvent<HTMLButtonElement>) {
  const card = event.currentTarget
  const press = cardPresses.get(card)
  if (!press) return
  press.pointerX = event.clientX
  press.pointerY = event.clientY
  if (press.frame !== null) return
  press.frame = requestAnimationFrame(() => {
    press.frame = null
    tiltHoloTowardPointer(card, press)
  })
}

// the pressed side comes toward the viewer, like TCG Pocket
function tiltHoloTowardPointer(card: HTMLButtonElement, press: CardPress) {
  const { box } = press
  const x = (press.pointerX - box.left) / box.width
  const y = (press.pointerY - box.top) / box.height
  // a captured pointer can leave the card: the light stays on it, or the foil
  // layers would show their seams
  const style = card.style
  style.setProperty("--holo-x", `${clamp(x, 0, 1) * 100}%`)
  style.setProperty("--holo-y", `${clamp(y, 0, 1) * 100}%`)
  style.setProperty(
    "--holo-tilt-x",
    `${getTiltOffset(y) * HOLO_MAX_TILT_DEG}deg`
  )
  style.setProperty(
    "--holo-tilt-y",
    `${-getTiltOffset(x) * HOLO_MAX_TILT_DEG}deg`
  )
}

function resetHoloLight(card: HTMLButtonElement) {
  for (const property of HOLO_LIGHT_PROPERTIES) {
    card.style.removeProperty(property)
  }
}

// the press state lives on the element, so a list of cards can share these
const cardTiltHandlers = {
  onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    const card = event.currentTarget
    card.setPointerCapture(event.pointerId)
    card.dataset.holoPressed = String(Date.now())
    delete card.dataset.holoHeld
    cardPresses.set(card, {
      box: card.getBoundingClientRect(),
      pointerX: event.clientX,
      pointerY: event.clientY,
      frame: null
    })
    queueHoloTilt(event)
  },
  onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.dataset.holoPressed) queueHoloTilt(event)
  },
  onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    endCardPress(event)
  },
  onPointerCancel(event: PointerEvent<HTMLButtonElement>) {
    endCardPress(event)
  },
  onDragStart(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
  }
}

function endCardPress(event: PointerEvent<HTMLButtonElement>) {
  const card = event.currentTarget
  const pressedAt = Number(card.dataset.holoPressed)
  if (!pressedAt) return
  if (Date.now() - pressedAt > HOLO_HOLD_THRESHOLD_MS) {
    card.dataset.holoHeld = ""
  }
  delete card.dataset.holoPressed
  const press = cardPresses.get(card)
  if (press?.frame != null) cancelAnimationFrame(press.frame)
  cardPresses.delete(card)
  resetHoloLight(card)
}

// true once after a long press, so that press does not also click the card
function consumeHeldPress(card: HTMLElement) {
  const wasHeld = card.dataset.holoHeld !== undefined
  delete card.dataset.holoHeld
  return wasHeld
}

export type SpecialCardKind = "shiny" | "holo"

// sampled from each kind's background artwork
export const SPECIAL_CARD_PALETTES: Record<SpecialCardKind, string[]> = {
  shiny: ["#f7a8d8", "#9fe6d6", "#ffe08a", "#ffb36b", "#9ecbff"],
  holo: ["#ff4d8d", "#33c7f0", "#ffe14d", "#2b4bd8", "#ff8a3d"]
}

const CARD_BACKGROUNDS_BY_KIND: Record<SpecialCardKind, string[]> = {
  shiny: ["assets/ui/card-bg/shiny.avif"],
  holo: [
    "assets/ui/card-bg/holo-1.avif",
    "assets/ui/card-bg/holo-2.avif",
    "assets/ui/card-bg/holo-3.avif"
  ]
}

// every regular backdrop numbered by the scene it shows
const REGULAR_CARD_BACKGROUNDS_BY_SYNERGY: Record<Synergy, number[]> = {
  [Synergy.NORMAL]: [2, 15, 16, 27, 48, 49],
  [Synergy.FLYING]: [10, 48, 50, 51],
  [Synergy.FIELD]: [16, 27, 30, 49],
  [Synergy.DARK]: [3, 17, 42],
  [Synergy.GROUND]: [18, 20, 40, 43, 47],
  [Synergy.PSYCHIC]: [1, 14, 44, 55],
  [Synergy.GRASS]: [6, 25, 31],
  [Synergy.BUG]: [12, 23, 31, 42, 52],
  [Synergy.WATER]: [13, 29, 33, 41, 56],
  [Synergy.AQUATIC]: [22, 33, 34, 39, 54],
  [Synergy.POISON]: [5, 36, 52],
  [Synergy.FAIRY]: [5, 8, 9, 35],
  [Synergy.FIGHTING]: [15, 32, 47],
  [Synergy.FIRE]: [24, 43, 46],
  [Synergy.GHOST]: [3, 14, 21, 37],
  [Synergy.ROCK]: [7, 19, 26, 45],
  [Synergy.MONSTER]: [17, 38, 45],
  [Synergy.AMORPHOUS]: [21, 36],
  [Synergy.WILD]: [23, 30],
  [Synergy.SOUND]: [32, 51],
  [Synergy.FLORA]: [6, 8, 34],
  [Synergy.STEEL]: [11, 44],
  [Synergy.ELECTRIC]: [11, 54],
  [Synergy.ICE]: [4, 19, 28, 55],
  [Synergy.BABY]: [9, 12, 22],
  [Synergy.HUMAN]: [15, 53, 56],
  [Synergy.DRAGON]: [26, 37, 38, 50],
  [Synergy.LIGHT]: [21, 25, 35, 51],
  [Synergy.GOURMET]: [9, 53],
  [Synergy.FOSSIL]: [7, 18, 39],
  [Synergy.ARTIFICIAL]: [1, 11, 44],
  [Synergy.PRODIGY]: [1, 14, 35]
}

// families whose type scene does not fit them
const SCENE_BY_FAMILY: Partial<Record<Pkm, number>> = {
  [Pkm.GROWLITHE]: 16,
  [Pkm.PICHU]: 49,
  [Pkm.MAREANIE]: 41,
  [Pkm.WIMPOD]: 41,
  [Pkm.DONDOZO]: 41,
  [Pkm.ZYGARDE_10]: 38,
  [Pkm.SOLOSIS]: 1
}
const UNOWN_SCENE = 44

// cropped from official card illustrations to a part without any Pokemon
const CARD_ART_BY_POKEMON: Partial<Record<Pkm, string>> = {
  [Pkm.ENTEI]: "entei",
  [Pkm.RAIKOU]: "raikou",
  [Pkm.SUICUNE]: "suicune",
  [Pkm.MELMETAL]: "melmetal",
  [Pkm.HO_OH]: "ho_oh",
  [Pkm.LUGIA]: "ho_oh",
  [Pkm.SHADOW_LUGIA]: "ho_oh"
}

function getRegularCardBackground(sceneNumber: number) {
  return `assets/ui/card-bg/regular-${String(sceneNumber).padStart(2, "0")}.jpg`
}

// the family's first type picks the scene; typeless forms like Arceus and
// Kecleon fall back to their own types, then to Normal
function getFamilySynergy(pokemon: Pkm) {
  return (
    getPokemonData(PkmFamily[pokemon]).types[0] ??
    getPokemonData(pokemon).types[0] ??
    Synergy.NORMAL
  )
}

const CARD_ART_CROPS = ["0%", "50%", "100%"]
// Legendary and Unique Pokemon share a scene with no evolution beside them,
// so each one gets its own crop
const SOLO_CARD_ART_CROP_STEPS = 10

function getPkmHash(pokemon: Pkm) {
  return [...PkmIndex[pokemon]].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0
  )
}

// fixed per family, so every stage of a family shares the same backdrop
function getFamilyHash(pokemon: Pkm) {
  return getPkmHash(PkmFamily[pokemon])
}

// each stage shows the next crop of that backdrop, so a family pans across the
// artwork; forms past the last crop (megas) fall back to a stable random one
function getPkmCrop(pokemon: Pkm) {
  const { stars, rarity } = getPokemonData(pokemon)
  if (rarity === Rarity.LEGENDARY || rarity === Rarity.UNIQUE) {
    const step = getPkmHash(pokemon) % (SOLO_CARD_ART_CROP_STEPS + 1)
    return `${(step * 100) / SOLO_CARD_ART_CROP_STEPS}%`
  }
  if (stars < 1 || stars > CARD_ART_CROPS.length) {
    return CARD_ART_CROPS[getPkmHash(pokemon) % CARD_ART_CROPS.length]
  }
  return CARD_ART_CROPS[stars - 1]
}

// fixed per family, so a card always shows the same backdrop and crop
function getCardBackground(kind: SpecialCardKind | null, pokemon: Pkm) {
  if (kind) {
    const backgrounds = CARD_BACKGROUNDS_BY_KIND[kind]
    return backgrounds[getFamilyHash(pokemon) % backgrounds.length]
  }
  if (Unowns.includes(pokemon)) return getRegularCardBackground(UNOWN_SCENE)
  const familyScene = SCENE_BY_FAMILY[PkmFamily[pokemon]]
  if (familyScene) return getRegularCardBackground(familyScene)
  const cardArt = CARD_ART_BY_POKEMON[pokemon]
  if (cardArt) return `assets/ui/card-bg/pokemon/${cardArt}.jpg`
  const scenes = REGULAR_CARD_BACKGROUNDS_BY_SYNERGY[getFamilySynergy(pokemon)]
  const sceneNumber = scenes[getFamilyHash(pokemon) % scenes.length]
  return getRegularCardBackground(sceneNumber)
}

function getSpecialCardStyle(kind: SpecialCardKind) {
  return Object.fromEntries(
    SPECIAL_CARD_PALETTES[kind].map((color, i) => [
      `--card-color-${i + 1}`,
      color
    ])
  )
}

function getCardArtStyle(kind: SpecialCardKind | null, pokemon: Pkm) {
  return {
    "--card-art": `url("${getCardBackground(kind, pokemon)}")`,
    "--card-art-pos": getPkmCrop(pokemon),
    ...(kind ? getSpecialCardStyle(kind) : {})
  }
}

// one sweep per cycle; without a delay each card starts at a random point
const SHEEN_CYCLE_MS = 9000

function SeasonCardShine(props: {
  kind: SpecialCardKind
  sheenDelayMs?: number
}) {
  const [sheenOffsetMs] = useState(() => Math.random() * SHEEN_CYCLE_MS)
  return (
    <>
      <span className="season-holo-foil" aria-hidden />
      {props.kind === "shiny" && (
        <>
          <span className="season-shiny-etch" aria-hidden />
          <span className="season-shiny-glare" aria-hidden />
        </>
      )}
      <span
        className="season-holo-sheen"
        aria-hidden
        style={{
          animationDuration: `${SHEEN_CYCLE_MS}ms`,
          animationDelay:
            props.sheenDelayMs === undefined
              ? `-${sheenOffsetMs}ms`
              : `${props.sheenDelayMs}ms`
        }}
      />
      <span
        className="season-holo-badge"
        role="img"
        title={props.kind === "shiny" ? "Shiny" : "Holo"}
      />
    </>
  )
}

export default function SeasonCard(props: {
  pokemon: Pkm
  shiny?: boolean
  holo?: boolean
  emotion?: Emotion
  portraitSrc?: string
  backSrc?: string
  isFaceUp?: boolean
  flipDelayMs?: number
  sheenDelayMs?: number
  isMissing?: boolean
  className?: string
  style?: CSSProperties
  footer?: ReactNode
  synergyIconSize?: string
  cornerBadge?: ReactNode
  children?: ReactNode
  disabled?: boolean
  isTiltable?: boolean
  onClick?: () => void
}) {
  const { t } = useTranslation()
  const { pokemon } = props
  const data = getPokemonData(pokemon)
  const specialKind: SpecialCardKind | null = props.shiny
    ? "shiny"
    : props.holo
      ? "holo"
      : null

  return (
    <button
      className={cc("season-booster-card", props.className ?? "", {
        flipped: props.isFaceUp ?? true,
        shiny: props.shiny ?? false,
        holo: props.holo ?? false,
        missing: props.isMissing ?? false
      })}
      style={
        {
          ...props.style,
          ...getCardArtStyle(specialKind, pokemon),
          "--rarity-color": RarityColor[data.rarity],
          "--flip-delay": `${props.flipDelayMs ?? 0}ms`,
          "--shiny-turn-duration": `${SHINY_TURN_MS}ms`
        } as CSSProperties
      }
      disabled={props.disabled}
      onClick={(event) => {
        if (consumeHeldPress(event.currentTarget)) return
        props.onClick?.()
      }}
      {...((props.isTiltable ?? true) ? cardTiltHandlers : {})}
    >
      <span
        className="season-booster-card-inner"
        style={{ transitionDelay: `${props.flipDelayMs ?? 0}ms` }}
      >
        <img
          className="season-booster-card-back"
          src={props.backSrc ?? "assets/ui/pokecard.png"}
          alt=""
        />
        <span className="season-booster-card-front">
          <span className="season-booster-card-name">
            <span>{t(`pkm.${pokemon}`)}</span>
            <span className="season-wonder-stars">
              {Array.from({ length: data.stars }, (_, starIndex) => (
                <img key={starIndex} src="assets/ui/star.svg" alt="" />
              ))}
            </span>
          </span>
          <span className="season-booster-card-art">
            <img
              src={
                props.portraitSrc ??
                getPortraitSrc(
                  PkmIndex[pokemon],
                  props.shiny ?? false,
                  props.emotion ?? Emotion.NORMAL
                )
              }
              width={56}
              height={56}
              alt=""
            />
          </span>
          {props.footer ?? (
            <span className="season-booster-card-types">
              {data.types.map((type) => (
                <SynergyIcon
                  key={type}
                  type={type}
                  size={props.synergyIconSize ?? "18px"}
                />
              ))}
            </span>
          )}
          {specialKind && (
            <SeasonCardShine
              kind={specialKind}
              sheenDelayMs={props.sheenDelayMs}
            />
          )}
          {props.cornerBadge}
        </span>
      </span>
      {props.children}
    </button>
  )
}
