import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { PkmAltForms } from "../../../../../config"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { Ability } from "../../../../../types/enum/Ability"
import { Passive } from "../../../../../types/enum/Passive"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { values } from "../../../../../utils/object"
import { cc } from "../../utils/jsx"
import PokemonPortrait from "../pokemon-portrait"
import { SearchInput } from "../search-input/search-input"
import "./pokemon-typeahead.css"

const MAX_SUGGESTIONS = 40

function listPokemonOptions(pokemonName: (pkm: Pkm) => string) {
  return values(Pkm)
    .filter((p) => {
      const pokemon = getPokemonData(p)
      return (
        (pokemon.skill !== Ability.DEFAULT ||
          pokemon.passive !== Passive.NONE) &&
        PkmAltForms.includes(pokemon.name as Pkm) === false
      )
    })
    .sort((a, b) => pokemonName(a).localeCompare(pokemonName(b)))
}

export function PokemonTypeahead({
  onChange,
  value,
  options
}: {
  value: string
  options?: Pkm[]
  onChange: (value: Pkm | "") => void
}) {
  const { t } = useTranslation()
  const pokemonOptions =
    options || listPokemonOptions((pkm) => t(`pkm.${pkm}`))

  return (
    <select
      value={value}
      onChange={(e) => onChange((e.target?.value as Pkm) ?? "")}
      className="pokemon-typeahead"
    >
      <option value="" disabled>
        {t("search_pokemon")}
      </option>
      <option value="">{t("all")}</option>
      {pokemonOptions.map((p) => (
        <option key={p} value={p}>
          {t(`pkm.${p}`)}
        </option>
      ))}
    </select>
  )
}

export function PokemonSearch({
  onChange,
  value,
  options
}: {
  value: Pkm | ""
  options?: Pkm[]
  onChange: (value: Pkm | "") => void
}) {
  const { t } = useTranslation()
  const [text, setText] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const suggestionListRef = useRef<HTMLUListElement>(null)

  const namedOptions = useMemo(
    () =>
      (options ?? listPokemonOptions((pkm) => t(`pkm.${pkm}`))).map(
        (pkm) => ({ pkm, name: t(`pkm.${pkm}`) })
      ),
    [options, t]
  )

  const suggestions = useMemo(() => {
    const search = text.trim().toLowerCase()
    if (search === "") return []
    const startsWithSearch = (name: string) =>
      Number(name.toLowerCase().startsWith(search))
    return namedOptions
      .filter(({ name }) => name.toLowerCase().includes(search))
      .sort((a, b) => startsWithSearch(b.name) - startsWithSearch(a.name))
      .slice(0, MAX_SUGGESTIONS)
  }, [namedOptions, text])

  // a Pokemon picked elsewhere, like by its portrait, shows up as the search
  useEffect(() => {
    setText(value ? t(`pkm.${value}`) : "")
  }, [value, t])

  useEffect(() => {
    suggestionListRef.current?.children[activeIndex]?.scrollIntoView({
      block: "nearest"
    })
  }, [activeIndex])

  const pick = (pkm: Pkm) => {
    onChange(pkm)
    setText(t(`pkm.${pkm}`))
    setIsOpen(false)
  }

  const navigateSuggestions = (event: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      pick(suggestions[activeIndex].pkm)
    } else if (event.key === "Escape") {
      // or Escape would also close the wiki window
      event.preventDefault()
      event.stopPropagation()
      setIsOpen(false)
    }
  }

  return (
    <SearchInput
      value={text}
      onChange={(nextText) => {
        setText(nextText)
        setActiveIndex(0)
        setIsOpen(true)
        if (nextText.trim() === "") onChange("")
      }}
      onKeyDown={navigateSuggestions}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={suggestionListRef}
          className="pokemon-search-suggestions"
          role="listbox"
          // keeps the field focused, or its blur closes the list mid click
          onMouseDown={(event) => event.preventDefault()}
        >
          {suggestions.map(({ pkm, name }, index) => (
            <li
              key={pkm}
              role="option"
              aria-selected={index === activeIndex}
              className={cc({ active: index === activeIndex })}
              onClick={() => pick(pkm)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <PokemonPortrait portrait={PkmIndex[pkm]} loading="eager" />
              <span>{name}</span>
            </li>
          ))}
        </ul>
      )}
    </SearchInput>
  )
}
