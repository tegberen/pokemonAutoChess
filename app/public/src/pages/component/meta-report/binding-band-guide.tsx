import { type ReactNode, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Item } from "../../../../../types/enum/Item"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { addIconsToHtml } from "../../utils/descriptions"
import "./binding-band-guide.css"

const recipes: Record<string, [Item, Item, Item]> = {
  "Everstone: Binding Band + Fossil Stone": [
    Item.BINDING_BAND,
    Item.FOSSIL_STONE,
    Item.EVER_STONE
  ],
  "Soothe Bell": [Item.BINDING_BAND, Item.MIRACLE_SEED, Item.SOOTHE_BELL],
  "EXP Charm": [Item.BINDING_BAND, Item.MYSTIC_WATER, Item.EXP_CHARM],
  "Fairy Feather": [Item.BINDING_BAND, Item.HEART_SCALE, Item.FAIRY_FEATHER],
  "Clear Amulet": [Item.BINDING_BAND, Item.NEVER_MELT_ICE, Item.CLEAR_AMULET],
  "Destiny Knot": [Item.BINDING_BAND, Item.CHARCOAL, Item.DESTINY_KNOT],
  "Lucky Punch": [Item.BINDING_BAND, Item.MAGNET, Item.LUCKY_PUNCH],
  "Grip Claw": [Item.BINDING_BAND, Item.BLACK_GLASSES, Item.GRIP_CLAW],
  "Covert Cloak": [Item.BINDING_BAND, Item.TWISTED_SPOON, Item.COVERT_CLOAK],
  "Fluffy Tail": [Item.BINDING_BAND, Item.BINDING_BAND, Item.FLUFFY_TAIL]
}

// Every example is a pair: the set the reader already builds on the main
// server, and the Binding Band version of the same idea. A pair without a
// familiar half is an idea the component makes possible for the first time.
// Both halves read "context: items"; only the new half explains itself.
type BuildPair = { familiar?: string; new: string }

const builds: Record<string, BuildPair[]> = {
  "Soothe Bell": [
    {
      familiar: "GRASS: stacking GREEN_ORB",
      new: "BUG or AQUATIC: stacking SOOTHE_BELL"
    },
    {
      familiar: "Tempo slam: STAR_DUST",
      new: "Tempo slam: SOOTHE_BELL to preserve HP — the raw SHIELD is strongest early and falls off later"
    }
  ],
  "EXP Charm": [{ new: "EXP_CHARM + STAR_DUST or RELIC_CROWN" }],
  "Fairy Feather": [
    {
      new: "ROCK: FAIRY_FEATHER + LOADED_DICE, XRAY_VISION or UPGRADE — DEF turned into damage"
    },
    {
      new: "ELECTRIC, AMORPHOUS or FLYING: FAIRY_FEATHER for the ATK reduction"
    }
  ],
  "Clear Amulet": [
    {
      familiar:
        "Bruiser: MUSCLE_BAND + two sustain items (e.g. ROCKY_HELMET, ASSAULT_VEST, SAFETY_GOGGLES)",
      new: "DRAGON, FIGHTING or GROUND: CLEAR_AMULET — one more sustain option"
    },
    { new: "WILD, DARK or STEEL: FLAME_ORB + CLEAR_AMULET" }
  ],
  "Destiny Knot": [
    {
      familiar: "PROTECT tank: POKE_DOLL + SHINY_CHARM",
      new: "FAIRY or GHOST: FLUFFY_TAIL + LOADED_DICE + DESTINY_KNOT — a dodge tank that buffs its carry"
    }
  ],
  "Lucky Punch": [
    {
      familiar:
        "Speed core: XRAY_VISION + two ON_ATTACK items (e.g. RAZOR_CLAW + RAZOR_FANG)",
      new: "STEEL, FIRE or MONSTER: LUCKY_PUNCH + two ON_ATTACK items"
    }
  ],
  "Grip Claw": [
    {
      familiar: "Scaling options: UPGRADE or SOUL_DEW",
      new: "Two more scaling options: GRIP_CLAW and WIDE_LENS"
    }
  ],
  "Covert Cloak": [
    {
      familiar: "AP carry: CHOICE_SPECS + SOUL_DEW, AQUA_EGG or PROTECTIVE_PADS",
      new: "COVERT_CLOAK + POKEMONOMICON (replaces CHOICE_SPECS) + WIDE_LENS or BLUE_ORB"
    }
  ]
}

type Section = { heading: string; level: number; paragraphs: string[] }

