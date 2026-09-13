import { Marked } from "marked"
import { RarityColor } from "../../../../../config/game/shop"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
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
  },
  {
    id: "patchlog",
    title: "Patch Log",
    heading: "Patch Log"
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
  "HISUIAN VOLTORB": Pkm.HISUI_VOLTORB,
  HIPPOWDON: Pkm.HIPPODOWN,
  "BLOODMOON URSALUNA": Pkm.URSALUNA_BLOODMOON,
  DARTRIX: Pkm.DARTIX,
  "HISUIAN SAMUROTT": Pkm.HISUI_SAMUROTT,
  "SHAYMIN (SKY)": Pkm.SHAYMIN_SKY,
  "CINDERACE (PIRATE)": Pkm.CINDERACE_PIRATE,
  "URSHIFU (SINGLE STRIKE)": Pkm.URSHIFU_SINGLE,
  "URSHIFU (RAPID STRIKE)": Pkm.URSHIFU_RAPID
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

function matchPokemons(subject: string) {
  let remaining = subject.toUpperCase()
  const positions = new Map<Pkm, number>()
  for (const { pokemon, label, expression } of pokemonLabels) {
    remaining = remaining.replace(
      expression,
      (_, prefix: string, offset: number) => {
        if (!positions.has(pokemon))
          positions.set(pokemon, offset + prefix.length)
        return prefix + " ".repeat(label.length)
      }
    )
  }
  return [...positions.keys()].sort(
    (a, b) => positions.get(a)! - positions.get(b)!
  )
}

function pokemonPortraits(subject: string) {
  const portraits = document.createElement("span")
  portraits.className = "guide-pokemon-portraits"
  for (const pokemon of matchPokemons(subject).slice(0, 5)) {
    const image = document.createElement("img")
    image.src = getPortraitSrc(PkmIndex[pokemon])
    image.alt = ""
    image.dataset.tooltipId = "game-pokemon-detail-tooltip"
    image.dataset.tooltipContent = pokemon
    portraits.append(image)
  }
  return portraits
}

const rarityOrder = Object.values(Rarity)

function groupRowsByRarity(body: HTMLTableSectionElement) {
  const rows = Array.from(body.rows)
  const rarityOf = (row: HTMLTableRowElement) => {
    const index = rarityOrder.indexOf(row.dataset.rarity as Rarity)
    return index < 0 ? rarityOrder.length : index
  }
  rows.sort((a, b) => rarityOf(a) - rarityOf(b))
  let currentRarity: string | undefined
  for (const row of rows) {
    const rarity = row.dataset.rarity as Rarity | undefined
    if (rarity && rarity !== currentRarity) {
      const heading = body.insertRow()
      heading.className = "guide-patchlog-rarity"
      const cell = heading.insertCell()
      cell.colSpan = 2
      cell.style.color = RarityColor[rarity]
      cell.textContent = rarity.charAt(0) + rarity.slice(1).toLowerCase()
    }
    currentRarity = rarity
    body.append(row)
  }
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

function appendWithArrows(target: Node, text: string) {
  text.split("→").forEach((part, index) => {
    if (index > 0) target.appendChild(patchLogSpan("guide-patchlog-arrow", "→"))
    if (part) target.appendChild(document.createTextNode(part))
  })
}

function patchLogSpan(className: string, text: string) {
  const span = document.createElement("span")
  span.className = className
  span.textContent = text
  return span
}

// mutes the value a change moved away from and brings the new one forward
function emphasiseValueChanges(cell: HTMLElement) {
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    if (node.textContent?.includes("→")) nodes.push(node)
  }
  for (const node of nodes) {
    const text = node.textContent ?? ""
    const fragment = document.createDocumentFragment()
    let last = 0
    for (const match of text.matchAll(/(\S+)(\s*)→(\s*)([^\s,]+)/g)) {
      const index = match.index ?? 0
      appendWithArrows(fragment, text.slice(last, index))
      fragment.append(
        patchLogSpan("guide-patchlog-old", match[1]),
        match[2],
        patchLogSpan("guide-patchlog-arrow", "→"),
        match[3],
        patchLogSpan("guide-patchlog-new", match[4])
      )
      last = index + match[0].length
    }
    appendWithArrows(fragment, text.slice(last))
    node.replaceWith(fragment)
  }
}

export type PatchLogWish = { name: string; icon: string }

function wishIconMatchers(wishes: PatchLogWish[]) {
  return wishes
    .flatMap(({ name, icon }) => {
      const family = name.replace(/\s+I{1,3}$/, "")
      return family === name
        ? [{ label: name, icon }]
        : [
            { label: name, icon },
            { label: family, icon }
          ]
    })
    .sort((a, b) => b.label.length - a.label.length)
    .map(({ label, icon }) => ({
      icon,
      label,
      expression: new RegExp(
        `(^|[^A-Za-z])${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^A-Za-z]|$)`,
        "i"
      )
    }))
}

function wishIcons(
  subject: string,
  matchers: ReturnType<typeof wishIconMatchers>
) {
  let remaining = subject
  const icons = new Set<string>()
  for (const { label, icon, expression } of matchers) {
    if (!expression.test(remaining)) continue
    icons.add(icon)
    remaining = remaining.replace(
      expression,
      (_, prefix: string) => prefix + " ".repeat(label.length)
    )
  }
  const wrapper = document.createElement("span")
  wrapper.className = "guide-wish-icons"
  for (const icon of [...icons].slice(0, 3)) {
    const image = document.createElement("img")
    image.src = `/assets/blessings/${icon}.svg`
    image.alt = ""
    wrapper.append(image)
  }
  return wrapper
}

export function formatPatchLog(html: string, wishes: PatchLogWish[]) {
  const matchers = wishIconMatchers(wishes)
  const root = document.createElement("div")
  root.innerHTML = html
  let category = ""
  for (const element of Array.from(root.children)) {
    const label = element.firstElementChild
    if (
      element.tagName === "P" &&
      element.childNodes.length === 1 &&
      label?.tagName === "STRONG"
    ) {
      category = label.textContent ?? ""
      const heading = document.createElement("h5")
      heading.className = "guide-patchlog-category"
      heading.textContent = category
      element.replaceWith(heading)
      continue
    }
    if (element.tagName !== "UL") continue
    const table = document.createElement("table")
    table.className = "guide-patchlog-table"
    const body = table.createTBody()
    for (const item of Array.from(element.children)) {
      const row = body.insertRow()
      const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT)
      let separatorNode: Text | null = null
      while (walker.nextNode()) {
        if ((walker.currentNode.textContent ?? "").includes("|")) {
          separatorNode = walker.currentNode as Text
          break
        }
      }
      if (!separatorNode) {
        const cell = row.insertCell()
        cell.colSpan = 2
        if (item.querySelector(".guide-new-tag")) {
          cell.className = "guide-patchlog-new-entry"
        }
        while (item.firstChild) cell.append(item.firstChild)
        if (category === "Wishes") {
          cell.prepend(wishIcons(cell.textContent ?? "", matchers))
        }
        continue
      }
      const range = document.createRange()
      range.setStart(item, 0)
      range.setEnd(
        separatorNode,
        (separatorNode.textContent ?? "").indexOf("|") + 1
      )
      const subject = row.insertCell()
      subject.className = "guide-patchlog-subject"
      subject.append(range.extractContents())
      // the icon pass wraps any text holding a stat token in a span, so the
      // separator can end up nested rather than as the cell's last child
      const subjectTexts = document.createTreeWalker(subject, NodeFilter.SHOW_TEXT)
      let lastText: Node | null = null
      while (subjectTexts.nextNode()) lastText = subjectTexts.currentNode
      if (lastText) {
        lastText.textContent = (lastText.textContent ?? "").replace(
          /\s*\|\s*$/,
          ""
        )
      }
      if (category === "Pokémon") {
        const subjectText = subject.textContent ?? ""
        const [firstPokemon] = matchPokemons(subjectText)
        if (firstPokemon) row.dataset.rarity = getPokemonData(firstPokemon).rarity
        subject.prepend(pokemonPortraits(subjectText))
      } else if (category === "Fixes") {
        const subjectText = subject.textContent ?? ""
        const portraits = pokemonPortraits(subjectText)
        const icons = wishIcons(subjectText, matchers)
        if (portraits.childElementCount > 0) subject.prepend(portraits)
        else if (icons.childElementCount > 0) subject.prepend(icons)
      } else if (category === "Wishes") {
        subject.prepend(wishIcons(subject.textContent ?? "", matchers))
      }
      const change = row.insertCell()
      while (item.firstChild) change.append(item.firstChild)
      emphasiseValueChanges(change)
    }
    if (category === "Pokémon") groupRowsByRarity(body)
    element.replaceWith(table)
    wrapTable(table)
  }
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

export function formatGuideArticle(
  html: string,
  kind: "item" | "weather" | "synergy"
) {
  const root = document.createElement("div")
  root.innerHTML = html
  root.querySelectorAll("table").forEach((table) => {
    table.classList.add(`guide-${kind}-table`)
    table.setAttribute(
      "aria-label",
      kind === "item"
        ? "Items and effects"
        : kind === "weather"
          ? "Weather and effects"
          : "Pokemon and abilities"
    )
    table
      .querySelectorAll("thead th")
      .forEach((cell) => cell.setAttribute("scope", "col"))
    for (const body of Array.from(table.tBodies)) {
      for (const row of Array.from(body.rows)) {
        const nameCell = row.cells[0]
        const label = nameCell?.textContent?.trim()
        if (label) row.id = sectionId("entry-" + label)
        // the synergy table names a Pokemon in its first column, so show its portrait
        if (kind === "synergy" && nameCell && label) {
          nameCell.prepend(pokemonPortraits(label))
        }
      }
    }
    wrapTable(table)
  })
  // only the items chapter groups its h4 headings into entry cards
  if (kind !== "item") return root.innerHTML
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
