# Fishery - Tier 1 shell
# footprint 13 x 9, walls 7 high
# builds from the player position toward +x / +z

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
fill ~0 ~2 ~0 ~12 ~7 ~8 dark_oak_planks
fill ~1 ~2 ~1 ~11 ~7 ~7 air

# corner posts
fill ~0 ~1 ~0 ~0 ~7 ~0 dark_oak_log
fill ~12 ~1 ~0 ~12 ~7 ~0 dark_oak_log
fill ~0 ~1 ~8 ~0 ~7 ~8 dark_oak_log
fill ~12 ~1 ~8 ~12 ~7 ~8 dark_oak_log

# mid pilasters
fill ~6 ~1 ~0 ~6 ~7 ~0 dark_oak_log
fill ~6 ~1 ~8 ~6 ~7 ~8 dark_oak_log
fill ~0 ~1 ~4 ~0 ~7 ~4 dark_oak_log
fill ~12 ~1 ~4 ~12 ~7 ~4 dark_oak_log

# lintel course under the roof
fill ~0 ~7 ~0 ~12 ~7 ~8 smooth_stone
fill ~1 ~7 ~1 ~11 ~7 ~7 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air
fill ~4 ~4 ~-1 ~7 ~4 ~-1 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]

# back door
fill ~7 ~1 ~8 ~7 ~3 ~8 air

# windows on all four faces
fill ~2 ~3 ~0 ~3 ~4 ~0 glass_pane
fill ~1 ~3 ~0 ~1 ~4 ~0 smooth_stone
fill ~4 ~3 ~0 ~4 ~4 ~0 smooth_stone
fill ~2 ~3 ~8 ~3 ~4 ~8 glass_pane
fill ~1 ~3 ~8 ~1 ~4 ~8 smooth_stone
fill ~4 ~3 ~8 ~4 ~4 ~8 smooth_stone
fill ~9 ~3 ~0 ~10 ~4 ~0 glass_pane
fill ~8 ~3 ~0 ~8 ~4 ~0 smooth_stone
fill ~11 ~3 ~0 ~11 ~4 ~0 smooth_stone
fill ~9 ~3 ~8 ~10 ~4 ~8 glass_pane
fill ~8 ~3 ~8 ~8 ~4 ~8 smooth_stone
fill ~11 ~3 ~8 ~11 ~4 ~8 smooth_stone
fill ~0 ~3 ~2 ~0 ~4 ~3 glass_pane
fill ~0 ~3 ~1 ~0 ~4 ~1 smooth_stone
fill ~0 ~3 ~4 ~0 ~4 ~4 smooth_stone
fill ~12 ~3 ~2 ~12 ~4 ~3 glass_pane
fill ~12 ~3 ~1 ~12 ~4 ~1 smooth_stone
fill ~12 ~3 ~4 ~12 ~4 ~4 smooth_stone

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~11 ~6 ~4 dark_oak_planks
fill ~6 ~1 ~4 ~6 ~3 ~4 air

# gabled roof - 45 degree stair slope, solid gable ends
fill ~-1 ~8 ~-1 ~13 ~8 ~-1 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~9 ~13 ~8 ~9 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~0 ~-1 ~8 ~8 stripped_dark_oak_wood
fill ~13 ~8 ~0 ~13 ~8 ~8 stripped_dark_oak_wood
fill ~-1 ~9 ~0 ~13 ~9 ~0 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~8 ~13 ~9 ~8 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~1 ~-1 ~9 ~7 stripped_dark_oak_wood
fill ~13 ~9 ~1 ~13 ~9 ~7 stripped_dark_oak_wood
fill ~-1 ~10 ~1 ~13 ~10 ~1 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~7 ~13 ~10 ~7 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~2 ~-1 ~10 ~6 stripped_dark_oak_wood
fill ~13 ~10 ~2 ~13 ~10 ~6 stripped_dark_oak_wood
fill ~-1 ~11 ~2 ~13 ~11 ~2 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~6 ~13 ~11 ~6 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~3 ~-1 ~11 ~5 stripped_dark_oak_wood
fill ~13 ~11 ~3 ~13 ~11 ~5 stripped_dark_oak_wood
fill ~-1 ~12 ~3 ~13 ~12 ~3 dark_oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~5 ~13 ~12 ~5 dark_oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~4 ~-1 ~12 ~4 stripped_dark_oak_wood
fill ~13 ~12 ~4 ~13 ~12 ~4 stripped_dark_oak_wood
fill ~-1 ~13 ~4 ~13 ~13 ~4 stripped_dark_oak_wood

# trade features
# dock-side loading opening
fill ~12 ~2 ~5 ~12 ~6 ~7 air

say Fishery T1 shell placed.
