---
name: minecraft-builder
description: Rules and reference sources for generating pro-quality Minecraft builds as .mcstructure files. Use this skill whenever generating, editing, or reviewing any Minecraft structure, building, town layout, or terrain feature — houses, trade buildings, roofs, walls, landscaping — even if the user doesn't say "build tips". Apply the design rules below before emitting any block data.
---

# Minecraft Builder

Design rules distilled from professional builder guides, plus transcribed
reference digests under `references/`. Apply the core rules on every build.
Open the matching reference file when a technique needs more depth.

Cross-links in this repo:

- Pipeline / registry / schem import → `.cursor/skills/minecraft-building/`
- Economy World craft briefing → `.cursor/skills/minecraft-build-craft/`

This skill owns **pro visual quality**. Apply it before emitting block data.

## Core rules (apply to every build)

### Palette
- Use 3–5 complementary blocks per build; never a single-block surface.
- Palette blocks must share at least 2 of 3 traits: color temperature,
  brightness, material logic (e.g., stone/andesite/tuff/deepslate = coherent
  gray mineral family).
- One main block family + one transition family + one small accent. Accents
  need quiet support blocks around them — never distribute strong accents evenly.
- Established world palette for this project: sandstone/calcite, mud-brick
  roofs, spruce timber, arched gates, oxidized copper lanterns. NOT medieval
  by default.
- Practical ratio: ~60% main / 30% transition / 10% accent. Test a 5×5 or 7×7
  patch under final lighting before committing.

### Depth (the #1 pro/amateur separator)
- No flat walls. Recess sections, push others out, frame corners with a
  contrasting block.
- Vertical pillars (logs) every 3–5 blocks along exterior walls.
- Inset windows one block; upside-down stairs under windowsills.
- Slabs for half-height ledges along wall bases; stairs as trim wherever a
  surface meets another plane.
- Outer frame sits diagonal/outside the wall plane — not flush inside it.

### Shape & proportions
- Never ship a lone rectangular box. Break the footprint: wings, porches,
  setbacks, balconies, L/T plans.
- Odd-numbered footprints (5×7, 9×11) so doors, windows, and roof peaks have
  a true center block.
- Vary floor/ceiling heights; avoid uniform box volumes.
- Ceiling clearance ≥3 (prefer 4–5 wall height on small houses) so interiors
  and doors/windows fit.

### Roofs
- Always overhang 1–2 blocks past the walls on every side; upside-down stairs
  under the overhang as trim.
- Ridge spines = slabs, not full blocks. Gable rakes = upright stair (back out)
  + upside-down stair behind it (back in) — the stepped rim profile.
- Mix 2+ roof materials for texture noise; darker trim on edges, lighter main
  slope.
- Match roof style to build type: gable/cross-gable for cottages, hipped for
  villas, flat + parapet for modern, shed for industrial.
- Chimneys with stone footing + campfire in the throat (smoke = alive).
- Build the primary roof volume first; secondary wings connect into it.

### Gradients
- Gradient = sequential blend A→B→C by value (light/dark), texture density,
  and hue. Never skip a transition step — visible blocky jumps kill realism.
- Use for weathering (clean top → mossy/cracked base), terrain transitions,
  and large walls.
- Prefer structured clusters over random splatters. Squint-test dominant shapes.
- Canvas first (wool/placeholder massing) → intentional cracks → gradient last.
  A great gradient cannot save a bad shape.

### Grounding & landscaping
- A build dropped on flat ground is unfinished. Feather the terrain into the
  build: paths (gravel/coarse dirt/path blocks with noise), hedges, trees,
  flower beds, fences.
- Terrace on slopes, never flatten. Dress cut seams as retaining walls /
  embankments.
- Vegetation is noise-jittered, never rows.
- Prefer custom/hand-shaped trees near hero builds over vanilla sapling spam.
- Do not leave dirt peeking under foundations; extend foundation or cover.

### Interiors & lighting
- Furnish intentionally: stair chairs, fence-post tables, barrels as cabinets,
  lanterns overhead.
- Hide light sources (behind trapdoors, in lanterns, under carpet). No torch
  spam on surfaces.
- Trapdoors are a primary detail tool (shutters, shelves, planters, pillar
  caps, ceiling panels, hidden lights).

### Work-form doctrine (industrial sites)
- Industrial sites are defined by their WORK FORM, not a storefront box. A
  quarry is a pit with benches and a haul ramp plus a humble office; the
  workings dominate, the building is subordinate.
- Every trade building: decorated front-of-house (counter/storefront) +
  functional back-of-house (production area).

### Authenticity & restraint
- Model buildings on real-world references. Ask: "does any [building type]
  IRL look like that?" If no, redesign.
- Over-detailing is a failure mode — balanced detail beats noise. Read at
  distance first; if chaotic from afar, cut detail.
- Support floating overhangs with visible framing — no physics-defying slabs.
- Composition: design the primary viewing angle (street approach). Use leading
  lines, silhouette weight, and narrative wear where appropriate.

## Reference digests (read when needed)

| File | Use when |
|---|---|
| `references/fundamentals.md` | General tip checklists, depth, interiors, landscaping |
| `references/gradients-and-palettes.md` | ArdaCraft gradient process, palette recipes, 60/30/10 |
| `references/roofs.md` | Roof styles, eaves, materials, dormers, mistakes |
| `references/video-techniques.md` | Transcribed Grian / Hermitcraft / builder tip videos |
| `references/SOURCES.md` | Original URLs + ingest status |

## Output requirements for this project
- Emit builds as `.mcstructure` (Bedrock NBT, little-endian). Naming:
  `<name>_L<level>` for upgradeable buildings (`stone_quarry_L1`); homes are
  numbered variants (`home_1`, `home_12`), no `L`.
- Capture box must include below-grade excavation (pit floors) and exclude pad
  marker blocks.
- Every build ships with a layer-by-layer blueprint sheet (one grid per
  y-layer, block legend, material counts, front + back renders).
- Land assets via `.cursor/skills/minecraft-building/` (pack path, registry,
  `npm run build` / test / verify).
