# HALLOWEEN CANDY QUEST — RESOURCE PACK v1.0

**Audience:** English vocabulary game for children aged 5–6.  
**Gameplay:** Solo Adventure / two-team turn-taking; hybrid auto-walk + tap interactions; Trick or Treat candy collection.  
**Art:** colorful 16-bit-inspired pixel art, cute not scary.  
**Status:** visual asset pack only — **no gameplay code**.

## Contents

This archive contains **252 PNG images** and a JSON/CSV asset manifest. Images are separated into folders by purpose.

- `backgrounds/`: three themed zones, each with two variations, both 320×180 native and 1280×720 nearest-neighbor enlarged.
- `characters/`: six playable characters, transparent portraits, 5 states × 2 frames each, plus unified sprite sheets.
- `npcs/`: friendly Halloween house owners and background characters.
- `buildings/`, `doors/`, `interactables/`: separate buildings, doors, pumpkin states, chests, props and decorations.
- `candy/`: collectible candy variants and empty/half/full baskets.
- `vocabulary/`: **24 separate word icons** (transparent), and **24 ready-to-display 256×256 cards**.
- `ui/`: button states, panels and audio icons.
- `effects/`, `parallax/`, `environment/`: interaction effects, scene-layer samples, ground tiles and props.
- `source_atlases/`: full image-generation reference boards for visual guidance, not runtime assets.
- `asset_manifest.json` / `asset_manifest.csv`: exact relative paths, dimensions, transparent status, and asset purpose.

## Gameplay integration guidance (not code)

### Character animations

Each `characters/spritesheets/<character>_5x2_48px.png` contains 2 frames (columns) × 5 states (rows), 48×48 pixels per frame. Row order: idle → walk → knock → celebrate → try_again. The individual frame PNG files are in each character's folder. Pixel-size should be preserved using nearest-neighbor scaling. These frames are starter animations, **not a polished 8-direction walking set**.

### Backgrounds and screens

Design gameplay in 16:9 on desktop. Mobile should reflow with a camera viewport, not squash backgrounds. Static 320×180 pixel art may be shown at 1280×720 using exact x4 scaling. Houses, doors, characters and props should be layered above the background. Scene backgrounds are **painted compositions, not collision maps**.

### Vocabulary

Cards and icons are independent of Halloween gameplay; educators may use other word sets. Included art covers: pumpkin, ghost, bat, cat, candy, witch, hat, spider, moon, broom, vampire, owl, cauldron, potion, mask, lantern, skeleton, castle, monster, costume, web, star, trick or treat, haunted house.

### Asset limitations and visual QA

1. This is a **first-pass separated visual kit**, cropped/cleaned from generated source atlases. Some objects may have tiny color fringes or leftover dark pixels. Transparent PNGs are suitable for prototyping; polish edge pixels before commercial release.
2. The six character animation sets are **small pose samples**. More frames and consistent side views will be required for fluid production animations.
3. Background compositions contain embedded decorative buildings. Overlay the isolated building and door assets for interactivity; avoid assuming the background is fully modular.
4. The `source_atlases/` folder contains compositional boards, including text labels. Do not use those images as runtime UI.
5. UI buttons may contain baked English labels. Use localized rendering for any labels that must change.
6. Audio recordings and music are **not included**; only visual audio icons are provided. Teacher voice / TTS / uploaded recordings are to be integrated later.
7. The source images are AI-generated; inspect semantic details and visual consistency before final production use.

## Asset totals by category

- background: 12
- basket: 3
- building: 9
- candy: 14
- character_frame: 60
- character_portrait: 6
- character_spritesheet: 6
- door: 12
- effect: 6
- environment_prop: 10
- interactive_prop: 15
- npc: 10
- parallax: 4
- preview: 1
- source_atlas: 3
- tile: 10
- ui_button: 14
- ui_icon: 3
- ui_panel: 6
- vocabulary_card: 24
- vocabulary_icon: 24

## Game-design snapshot

Solo: 8 turns by default, no countdown, progressive exploration across all 3 zones.  
Teams: 12 turns by default, 6 turns/team with equal reward opportunities.  
Scoring: +2 candies on first try, +1 after hint, 0 after two unsuccessful attempts; never subtract.  
Question modes: Listen & Choose, Look & Listen, Find the Object, Match the Pairs.  
Adult controls: Replay, Pause, Skip, Next Turn and vocabulary setup.

**File licensing note:** These are generated resources provided for use in the project. Third-party trademark/logos/music are not included.
