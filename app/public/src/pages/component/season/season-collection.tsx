import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { useTranslation } from "react-i18next"
import { AutoSizer } from "react-virtualized-auto-sizer"
import { getScrollbarSize, Grid } from "react-window"
import { getBaseAltForm } from "../../../../../config"
import {
  getSeasonPortrait,
  SEASON_PORTRAITS
} from "../../../../../config/game/season"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { Ability } from "../../../../../types/enum/Ability"
import { Emotion } from "../../../../../types/enum/Emotion"
import { Passive } from "../../../../../types/enum/Passive"
import {
  Pkm,
  PkmByIndex,
  PkmFamily,
  PkmIndex
} from "../../../../../types/enum/Pokemon"
import { Synergy, WishOnlySynergies } from "../../../../../types/enum/Synergy"
import type { IPokemonCollectionItemUnpacked } from "../../../../../types/interfaces/UserMetadata"
import {
  getAvatarString,
  getPortraitSrc,
  getSeasonPortraitAvatar
} from "../../../../../utils/avatar"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import { changeSelectedEmotion, resetSelectedEmotions } from "../../../network"
import {
  changeAvatar,
  changeAvatarToSeasonPortrait,
  setErrorAlertMessage
} from "../../../stores/NetworkStore"
import { cc } from "../../utils/jsx"
import { LocalStoreKeys, useLocalStore } from "../../utils/store"
import SynergyIcon from "../icons/synergy-icon"
import { Modal } from "../modal/modal"
import { PokemonTypeahead } from "../typeahead/pokemon-typeahead"
import { reactInKangaskhanStorage } from "./kangaskhan-storage-header"
import { SeasonTabPortrait } from "./season"
import SeasonCard from "./season-card"
import SeasonSparkles from "./season-sparkles"
import "./season.css"

const COLLECTION_COLUMNS = 6
const COLLECTION_COMPACT_COLUMNS = 10
const COLLECTION_MIN_COLUMN_WIDTH = 100
const COLLECTION_NARROW_COLUMNS = 3
const COLLECTION_NARROW_WIDTH = 720
const COLLECTION_CELL_INSET = 12
const COLLECTION_COMPACT_CELL_INSET = 6
const COLLECTION_CELL_EXTRA_HEIGHT = 30
const CARD_ASPECT = 168 / 120
const RESET_CONFIRM_TIMEOUT_MS = 3000
const SHINY_SPARKLE_MIN_DELAY_MS = 1800
const SHINY_SPARKLE_RANDOM_DELAY_MS = 1200
const COLLECTION_SYNERGIES = (Object.keys(Synergy) as Synergy[]).filter(
  (synergy) => !WishOnlySynergies.includes(synergy)
)

type CollectionTab = "collection" | "shiny" | "holo"
type ChosenEmotions = Record<string, string>
type CollectionSort = "index" | "progress" | "favorite" | "played" | "season"

const SEASON_PORTRAIT_PREFIX = "season:"

function getSeasonPortraits(pokemon: Pkm) {
  return SEASON_PORTRAITS.filter((portrait) => portrait.pokemon === pokemon)
}

function resolvePortraitChoice(choice?: string) {
  if (choice?.startsWith(SEASON_PORTRAIT_PREFIX)) {
    const id = choice.slice(SEASON_PORTRAIT_PREFIX.length)
    return { portraitSrc: getSeasonPortrait(id)?.src }
  }
  return { emotion: choice as Emotion | undefined }
}

interface AvatarChoice {
  emotion?: Emotion
  seasonPortraitId?: string
}

interface CollectionForm {
  pokemon: Pkm
  index: string
  emotions: Emotion[]
  ownedEmotions: Emotion[]
  ownedShinyEmotions: Emotion[]
  played: number
}

// one card per family of alt forms (Arceus, Vivillon...): its own fields are
// the first form's, the totals span every form
interface CollectionEntry extends CollectionForm {
  forms: CollectionForm[]
  totalEmotions: number
  totalOwnedEmotions: number
  totalPlayed: number
  types: Synergy[]
}

function getChosenEmotionKey(pokemon: Pkm, shiny: boolean) {
  return `${pokemon}/${shiny ? "shiny" : "normal"}`
}

function isOtherCollectionEntry(index: string) {
  return index.startsWith("0000") || index.startsWith("9999")
}