function parseGuide(markdown: string): Section[] {
  const sections: Section[] = []
  let current: Section | undefined
  for (const block of markdown.split(/\r?\n\r?\n/)) {
    const heading = block.match(/^(#{1,2}) (.+)$/)
    if (heading) {
      current = {
        level: heading[1].length,
        heading: heading[2],
        paragraphs: []
      }
      sections.push(current)
    } else if (current && block.trim().length > 0) {
      current.paragraphs.push(block.trim())
    }
  }
  return sections
}

function ItemIcon({ item }: { item: Item }) {
  return (
    <span
      className="binding-guide-item"
      data-tooltip-id="item-detail-tooltip"
      data-tooltip-content={item}
      tabIndex={0}
    >
      <img src={`assets/item/${item}.png`} alt="" />
    </span>
  )
}

function Recipe({ items }: { items: [Item, Item, Item] }) {
  return (
    <div className="binding-guide-recipe" aria-hidden="true">
      <ItemIcon item={items[0]} />
      <span>+</span>
      <ItemIcon item={items[1]} />
      <span>=</span>
      <ItemIcon item={items[2]} />
    </div>
  )
}

// addIconsToHtml, unlike its React sibling, wires item chips to the shared
// item-detail-tooltip, so hovering an item in the guide opens the same card as
// hovering it on the board.
function Icons({ text }: { text: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: addIconsToHtml(text.replace(/\r?\n/g, "<br>"))
      }}
    />
  )
}

function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return paragraphs.map((paragraph) => (
    <p key={paragraph}>
      <Icons text={paragraph} />
    </p>
  ))
}

function Builds({ pairs }: { pairs: BuildPair[] }) {
  return (
    <details className="binding-guide-builds">
      <summary>
        Opinions
        <span className="binding-guide-builds-chevron" />
      </summary>
      <ul className="binding-guide-builds-list">
        {pairs.map((pair) => (
          <li key={pair.new}>
            {pair.familiar && (
              <>
                <span className="binding-guide-build-label">Familiar</span>
                <Icons text={pair.familiar} />
              </>
            )}
            <span className="binding-guide-build-label binding-guide-build-label-new">
              New
            </span>
            <Icons text={pair.new} />
          </li>
        ))}
      </ul>
    </details>
  )
}

function SectionHeading({
  section,
  children
}: {
  section: Section
  children?: ReactNode
}) {
  const { t } = useTranslation()

  if (section.level === 1) {
    return (
      <header className="binding-guide-title">
        <img src="assets/item/BINDING_BAND.png" alt="" />
        <div>
          <h2>{section.heading}</h2>
          {children}
        </div>
      </header>
    )
  }
  const recipe = recipes[section.heading]
  const item = recipe?.[2]

  return (
    <header className="binding-guide-section-heading">
      <div className="binding-guide-heading-row">
        <h3>{section.heading}</h3>
        {recipe && <Recipe items={recipe} />}
      </div>
      {item && (
        <blockquote className="binding-guide-item-description">
          <Icons text={t(`item_description.${item}`)} />
        </blockquote>
      )}
    </header>
  )
}

export function BindingBandGuide() {
  const [markdown, setMarkdown] = useState("")
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    const controller = new AbortController()
    fetch("/changelog/binding-band-guide.md", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Guide unavailable")
        return response.text()
      })
      .then((text) => {
        if (controller.signal.aborted) return
        setMarkdown(text)
        setStatus("ready")
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error")
      })
    return () => controller.abort()
  }, [])

  if (status !== "ready") {
    return (
      <article className="binding-band-guide">
        <section className="my-box binding-guide-section">
          <p>{status === "loading" ? "Loading…" : "Guide unavailable"}</p>
        </section>
      </article>
    )
  }

  return (
    <article className="binding-band-guide">
      {parseGuide(markdown).map((section) => (
        <section
          className={`my-box binding-guide-section binding-guide-level-${section.level}`}
          key={section.heading}
        >
          <SectionHeading section={section}>
            {section.level === 1 && (
              <Paragraphs paragraphs={section.paragraphs} />
            )}
          </SectionHeading>
          {section.level !== 1 && (
            <div className="binding-guide-copy">
              <Paragraphs paragraphs={section.paragraphs} />
              {builds[section.heading] && (
                <Builds pairs={builds[section.heading]} />
              )}
            </div>
          )}
        </section>
      ))}
      <ItemDetailTooltip />
    </article>
  )
}
