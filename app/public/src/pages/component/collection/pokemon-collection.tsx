import type React from "react"
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"
import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { AutoSizer } from "react-virtualized-auto-sizer"
import { Grid } from "react-window"
import {
  getAllAltForms,
  getEmotionCost,
  PkmAltForms
} from "../../../../../config"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { Ability } from "../../../../../types/enum/Ability"
import type { Emotion } from "../../../../../types/enum/Emotion"
import { Passive } from "../../../../../types/enum/Passive"
import {
  Pkm,
  PkmFamily,
  PkmIndex
} from "../../../../../types/enum/Pokemon"
import { Synergy } from "../../../../../types/enum/Synergy"
import type { IPokemonCollectionItemUnpacked } from "../../../../../types/interfaces/UserMetadata"
import { PokemonAnimations } from "../../../game/components/pokemon-animations"
import { useAppSelector } from "../../../hooks"
import { LocalStoreKeys, localStore, useLocalStore } from "../../utils/store"
import SynergyIcon from "../icons/synergy-icon"
import { PokemonTypeahead } from "../typeahead/pokemon-typeahead"
import PokemonCollectionItem from "./pokemon-collection-item"
import PokemonEmotionsModal from "./pokemon-emotions-modal"
import UnownPanel from "./unown-panel"
import "./pokemon-collection.css"

const CELL_WIDTH = 90
const CELL_HEIGHT = 118

export type CollectionFilterState = {
  mode: "collection" | "shiny" | "pokedex"
  filter: "all" | "favorite"
  sort: "index" | "played"
}

type CollectionItem = {
  pkm: Pkm
  item: IPokemonCollectionItemUnpacked
  isNew: boolean
  isFavorite: boolean
  isUnlocked: boolean
  isUnlockable: boolean
}


export default function PokemonCollection() {
  const { t } = useTranslation()
  const [selectedPokemon, setSelectedPokemon] = useState<Pkm | "">("")

  const prevFilterState = useMemo<CollectionFilterState>(() => {
    const prevState = localStore.get(LocalStoreKeys.COLLECTION_FILTER)
    return {
      mode: (["collection", "shiny", "pokedex"] as const).includes(
        prevState?.mode
      )
        ? prevState.mode
        : "collection",
      filter: (["all", "favorite"] as const).includes(prevState?.filter)
        ? prevState.filter
        : "all",
      sort: (["index", "played"] as const).includes(prevState?.sort)
        ? prevState.sort
        : "index"
    }
  }, [])

  const [filterState, setFilterState] =
    useState<CollectionFilterState>(prevFilterState)

  useEffect(() => {
    localStore.set(LocalStoreKeys.COLLECTION_FILTER, filterState)
  }, [filterState])

  return (
    <div id="pokemon-collection">
      <header>
        <select
          value={filterState.mode}
          onChange={(e) =>
            setFilterState({
              ...filterState,
              mode: e.target.value as "collection" | "shiny" | "pokedex"
            })
          }
        >
          <option value={"collection"}>{t("collection.title")}</option>
          <option value={"shiny"}>{t("shiny_hunter")}</option>
          <option value={"pokedex"}>{t("pokedex")}</option>
        </select>

        <select
          value={filterState.filter}
          onChange={(e) =>
            setFilterState({
              ...filterState,
              filter: e.target.value as "all" | "favorite"
            })
          }
        >
          <option value={"all"}>{t("collection.show_all")}</option>
          <option value={"favorite"}>{t("collection.show_favorites")}</option>
        </select>

        <select
          value={filterState.sort}
          onChange={(e) =>
            setFilterState({
              ...filterState,
              sort: e.target.value as "index" | "played"
            })
          }
        >
          <option value={"index"}>{t("collection.sort_by_index")}</option>
          <option value={"played"}>{t("collection.sort_by_played")}</option>
        </select>

        <PokemonTypeahead
          value={selectedPokemon}
          onChange={setSelectedPokemon}
        />
      </header>
      <div style={{ maxWidth: "100%" }}>
        <Tabs>
          <TabList className="pokemon-collection-tabs">
            <Tab key="title-all">{t("all")}</Tab>
            {(Object.keys(Synergy) as Synergy[]).map((type) => {
              return (
                <Tab key={"title-" + type}>
                  <SynergyIcon type={type} />
                </Tab>
              )
            })}
            <Tab key="?">
              <img src="assets/ui/unown.svg" alt="?" className="unown-icon" />
            </Tab>
          </TabList>

          {(["all"].concat(Object.keys(Synergy)) as (Synergy | "all")[]).map(
            (type) => {
              return (
                <TabPanel key={type}>
                  <PokemonCollectionList
                    type={type}
                    setPokemon={setSelectedPokemon}
                    filterState={filterState}
                  />
                </TabPanel>
              )
            }
          )}
          <TabPanel>
            <UnownPanel
              setPokemon={setSelectedPokemon}
              filterState={filterState}
            />
          </TabPanel>
        </Tabs>
      </div>
      {selectedPokemon && (
        <PokemonEmotionsModal
          pokemon={selectedPokemon}
          onClose={() => setSelectedPokemon("")}
        />
      )}
    </div>
  )
}

