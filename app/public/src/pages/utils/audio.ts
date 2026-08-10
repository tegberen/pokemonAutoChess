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
    sound.play()
  }
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
