# Yellow Stadium canonical architecture

`golden/index.rc8.html` is the immutable RC8 release artifact. Canonical source may differ byte-for-byte as compatibility layers are consolidated, while `npm run verify` checks both that the archived RC8 golden is untouched and that the current canonical build is reproducible.

## Runtime layers

### Data and state

`src/data/` contains species, move, and evolution data. `src/core/` owns record normalization, save load/write, runtime globals, and the `YSFlow` lifecycle bus.

The RC8 save schema is **9**. Save compatibility is a hard contract until a deliberate migration increments the schema.

### Battle mechanics

The mechanical battle path lives in `src/battle/`: model creation, battle start, UI model rendering, AI decisions, turns, damage/status, faint/end-turn handling, items/capture, XP/evolution, battle completion, and campaign challenge rules.

Presentation must not own damage, accuracy, turn order, capture odds, XP, or progression.

### Journey

`src/journey/kanto-map.js` is the sole Kanto map authority as of B1. `kanto-map-legacy.js` is an inert archival slot and must contain no runtime behavior.

As of B3, `src/journey/journey-controller.js` owns the Journey hub, six-slot Journey party panel, Journey return routing, party lookups used by interface consumers, and Journey lifecycle refreshes. The former `window.JourneyParty` compatibility service no longer exists.

### Bag and items

`src/bag/bag.js` is the sole full-Bag UI owner as of B2. It owns Bag navigation, the five Bag tabs, item/record rendering, Mew egg presentation, and the `bag:rendered` lifecycle event.

`src/items/item-system.js` owns field-item behavior only (stones, Rare Candy, medicine, and held-item equipping). It must not observe, replace, or render Bag DOM.

### Settings and mode preparation

`src/ui/settings.js` owns Settings-screen entry, Shared EXP persistence, and the in-Settings New Game shortcut. The destructive reset itself remains the canonical `reset-save` handler in the core application flow.

`src/ui/battle-entry-mobile.js` owns ready-screen mode differences, including hiding user-selected difficulty for Safari. There is no separate regression listener for this behavior.

### Presentation

As of C4, `src/presentation/battle-presentation-director.js` is the single engine-facing presentation boundary. Battle mechanics call `BattlePresentationDirector`; they do not call subordinate presentation implementations directly.

The ten recovered battle-presentation implementation generations have been absorbed into two durable modules: `src/presentation/battle-runtime.js` (camera, pacing, atmosphere, cinematics, turn grammar, capture) and `src/presentation/move-effects.js` (procedural attacks, choreography, source-derived effects, signatures). C4 additionally absorbs the event-driven battle chrome—clarity, readout, environments, Stadium broadcast/crowd behavior, refinement, and v6.2 item/capture polish—into `src/presentation/battle-decorators.js`. Private `YSPresentationInternals` holds installed services; private `YSPresentationInstallers` preserves the historical RC8 activation/listener order through tiny compatibility slots. Neither registry is attached to `window`.

The director owns the staged surface for pacing, send-out/withdraw, anticipation, move visuals, hit reactions, result/status grammar, fainting, capture and cleanup. Presentation remains prohibited from changing battle RNG or mechanics.

### Audio

As of D1, `src/audio/audio-manager.js` is the sole Web Audio owner. It owns the single `AudioContext`, master gain/compressor, music/effects/UI buses, mute persistence, gesture unlock/resume, visibility lifecycle, music scheduling, battle SFX, status/capture cues, cries, crowd noise, low-HP alerts, and PokéCenter chimes.

`src/audio/retired-audio-v56-slot.js` is inert and exists only to preserve the compatibility script-slot layout. No other canonical module may reference `AudioContext` or `webkitAudioContext`. Cross-system callers use `window.AudioManager`; external callers may use `YellowStadium.audio`.


### Assets

As of E1, image assets are canonical physical files under `public/assets/` and deploy to `dist/assets/`. The former 18.1 MB `window.STADIUM_ASSETS` data-URI map is retired to a tiny compatibility slot; `assetUrl(path)` falls back to the same physical `./assets/...` path, so existing callers do not need migration shims.