export function PokemonCollectionList(props: {
  type: Synergy | "all"
  setPokemon: Dispatch<SetStateAction<Pkm | "">>
  filterState: CollectionFilterState
}) {
  const pokemonCollection = useAppSelector(
    (state) => state.network.profile?.pokemonCollection
  )
  const lastBoostersOpened = useAppSelector(
    (state) => state.boosters.lastBoostersOpened
  )
  const [favorites] = useLocalStore<Pkm[]>(
    LocalStoreKeys.FAVORITES,
    [],
    Infinity
  )

  const getItem = useCallback(
    (index) => pokemonCollection?.get(index),
    [pokemonCollection]
  )

  const pokemonsSorted = useMemo(() => {
    return (Object.values(Pkm) as Pkm[]).sort((a: Pkm, b: Pkm) => {
      if (props.filterState.sort === "played") {
        return (
          (getItem(PkmIndex[b])?.played ?? 0) -
          (getItem(PkmIndex[a])?.played ?? 0)
        )
      }
      // default: sort by index
      return PkmFamily[a] === PkmFamily[b]
        ? getPokemonData(a).stars - getPokemonData(b).stars
        : PkmIndex[PkmFamily[a]].localeCompare(PkmIndex[PkmFamily[b]])
    })
  }, [props.filterState.sort, getItem])

  const pokemonsFilteredByType = useMemo(() => {
    return pokemonsSorted.filter((pkm) => {
      const pokemonData = getPokemonData(pkm)
      return (
        pkm !== Pkm.DEFAULT &&
        PkmAltForms.includes(pkm) === false &&
        (pokemonData.skill !== Ability.DEFAULT ||
          pokemonData.passive !== Passive.NONE) &&
        (props.type === "all" || pokemonData.passive !== Passive.UNOWN) &&
        (props.type === "all" ||
          pokemonData.types.includes(Synergy[props.type]))
      )
    })
  }, [pokemonsSorted, props.type])

  // Pre-filter items so the grid knows the exact count (no null renders)
  const filteredItems = useMemo<CollectionItem[]>(() => {
    return pokemonsFilteredByType
      .map((pkm) => {
        const pokemonData = getPokemonData(pkm)
        const item = getItem(pokemonData.index)

        if (getAvailableEmotions(pokemonData.index, false).length === 0)
          return null

        const { dust, emotions, shinyEmotions } = item ?? {
          dust: 0,
          emotions: [] as Emotion[],
          shinyEmotions: [] as Emotion[]
        }

        const allForms = getAllAltForms(pkm)
        const isUnlocked = allForms.some((form) => {
          const formItem = getItem(PkmIndex[form])
          const formEmotions = formItem?.emotions ?? []
          const formShinyEmotions = formItem?.shinyEmotions ?? []
          return props.filterState.mode === "pokedex"
            ? (formItem?.played ?? 0) > 0
            : props.filterState.mode === "shiny"
              ? formShinyEmotions.length > 0
              : formEmotions.length > 0 || formShinyEmotions.length > 0
        })

        const isNew = lastBoostersOpened.some((booster) =>
          booster.some((card) => allForms.includes(card.name) && card.new)
        )

        const isFavorite = favorites.includes(pkm)

        const availableEmotions = getAvailableEmotions(pokemonData.index, false)
        const shinyAvailableEmotions = getAvailableEmotions(
          pokemonData.index,
          true
        )
        const isUnlockable =
          props.filterState.mode !== "pokedex" &&
          (availableEmotions.some(
            (e) =>
              !emotions.includes(e) &&
              dust >= getEmotionCost(e, false) &&
              props.filterState.mode !== "shiny"
          ) ||
            shinyAvailableEmotions.some(
              (e) =>
                !shinyEmotions.includes(e) &&
                dust >= getEmotionCost(e, true) &&
                !PokemonAnimations[pkm]?.shinyUnavailable
            ))

        if (props.filterState.filter === "favorite" && !isFavorite) return null

        return {
          pkm,
          item,
          isNew,
          isFavorite,
          isUnlocked,
          isUnlockable
        }
      })
      .filter<CollectionItem>((item): item is CollectionItem => item !== null)
  }, [
    pokemonsFilteredByType,
    getItem,
    props.filterState,
    lastBoostersOpened,
    favorites
  ])

  return (
    <div className="pokemon-collection-list">
      <AutoSizer
        renderProp={({ height, width }) => {
          if (height === undefined || width === undefined) return null
          const columnCount = Math.max(1, Math.floor(width / CELL_WIDTH))
          const rowCount = Math.ceil(filteredItems.length / columnCount)
          return (
            <Grid<PokemonCellData>
              style={{ height, width }}
              columnCount={columnCount}
              columnWidth={CELL_WIDTH}
              rowCount={rowCount}
              rowHeight={CELL_HEIGHT}
              cellComponent={PokemonCell}
              cellProps={{
                filteredItems,
                columnCount,
                getItem,
                filterState: props.filterState,
                setPokemon: props.setPokemon,
                type: props.type
              }}
            />
          )
        }}
      />
    </div>
  )
}

type PokemonCellData = {
  filteredItems: CollectionItem[]
  columnCount: number
  getItem: (index: string) => any
  filterState: CollectionFilterState
  setPokemon: Dispatch<SetStateAction<Pkm | "">>
  type: Synergy | "all"
}

function PokemonCell({
  columnIndex,
  rowIndex,
  style,
  filteredItems,
  columnCount,
  getItem,
  filterState,
  setPokemon,
  type
}: {
  ariaAttributes: object
  columnIndex: number
  rowIndex: number
  style: React.CSSProperties
} & PokemonCellData): React.ReactElement | null {
  const index = rowIndex * columnCount + columnIndex
  if (index >= filteredItems.length) return null
  const { pkm, isNew, isFavorite, isUnlocked, isUnlockable } =
    filteredItems[index]
  const pokemonData = getPokemonData(pkm)
  return (
    <div style={style}>
      <PokemonCollectionItem
        key={`${pokemonData.index}-${type}`}
        name={pkm}
        index={pokemonData.index}
        item={getItem(pokemonData.index)}
        filterState={filterState}
        setPokemon={setPokemon}
        isNew={isNew}
        isFavorite={isFavorite}
        isUnlocked={isUnlocked}
        isUnlockable={isUnlockable}
      />
    </div>
  )
}
