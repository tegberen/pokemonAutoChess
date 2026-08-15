import type Phaser from "phaser"
import type { Scene } from "phaser"
import type { DungeonMusic } from "../../../../types/enum/Dungeon"
import { logger } from "../../../../utils/logger"
import { preference, subscribeToPreferences } from "../../preferences"

export const SOUNDS = {
  BLESSING: "blessing_sound.ogg",
  BLESSING_FLIP: "blessing_flip.ogg",
  BUTTON_CLICK: "buttonclick.ogg",
  BUTTON_HOVER: "buttonhover.ogg",
  CAROUSEL_UNLOCK: "carouselunlock.ogg",
  EVOLUTION_T2: "evolutiont2.ogg",
  EVOLUTION_T3: "evolutiont3.ogg",
  FINISH1: "finish1.ogg",
  FINISH2: "finish2.ogg",
  FINISH3: "finish3.ogg",
  FINISH4: "finish4.ogg",
  FINISH5: "finish5.ogg",
  FINISH6: "finish6.ogg",
  FINISH7: "finish7.ogg",
  FINISH8: "finish8.ogg",
  GOLD_TO_LEVEL: "gold_to_level_sound.ogg",
  JOIN_ROOM: "joinroom.ogg",
  LEAVE_ROOM: "leaveroom.ogg",
  REFRESH: "refresh.ogg",
  SELL_UNIT: "sell_unit_sound.ogg",
  SET_READY: "setready.ogg",
  SHOW_OFF: "show_off_song.ogg",
  START_GAME: "startgame.ogg"
} as const

type Soundkey = (typeof SOUNDS)[keyof typeof SOUNDS]

const AUDIO_ELEMENTS: { [K in Soundkey]?: HTMLAudioElement } = {}

export function preloadSounds() {
  Object.values(SOUNDS).forEach(
    (sound) => (AUDIO_ELEMENTS[sound] = new Audio(`assets/sounds/${sound}`))
  )
}

export function preloadMusic(
  scene: Scene,
  dungeonMusic: DungeonMusic,
  alt = ""
) {
  scene.load.audio("music_" + dungeonMusic, [
    `assets/musics/ogg/${dungeonMusic}${alt}.ogg`
  ])
}

function setupSounds() {
  document.body.addEventListener("mouseover", (e) => {
    if (e.target instanceof HTMLButtonElement) {
      playSound(SOUNDS.BUTTON_HOVER)
    }
  })
  document.body.addEventListener("click", (e) => {
    const button =
      e.target instanceof HTMLElement ? e.target.closest("button") : null
    // data-no-click-sound opts a button out when it plays a sound of its own
    if (button && button.dataset.noClickSound == null) {
      playSound(SOUNDS.BUTTON_CLICK)
    }
  })
}

preloadSounds()
setupSounds()

export function playSound(key: Soundkey, volume = 1) {
  const sound = AUDIO_ELEMENTS[key]
  if (sound) {
    sound.currentTime = 0
    sound.volume = (volume * preference("sfxVolume")) / 100
    // rejects until the user has interacted with the page; a missed sound
    // effect is not worth an unhandled rejection
    sound.play().catch(() => {})
  }
}

let showOffFadeInterval: ReturnType<typeof setInterval> | undefined

export function playShowOffSong(scene?: SceneWithMusic) {
  const sound = AUDIO_ELEMENTS[SOUNDS.SHOW_OFF]
  if (!sound) return

  if (showOffFadeInterval) clearInterval(showOffFadeInterval)
  sound.currentTime = 0
  const fadeInDuration = 3
  const fadeOutDuration = 5
  sound.volume = 0

  const fadeInterval = setInterval(() => {
    const remaining = sound.duration - sound.currentTime
    const fadeInProgress = Math.min(1, sound.currentTime / fadeInDuration)
    const fullVolume = preference("musicVolume") / 100
    if (Number.isFinite(remaining) && remaining <= fadeOutDuration) {
      const fadeOutProgress = Math.max(0, remaining / fadeOutDuration)
      sound.volume = fullVolume * fadeOutProgress
      scene?.music?.setVolume(fullVolume * (1 - fadeOutProgress))
    } else {
      sound.volume = fullVolume * fadeInProgress
      scene?.music?.setVolume(fullVolume * (1 - fadeInProgress))
    }
    if (sound.ended) {
      scene?.music?.setVolume(preference("musicVolume") / 100)
      clearInterval(fadeInterval)
      if (showOffFadeInterval === fadeInterval) showOffFadeInterval = undefined
    }
  }, 100)
  showOffFadeInterval = fadeInterval
  void sound.play().catch(() => {
    scene?.music?.setVolume(preference("musicVolume") / 100)
    clearInterval(fadeInterval)
    if (showOffFadeInterval === fadeInterval) showOffFadeInterval = undefined
  })
}

interface SceneWithMusic extends Phaser.Scene {
  music?: Phaser.Sound.WebAudioSound
}

export function playMusic(scene: SceneWithMusic, name: string) {
  if (scene == null || scene.music?.key === "music_" + name) return
  if (scene.music) scene.music.destroy()

  try {
    const music = scene.sound.add("music_" + name, {
      loop: true
    }) as Phaser.Sound.WebAudioSound

    const unsubscribeToPreferences = subscribeToPreferences(
      ({ musicVolume }) => {
        music.setVolume(musicVolume / 100)
      }
    )
    music.on("stop", unsubscribeToPreferences)

    scene.music = music
    scene.sound.pauseOnBlur = !preference("playInBackground")

    scene.music.play({
      volume: preference("musicVolume") / 100,
      loop: true
    })
  } catch (err) {
    logger.error("can't play music", err)
  }
}
