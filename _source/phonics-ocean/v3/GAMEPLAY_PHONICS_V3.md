# PHONICS OCEAN V3 – GAMEPLAY & SYSTEM DESIGN

## 1. Core concept
Phonics Ocean V3 is a Feeding Frenzy–inspired phonics game for kindergarten and early primary learners.
The player swims through underwater levels, hunts smaller fish, avoids bigger predators, and grows by eating the correct target fish.
The learning layer is phonics; the arcade layer is survival, movement, timing, and growth.

Core fantasy:
- eat small fish
- grow bigger
- unlock deeper ocean levels
- learn phonics through repeated fast recognition

The whole resource pack has been redesigned as **separate assets** instead of one giant concept board, so the game can use clean images without quality loss from cropping.

---

## 2. Platform design: desktop vs mobile

### 2.1 Desktop (default, harder, more skill-based)
Desktop mode should feel closest to Feeding Frenzy.

Control rules:
- The player fish stays directly on the mouse cursor.
- Moving the cursor instantly changes the fish direction and path.
- Left click = dash boost for a short burst.
- Right click or keyboard brake key = slow down / brake.
- Because the fish sits directly on the cursor, control is fast and precise but harder.

Desktop difficulty characteristics:
- faster reaction gameplay
- denser schools of fish
- more predators on screen
- narrower safe gaps between big fish
- stronger need for precision when chasing correct phonics targets

Why it works:
This mode supports older or more confident players who can aim accurately and react quickly.

### 2.2 Mobile (easier, more guided)
Mobile must be easier and more forgiving than desktop.

Control rules:
- The fish auto-swims forward at a gentle speed.
- The player drags on screen or uses a virtual joystick only to steer.
- Optional tap-to-target support: tap a target fish and the player fish curves toward it.
- Optional aim assist / helper bubble can slightly pull the fish toward the nearest correct target.

Mobile difficulty reductions:
- fewer predators at the same depth
- slower predator movement
- larger target fish hitboxes
- clearer spacing between fish schools
- more helper items
- reduced punishment for wrong answers

Why it works:
Small children on phones or tablets need simpler hand movement, less precision, and more readable play states.

---

## 3. Gameplay loop
1. Start level.
2. Spawn the player in a biome matching the level depth.
3. Small edible fish appear first.
4. The game presents a phonics goal (sound, word family, picture cue, or word).
5. The player chases and eats the correct target fish.
6. Correct answers give score, growth energy, and combo.
7. Eating enough fish grows the player and unlocks bigger prey.
8. As the level progresses, larger fish and predators begin to appear.
9. Survive, reach the target score or target growth state, and dive to the next biome.

This reproduces the recognizable Feeding Frenzy rhythm:
- small fish first
- then medium fish
- then bigger fish and danger
- player growth creates access to new prey
- pressure increases over time

---

## 4. Phonics integration
Phonics should be embedded into the prey system, not added as a disconnected quiz layer.

### 4.1 Word-fish system
Certain prey fish are “word fish.” Their text is rendered in-engine.
Examples:
- CVC words: cat, sun, pig
- word family targets: -at, -ig, -op
- blends: stop, crab, flag
- digraphs: ship, chin, moth

### 4.2 Learning modes
The same resource pack can support multiple phonics modes:
- Hear and Catch: hear a sound/word, catch the correct fish
- See and Catch: see a written target, catch the matching fish
- Family Hunt: eat every fish belonging to one word family
- Mixed Review: combine sound cue + visual target + hazard pressure

### 4.3 Difficulty by answer type
- Wrong fish on desktop: combo break, mild slowdown, no instant fail for early levels
- Wrong fish on mobile: soft “boop,” small stun or no reward, keep game flowing
- For beginner levels, incorrect fish should not be too punishing

---

## 5. Biome and level progression
The ocean must feel deeper and more dangerous with every level.

### Level 1 – Coral Reef
- shallow, bright, open
- easiest density
- focus: letter sounds / simple CVC
- player fish 1: small red-orange reef hunter

### Level 2 – Kelp Forest
- slightly deeper
- vertical kelp lanes create movement paths
- focus: easy CVC review and short-word chase
- player fish 2: yellow striped reef fish