// boosters unlock each alt form under its own index
const COLLECTION_FORMS = (Object.values(Pkm) as Pkm[])
  .filter((pokemon) => {
    const data = getPokemonData(pokemon)
    return (
      pokemon !== Pkm.DEFAULT &&
      (data.skill !== Ability.DEFAULT || data.passive !== Passive.NONE) &&
      getAvailableEmotions(PkmIndex[pokemon], false).length > 0
    )
  })
  .sort((a, b) =>
    PkmFamily[a] === PkmFamily[b]
      ? getPokemonData(a).stars - getPokemonData(b).stars
      : PkmIndex[PkmFamily[a]].localeCompare(PkmIndex[PkmFamily[b]])
  )

const COLLECTION_FORM_SET = new Set(COLLECTION_FORMS)

const COLLECTION_VARIANT_PREFIXES = ["MEGA_", "PRIMAL_", "ORIGIN_", "SHADOW_"]
const COLLECTION_VARIANT_SUFFIXES = ["_CROWNED", "_PIRATE", "_BLACK", "_WHITE"]
const MEGA_VARIANT_SUFFIXES = ["_X", "_Y"]

// forms whose names do not lead back to their base
const COLLECTION_BASE_BY_FORM: Partial<Record<Pkm, Pkm>> = {
  [Pkm.ZYGARDE_10]: Pkm.ZYGARDE_50,
  [Pkm.ZYGARDE_100]: Pkm.ZYGARDE_50,
  [Pkm.MEGA_ZYGARDE]: Pkm.ZYGARDE_50,
  [Pkm.DEERLING_SUMMER]: Pkm.DEERLING_SPRING,
  [Pkm.DEERLING_AUTUMN]: Pkm.DEERLING_SPRING,
  [Pkm.DEERLING_WINTER]: Pkm.DEERLING_SPRING,
  [Pkm.SAWSBUCK_SUMMER]: Pkm.SAWSBUCK_SPRING,
  [Pkm.SAWSBUCK_AUTUMN]: Pkm.SAWSBUCK_SPRING,
  [Pkm.SAWSBUCK_WINTER]: Pkm.SAWSBUCK_SPRING
}

function isPkm(name: string): name is Pkm {
  return name in PkmIndex
}

// Megas, Primals, Origin, Shadow, Crowned, Pirate and Kyurem's fusions share
// one card with their regular form, like alt forms
function getCollectionBase(pokemon: Pkm): Pkm {
  const explicitBase = COLLECTION_BASE_BY_FORM[pokemon]
  if (explicitBase) return explicitBase
  const altBase = getBaseAltForm(pokemon)
  let name: string = altBase
  const prefix = COLLECTION_VARIANT_PREFIXES.find((p) => name.startsWith(p))
  if (prefix) {
    name = name.slice(prefix.length)
    const megaSuffix = MEGA_VARIANT_SUFFIXES.find((s) => name.endsWith(s))
    if (prefix === "MEGA_" && megaSuffix && !isPkm(name)) {
      name = name.slice(0, -megaSuffix.length)
    }
  }
  const suffix = COLLECTION_VARIANT_SUFFIXES.find((s) => name.endsWith(s))
  if (suffix && isPkm(name.slice(0, -suffix.length))) {
    name = name.slice(0, -suffix.length)
  }
  if (!isPkm(name) || name === altBase) return altBase
  return getCollectionBase(name)
}

const COLLECTION_FAMILIES = (() => {
  const familiesByBase = new Map<Pkm, Pkm[]>()
  for (const form of COLLECTION_FORMS) {
    const base = getCollectionBase(form)
    const family = familiesByBase.get(base) ?? []
    if (form === base) family.unshift(form)
    else family.push(form)
    familiesByBase.set(base, family)
  }
  return [...familiesByBase.values()]
})()

function buildCollectionForm(
  pokemon: Pkm,
  ownedItems: Map<string, IPokemonCollectionItemUnpacked>
): CollectionForm {
  const index = PkmIndex[pokemon]
  const item = ownedItems.get(index)
  return {
    pokemon,
    index,
    emotions: getAvailableEmotions(index, false),
    ownedEmotions: item?.emotions ?? [],
    ownedShinyEmotions: item?.shinyEmotions ?? [],
    played: item?.played ?? 0
  }
}