`public/asset-manifest.json` records the recovered RC8 bytes, MIME type, size and SHA-256 for all **806 assets**. `tools/verify.py` hashes the complete `dist/assets/` tree, and `tests/asset_externalization_contract.py` rejects reintroduced embedded images or missing files. Large static Journey artwork uses native lazy decoding/loading rather than being decoded during initial HTML parse.

### Progression and game modes

Journey, Cups, Safari, PokéCenter, items, party management, onboarding, and progression are separated by directory but still share historical globals `save`, `battle`, `selected`, and `els`.

### Runtime state boundary

As of B4, `src/core/runtime-state.js` exposes a locked internal `window.YSRuntime` compatibility gateway. Cross-system modules use it for save reads/writes, current-battle reads, defensive selected-party reads, legacy element lookup, persistence, and finished-battle cleanup instead of reaching directly into the recovered script-scope globals.

Core battle/save/party modules still directly own `save`, `battle`, `selected`, and `els` during compatibility consolidation. `YSRuntime.save` remains a live compatibility view; new cross-system writes should prefer `YSRuntime.updateSave()` so the gateway can become stricter later.

### Public API

`src/api/yellow-stadium.js` exposes the stable `window.YellowStadium` facade. As of B4 its state surface delegates through `YSRuntime`. New external-facing work should prefer this facade; internal cross-system reactions should prefer `YSFlow` or an explicit owning service.

`src/core/ys-flow.js` is the lifecycle/event boundary for cross-system reactions.

## Ownership rules for new code

1. No new direct mutation of `save`, `battle`, `selected`, or `els` outside the subsystem owning the mutation.
2. No duplicate `window.*` exports. A public global has exactly one owner.
3. No new `window.*` export unless intentionally part of the stable API or a uniquely named temporary migration shim.
4. No new module may replace a DOM node simply to erase another module's event handlers.
5. No new AudioContext owner may be added.
6. Presentation cannot influence battle RNG or mechanics.
7. Any intentional behavior change updates tests first.
8. All changes must pass `npm test`.

## B4 audit snapshot

The B4 migration removed 300 direct references to the recovered historical state globals across the full source (`save` 566→432, `battle` 754→651, `selected` 149→112, `els` 188→162). The remaining direct references are concentrated primarily in the core mechanical owners and older support systems scheduled for later consolidation.

## Current compatibility debt

- The recovered script layout still retains inert legacy slots so the 82-script ordering contract remains stable during consolidation.
- D1 replaced both legacy music and v5.6 battle-audio ownership with one `AudioManager`; the old v5.6 slot is inert.
- C3/C4 absorbed both the private move/runtime generations and the event-driven presentation decorators into three durable presentation modules. Remaining presentation debt is the separate audio compatibility layers.
- Core mechanics and several pre-consolidation support systems still own historical globals directly; B4 removed direct cross-system access from Journey, Safari, PokéCenter, migrated UI, and presentation layers.
- E1 removed the generated inline asset map. Remaining asset work is reachability/pruning and screen-aware preload policy; no large image should be re-embedded into HTML/JS/CSS.
- G1 removed the version-named CSS hooks: the 41 recovered `NNN.css` slots are now 14 concern-named files (`tokens`, `layout`, `onboarding`, `party`, `shop`, `cups`, `journey`, `safari`, `pokedex`, `bag`, `pokecenter`, `battle`, `modal-rewards`, `animations`), each selector defined exactly once. See `RELEASE_NOTES_G1.md`.

## G1 stylesheet layout

`src/styles/` holds 14 files, loaded in that order (matters only where two *different* selectors of equal specificity could otherwise tie — this ordering reproduces the original RC8 cascade). New rules go in the file matching their concern; a rule touching more than one concern (e.g. a `.yellow-ui2`-scoped selector spanning several screens) goes with whichever concern its class name most specifically names. Do not reintroduce numbered/unnamed style files.

## E2 asset boundary

`AssetDemand` is the private loading coordinator in `src/presentation/assets.js`. New code should use existing `assetUrl()`/`setSprite()` behavior and, when prefetching is genuinely useful, add only small files to a screen-specific demand group. Do not put maps, arenas, or other multi-megabyte scenic art in preload groups.

The live deploy manifest is `public/asset-manifest.json`. `golden/asset-manifest.rc8.json` is provenance only and records all 806 assets recovered from RC8, including files no longer shipped.
