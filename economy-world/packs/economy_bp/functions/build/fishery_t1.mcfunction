# Fishery - Tier 1 shell
# footprint 13 x 9, wall height 5
# builds from the player's position toward +x / +z

# clear site
fill ~-2 ~0 ~-2 ~14 ~12 ~10 air

# foundation and floor
fill ~-1 ~-1 ~-1 ~13 ~-1 ~9 stone_bricks
fill ~0 ~0 ~0 ~12 ~0 ~8 stone_bricks

# walls
fill ~0 ~1 ~0 ~12 ~5 ~8 dark_oak_planks
fill ~1 ~1 ~1 ~11 ~5 ~7 air

# corner posts
fill ~0 ~1 ~0 ~0 ~5 ~0 dark_oak_log
fill ~12 ~1 ~0 ~12 ~5 ~0 dark_oak_log
fill ~0 ~1 ~8 ~0 ~5 ~8 dark_oak_log
fill ~12 ~1 ~8 ~12 ~5 ~8 dark_oak_log

# top trim course
fill ~0 ~5 ~0 ~12 ~5 ~8 smooth_stone
fill ~1 ~5 ~1 ~11 ~5 ~7 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air

# back door
fill ~6 ~1 ~8 ~6 ~3 ~8 air

# windows
fill ~1 ~2 ~0 ~1 ~3 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~3 ~0 glass_pane
fill ~10 ~2 ~0 ~10 ~3 ~0 glass_pane
fill ~11 ~2 ~0 ~11 ~3 ~0 glass_pane
fill ~0 ~2 ~2 ~0 ~3 ~2 glass_pane
fill ~12 ~2 ~2 ~12 ~3 ~2 glass_pane
fill ~0 ~2 ~5 ~0 ~3 ~5 glass_pane
fill ~12 ~2 ~5 ~12 ~3 ~5 glass_pane

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~11 ~4 ~4 dark_oak_planks
fill ~6 ~1 ~4 ~6 ~3 ~4 air

# roof
fill ~-1 ~6 ~-1 ~13 ~6 ~-1 dark_oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~6 ~9 ~13 ~6 ~9 dark_oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~6 ~0 ~-1 ~6 ~8 stripped_dark_oak_wood
fill ~13 ~6 ~0 ~13 ~6 ~8 stripped_dark_oak_wood
fill ~-1 ~7 ~0 ~13 ~7 ~0 dark_oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~7 ~8 ~13 ~7 ~8 dark_oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~7 ~1 ~-1 ~7 ~7 stripped_dark_oak_wood
fill ~13 ~7 ~1 ~13 ~7 ~7 stripped_dark_oak_wood
fill ~-1 ~8 ~1 ~13 ~8 ~1 dark_oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~7 ~13 ~8 ~7 dark_oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~2 ~-1 ~8 ~6 stripped_dark_oak_wood
fill ~13 ~8 ~2 ~13 ~8 ~6 stripped_dark_oak_wood
fill ~-1 ~9 ~2 ~13 ~9 ~2 dark_oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~6 ~13 ~9 ~6 dark_oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~3 ~-1 ~9 ~5 stripped_dark_oak_wood
fill ~13 ~9 ~3 ~13 ~9 ~5 stripped_dark_oak_wood
fill ~-1 ~10 ~3 ~13 ~10 ~3 dark_oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~5 ~13 ~10 ~5 dark_oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]

# trade features
# dock-side loading opening
fill ~12 ~1 ~5 ~12 ~4 ~7 air

say Fishery T1 shell placed. Decorate away.
