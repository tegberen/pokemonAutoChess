#!/bin/bash

SPRITE_COLLAB_PATH="/c/Users/arbet/pac/SpriteCollab"
EDIT_DIR="/c/Users/arbet/pac/pokemonAutoChess/edit"

CUSTOM_POKEMON=(

  "0646-0001"
  "0646-0002"

)

cd "$EDIT_DIR" || exit 1

for INDEX in "${CUSTOM_POKEMON[@]}"; do
  echo "Adding pokemon: $INDEX"
  npx ts-node add-pokemon.ts << EOF
$SPRITE_COLLAB_PATH
$INDEX
EOF
  sleep 2
  if [ $? -ne 0 ]; then
    echo "❌ Failed for $INDEX"
  else
    echo "✅ Done: $INDEX"
  fi
done

echo "All custom pokemon processed!"
