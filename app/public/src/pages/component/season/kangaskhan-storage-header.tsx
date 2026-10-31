import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import { Emotion } from "../../../../../types/enum/Emotion"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"

const KANGASKHAN_EMOTIONS = getAvailableEmotions(
  PkmIndex[Pkm.KANGASKHAN],
  false
)
const REACTION_MS = 2500

type StorageReaction = "avatar" | "favorite"

const REACTION_EMOTIONS: Record<StorageReaction, Emotion[]> = {
  avatar: [Emotion.JOYOUS, Emotion.HAPPY],
  favorite: [Emotion.INSPIRED, Emotion.HAPPY]
}

// the storage window's header sits outside the storage itself, so the
// storage tells it what happened through this small listener list
const reactionListeners = new Set<(reaction: StorageReaction) => void>()

export function reactInKangaskhanStorage(reaction: StorageReaction) {
  reactionListeners.forEach((listener) => listener(reaction))
}

function getRestingEmotion() {
  return KANGASKHAN_EMOTIONS[
    Math.floor(Math.random() * KANGASKHAN_EMOTIONS.length)
  ]
}

// first of the reaction's faces that Kangaskhan has a portrait for
function getReactionEmotion(reaction: StorageReaction) {
  return (
    REACTION_EMOTIONS[reaction].find((emotion) =>
      KANGASKHAN_EMOTIONS.includes(emotion)
    ) ?? Emotion.NORMAL
  )
}

export default function KangaskhanStorageHeader() {
  const { t } = useTranslation()
  const [restingEmotion] = useState(getRestingEmotion)
  const [reactionEmotion, setReactionEmotion] = useState<Emotion>()

  useEffect(() => {
    const listener = (reaction: StorageReaction) =>
      setReactionEmotion(getReactionEmotion(reaction))
    reactionListeners.add(listener)
    return () => {
      reactionListeners.delete(listener)
    }
  }, [])

  useEffect(() => {
    if (!reactionEmotion) return
    const timeout = setTimeout(() => setReactionEmotion(undefined), REACTION_MS)
    return () => clearTimeout(timeout)
  }, [reactionEmotion])

  return (
    <span className="kangaskhan-storage-header">
      <img
        className="season-tab-portrait"
        src={getPortraitSrc(
          PkmIndex[Pkm.KANGASKHAN],
          false,
          reactionEmotion ?? restingEmotion
        )}
        width={28}
        height={28}
        alt=""
      />
      {t("collection.title")}
    </span>
  )
}