function buildCollection(
  ownedItems: Map<string, IPokemonCollectionItemUnpacked>
): CollectionEntry[] {
  return COLLECTION_FAMILIES.map((family) => {
    const forms = family.map((pokemon) =>
      buildCollectionForm(pokemon, ownedItems)
    )
    const sum = (count: (form: CollectionForm) => number) =>
      forms.reduce((total, form) => total + count(form), 0)
    return {
      ...forms[0],
      forms,
      totalEmotions: sum((form) => form.emotions.length),
      totalOwnedEmotions: sum((form) => form.ownedEmotions.length),
      totalPlayed: sum((form) => form.played),
      types: [
        ...new Set(family.flatMap((pokemon) => getPokemonData(pokemon).types))
      ]
    }
  })
}

function findCollectionEntry(collection: CollectionEntry[], pokemon: Pkm) {
  return collection.find((entry) =>
    entry.forms.some((form) => form.pokemon === pokemon)
  )
}

function getChosenEmotions(
  ownedItems: Map<string, IPokemonCollectionItemUnpacked>
): ChosenEmotions {
  const chosenEmotions: ChosenEmotions = {}
  ownedItems.forEach((item, index) => {
    const pokemon = PkmByIndex[index]
    if (!pokemon || !item.selectedEmotion) return
    if (item.selectedEmotion === Emotion.NORMAL && !item.selectedShiny) return
    const key = getChosenEmotionKey(pokemon, item.selectedShiny)
    chosenEmotions[key] = item.selectedEmotion
  })
  return chosenEmotions
}

function getCollectionGrid(width: number, columns = COLLECTION_COLUMNS) {
  // the vertical scrollbar sits inside the grid: leave it its gutter so the
  // last column is never clipped
  const innerWidth = Math.max(0, width - getScrollbarSize())
  const columnCount =
    width < COLLECTION_NARROW_WIDTH
      ? COLLECTION_NARROW_COLUMNS
      : Math.min(
          columns,
          Math.max(
            1,
            Math.floor(innerWidth / COLLECTION_MIN_COLUMN_WIDTH)
          )
        )
  const columnWidth = innerWidth / columnCount
  const cellInset =
    columns > COLLECTION_COLUMNS
      ? COLLECTION_COMPACT_CELL_INSET
      : COLLECTION_CELL_INSET
  return {
    columnCount,
    columnWidth,
    rowHeight: Math.round(
      (columnWidth - cellInset) * CARD_ASPECT + COLLECTION_CELL_EXTRA_HEIGHT
    )
  }
}

interface VisibleCards {
  first: number
  last: number
}

type SparkleBurstListener = (cardIndex: number) => void

// bursts only land on rendered cards, or most of them happen off screen. They
// are announced to the cards instead of kept as collection state, so a burst
// re-renders one card, not the whole grid
function useRandomSparkleBursts(isEnabled: boolean) {
  const listenersRef = useRef(new Set<SparkleBurstListener>())
  const visibleCardsRef = useRef<VisibleCards>({ first: 0, last: -1 })
  useEffect(() => {
    if (!isEnabled) return
    let timeout: ReturnType<typeof setTimeout>
    const scheduleNextBurst = () => {
      timeout = setTimeout(
        () => {
          const { first, last } = visibleCardsRef.current
          if (last >= first) {
            const index = first + Math.floor(Math.random() * (last - first + 1))
            for (const listener of listenersRef.current) listener(index)
          }
          scheduleNextBurst()
        },
        SHINY_SPARKLE_MIN_DELAY_MS +
          Math.random() * SHINY_SPARKLE_RANDOM_DELAY_MS
      )
    }
    scheduleNextBurst()
    return () => clearTimeout(timeout)
  }, [isEnabled])
  const onVisibleCardsChange = useCallback((visibleCards: VisibleCards) => {
    visibleCardsRef.current = visibleCards
  }, [])
  const subscribe = useCallback((listener: SparkleBurstListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])
  return { subscribe, onVisibleCardsChange }
}

function SparkleBurstSlot(props: {
  cardIndex: number
  subscribe: (listener: SparkleBurstListener) => () => void
}) {
  const { cardIndex, subscribe } = props
  const [burstId, setBurstId] = useState(0)
  useEffect(
    () =>
      subscribe((burstIndex) => {
        if (burstIndex === cardIndex) setBurstId((id) => id + 1)
      }),
    [subscribe, cardIndex]
  )
  if (burstId === 0) return null
  return <SeasonSparkles key={burstId} delayMs={0} isContained />
}

