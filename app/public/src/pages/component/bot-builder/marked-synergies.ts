import { useEffect, useState } from "react"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import type { Pkm } from "../../../../../types/enum/Pokemon"
import type { Synergy } from "../../../../../types/enum/Synergy"
import { LocalStoreKeys, localStore } from "../../utils/store"

function readMarkedSynergies(): Synergy[] {
  const stored = localStore.get(LocalStoreKeys.TEAM_PLANNER_MARKED_SYNERGIES)
  return Array.isArray(stored) ? stored : []
}

export function useMarkedSynergies() {
  const [markedSynergies, setMarkedSynergies] = useState(readMarkedSynergies)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LocalStoreKeys.TEAM_PLANNER_MARKED_SYNERGIES) {
        setMarkedSynergies(readMarkedSynergies())
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const toggleMarkedSynergy = (synergy: Synergy) => {
    const next = markedSynergies.includes(synergy)
      ? markedSynergies.filter((s) => s !== synergy)
      : [...markedSynergies, synergy]
    localStore.set(LocalStoreKeys.TEAM_PLANNER_MARKED_SYNERGIES, next)
  }

  const clearMarkedSynergies = () =>
    localStore.set(LocalStoreKeys.TEAM_PLANNER_MARKED_SYNERGIES, [])

  return { markedSynergies, toggleMarkedSynergy, clearMarkedSynergies }
}

// Magby counts for Artificial through Magmortar
function getEvolutionLine(pokemon: Pkm): Pkm[] {
  const line: Pkm[] = []
  const toVisit = [pokemon]
  while (toVisit.length > 0) {
    const current = toVisit.pop()!
    if (line.includes(current)) continue
    line.push(current)
    const { evolution, evolutions } = getPokemonData(current)
    if (evolution) toVisit.push(evolution)
    if (evolutions) toVisit.push(...evolutions)
  }
  return line
}

export function hasMarkedSynergy(pokemon: Pkm, markedSynergies: Synergy[]) {
  return (
    markedSynergies.length > 0 &&
    getEvolutionLine(pokemon).some((stage) =>
      getPokemonData(stage).types.some((type) => markedSynergies.includes(type))
    )
  )
}
