import { Blessing, SALT_SHAKER_RADIUS_BY_STAR } from "../types/enum/Blessing"
import { distanceC } from "../utils/distance"
import type { Board } from "./board"
import type { PokemonEntity } from "./pokemon-entity"

// kept apart from salt-cure.ts: the entity's death hook needs these, and it
// must not import an ability file

const SALT_CURE_RADIUS = 2

export function getSaltCureRadius(pokemon: PokemonEntity) {
  if (!pokemon.heroBlessings?.has(Blessing.SALT_SHAKER)) return SALT_CURE_RADIUS
  return (
    SALT_SHAKER_RADIUS_BY_STAR[pokemon.stars - 1] ??
    SALT_SHAKER_RADIUS_BY_STAR.at(-1)!
  )
}

// same round radius as board.getCellsInRadius, so "in range" matches what the
// cast actually reaches
function isWithinSaltCure(nacli: PokemonEntity, x: number, y: number) {
  const radius = getSaltCureRadius(nacli) + 0.5
  const dx = nacli.positionX - x
  const dy = nacli.positionY - y
  return dx * dx + dy * dy < radius * radius
}

export function grantSaltShakerRockSalt(
  knockedOut: PokemonEntity,
  board: Board
) {
  const saltShakers = board.cells.filter(
    (entity): entity is PokemonEntity =>
      entity !== undefined &&
      entity.team !== knockedOut.team &&
      entity.hp > 0 &&
      entity.heroBlessings?.has(Blessing.SALT_SHAKER) === true &&
      isWithinSaltCure(entity, knockedOut.positionX, knockedOut.positionY)
  )
  for (const nacli of saltShakers) {
    const ally = board.cells
      .filter(
        (entity): entity is PokemonEntity =>
          entity !== undefined &&
          entity.team === nacli.team &&
          entity.hp > 0 &&
          !entity.status.runeProtect
      )
      .sort(
        (a, b) =>
          distanceC(
            a.positionX,
            a.positionY,
            knockedOut.positionX,
            knockedOut.positionY
          ) -
          distanceC(
            b.positionX,
            b.positionY,
            knockedOut.positionX,
            knockedOut.positionY
          )
      )[0]
    if (!ally) continue
    ally.broadcastAbility({
      skill: "SALT_SHAKER_ROCK_SALT",
      positionX: knockedOut.positionX,
      positionY: knockedOut.positionY,
      targetX: ally.positionX,
      targetY: ally.positionY
    })
    ally.status.triggerRuneProtect(5000, ally, ally)
    ally.addShield(0.5 * ally.maxHP, ally, 0, false)
  }
}