export default function SeasonCollection(props: { onOpenGuild?: () => void }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const profile = useAppSelector((state) => state.network.profile)
  const ownedItems = profile?.pokemonCollection
  const collection = useMemo(
    () => buildCollection(ownedItems ?? new Map()),
    [ownedItems]
  )
  const chosenEmotions = useMemo(
    () => getChosenEmotions(ownedItems ?? new Map()),
    [ownedItems]
  )
  const shinyPokemons = useMemo(
    () =>
      collection
        .flatMap((entry) => entry.forms)
        .filter((form) => form.ownedShinyEmotions.length > 0)
        .map((form) => form.pokemon),
    [collection]
  )
  const holoPokemons = useMemo(
    () =>
      (profile?.holoIndexes ?? [])
        .filter((index) => PkmByIndex[index])
        .sort((a, b) => a.localeCompare(b))
        .map((index) => PkmByIndex[index]),
    [profile?.holoIndexes]
  )
  const [tab, setTab] = useState<CollectionTab>("collection")
  const [synergy, setSynergy] = useState<Synergy | "all" | "other">("all")
  const [sort, setSort] = useState<CollectionSort>("index")
  const [selected, setSelected] = useState<{
    pokemon: Pkm
    shiny: boolean
    holo?: boolean
  }>()
  const [isConfirmingResetAll, setIsConfirmingResetAll] = useState(false)
  const [isCompactView, setIsCompactView] = useLocalStore<boolean>(
    LocalStoreKeys.COLLECTION_COMPACT_VIEW,
    false,
    Infinity
  )
  const gridColumns = isCompactView
    ? COLLECTION_COMPACT_COLUMNS
    : COLLECTION_COLUMNS
  const synergyIconSize = isCompactView ? "18px" : "30px"
  const shinySparkles = useRandomSparkleBursts(
    tab === "shiny" && shinyPokemons.length > 0
  )

  useEffect(() => {
    if (!isConfirmingResetAll) return
    const timeout = setTimeout(
      () => setIsConfirmingResetAll(false),
      RESET_CONFIRM_TIMEOUT_MS
    )
    return () => clearTimeout(timeout)
  }, [isConfirmingResetAll])

  function onClickResetAll() {
    if (!isConfirmingResetAll) {
      setIsConfirmingResetAll(true)
      return
    }
    setIsConfirmingResetAll(false)
    resetSelectedEmotions().catch(showError)
  }

  function showError(error: Error) {
    dispatch(setErrorAlertMessage(error.message))
  }

  // the server keeps one selection per Pokemon: a shiny pick replaces a
  // normal one; no emotion resets it to the default portrait
  function chooseEmotion(pokemon: Pkm, shiny: boolean, emotion?: Emotion) {
    changeSelectedEmotion({
      index: PkmIndex[pokemon],
      emotion: emotion ?? null,
      shiny: emotion ? shiny : false
    }).catch(showError)
  }
  const [favorites, updateFavorites] = useLocalStore<Pkm[]>(
    LocalStoreKeys.FAVORITES,
    [],
    Infinity
  )

  function toggleFavorite(pokemon: Pkm) {
    updateFavorites(
      favorites.includes(pokemon)
        ? favorites.filter((favorite) => favorite !== pokemon)
        : [...favorites, pokemon]
    )
  }

  const selectedEntry = selected
    ? findCollectionEntry(collection, selected.pokemon)
    : undefined

  // the grids compare their cell props shallowly: stable callbacks keep a
  // parent re-render from repainting every card
  const selectCollectionCard = useCallback(
    (pokemon: Pkm) => setSelected({ pokemon, shiny: false }),
    []
  )
  const renderHoloCard = useCallback(
    (pokemon: Pkm) => (
      <SeasonCard
        pokemon={pokemon}
        holo
        {...resolvePortraitChoice(
          chosenEmotions[getChosenEmotionKey(pokemon, false)]
        )}
        synergyIconSize={synergyIconSize}
        onClick={() => setSelected({ pokemon, shiny: false, holo: true })}
      />
    ),
    [chosenEmotions, synergyIconSize]
  )
  const subscribeToSparkleBursts = shinySparkles.subscribe
  const renderShinyCard = useCallback(
    (pokemon: Pkm, cardIndex: number) => (
      <SeasonCard
        pokemon={pokemon}
        shiny
        emotion={
          chosenEmotions[getChosenEmotionKey(pokemon, true)] as
            | Emotion
            | undefined
        }
        synergyIconSize={synergyIconSize}
        onClick={() => setSelected({ pokemon, shiny: true })}
      >
        <SparkleBurstSlot
          cardIndex={cardIndex}
          subscribe={subscribeToSparkleBursts}
        />
      </SeasonCard>
    ),
    [chosenEmotions, synergyIconSize, subscribeToSparkleBursts]
  )

  const visibleEntries = useMemo(() => {
    const entries = collection.filter((entry) =>
      synergy === "other"
        ? isOtherCollectionEntry(entry.index)
        : !isOtherCollectionEntry(entry.index) &&
          (synergy === "all" || entry.types.includes(synergy))
    )
    if (sort === "progress") {
      const progress = (entry: CollectionEntry) =>
        entry.totalOwnedEmotions / entry.totalEmotions
      return [...entries].sort((a, b) => progress(b) - progress(a))
    }
    if (sort === "season") {
      return entries.filter((entry) =>
        entry.forms.some((form) => getSeasonPortraits(form.pokemon).length > 0)
      )
    }
    if (sort === "played") {
      return [...entries].sort((a, b) => b.totalPlayed - a.totalPlayed)
    }
    if (sort === "favorite") {
      const isFavorite = (entry: CollectionEntry) =>
        favorites.includes(entry.pokemon) ? 1 : 0
      return [...entries].sort((a, b) => isFavorite(b) - isFavorite(a))
    }
    return entries
  }, [collection, synergy, sort, favorites])

  return (
    <div className="season-page season-collection">
      <section className="season-frame season-collection-body">
        <div className="season-tabs">
          <button
            className={cc("season-tab", { active: tab === "collection" })}
            onClick={() => setTab("collection")}
          >
            Pokémon
          </button>
          <button
            className={cc("season-tab", { active: tab === "shiny" })}
            onClick={() => setTab("shiny")}
          >
            Shiny Pokémon
          </button>
          <button
            className={cc("season-tab", { active: tab === "holo" })}
            onClick={() => setTab("holo")}
          >
            Holo Pokémon
          </button>
          {props.onOpenGuild && (
            // a shortcut back, the mirror of the Guild's Storage tab
            <button
              className="season-tab"
              title="Wigglytuff's Guild"
              onClick={props.onOpenGuild}
            >
              <SeasonTabPortrait pokemon={Pkm.WIGGLYTUFF} />
              Guild Hall
              <span className="season-arrow-icon right season-tab-leave" />
            </button>
          )}
          <div className="season-collection-controls">
            <button
              className={cc(
                "bubbly season-collection-views",
                isCompactView ? "blue" : ""
              )}
              title={isCompactView ? "Large cards" : "Small cards"}
              aria-pressed={isCompactView}
              onClick={() => setIsCompactView(!isCompactView)}
            >
              <img src="assets/ui/binder.svg" width={18} height={18} alt="" />
            </button>
            <button
              className={cc("bubbly season-collection-reset-all", {
                confirming: isConfirmingResetAll
              })}
              title="Reset all to default portrait"
              disabled={Object.keys(chosenEmotions).length === 0}
              onClick={onClickResetAll}
            >
              <img src="assets/ui/refresh.svg" width={18} height={18} alt="" />
              {isConfirmingResetAll && "Confirm"}
            </button>
            {tab === "collection" && (
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as CollectionSort)
                }
              >
                <option value="index">Index</option>
                <option value="progress">Progress</option>
                <option value="favorite">Favorites</option>
                <option value="played">Played</option>
                <option value="season">Season</option>
              </select>
            )}
            <PokemonTypeahead
              value=""
              onChange={(pokemon) =>
                pokemon && setSelected({ pokemon, shiny: false })
              }
            />
          </div>
        </div>

        {tab === "collection" ? (
          <>
            <div className="season-collection-synergies">
              <button
                className={cc({ active: synergy === "all" })}
                onClick={() => setSynergy("all")}
              >
                {t("all")}
              </button>
              {COLLECTION_SYNERGIES.map((type) => (
                <button
                  key={type}
                  className={cc({ active: synergy === type })}
                  onClick={() => setSynergy(type)}
                >
                  <SynergyIcon type={type} size="20px" />
                </button>
              ))}
              <button
                className={cc({ active: synergy === "other" })}
                onClick={() => setSynergy("other")}
              >
                Other
              </button>
            </div>
            <div
              className={cc("season-collection-grid", {
                compact: isCompactView
              })}
            >
              <AutoSizer
                style={{ height: "100%", width: "100%" }}
                renderProp={({ height, width }) => {
                  if (height === undefined || width === undefined) return null
                  const { columnCount, columnWidth, rowHeight } =
                    getCollectionGrid(width, gridColumns)
                  return (
                    <Grid<CollectionCellProps>
                      style={{ height, width, scrollbarGutter: "stable" }}
                      columnCount={columnCount}
                      columnWidth={columnWidth}
                      rowCount={Math.ceil(visibleEntries.length / columnCount)}
                      rowHeight={rowHeight}
                      cellComponent={CollectionCell}
                      cellProps={{
                        entries: visibleEntries,
                        columnCount,
                        chosenEmotions,
                        synergyIconSize,
                        showPlayCount: sort === "played",
                        showProgress: sort === "progress",
                        onSelect: selectCollectionCard
                      }}
                    />
                  )
                }}
              />
            </div>
          </>
        ) : tab === "holo" ? (
          <ShowcaseGrid
            pokemons={holoPokemons}
            columns={gridColumns}
            renderCard={renderHoloCard}
          />
        ) : (
          <ShowcaseGrid
            pokemons={shinyPokemons}
            columns={gridColumns}
            onVisibleCardsChange={shinySparkles.onVisibleCardsChange}
            renderCard={renderShinyCard}
          />
        )}
      </section>

      {selected && selectedEntry && (
        <SeasonCollectionModal
          entry={
            selectedEntry.forms.find(
              (form) => form.pokemon === selected.pokemon
            ) ?? selectedEntry
          }
          forms={selectedEntry.forms}
          onSelectForm={(pokemon) => setSelected({ ...selected, pokemon })}
          shiny={selected.shiny}
          holo={selected.holo ?? false}
          chosenEmotion={
            chosenEmotions[
              getChosenEmotionKey(selected.pokemon, selected.shiny)
            ]
          }
          ownedSeasonPortraitIds={profile?.seasonPortraits ?? []}
          currentAvatar={profile?.avatar}
          onChooseEmotion={(emotion) =>
            chooseEmotion(selected.pokemon, selected.shiny, emotion)
          }
          onSetAvatar={(choice) => {
            reactInKangaskhanStorage("avatar")
            if (choice.seasonPortraitId) {
              dispatch(changeAvatarToSeasonPortrait(choice.seasonPortraitId))
            } else {
              dispatch(
                changeAvatar({
                  index: PkmIndex[selected.pokemon],
                  emotion: choice.emotion ?? Emotion.NORMAL,
                  shiny: selected.shiny
                })
              )
            }
          }}
          isFavorite={favorites.includes(selectedEntry.pokemon)}
          onToggleFavorite={() => {
            if (!favorites.includes(selectedEntry.pokemon)) {
              reactInKangaskhanStorage("favorite")
            }
            toggleFavorite(selectedEntry.pokemon)
          }}
          onClose={() => setSelected(undefined)}
        />
      )}
    </div>
  )
}

