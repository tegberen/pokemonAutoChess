import type React from "react"
import { useState } from "react"
import type { Emotion } from "../../../../types"
import { getAvatarSrc, getPortraitSrc } from "../../../../utils/avatar"
import { cc } from "../utils/jsx"

export interface PortraitOptions {
  index: string
  shiny?: boolean
  emotion?: Emotion
}

// the never on the opposite key lets both be destructured out of a union, which
// is what keeps them from reaching the DOM as invalid img attributes
type Props = (
  | { avatar: string; portrait?: never }
  | { portrait: string | PortraitOptions; avatar?: never }
) &
  React.ImgHTMLAttributes<HTMLImageElement>

const MISSING_PORTRAIT = "/assets/ui/missing-portrait.png"

export default function PokemonPortrait(props: Props) {
  const { className, avatar, portrait, ...rest } = props
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)

  let src: string
  if (portrait === undefined) {
    src = getAvatarSrc(avatar!)
  } else if (typeof portrait === "object") {
    src = getPortraitSrc(portrait.index, portrait.shiny, portrait.emotion)
  } else {
    src = getPortraitSrc(portrait)
  }

  return (
    // the intrinsic size reserves the box before the portrait loads, without it
    // hundreds of lazy portraits collapse to 0x0 and never enter the viewport
    <img
      src={erroredSrc === src ? MISSING_PORTRAIT : src}
      loading="lazy"
      decoding="async"
      width={40}
      height={40}
      className={cc("pokemon-portrait", className || "")}
      onError={() => setErroredSrc(src)}
      {...rest}
    />
  )
}