### Level 3 – Shipwreck Bay
- medium depth
- more obstacles and medium prey
- focus: word families and recognition speed
- player fish 3: blue explorer tang

### Level 4 – Twilight Trench
- darker, cooler colors
- predator pressure increases
- focus: blends
- player fish 4: lionfish-style hunter

### Level 5 – Abyss Cave
- deep cave atmosphere, narrow safe spaces
- more hazards and larger predators
- focus: digraphs
- player fish 5: purple angler explorer

### Level 6 – Volcanic Ruins
- deepest base pack biome, high pressure
- lava glow, late-game predator density
- focus: mixed review and challenge
- player fish 6: armored deep-sea guardian fish

Optional later expansion:
- Ice Sea
- Sunken Temple
- Boss-only challenge biome

---

## 6. Spawn and pacing model
To imitate Feeding Frenzy well, fish quantity and threat level must scale over time.

### 6.1 Early phase
- many tiny edible fish
- almost no predators
- easy target recognition
- player learns the current phonics goal

### 6.2 Mid phase
- medium fish begin appearing
- edible schools become mixed
- wrong targets are more frequent
- 1–2 predator types start to patrol

### 6.3 Late phase
- predator frequency increases
- larger prey become available only if the player has grown enough
- hazards appear more often
- spawn timing creates more screen pressure

### 6.4 Suggested difficulty curve
- Level 1: calm intro
- Level 2: slightly busier
- Level 3: medium pace
- Level 4: notable pressure jump
- Level 5: high tension
- Level 6: late-game challenge

---

## 7. Resource pack structure

### 7.1 Background files
- `coral_reef.png`
- `kelp_forest.png`
- `shipwreck_bay.png`
- `twilight_trench.png`
- `abyss_cave.png`
- `volcanic_ruins.png`

### 7.2 Sprite sheet files
- `player_fish_levels_sheet.png`
  - six player fish variants, one for each level theme
- `word_fish_and_prey_sheet.png`
  - word carrier fish
  - small/medium/large edible prey
- `predators_ui_items_effects_sheet.png`
  - predators
  - helper animals
  - hazards
  - items and power-ups
  - HUD icons
  - mobile control icons
  - VFX and portal/depth effects

---

## 8. Player growth system
Growth should be visible and satisfying.

Rules:
- correct fish increase the growth meter
- enough growth upgrades player size tier or unlocks larger prey
- larger prey give more points and more growth
- bigger player fish feel stronger and safer against small threats

Possible growth thresholds:
- tier A: can eat tiny fish only
- tier B: can eat tiny + medium
- tier C: can eat medium + selected big prey
- tier D: late-level empowered state

If preferred, the player can also visually change species by level rather than only scaling one fish.
This reinforces exploration and makes each biome feel new.

---

## 9. Items and helpers
Suggested support items included in the pack:
- star = score bonus
- lightning = speed burst
- bubble shield = temporary protection
- stopwatch = time bonus / slow motion
- heart = extra life / HP restore
- treasure chest = bonus reward
- magnet = attract nearby correct targets

Helper creatures:
- turtle = safe friendly ambient swimmer
- dolphin = cheerful helper / reward trigger

Hazards:
- jellyfish
- sea mine
- crab obstacle
- falling rocks

Predators:
- shark
- puffer predator
- moray eel
- barracuda
- anglerfish

---

## 10. Safety and child-friendly tone
The game should stay exciting without becoming scary.

Rules:
- predators look grumpy but cartoon-cute
- no gore
- no realistic injury
- failure feedback is brief and soft
- bright, readable silhouettes for all important fish

---

## 11. Implementation notes
- Word labels should be rendered by the engine, not baked into sprites.
- Desktop and mobile should use separate tuning presets.
- Mobile should always be easier than desktop.
- Spawn tables should depend on both level and elapsed time.
- Deeper biomes should use darker palettes and stronger contrast.
- Use the separate files from this pack directly instead of cropping from one large design board.

---

## 12. Recommended next production step
After this pack, the next ideal step is:
1. split the sheets into final animation frames
2. create `sprites.json` / atlas metadata
3. prepare level config JSON for each biome
4. connect the phonics content tables to prey spawning
5. tune separate desktop/mobile difficulty presets
