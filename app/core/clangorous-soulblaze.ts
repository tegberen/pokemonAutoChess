import type { Board } from "./board"
import type { PokemonEntity } from "./pokemon-entity"

// kept apart from clangorous-soul.ts: the entity's death hook reads it, and it
// must not import an ability file

type StoredBuffs = { atk: number; def: number; speDef: number }

const buffsGainedFromOwnCasts = new WeakMap<PokemonEntity, StoredBuffs>()

export function recordClangorousSoulblazeBuffs(
  jangmoO: PokemonEntity,
  gained: StoredBuffs
) {
  const stored = buffsGainedFromOwnCasts.get(jangmoO) ?? {
    atk: 0,
    def: 0,
    speDef: 0
  }
  stored.atk += gained.atk
  stored.def += gained.def
  stored.speDef += gained.speDef
  buffsGainedFromOwnCasts.set(jangmoO, stored)
}

export function spreadClangorousSoulblazeBuffs(
  jangmoO: PokemonEntity,
  board: Board
) {
  const stored = buffsGainedFromOwnCasts.get(jangmoO)
  if (!stored) return
  buffsGainedFromOwnCasts.delete(jangmoO)
  const allies = board
    .getCellsInRange(jangmoO.positionX, jangmoO.positionY, jangmoO.range, false)
    .map((cell) => cell.value)
    .filter(
      (ally): ally is PokemonEntity =>
        ally !== undefined && ally.team === jangmoO.team && ally.hp > 0
    )
  jangmoO.broadcastAbility({ skill: "CLANGOROUS_SOULBLAZE_BURST" })
  allies.forEach((ally) => {
    jangmoO.broadcastAbility({
      skill: "CLANGOROUS_SOULBLAZE_SPREAD",
      targetX: ally.positionX,
      targetY: ally.positionY
    })
    ally.addAttack(stored.atk, jangmoO, 0, false)
    ally.addDefense(stored.def, jangmoO, 0, false)
    ally.addSpecialDefense(stored.speDef, jangmoO, 0, false)
  })
}
