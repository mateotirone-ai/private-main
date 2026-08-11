# Gradients and palettes digest

Transcribed primarily from ArdaCraft Gradient Guide and Minecraft Gradient blog.

Sources:
- https://www.ardacraft.me/resources/gradient-guide
- https://wiki.ardacraft.me/index.php/Gradient_Guide
- https://minecraftgradient.blog/minecraft-color-palette/
- https://minecraftgradient.blog/
- https://www.minecraftplot.com/minecraft-block-gradient-generator/
- https://blockblend.app/guides (index; individual combo pages vary)

## What a gradient is

A tidy transition A → B → C of **value** (light/dark), then colour, then
texture — like shading, blending, or dithering. In Minecraft it is sequential
block mixing that should read seamless, not as blocky squares.

Beginner failure mode: **skipping a step** in the ordered palette so distant
values touch (e.g. light limestone against dark brick with no mid).

## Palette selection (ArdaCraft + Gradient blog)

Judge candidate blocks by:

1. **Value** (most important)
2. **Colour / temperature**
3. **Texture density**

Blocks should share ≥2 of: temperature, brightness, material logic.

Roles:

- **Main** — carries silhouette from distance
- **Transition** — softens jumps (tuff between stone and deepslate)
- **Accent** — door frames, chimneys, ridges, machinery — sparse

60/30/10 keeps readability. Large surfaces need closer values; trim can jump
harder.

Do not place every loud accent (gold, diamond, copper, warped, shroomlight)
at equal strength.

## Pattern (weathering shape)

Good gradients need a **structured pattern**, usually soft blob clusters of
wear — water drip, corner darkening, base staining — not salt-and-pepper
splatter.

Anti-patterns:

- Random splatters
- Harsh 45° smear shapes
- Skipping palette steps so red touches yellow across the strip

Process tip: squint; fix dominant ugly shapes; keep adjacency order.

Cracks/chips belong where wear is honest: corners, around openings, wall
angle joints. Cracked zones become the **darkest** stain regions.

## Process (canvas → detail → gradient)

ArdaCraft order (do not reverse):

1. **Basic canvas shape** — wool/placeholder; lock proportions, doors,
   windows. Gradient cannot save a wonky structure.
2. **Canvas detailing / cracks** — intentional damage marks that preview dark
   zones.
3. **Apply gradient** — replace canvas with ordered palette following crack
   logic; adjust cracks ↔ stains until balanced.

Detail budget: highly articulated depth → simpler gradient; simple surfaces →
richer gradient. Nearby buildings should share a cohesion level — one ornate
house next to one quiet house can be intentional breathing room.

Palette length scales with structure size. Too many steps → noisy; too few →
bland.

## Practical sequences (vanilla-friendly)

| Job | Sequence |
|---|---|
| Stone → deepslate wall | stone → andesite → tuff → cobblestone → deepslate |
| Grass → path | grass → dirt → coarse dirt → rooted dirt → mud / gravel |
| Warm desert wall | sandstone → smooth sandstone → terracotta → orange terracotta |
| Mossy castle base | mossy cobble → cobble → andesite → stone bricks |
| Forest cabin | stripped spruce → spruce → dark oak → moss → azalea leaves |
| Cave entrance | grass → coarse dirt → gravel → stone → tuff → deepslate |
| Copper accent build | bricks/mud bricks → exposed copper → weathered copper → spruce trapdoors |

Path tip: cleaner readable center, rougher biome-matched edges.

Wall tip: cleaner/lighter high and central; darker at base, buttresses, corners.

Roof tip: darker eaves/ridge trim, lighter main slope; mud brick / spruce /
dark oak common.

## Placement rules that keep gradients readable

- Place main field first; transitions only at edges, shadows, weather zones,
  terrain contact.
- Avoid candy-stripe bands unless stylized on purpose; use clusters and slight
  bleed of mid-tones into neighbors.
- Always test under the lighting (and biome grass/leaf tint) of the final site.
- Blackstone / black concrete are **shadow tools**, not midtones — overuse
  crushes detail.
- Survival: farmable blocks as 60%; rare blocks as 10% accents.

## Project world palette lock

Default Economy World look (override only when biome/era demands):

- Walls / body: sandstone, calcite, related warm neutrals
- Roofs: mud brick family
- Timber: spruce
- Gates: arches
- Lanterns: oxidized copper accent lighting

NOT medieval stone-brick default unless the brief says so.