interface ShowcaseCellProps {
  pokemons: Pkm[]
  columnCount: number
  renderCard: (pokemon: Pkm, index: number) => ReactNode
}

function ShowcaseGrid({
  columns,
  onVisibleCardsChange,
  ...props
}: Omit<ShowcaseCellProps, "columnCount"> & {
  columns: number
  onVisibleCardsChange?: (visibleCards: VisibleCards) => void
}) {
  return (
    <div
      className={cc("season-collection-grid showcase", {
        compact: columns > COLLECTION_COLUMNS
      })}
    >
      <AutoSizer
        style={{ height: "100%", width: "100%" }}
        renderProp={({ height, width }) => {
          if (height === undefined || width === undefined) return null
          const { columnCount, columnWidth, rowHeight } =
            getCollectionGrid(width, columns)
          return (
            <Grid<ShowcaseCellProps>
              style={{ height, width, scrollbarGutter: "stable" }}
              columnCount={columnCount}
              columnWidth={columnWidth}
              rowCount={Math.ceil(props.pokemons.length / columnCount)}
              rowHeight={rowHeight}
              cellComponent={ShowcaseCell}
              cellProps={{ ...props, columnCount }}
              onCellsRendered={({ rowStartIndex, rowStopIndex }) =>
                onVisibleCardsChange?.({
                  first: rowStartIndex * columnCount,
                  last: Math.min(
                    props.pokemons.length - 1,
                    (rowStopIndex + 1) * columnCount - 1
                  )
                })
              }
            />
          )
        }}
      />
    </div>
  )
}

