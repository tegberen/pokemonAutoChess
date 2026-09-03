import { Marked } from "marked"
import { RarityColor } from "../../../../../config/game/shop"
import { Rarity } from "../../../../../types/enum/Game"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { Synergy } from "../../../../../types/enum/Synergy"
import { getPortraitSrc } from "../../../../../utils/avatar"

export const chapters = [
  {
    id: "pokemon",
    title: "Pokémon",
    heading: "Pokémon"
  },
  {
    id: "synergies",
    title: "Synergies",
    heading: "Synergies"
  },
  {
    id: "weather",
    title: "Weather",
    heading: "Weather"
  },
  {
    id: "items",
    title: "Items",
    heading: "Items"
  },
  {
    id: "events",
    title: "Game Mode",
    heading: "Game Mode"
  },
  {
    id: "misc",
    title: "Misc",
    heading: "Misc"
  }
] as const

export type GuideChapterId = (typeof chapters)[number]["id"]
export type GuidePageId = "home" | GuideChapterId
export const guidePages = [
  { id: "home", title: "Overview" },
  ...chapters
] as const

// Keep the editable Markdown as the source of truth; each heading becomes a chapter.
export function chapterMarkdown(markdown: string, heading: string) {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex(
    (line) => /^## /.test(line) && line.replace(/^## /, "").trim() === heading
  )
  if (start < 0) return ""
  const level = 2
  let end = start + 1
  while (end < lines.length) {
    const next = lines[end].match(/^(#{1,3}) /)
    if (next && next[1].length <= level) break
    end++
  }
  return lines
    .slice(start + 1, end)
    .join("\n")
    .trim()
}

const pokemonNameAliases: Record<string, Pkm> = {
  ALCREMIE: Pkm.ALCREMIE_VANILLA,
  MAMOOSH: Pkm.MAMOSWINE,
  INTELLION: Pkm.INTELEON,
  "ALOLAN NINETALES": Pkm.ALOLAN_NINETALES,
  "GALAR WEEZING": Pkm.GALARIAN_WEEZING,
  "HISUIAN ARCANINE": Pkm.HISUI_ARCANINE,
  "BLOODMOON URSALUNA": Pkm.URSALUNA_BLOODMOON
}

// Match the longest form names first; compile once, not once per table row.
const pokemonLabels = [
  ...Object.entries(pokemonNameAliases).map(([label, pokemon]) => ({
    label,
    pokemon
  })),
  ...Object.values(Pkm).map((pokemon) => ({
    pokemon,
    label: pokemon.replaceAll("_", " ")
  }))
]
  .sort((a, b) => b.label.length - a.label.length)
  .map(({ pokemon, label }) => ({
    pokemon,
    label,
    expression: new RegExp(
      `(^|[^A-Z])${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^A-Z]|$)`,
      "g"
    )
  }))

function pokemonPortraits(subject: string) {
  let remaining = subject.toUpperCase()
  const matches = new Set<Pkm>()
  for (const { pokemon, label, expression } of pokemonLabels) {
    remaining = remaining.replace(expression, (_, prefix: string) => {
      matches.add(pokemon)
      return prefix + " ".repeat(label.length)
    })
  }
  const portraits = document.createElement("span")
  portraits.className = "guide-pokemon-portraits"
  for (const pokemon of [...matches].slice(0, 5)) {
    const image = document.createElement("img")
    image.src = getPortraitSrc(PkmIndex[pokemon])
    image.alt = ""
    image.dataset.tooltipId = "game-pokemon-detail-tooltip"
    image.dataset.tooltipContent = pokemon
    portraits.append(image)
  }
  return portraits
}

function wrapTable(table: HTMLTableElement) {
  const wrapper = document.createElement("div")
  wrapper.className = "guide-table-scroll"
  table.replaceWith(wrapper)
  wrapper.append(table)
}

export function addPokemonPortraits(html: string) {
  const root = document.createElement("div")
  root.innerHTML = html
  root.querySelectorAll<HTMLUListElement>(":scope > ul").forEach((list) => {
    const entries = Array.from(list.children)
    // Leave ordinary prose lists intact rather than duplicating them into columns.
    if (!entries.every((item) => (item.textContent ?? "").includes(":"))) return
    const table = document.createElement("table")
    table.className = "guide-pokemon-table"
    let heading = list.previousElementSibling
    while (heading && heading.tagName !== "H3")
      heading = heading.previousElementSibling
    table.setAttribute("aria-label", (heading?.textContent ?? "") + " Pokémon")
    const head = table.createTHead().insertRow()
    for (const label of ["Pokémon", "Pool / types / ability"]) {
      const cell = document.createElement("th")
      cell.scope = "col"
      cell.textContent = label
      head.append(cell)
    }
    const body = table.createTBody()
    for (const item of entries) {
      const subject = (item.textContent ?? "").split(":", 1)[0].trim()
      const row = body.insertRow()
      row.id = sectionId("pokemon-" + subject)
      const nameCell = document.createElement("th")
      nameCell.scope = "row"
      const name = document.createElement("span")
      name.textContent = subject
      nameCell.append(pokemonPortraits(subject), name)
      row.append(nameCell)
      // Remove the subject without losing inline icons or markup in the effect.
      const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        const colon = (node.textContent ?? "").indexOf(":")
        if (colon < 0) continue
        const range = document.createRange()
        range.setStart(item, 0)
        range.setEnd(node, colon + 1)
        range.deleteContents()
        break
      }
      const cell = row.insertCell()
      while (item.firstChild) cell.append(item.firstChild)
    }
    list.replaceWith(table)
    wrapTable(table)
  })
  return root.innerHTML
}

export function sectionId(title: string) {
  return (
    "guide-section-" +
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
  )
}

export function formatGuideArticle(html: string, kind: "item" | "weather") {
  const root = document.createElement("div")
  root.innerHTML = html
  root.querySelectorAll("table").forEach((table) => {
    table.classList.add(`guide-${kind}-table`)
    table.setAttribute(
      "aria-label",
      kind === "item" ? "Items and effects" : "Weather and effects"
    )
    table
      .querySelectorAll("thead th")
      .forEach((cell) => cell.setAttribute("scope", "col"))
    for (const body of Array.from(table.tBodies)) {
      for (const row of Array.from(body.rows)) {
        const label = row.cells[0]?.textContent?.trim()
        if (label) row.id = sectionId("entry-" + label)
      }
    }
    wrapTable(table)
  })
  if (kind === "weather") return root.innerHTML
  root.querySelectorAll("h4").forEach((heading) => {
    const section = document.createElement("section")
    section.className = "guide-item-entry"
    heading.before(section)
    section.append(heading)
    while (
      section.nextElementSibling &&
      !/^H[1-4]$/.test(section.nextElementSibling.tagName)
    ) {
      section.append(section.nextElementSibling)
    }
    const body = document.createElement("div")
    body.className = "guide-item-body"
    while (heading.nextSibling) body.append(heading.nextSibling)
    section.append(body)
  })
  return root.innerHTML
}

export const guideParser = new Marked({
  renderer: {
    heading({ tokens, depth, text }) {
      const synergy = Object.values(Synergy).find(
        (type) => type === text.replace(/^Rework /, "").toUpperCase()
      )
      if (depth === 4)
        return `<h4 id="${sectionId(text)}">${this.parser.parseInline(tokens)}</h4>`
      if (depth !== 3) return false
      if (text === "Mega Evolution") {
        return `<h3 id="${sectionId(text)}" class="guide-section-heading guide-mega-heading"><span class="guide-mega-label">${this.parser.parseInline(tokens)}</span></h3>`
      }
      const rarity = Object.values(Rarity).find(
        (value) => value === text.toUpperCase()
      )
      if (rarity) {
        return `<h3 id="${sectionId(text)}" class="guide-rarity-heading" style="color: ${RarityColor[rarity]}">${this.parser.parseInline(tokens)}</h3>`
      }
      const icon = synergy
        ? `<img class="synergy-icon" src="assets/types/${synergy}.svg" alt="" />`
        : ""
      return `<h3 id="${sectionId(text)}" class="guide-section-heading">${icon}${this.parser.parseInline(tokens)}</h3>`
    },
    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens)
      // Only internal Wiki and Bookmarks links get the shared button treatment.
      if (href.startsWith("#wiki/") || href.startsWith("#meta/")) {
        return `<a class="bubbly blue" href="${href}">${text}</a>`
      }
      return false
    }
  }
})
