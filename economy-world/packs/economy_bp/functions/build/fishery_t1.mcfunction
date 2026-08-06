# Fishery - Tier 1 shell
# footprint 13 x 9, wall height 6
# builds from the player's position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~15 ~16 ~11 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~13 ~-1 ~9 cobblestone
fill ~-1 ~0 ~-1 ~13 ~0 ~9 cobblestone
fill ~0 ~0 ~0 ~12 ~0 ~8 stone_bricks

# base course
fill ~0 ~1 ~0 ~12 ~1 ~8 cobblestone
fill ~1 ~1 ~1 ~11 ~1 ~7 air

# walls
fill ~0 ~2 ~0 ~12 ~6 ~8 dark_oak_planks
fill ~1 ~2 ~1 ~11 ~6 ~7 air

# corner posts
fill ~0 ~1 ~0 ~0 ~6 ~0 dark_oak_log
fill ~12 ~1 ~0 ~12 ~6 ~0 dark_oak_log
fill ~0 ~1 ~8 ~0 ~6 ~8 dark_oak_log
fill ~12 ~1 ~8 ~12 ~6 ~8 dark_oak_log

# protruding pilasters
fill ~3 ~1 ~-1 ~3 ~6 ~-1 dark_oak_log
fill ~3 ~1 ~9 ~3 ~6 ~9 dark_oak_log
fill ~7 ~1 ~-1 ~7 ~6 ~-1 dark_oak_log
fill ~7 ~1 ~9 ~7 ~6 ~9 dark_oak_log
fill ~-1 ~1 ~3 ~-1 ~6 ~3 dark_oak_log
fill ~13 ~1 ~3 ~13 ~6 ~3 dark_oak_log

# overhanging eave band
fill ~-1 ~7 ~-1 ~13 ~7 ~9 smooth_stone
fill ~0 ~7 ~0 ~12 ~7 ~8 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air
# door awning
fill ~4 ~4 ~-1 ~7 ~4 ~-1 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]

# back door
fill ~6 ~1 ~8 ~6 ~3 ~8 air

# windows with trim
fill ~1 ~3 ~0 ~1 ~4 ~0 glass_pane
fill ~1 ~2 ~0 ~1 ~2 ~0 smooth_stone
fill ~1 ~5 ~0 ~1 ~5 ~0 smooth_stone
fill ~2 ~3 ~0 ~2 ~4 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~2 ~0 smooth_stone
fill ~2 ~5 ~0 ~2 ~5 ~0 smooth_stone
fill ~10 ~3 ~0 ~10 ~4 ~0 glass_pane
fill ~10 ~2 ~0 ~10 ~2 ~0 smooth_stone
fill ~10 ~5 ~0 ~10 ~5 ~0 smooth_stone
fill ~11 ~3 ~0 ~11 ~4 ~0 glass_pane
fill ~11 ~2 ~0 ~11 ~2 ~0 smooth_stone
fill ~11 ~5 ~0 ~11 ~5 ~0 smooth_stone
fill ~0 ~3 ~2 ~0 ~4 ~2 glass_pane
fill ~0 ~2 ~2 ~0 ~2 ~2 smooth_stone
fill ~0 ~5 ~2 ~0 ~5 ~2 smooth_stone
fill ~12 ~3 ~2 ~12 ~4 ~2 glass_pane
fill ~12 ~2 ~2 ~12 ~2 ~2 smooth_stone
fill ~12 ~5 ~2 ~12 ~5 ~2 smooth_stone
fill ~0 ~3 ~5 ~0 ~4 ~5 glass_pane
fill ~0 ~2 ~5 ~0 ~2 ~5 smooth_stone
fill ~0 ~5 ~5 ~0 ~5 ~5 smooth_stone
fill ~12 ~3 ~5 ~12 ~4 ~5 glass_pane
fill ~12 ~2 ~5 ~12 ~2 ~5 smooth_stone
fill ~12 ~5 ~5 ~12 ~5 ~5 smooth_stone

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~11 ~6 ~4 dark_oak_planks
fill ~6 ~1 ~4 ~6 ~3 ~4 air

# roof - closed solid layers, stairs as trim only
fill ~-1 ~8 ~-1 ~13 ~8 ~9 stripped_dark_oak_wood
fill ~0 ~8 ~1 ~12 ~8 ~7 air
fill ~-1 ~8 ~-1 ~13 ~8 ~-1 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~9 ~13 ~8 ~9 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~0 ~13 ~9 ~8 stripped_dark_oak_wood
fill ~0 ~9 ~2 ~12 ~9 ~6 air
fill ~-1 ~9 ~0 ~13 ~9 ~0 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~8 ~13 ~9 ~8 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~1 ~13 ~10 ~7 stripped_dark_oak_wood
fill ~0 ~10 ~3 ~12 ~10 ~5 air
fill ~-1 ~10 ~1 ~13 ~10 ~1 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~7 ~13 ~10 ~7 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~2 ~13 ~11 ~6 stripped_dark_oak_wood
fill ~0 ~11 ~4 ~12 ~11 ~4 air
fill ~-1 ~11 ~2 ~13 ~11 ~2 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~6 ~13 ~11 ~6 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~3 ~13 ~12 ~5 stripped_dark_oak_wood
fill ~-1 ~12 ~3 ~13 ~12 ~3 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~5 ~13 ~12 ~5 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~4 ~13 ~13 ~4 stripped_dark_oak_wood

# trade features
# dock-side loading opening
fill ~12 ~2 ~5 ~12 ~5 ~7 air

say Fishery T1 shell placed. Decorate away.
