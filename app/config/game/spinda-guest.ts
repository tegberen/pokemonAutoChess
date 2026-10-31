import { getAvailableEmotions } from "../../models/precomputed/precomputed-emotions"
import { getPokemonData } from "../../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../../models/precomputed/precomputed-rarity"
import { Ability } from "../../types/enum/Ability"
import { Rarity } from "../../types/enum/Game"
import {
  Pkm,
  PkmFamily,
  PkmIndex,
  Unowns
} from "../../types/enum/Pokemon"
import type { ISpindaCafe } from "../../types/interfaces/UserMetadata"
import { getBaseAltForm } from "./pokemons"
import {
  getUtcDayKey,
  getUtcWeekIndex,
  getUtcWeekKey,
  isSpindaCafeOpen
} from "./season"

export type SpindaGuestSlot = "saturday" | "sunday"

export const SPINDA_GUEST_SLOTS: SpindaGuestSlot[] = ["saturday", "sunday"]

export const SPINDA_GUEST_GOAL_POINTS = 4
export const SPINDA_GUEST_POINTS_PER_GAME = 1
export const SPINDA_GUEST_POINTS_WITH_GUEST_ON_TEAM = 2
export const SPINDA_GUEST_DUPLICATE_BOOSTERS = 2

// shop Pokemon are found by playing; these can only be found by luck, so
// having one on the final team gives all the points at once
const SPINDA_GUEST_FOUND_COMPLETES_RARITIES = [
  Rarity.UNIQUE,
  Rarity.LEGENDARY,
  Rarity.HATCH
]

const MS_PER_DAY = 86_400_000
const FIRST_GUEST_WEEK_INDEX = getUtcWeekIndex(Date.UTC(2026, 9, 26))
const FIRST_GUEST_MONTH_INDEX = 2026 * 12 + 9
// the Saturday of this stretch of each month hosts a Legendary
const LEGENDARY_SATURDAY_FIRST_DAY = 21
const LEGENDARY_SATURDAY_LAST_DAY = 27

export interface SpindaGuest {
  slot: SpindaGuestSlot
  pokemon: Pkm
  goalPoints: number
  completesWhenFound: boolean
}

interface SpindaGuestPin {
  saturday: Pkm
  sunday: Pkm
}

// keyed by the weekend's Saturday; every other weekend follows the rotation
const SPINDA_GUEST_PINS: Record<string, SpindaGuestPin> = {
  "2026-10-31": { saturday: Pkm.GASTLY, sunday: Pkm.LITWICK },
  "2026-11-07": { saturday: Pkm.APPLIN, sunday: Pkm.SEEDOT },
  "2026-11-14": { saturday: Pkm.PACHIRISU, sunday: Pkm.ZIGZAGOON },
  "2026-11-21": { saturday: Pkm.CELEBI, sunday: Pkm.TEDDIURSA },
  "2026-11-28": { saturday: Pkm.FARFETCH_D, sunday: Pkm.HAPPINY },
  "2026-12-05": { saturday: Pkm.CRYOGONAL, sunday: Pkm.SNORUNT },
  "2026-12-12": { saturday: Pkm.STANTLER, sunday: Pkm.VANILLITE },
  "2026-12-19": { saturday: Pkm.DELIBIRD, sunday: Pkm.TOGEPI },
  "2026-12-26": { saturday: Pkm.JIRACHI, sunday: Pkm.AMAURA },
  "2027-01-02": { saturday: Pkm.CHIMECHO, sunday: Pkm.DRATINI },
  "2027-01-09": { saturday: Pkm.EISCUE, sunday: Pkm.SWINUB },
  "2027-01-16": { saturday: Pkm.KOMALA, sunday: Pkm.SPHEAL },
  "2027-01-23": { saturday: Pkm.ARTICUNO, sunday: Pkm.TYRUNT },
  "2027-01-30": { saturday: Pkm.CASTFORM, sunday: Pkm.TRAPINCH },
  "2027-02-06": { saturday: Pkm.GHOLDENGO, sunday: Pkm.MAREEP },
  "2027-02-13": { saturday: Pkm.LUVDISC, sunday: Pkm.BOUNSWEET },
  "2027-02-20": { saturday: Pkm.HAWLUCHA, sunday: Pkm.MACHOP },
  "2027-02-27": { saturday: Pkm.SHAYMIN, sunday: Pkm.BUDEW }
}

function getEligiblePokemons(rarities: Rarity[], maxStars: number) {
  return rarities
    .flatMap(
      (rarity) => (PRECOMPUTED_POKEMONS_PER_RARITY[rarity] ?? []) as Pkm[]
    )
    .filter((pokemon) => {
      const data = getPokemonData(pokemon)
      return (
        data.stars <= maxStars &&
        !data.additional &&
        !data.regional &&
        data.skill !== Ability.DEFAULT &&
        !Unowns.includes(pokemon) &&
        getBaseAltForm(pokemon) === pokemon &&
        getAvailableEmotions(PkmIndex[pokemon], false).length > 0
      )
    })
}

function getFirstFormPerFamily(pokemons: Pkm[]) {
  const firstForms = new Map<Pkm, Pkm>()
  for (const pokemon of pokemons) {
    const family = PkmFamily[pokemon]
    const current = firstForms.get(family)
    if (
      !current ||
      getPokemonData(pokemon).stars < getPokemonData(current).stars
    ) {
      firstForms.set(family, pokemon)
    }
  }
  return [...firstForms.values()]
}