function ShowcaseCell({
  columnIndex,
  rowIndex,
  style,
  pokemons,
  columnCount,
  renderCard
}: {
  ariaAttributes: object
  columnIndex: number
  rowIndex: number
  style: CSSProperties
} & ShowcaseCellProps) {
  const index = rowIndex * columnCount + columnIndex
  const pokemon = pokemons[index]
  if (!pokemon) return null
  return (
    <div style={style} className="season-collection-cell">
      {renderCard(pokemon, index)}
    </div>
  )
}

interface CollectionCellProps {
  entries: CollectionEntry[]
  columnCount: number
  chosenEmotions: ChosenEmotions
  synergyIconSize: string
  showPlayCount: boolean
  showProgress: boolean
  onSelect: (pokemon: Pkm) => void
}

function CollectionCell({
  columnIndex,
  rowIndex,
  style,
  entries,
  columnCount,
  chosenEmotions,
  synergyIconSize,
  showPlayCount,
  showProgress,
  onSelect
}: {
  ariaAttributes: object
  columnIndex: number
  rowIndex: number
  style: CSSProperties
} & CollectionCellProps) {
  const entry = entries[rowIndex * columnCount + columnIndex]
  if (!entry) return null
  return (
    <div style={style} className="season-collection-cell">
      <SeasonCard
        pokemon={entry.pokemon}
        className={cc({ stacked: entry.forms.length > 1 })}
        {...resolvePortraitChoice(
          chosenEmotions[getChosenEmotionKey(entry.pokemon, false)]
        )}
        isMissing={entry.totalOwnedEmotions === 0}
        synergyIconSize={synergyIconSize}
        onClick={() => onSelect(entry.pokemon)}
        cornerBadge={
          entry.totalPlayed > 0 && (
            <span className="season-collection-played" title="Played">
              {showPlayCount && entry.totalPlayed}
              <img src="assets/ui/gamepad.svg" width={14} height={14} alt="" />
            </span>
          )
        }
      />
      <span
        className={cc("season-collection-progress", {
          complete:
            entry.totalEmotions > 0 &&
            entry.totalOwnedEmotions === entry.totalEmotions,
          hidden: !showProgress
        })}
      >
        <span
          style={{
            width: `${(entry.totalOwnedEmotions / entry.totalEmotions) * 100}%`
          }}
        />
      </span>
    </div>
  )
}

