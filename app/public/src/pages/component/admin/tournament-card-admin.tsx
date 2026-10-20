import { useEffect, useState } from "react"
import { useAppSelector } from "../../../hooks"
import { setEventNpc } from "../../../network"
import type { IEventNpcState } from "../../../stores/LobbyStore"
import { cc } from "../../utils/jsx"
import { Checkbox } from "../checkbox/checkbox"
import {
  type CalendarCardVariant,
  CalendarEventCard
} from "../events-menu/calendar"
import "../events-menu/calendar.css"

type CalendarCardDraft = {
  enabled: boolean
  title: string
  message: string
  date: string
}

type CalendarDraft = Record<CalendarCardVariant, CalendarCardDraft>

const CARD_SETTINGS: {
  variant: CalendarCardVariant
  label: string
  hint: string
  defaultTitle: string
  dateRequired: boolean
}[] = [
  {
    variant: "news",
    label: "News",
    hint: "An announcement, an update or anything players should know.",
    defaultTitle: "News",
    dateRequired: false
  },
  {
    variant: "smeargle",
    label: "Smeargle Pack Tournament",
    hint: "The solo tournament played under the Smeargle Pack rule.",
    defaultTitle: "Smeargle Pack Tournament",
    dateRequired: true
  },
  {
    variant: "doubleup",
    label: "Double Up Tournament",
    hint: "The duo tournament.",
    defaultTitle: "Double Up Tournament",
    dateRequired: true
  },
  {
    variant: "misfits",
    label: "Misfits Tournament",
    hint: "The solo tournament played under the Misfits rule.",
    defaultTitle: "Misfits Tournament",
    dateRequired: true
  }
]

function draftFromState(eventNpc: IEventNpcState): CalendarDraft {
  return {
    news: {
      enabled: eventNpc.newsEnabled,
      title: eventNpc.newsTitle,
      message: eventNpc.newsMessage,
      date: eventNpc.newsDate.slice(0, 10)
    },
    smeargle: {
      enabled: eventNpc.tournamentEnabled,
      title: eventNpc.tournamentTitle,
      message: eventNpc.tournamentMessage,
      date: eventNpc.tournamentDate.slice(0, 10)
    },
    doubleup: {
      enabled: eventNpc.doubleUpEnabled,
      title: eventNpc.doubleUpTitle,
      message: eventNpc.doubleUpMessage,
      date: eventNpc.doubleUpDate.slice(0, 10)
    },
    misfits: {
      enabled: eventNpc.misfitsEnabled,
      title: eventNpc.misfitsTitle,
      message: eventNpc.misfitsMessage,
      date: eventNpc.misfitsDate.slice(0, 10)
    }
  }
}

export function CalendarAdmin() {
  const eventNpc = useAppSelector((state) => state.lobby.eventNpc)
  const savedDraft = draftFromState(eventNpc)
  const [draft, setDraft] = useState<CalendarDraft>(savedDraft)
  useEffect(() => setDraft(draftFromState(eventNpc)), [eventNpc])

  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(savedDraft)
  const missingDate = CARD_SETTINGS.find(
    ({ variant, dateRequired }) =>
      dateRequired && draft[variant].enabled && !draft[variant].date
  )

  function updateCard(
    variant: CalendarCardVariant,
    changes: Partial<CalendarCardDraft>
  ) {
    setDraft((current) => ({
      ...current,
      [variant]: { ...current[variant], ...changes }
    }))
  }

  function save() {
    setEventNpc({
      enabled: eventNpc.enabled,
      pokemon: eventNpc.pokemon,
      title: eventNpc.title,
      message: eventNpc.message,
      orientation: eventNpc.orientation,
      animation: eventNpc.animation,
      emotion: eventNpc.emotion,
      tournamentEnabled: draft.smeargle.enabled,
      tournamentTitle: draft.smeargle.title,
      tournamentMessage: draft.smeargle.message,
      tournamentDate: draft.smeargle.date,
      doubleUpEnabled: draft.doubleup.enabled,
      doubleUpTitle: draft.doubleup.title,
      doubleUpMessage: draft.doubleup.message,
      doubleUpDate: draft.doubleup.date,
      newsEnabled: draft.news.enabled,
      newsTitle: draft.news.title,
      newsMessage: draft.news.message,
      newsDate: draft.news.date,
      misfitsEnabled: draft.misfits.enabled,
      misfitsTitle: draft.misfits.title,
      misfitsMessage: draft.misfits.message,
      misfitsDate: draft.misfits.date
    })
  }

  return (
    <div className="content calendar-admin">
      <p className="calendar-admin-intro">
        These cards appear in the Events menu, under Calendar. Turn a card on,
        fill it in, check the preview, then press Save.
      </p>

      {CARD_SETTINGS.map((card) => {
        const cardDraft = draft[card.variant]
        return (
          <section
            key={card.variant}
            className={cc("calendar-admin-card", {
              "hidden-card": !cardDraft.enabled
            })}
          >
            <header>
              <div>
                <h3>{card.label}</h3>
                <small>{card.hint}</small>
              </div>
              <Checkbox
                checked={cardDraft.enabled}
                onToggle={(enabled) => updateCard(card.variant, { enabled })}
                label={cardDraft.enabled ? "Shown" : "Hidden"}
                isDark
              />
            </header>

            <div className="calendar-admin-body">
              <div className="calendar-admin-fields">
                <label>
                  Title
                  <input
                    value={cardDraft.title}
                    placeholder={card.defaultTitle}
                    onChange={(e) =>
                      updateCard(card.variant, { title: e.target.value })
                    }
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={4}
                    value={cardDraft.message}
                    placeholder="What should players know?"
                    onChange={(e) =>
                      updateCard(card.variant, { message: e.target.value })
                    }
                  />
                </label>
                <label>
                  {card.dateRequired ? "Date" : "Date (optional)"}
                  <span className="calendar-admin-date">
                    <input
                      type="date"
                      value={cardDraft.date}
                      onChange={(e) =>
                        updateCard(card.variant, { date: e.target.value })
                      }
                    />
                    {!card.dateRequired && cardDraft.date && (
                      <button
                        type="button"
                        className="bubbly dark"
                        onClick={() => updateCard(card.variant, { date: "" })}
                      >
                        Clear
                      </button>
                    )}
                  </span>
                </label>
              </div>

              <div className="calendar-admin-preview">
                <small>Preview</small>
                <CalendarEventCard
                  name={cardDraft.title || card.defaultTitle}
                  description={cardDraft.message}
                  image=""
                  variant={card.variant}
                  start={cardDraft.date ? new Date(cardDraft.date) : null}
                  showCountdown={false}
                  now={new Date()}
                />
              </div>
            </div>
          </section>
        )
      })}

      <footer className="calendar-admin-footer">
        <span>
          {missingDate
            ? `${missingDate.label} needs a date before it can be shown.`
            : hasUnsavedChanges
              ? "You have unsaved changes."
              : "Everything is saved."}
        </span>
        <button
          className="bubbly blue"
          disabled={!hasUnsavedChanges || !!missingDate}
          onClick={save}
        >
          Save
        </button>
      </footer>
    </div>
  )
}
