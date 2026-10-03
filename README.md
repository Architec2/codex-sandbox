# Essie's Enchanted Wilds

An original, lightweight third-person block adventure. Play as Essie, explore a storybook forest with magical rabbit Pip, collect and place blocks, and craft useful treasures. This repository contains the first playable vertical slice.

## Run

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Build the static release with `npm run build`; deploy the generated `dist/` directory to any static host. No server or API is required.

## Controls

| Action            | Control                                |
| ----------------- | -------------------------------------- |
| Move / run        | WASD / Shift                           |
| Jump              | Space                                  |
| Camera            | Mouse or trackpad; R recentres         |
| Break / attack    | Left click or F                        |
| Place / use       | Right click or G                       |
| Pack and crafting | E                                      |
| Hotbar            | 1–9 or wheel                           |
| Pause             | Escape                                 |
| Creative flight   | Double-tap Space; Space up, Shift down |

## Phase 1 features

- Adventure and Creative world setup with three difficulty choices.
- Chunk-sized procedural block world, visible-block instancing, fog-limited draw distance, and capped pixel ratio.
- Third-person Essie, Pip companion, block collecting/building, nine-slot hotbar, inventory, and five recipes.
- A gentle Shadowling enemy, health, sanctuary recovery, defeat safety, and day/night atmosphere.
- Automatic and manual IndexedDB saves with a localStorage fallback, tutorial prompts, responsive menus, persisted settings, keyboard alternatives, and procedural sound feedback.

## Performance and saves

The renderer uses simple untextured materials, one instanced mesh per block type, no shadows or post-processing, a compact world, capped resolution, limited entities, and automatic pause on lost focus. The Low preset is the intended default for 1366×768 integrated-graphics laptops. Saves are versioned and stored in IndexedDB, with localStorage as the restricted-browser fallback; clearing site data removes them.

## Known limitations

- Water is visual only, and stair-stepping up one-block ledges is not automatic yet.
- Phase 1 deliberately limits the active world to one Shadowling at a time; navigation is lightweight direct pursuit rather than full pathfinding.
- Touch controls, gamepads, music, and multiple world slots are not included.

## Phase 2 ideas

Add streamed chunks and multiple save slots, tool durability, animal rescue quests, richer enemy navigation, multiple biomes, lightweight original music, and more expressive Essie and Pip animation.
