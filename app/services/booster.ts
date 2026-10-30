import { getBaseAltForm, PkmAltForms, PkmAltFormsByPkm } from "../config"
import { CollectionUtils } from "../core/collection"
import {
  CollectionEmotions,
  Emotion,
  type PkmWithCustom,
  Title
} from "../types"
import { NonPkm, Pkm, PkmIndex, Unowns } from "../types/enum/Pokemon"
import type { IUserMetadataMongo } from "../types/interfaces/UserMetadata"

export function checkTitlesAfterEmotionUnlocked(
  mongoUser: IUserMetadataMongo,
  unlocked: PkmWithCustom[]
) {
  const newTitles: Title[] = []
  if (!mongoUser.titles.includes(Title.SHINY_SEEKER)) {
    let numberOfShinies = 0
    mongoUser.pokemonCollection.forEach((c) => {
      const { shinyEmotions } = CollectionUtils.getEmotionsUnlocked(c)
      numberOfShinies += shinyEmotions.length
    })
    if (numberOfShinies >= 30) {
      newTitles.push(Title.SHINY_SEEKER)
    }
  }

  if (!mongoUser.titles.includes(Title.DUKE)) {
    if (
      Object.values(Pkm)
        .filter(
          (p) =>
            NonPkm.includes(p) === false && PkmAltForms.includes(p) === false
        )
        .every((pkm) => {
          const baseForm = getBaseAltForm(pkm)
          const accepted: Pkm[] =
            baseForm in PkmAltFormsByPkm
              ? [baseForm, ...PkmAltFormsByPkm[baseForm]]
              : [baseForm]
          return accepted.some((form) => {
            const item = mongoUser.pokemonCollection.get(PkmIndex[form])
            if (!item) return false
            const { emotions, shinyEmotions } =
              CollectionUtils.getEmotionsUnlocked(item)
            return emotions.length > 0 || shinyEmotions.length > 0
          })
        })
    ) {
      newTitles.push(Title.DUKE)
    }
  }

  if (
    unlocked.some((p) => p.emotion === Emotion.ANGRY && p.name === Pkm.ARBOK) &&
    !mongoUser.titles.includes(Title.DENTIST)
  ) {
    newTitles.push(Title.DENTIST)
  }

  if (
    !mongoUser.titles.includes(Title.ARCHEOLOGIST) &&
    Unowns.some((unown) => unlocked.map((p) => p.name).includes(unown)) &&
    Unowns.every((name) => {
      const unownIndex = PkmIndex[name]
      const item = mongoUser.pokemonCollection.get(unownIndex)
      const isBeingUnlockedRightNow = unlocked.some((p) => p.name === name)
      let isAlreadyUnlocked = false
      if (item) {
        const { emotions, shinyEmotions } =
          CollectionUtils.getEmotionsUnlocked(item)
        isAlreadyUnlocked = emotions.length > 0 || shinyEmotions.length > 0
      }
      return isAlreadyUnlocked || isBeingUnlockedRightNow
    })
  ) {
    newTitles.push(Title.ARCHEOLOGIST)
  }

  if (!mongoUser.titles.includes(Title.DUCHESS)) {
    if (
      unlocked.some((p) => {
        const item = mongoUser.pokemonCollection.get(PkmIndex[p.name])
        if (!item) return false
        const { emotions, shinyEmotions } =
          CollectionUtils.getEmotionsUnlocked(item)
        return (
          shinyEmotions.length >= CollectionEmotions.length &&
          emotions.length >= CollectionEmotions.length
        )
      })
    ) {
      newTitles.push(Title.DUCHESS)
    }
  }

  if (newTitles.length > 0) {
    mongoUser.titles.push(...newTitles)
  }
}
