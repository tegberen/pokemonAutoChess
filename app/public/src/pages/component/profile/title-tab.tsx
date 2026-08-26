import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  THEME_BY_TITLE,
  TITLES_UNLOCKING_THEMES,
  type TitleUnlockingTheme
} from "../../../../../config"
import { Title } from "../../../../../types"
import { isIn } from "../../../../../utils/array"
import { useAppDispatch, useAppSelector } from "../../../hooks"
import {
  fetchTitles,
  type ITitleStatistic
} from "../../../models/title-statistic"
import { setTitle } from "../../../stores/NetworkStore"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { Checkbox } from "../checkbox/checkbox"

const HIDDEN_TITLES = new Set<Title>([
  Title.COLLECTOR,
  Title.DUCHESS,
  Title.ELITE_FOUR_MEMBER,
  Title.DUKE,
  Title.ACE_TRAINER,
  Title.VANQUISHER,
  Title.DENTIST,
  Title.ARCHEOLOGIST
])

const JAC_TITLES = new Set<Title>([
  Title.WHALE,
  Title.ANCIENT,
  Title.THE_SCRIBBLER,
  Title.CHAMPION,
  Title.SHOW_OFF,
  Title.HOT_STREAK,
  Title.PRIDE,
  Title.STARRY,
  Title.WHIMSY
])

export function TitleTab() {
  const [showUnlocked, setShowUnlocked] = useState<boolean>(true)
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.network.profile)
  const [titles, setTitles] = useState<ITitleStatistic[]>([])
  const visibleTitleNames = Object.values(Title).filter(
    (title) => !HIDDEN_TITLES.has(title)
  )
  const nbTitlesUnlocked = user
    ? visibleTitleNames.filter((title) => isIn(user.titles, title)).length
    : 0

  useEffect(() => {
    fetchTitles().then((res) => {
      visibleTitleNames.forEach((title) => {
        if (!res.some((t) => t.name === title)) {
          res.push({ name: title, rarity: 0 })
        }
      })
      setTitles(res.filter((title) => !HIDDEN_TITLES.has(title.name)))
    })
  }, [])

  const renderTitle = (title: ITitleStatistic) => {
    const unlocked = user?.titles.includes(title.name) ?? false

    return (
      <li
        key={title.name}
        style={{
          background: `linear-gradient(to right, var(--color-bg-primary) 0% ${
            title.rarity * 100
          }%, var(--color-bg-secondary) ${title.rarity * 100}% 100%)`
        }}
        className={cc("clickable", "my-box", {
          unlocked,
          selected: user?.title === title.name
        })}
        onClick={() => {
          if (unlocked) dispatch(setTitle(title.name))
        }}
      >
        <span className="title-name">{t(`title.${title.name}`)}</span>
        <div className="title-description">
          <p>{addIconsToDescription(t(`title_description.${title.name}`))}</p>
          {isIn(TITLES_UNLOCKING_THEMES, title.name) && (
            <p>
              <img src="/assets/ui/palette.svg" height="24" width="24" />{" "}
              {t("profile.progress.unlocks_theme", {
                theme: t(
                  `theme.${THEME_BY_TITLE[title.name as TitleUnlockingTheme]}`
                )
              })}
            </p>
          )}
        </div>
        <span className="title-rarity">
          {(title.rarity * 100).toFixed(3)}%
        </span>
      </li>
    )
  }

  const sortedTitles = [...titles].sort((a, b) =>
    t(`title.${a.name}`).localeCompare(t(`title.${b.name}`))
  )
  const titleGroups = [
    {
      key: "jac",
      label: t("profile.titles.jac", { defaultValue: "JAC Titles" }),
      hint: t("profile.titles.jac_hint", {
        defaultValue: "Special titles from community events and challenges"
      }),
      titles: sortedTitles.filter(
        (title) =>
          JAC_TITLES.has(title.name) &&
          (showUnlocked || user?.titles.includes(title.name) === true)
      )
    },
    {
      key: "unlocked",
      label: t("profile.titles.unlocked", { defaultValue: "Unlocked Titles" }),
      hint: t("profile.titles.unlocked_hint", {
        defaultValue: "Ready to equip"
      }),
      titles: sortedTitles.filter(
        (title) =>
          !JAC_TITLES.has(title.name) && user?.titles.includes(title.name)
      )
    },
    {
      key: "locked",
      label: t("profile.titles.locked", { defaultValue: "Locked Titles" }),
      hint: t("profile.titles.locked_hint", {
        defaultValue: "Complete their challenge to unlock them"
      }),
      titles: showUnlocked
        ? sortedTitles.filter(
            (title) =>
              !JAC_TITLES.has(title.name) && !user?.titles.includes(title.name)
          )
        : []
    }
  ]

  return user && titles ? (
    <div className="title-tab">
      <div className="title-tab-toolbar">
        <Checkbox
          checked={showUnlocked}
          onToggle={setShowUnlocked}
          label={t("toggle_locked")}
          isDark
        />
        <p>
          {t("profile.progress.titles_unlocked", {
            count: nbTitlesUnlocked,
            total: visibleTitleNames.length
          })}
        </p>
      </div>
      <ul className="titles title-current">
        <li
          key="no-title"
          className={cc("clickable", "my-box", {
            unlocked: true,
            selected: user.title === ""
          })}
          onClick={() => dispatch(setTitle(""))}
        >
          <span className="title-name">{t("title.no_title")}</span>
          <span className="title-description">
            {t("profile.titles.clear_hint", {
              defaultValue: "Display your name without a title"
            })}
          </span>
        </li>
      </ul>
      {titleGroups.map(
        (group) =>
          group.titles.length > 0 && (
            <section className={`title-group title-group-${group.key}`} key={group.key}>
              <header>
                <div>
                  <h3>{group.label}</h3>
                  <p>{group.hint}</p>
                </div>
                <span className="title-group-count">{group.titles.length}</span>
              </header>
              <ul className="titles">{group.titles.map(renderTitle)}</ul>
            </section>
          )
      )}
    </div>
  ) : null
}
