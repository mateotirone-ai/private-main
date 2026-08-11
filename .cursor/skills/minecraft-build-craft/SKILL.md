---
name: minecraft-build-craft
description: Design and author professional-looking Minecraft buildings for Economy World. Use when asked to design, improve, style, or procedurally compose a build; choose massing, palette, facade, interiors, lighting, or variants; turn a reference into geometry; or write a build recipe/plan that should look intentional rather than boxy.
---

# Minecraft build craft for Economy World

Teach yourself (the agent) to produce **readable, professional-looking** trade
and civic buildings for this Bedrock repo — not flat boxes, not Java megacity
demos.

For import, registry, anchors, build, and test commands, also follow
`.cursor/skills/minecraft-building/SKILL.md`. This skill owns **design quality**.
Do not stand up Paper/mineflayer/Lodestone unless the user explicitly asks for a
separate Java preview workflow.

## Design target (Economy World)

- Soft stylized, cozy, controller-readable silhouettes.
- Function must read at a glance (bakery vs quarry vs forge vs store).
- Fixed **pad** across tiers: L2/L3 get taller/denser/richer, not a wider pad.
- Prefer a small coherent palette; escalate materials by tier
  (timber → timber/stone → dressed craft), not random rainbow blocks.
- Negative space and silhouette matter as much as ornament.
- Keep entrances obvious from the street; keep storefront/office floor space
  walkable and outside walls.

Read only what you need from:

- `economy-world/docs/town-generation-spec.md`
- `economy-world/docs/structures.md`
- `.cursor/skills/minecraft-build-craft/references/design-patterns.md`
- `.cursor/skills/minecraft-build-craft/references/authoring-loop.md`

## Authoring loop (adapted from recipe skills)

Before placing a single block decision, write a short design brief:

1. **Program** — trade/civic role, who enters, what happens inside.
2. **Footprint** — pad size, front face, gate, yard/work zone needs.
3. **Massing** — primary volume, secondary wing/lean-to, roof type, height.
4. **Palette** — 3–5 primary blocks + 1–2 accent blocks; list stair/slab/fence
   cousins for the same family.
5. **Facade rhythm** — bay width, window spacing, door emphasis, corner
   treatment.
6. **Interior circulation** — path from gate → counter/work → office/storage.
7. **Lighting & props** — lanterns, signs, barrels, tools that sell the trade.
8. **Tier delta** — what L2/L3 add without moving the entrance or pad.

Then compose geometry in layers (never detail first):

1. Ground / pad / foundation
2. Primary shell (walls + roof)
3. Openings (doors, windows, loading)
4. Structure articulation (frames, beams, buttresses, chimneys)
5. Trade landmark (oven, crane, kiln, awning, hoist — one hero read)
6. Interior props + lighting
7. Exterior yard / negative space / path stub to gate

## Composition mindset (from programmatic builders)

Treat the build like a **recipe**, even when the final asset is a captured
`.mcstructure` or imported `.schem`:

- Prefer helpers over one-off scatter: floors, hollow shells, rings, columns,
  eaves, repeated window bays.
- Keep coordinates inside the pad and structure bounds.
- Use deterministic variation (hashed dither) for weathering or clutter — not
  pure randomness that breaks tiers.
- Depth > stickers: inset windows, overhang eaves, 1-block relief frames.
- Avoid continuous identical walls longer than ~6–8 blocks without a break
  (pilaster, buttress, material change, window, recess).

Vanilla Java block ids are fine in design notes and `.schem` sources; the
repo converter maps them to Bedrock on `npm run build`. Prefer blocks that
convert cleanly (stairs, slabs, walls, fences, lanterns, logs, copper, stone
families). Avoid relying on Java-only block entities for the look.

## Delivery paths in this repo

Choose one and say which you used:

1. **Designer capture (preferred for hero buildings):** author in a capture
   world → export `.mcstructure` to
   `economy-world/packs/economy_bp/structures/ew/<stem>.mcstructure`.
2. **Schematic import:** produce or drop `<stem>.schem` in
   `economy-world/assets/schematics/` → `npm run build`.
3. **Design-only pass:** if no asset yet, ship a brief + layered block plan +
   registry proposal with TODO anchors — never invent a fake `.mcstructure`.

After any real asset lands, complete registry work per `minecraft-building`
(gate, NPC anchors, zones measured from geometry).

## Quality bar / anti-patterns

Reject or rewrite builds that:

- are a single hollow box with door holes;
- use more than ~7 unrelated block types with no hierarchy;
- hide the entrance or put the office inside a wall;
- claim "matches reference" from tests/registry alone;
- change pad width between L1 and L3;
- stamp the same shell for every trade with only a sign swap.

Pass when:

- silhouette reads the trade at distance;
- palette is coherent;
- facade has rhythm and depth;
- interior path is obvious;
- lighting reads at night;
- L2/L3 feel like upgrades of the same building.

## Reference feedback loop

When a photo or build reference exists:

1. Extract proportions, roof type, material family, 3 distinctive features.
2. Build massing first.
3. Compare those features after each pass.
4. Fix the biggest mismatch before adding props.

## Attribution

Adapted for this Bedrock Economy World pipeline from:

- [wzhaoMS/minecraft-builder-skill](https://github.com/wzhaoMS/minecraft-builder-skill)
  (realism patterns, layered builds, reference feedback)
- [mattzh72/minecraft-builder-skill](https://github.com/mattzh72/minecraft-builder-skill)
  (recipe composition, iteration, readable geometry)