const REGULAR_GUESTS = getEligiblePokemons(
  [
    Rarity.COMMON,
    Rarity.UNCOMMON,
    Rarity.RARE,
    Rarity.EPIC,
    Rarity.ULTRA,
    Rarity.HATCH
  ],
  1
)
const UNIQUE_GUESTS = getEligiblePokemons([Rarity.UNIQUE], 3)
const LEGENDARY_GUESTS = getEligiblePokemons([Rarity.LEGENDARY], 3)

const REGULAR_GUEST_SET = new Set(REGULAR_GUESTS)
const PINNABLE_GUEST_SET = new Set([
  ...REGULAR_GUESTS,
  ...UNIQUE_GUESTS,
  ...LEGENDARY_GUESTS
])

for (const [saturdayKey, pin] of Object.entries(SPINDA_GUEST_PINS)) {
  if (!PINNABLE_GUEST_SET.has(pin.saturday)) {
    throw new Error(
      `Spinda guest ${pin.saturday} (${saturdayKey}) not eligible`
    )
  }
  if (!REGULAR_GUEST_SET.has(pin.sunday)) {
    throw new Error(`Spinda guest ${pin.sunday} (${saturdayKey}) not regular`)
  }
}

const PINNED_FAMILIES = new Set(
  Object.values(SPINDA_GUEST_PINS).flatMap((pin) => [
    PkmFamily[pin.saturday],
    PkmFamily[pin.sunday]
  ])
)

function createRotation(pokemons: Pkm[]) {
  const available = getFirstFormPerFamily(pokemons).filter(
    (pokemon) => !PINNED_FAMILIES.has(PkmFamily[pokemon])
  )
  // a stride coprime with the list size visits every guest before any repeats
  let stride = Math.max(1, Math.floor(available.length * 0.618))
  while (greatestCommonDivisor(stride, available.length) !== 1) stride++
  return (index: number) => available[(index * stride) % available.length]
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b)
}

const getRegularRotationGuest = createRotation(REGULAR_GUESTS)
const getUniqueRotationGuest = createRotation(UNIQUE_GUESTS)
const getLegendaryRotationGuest = createRotation(LEGENDARY_GUESTS)

function createGuest(slot: SpindaGuestSlot, pokemon: Pkm): SpindaGuest {
  return {
    slot,
    pokemon,
    goalPoints: SPINDA_GUEST_GOAL_POINTS,
    completesWhenFound: SPINDA_GUEST_FOUND_COMPLETES_RARITIES.includes(
      getPokemonData(pokemon).rarity
    )
  }
}

export function getSpindaGuests(
  now = Date.now()
): Record<SpindaGuestSlot, SpindaGuest> {
  const saturday = new Date(Date.parse(getUtcWeekKey(now)) + 5 * MS_PER_DAY)
  const pin = SPINDA_GUEST_PINS[getUtcDayKey(saturday.getTime())]
  const weekNumber = Math.max(0, getUtcWeekIndex(now) - FIRST_GUEST_WEEK_INDEX)
  const monthNumber = Math.max(
    0,
    saturday.getUTCFullYear() * 12 +
      saturday.getUTCMonth() -
      FIRST_GUEST_MONTH_INDEX
  )
  const saturdayDate = saturday.getUTCDate()
  const isLegendaryWeekend =
    saturdayDate >= LEGENDARY_SATURDAY_FIRST_DAY &&
    saturdayDate <= LEGENDARY_SATURDAY_LAST_DAY
  const saturdayPokemon =
    pin?.saturday ??
    (isLegendaryWeekend
      ? getLegendaryRotationGuest(monthNumber)
      : getUniqueRotationGuest(weekNumber))
  const sundayPokemon = pin?.sunday ?? getRegularRotationGuest(weekNumber)
  return {
    saturday: createGuest("saturday", saturdayPokemon),
    sunday: createGuest("sunday", sundayPokemon)
  }
}

// null while the café is closed
export function getCurrentSpindaGuestSlot(
  now = Date.now()
): SpindaGuestSlot | null {
  const day = new Date(now).getUTCDay()
  if (day === 6) return "saturday"
  if (day === 0) return "sunday"
  return null
}

// matched by family, so an evolved guest still counts
export function getSpindaGuestGamePoints(
  guest: SpindaGuest,
  finalPokemon: Pkm[]
) {
  const isOnTeam = finalPokemon.some(
    (pokemon) => PkmFamily[pokemon] === PkmFamily[guest.pokemon]
  )
  if (!isOnTeam) return SPINDA_GUEST_POINTS_PER_GAME
  return guest.completesWhenFound
    ? guest.goalPoints
    : SPINDA_GUEST_POINTS_WITH_GUEST_ON_TEAM
}

export function getSpindaGuestPoints(
  cafe: ISpindaCafe | undefined,
  slot: SpindaGuestSlot,
  now = Date.now()
) {
  return cafe?.guestWeekKey === getUtcWeekKey(now)
    ? (cafe.guestPoints?.[slot] ?? 0)
    : 0
}

export function isSpindaGuestClaimed(
  cafe: ISpindaCafe | undefined,
  slot: SpindaGuestSlot,
  now = Date.now()
) {
  return (
    cafe?.guestWeekKey === getUtcWeekKey(now) &&
    cafe.guestClaimed?.[slot] === true
  )
}

export function canClaimSpindaGuest(
  cafe: ISpindaCafe | undefined,
  slot: SpindaGuestSlot,
  now = Date.now()
) {
  return (
    isSpindaCafeOpen(now) &&
    getSpindaGuestPoints(cafe, slot, now) >= SPINDA_GUEST_GOAL_POINTS &&
    !isSpindaGuestClaimed(cafe, slot, now)
  )
}
