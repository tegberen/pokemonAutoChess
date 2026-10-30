import { Emotion } from "../../types/enum/Emotion"

export const EmotionCost: { [key in Emotion]: number } = {
  [Emotion.NORMAL]: 50,
  [Emotion.HAPPY]: 100,
  [Emotion.PAIN]: 100,
  [Emotion.ANGRY]: 100,
  [Emotion.WORRIED]: 100,
  [Emotion.SAD]: 100,
  [Emotion.CRYING]: 100,
  [Emotion.SHOUTING]: 150,
  [Emotion.TEARY_EYED]: 150,
  [Emotion.DETERMINED]: 150,
  [Emotion.JOYOUS]: 150,
  [Emotion.INSPIRED]: 150,
  [Emotion.SURPRISED]: 150,
  [Emotion.DIZZY]: 150,
  [Emotion.SPECIAL0]: 200,
  [Emotion.SPECIAL1]: 200,
  [Emotion.SIGH]: 200,
  [Emotion.STUNNED]: 200,
  [Emotion.SPECIAL2]: 200,
  [Emotion.SPECIAL3]: 200
}
