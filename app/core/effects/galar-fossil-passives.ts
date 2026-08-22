import { Passive } from "../../types/enum/Passive"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"

export const FROZEN_BEAK_PARALYSIS_DURATION = 4000
export const FISHIOUS_REND_LOW_HP_THRESHOLD = 0.5
export const FISHIOUS_REND_LOW_HP_DAMAGE_MULTIPLIER = 1.3
export const FROZEN_REND_MAX_HP_RATIO = 0.2
export const FROZEN_REND_RUNE_PROTECT_DURATION = 1000

/* Every restored Galar fossil answers when an allied FOSSIL unit awakens its
   primordial power at 30% HP. All four are anchored on the ally that awakened
   rather than on the fossil itself: the fossil is a support piece, and the
   awakening frontliner is where the payoff should land. That awakening fires
   once per unit per combat (the synergy effects are removed right after), so
   these passives cannot double-trigger off the same ally. */
export function onPrimordialPowerAwakened(
  awakened: PokemonEntity,
  board: Board
) {
  board.cells.forEach((fossil) => {
    if (!fossil || fossil.team !== awakened.team || fossil.hp <= 0) return
    switch (fossil.passive) {
      case Passive.DRACOZOLT:
        return ampingBeakPassive(awakened)
      case Passive.ARCTOZOLT:
        return frozenBeakPassive(awakened, fossil, board)
      case Passive.DRACOVISH:
        return fishiousRendPassive(awakened)
      case Passive.ARCTOVISH:
        return frozenRendPassive(awakened, fossil)
    }
  })
}

// Dracozolt: the awakened ally casts as if it were one star higher
function ampingBeakPassive(awakened: PokemonEntity) {
  awakened.stars += 1
}

/* Arctozolt: paralyses what the awakened ally is up against; an already
   paralysed enemy is frozen instead */
function frozenBeakPassive(
  awakened: PokemonEntity,
  fossil: PokemonEntity,
  board: Board
) {
  forEachAdjacentEnemy(awakened, board, (enemy) => {
    if (enemy.status.paralysis) {
      enemy.status.triggerFreeze(FROZEN_BEAK_PARALYSIS_DURATION, enemy, fossil)
    } else {
      enemy.status.triggerParalysis(
        FROZEN_BEAK_PARALYSIS_DURATION,
        enemy,
        fossil
      )
    }
  })
}

/* Dracovish: the awakened ally finishes wounded enemies off. Read in
   pokemon-state alongside the other attacker-side damage multipliers. */
function fishiousRendPassive(awakened: PokemonEntity) {
  awakened.fishiousRendEmpowered = true
}

/* Arctovish: grows the awakened ally the way MONSTER stacks do. addMaxHP raises
   the ceiling and heals the same amount into current HP, so the awakening both
   restores it and pushes its 30% threshold back up. */
function frozenRendPassive(awakened: PokemonEntity, fossil: PokemonEntity) {
  awakened.addMaxHP(
    awakened.maxHP * FROZEN_REND_MAX_HP_RATIO,
    fossil,
    0,
    false
  )
  awakened.status.triggerRuneProtect(
    FROZEN_REND_RUNE_PROTECT_DURATION,
    awakened,
    fossil
  )
}

function forEachAdjacentEnemy(
  awakened: PokemonEntity,
  board: Board,
  apply: (enemy: PokemonEntity) => void
) {
  board
    .getAdjacentCells(awakened.positionX, awakened.positionY)
    .forEach((cell) => {
      const enemy = cell.value
      if (!enemy || enemy.team === awakened.team || enemy.hp <= 0) return
      apply(enemy)
    })
}