function SeasonCollectionModal(props: {
  entry: CollectionForm
  forms: CollectionForm[]
  onSelectForm: (pokemon: Pkm) => void
  shiny: boolean
  holo: boolean
  chosenEmotion?: string
  ownedSeasonPortraitIds: string[]
  currentAvatar?: string
  onChooseEmotion: (emotion?: Emotion) => void
  onSetAvatar: (choice: AvatarChoice) => void
  isFavorite: boolean
  onToggleFavorite: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { entry, shiny } = props
  const emotions = shiny
    ? getAvailableEmotions(entry.index, true)
    : entry.emotions
  const ownedEmotions = shiny ? entry.ownedShinyEmotions : entry.ownedEmotions
  const [chosenSeasonPortraitId, setChosenSeasonPortraitId] = useState<string>()
  const shownAvatar = chosenSeasonPortraitId
    ? getSeasonPortraitAvatar(chosenSeasonPortraitId)
    : getAvatarString(
        entry.index,
        shiny,
        (props.chosenEmotion ?? Emotion.NORMAL) as Emotion
      )
  const isCurrentAvatar = shownAvatar === props.currentAvatar
  const selectedEmotion = chosenSeasonPortraitId
    ? `${SEASON_PORTRAIT_PREFIX}${chosenSeasonPortraitId}`
    : (props.chosenEmotion ?? Emotion.NORMAL)
  const seasonPortraits = shiny ? [] : getSeasonPortraits(entry.pokemon)
  const ownedSeasonPortraitIds = props.ownedSeasonPortraitIds

  const progress = (ownedEmotions.length / emotions.length) * 100

  return (
    <Modal
      show={true}
      onClose={props.onClose}
      className="anchor-top season-collection-modal"
      body={
        <div className="season-collection-detail">
          <SeasonCard
            pokemon={entry.pokemon}
            shiny={shiny}
            holo={props.holo}
            {...resolvePortraitChoice(selectedEmotion)}
            isMissing={ownedEmotions.length === 0}
            synergyIconSize="30px"
          />
          <div className="season-collection-detail-side">
            <header className="season-collection-detail-header">
              <h2>{t(`pkm.${entry.pokemon}`)}</h2>
              <button
                className="close-btn"
                aria-label="Close"
                onClick={props.onClose}
              >
                🗙
              </button>
            </header>
            <span
              className={cc("season-collection-progress", {
                complete: progress === 100
              })}
            >
              <span style={{ width: `${progress}%` }} />
            </span>
            <span className="season-collection-detail-played" title="Played">
              <img src="assets/ui/gamepad.svg" width={16} height={16} alt="" />
              {entry.played}
            </span>
            {props.forms.length > 1 && (
              <ul className="season-collection-forms">
                {props.forms.map((form) => (
                  <li key={form.pokemon}>
                    <button
                      className={cc({
                        owned:
                          (shiny ? form.ownedShinyEmotions : form.ownedEmotions)
                            .length > 0,
                        selected: form.pokemon === entry.pokemon
                      })}
                      title={t(`pkm.${form.pokemon}`)}
                      onClick={() => {
                        setChosenSeasonPortraitId(undefined)
                        props.onSelectForm(form.pokemon)
                      }}
                    >
                      <img
                        src={getPortraitSrc(form.index, shiny)}
                        width={40}
                        height={40}
                        alt={t(`pkm.${form.pokemon}`)}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <ul className="season-collection-emotions">
              {emotions.map((emotion) => {
                const isOwned = ownedEmotions.includes(emotion)
                return (
                  <li key={emotion}>
                    <button
                      className={cc({
                        owned: isOwned,
                        selected: isOwned && emotion === selectedEmotion
                      })}
                      disabled={!isOwned}
                      title={t(`emotion.${emotion}`)}
                      onClick={() => {
                        setChosenSeasonPortraitId(undefined)
                        props.onChooseEmotion(
                          emotion === Emotion.NORMAL && !shiny
                            ? undefined
                            : emotion
                        )
                      }}
                    >
                      <img
                        src={getPortraitSrc(entry.index, shiny, emotion)}
                        width={56}
                        height={56}
                        alt={emotion}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
            {seasonPortraits.length > 0 && (
              <>
                <h3 className="season-collection-subheading">
                  Season portraits
                </h3>
                <ul className="season-collection-emotions">
                  {seasonPortraits.map((portrait) => {
                    const choice = `${SEASON_PORTRAIT_PREFIX}${portrait.id}`
                    const isOwned = ownedSeasonPortraitIds.includes(
                      portrait.id
                    )
                    return (
                      <li key={portrait.id}>
                        <button
                          className={cc({
                            owned: isOwned,
                            selected: isOwned && choice === selectedEmotion
                          })}
                          disabled={!isOwned}
                          title={portrait.label}
                          onClick={() =>
                            setChosenSeasonPortraitId(portrait.id)
                          }
                        >
                          <img
                            src={portrait.src}
                            width={56}
                            height={56}
                            alt={portrait.label}
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
            <div className="season-collection-detail-actions">
              <button
                className="bubbly season-collection-reset"
                title="Reset to default"
                disabled={!props.chosenEmotion && !chosenSeasonPortraitId}
                onClick={() => {
                  setChosenSeasonPortraitId(undefined)
                  props.onChooseEmotion(undefined)
                }}
              >
                <img
                  src="assets/ui/refresh.svg"
                  width={18}
                  height={18}
                  alt=""
                />
              </button>
              <button
                className={cc("bubbly season-collection-favorite", {
                  active: props.isFavorite
                })}
                title="Favorite"
                aria-pressed={props.isFavorite}
                onClick={props.onToggleFavorite}
              >
                <span className="season-favorite-icon" />
              </button>
              <button
                className={cc("season-shop-open set-avatar", {
                  "is-current-avatar": isCurrentAvatar
                })}
                disabled={
                  isCurrentAvatar ||
                  (ownedEmotions.length === 0 && !chosenSeasonPortraitId)
                }
                onClick={() =>
                  props.onSetAvatar(
                    chosenSeasonPortraitId
                      ? { seasonPortraitId: chosenSeasonPortraitId }
                      : {
                          emotion: (props.chosenEmotion ??
                            Emotion.NORMAL) as Emotion
                        }
                  )
                }
              >
                <span className="season-avatar-button-labels">
                  <span hidden={isCurrentAvatar}>Set as avatar</span>
                  <span hidden={!isCurrentAvatar}>Your avatar</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      }
    />
  )
}
