# Bakery - Tier 1 shell
# footprint 11 x 9, walls 7 high
# builds from the player position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~13 ~16 ~11 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~11 ~-1 ~9 cobblestone
fill ~-1 ~0 ~-1 ~11 ~0 ~9 cobblestone
fill ~0 ~0 ~0 ~10 ~0 ~8 stone_bricks

# base course
fill ~0 ~1 ~0 ~10 ~1 ~8 cobblestone
fill ~1 ~1 ~1 ~9 ~1 ~7 air

# walls
fill ~0 ~2 ~0 ~10 ~7 ~8 white_terracotta
fill ~1 ~2 ~1 ~9 ~7 ~7 air

# corner posts
fill ~0 ~1 ~0 ~0 ~7 ~0 spruce_log
fill ~10 ~1 ~0 ~10 ~7 ~0 spruce_log
fill ~0 ~1 ~8 ~0 ~7 ~8 spruce_log
fill ~10 ~1 ~8 ~10 ~7 ~8 spruce_log

# mid pilasters
fill ~5 ~1 ~0 ~5 ~7 ~0 spruce_log
fill ~5 ~1 ~8 ~5 ~7 ~8 spruce_log
fill ~0 ~1 ~4 ~0 ~7 ~4 spruce_log
fill ~10 ~1 ~4 ~10 ~7 ~4 spruce_log

# lintel course under the roof
fill ~0 ~7 ~0 ~10 ~7 ~8 spruce_planks
fill ~1 ~7 ~1 ~9 ~7 ~7 air

# front entrance
fill ~4 ~1 ~0 ~5 ~3 ~0 air
fill ~3 ~4 ~-1 ~6 ~4 ~-1 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]

# back door
fill ~6 ~1 ~8 ~6 ~3 ~8 air

# windows on all four faces
fill ~7 ~3 ~0 ~8 ~4 ~0 glass_pane
fill ~6 ~3 ~0 ~6 ~4 ~0 spruce_planks
fill ~9 ~3 ~0 ~9 ~4 ~0 spruce_planks
fill ~7 ~3 ~8 ~8 ~4 ~8 glass_pane
fill ~6 ~3 ~8 ~6 ~4 ~8 spruce_planks
fill ~9 ~3 ~8 ~9 ~4 ~8 spruce_planks
fill ~0 ~3 ~2 ~0 ~4 ~3 glass_pane
fill ~0 ~3 ~1 ~0 ~4 ~1 spruce_planks
fill ~0 ~3 ~4 ~0 ~4 ~4 spruce_planks
fill ~10 ~3 ~2 ~10 ~4 ~3 glass_pane
fill ~10 ~3 ~1 ~10 ~4 ~1 spruce_planks
fill ~10 ~3 ~4 ~10 ~4 ~4 spruce_planks

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~9 ~6 ~4 white_terracotta
fill ~5 ~1 ~4 ~5 ~3 ~4 air

# gabled roof - 45 degree stair slope, solid gable ends
fill ~-1 ~8 ~-1 ~11 ~8 ~-1 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~9 ~11 ~8 ~9 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~0 ~-1 ~8 ~8 stripped_spruce_wood
fill ~11 ~8 ~0 ~11 ~8 ~8 stripped_spruce_wood
fill ~-1 ~9 ~0 ~11 ~9 ~0 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~8 ~11 ~9 ~8 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~1 ~-1 ~9 ~7 stripped_spruce_wood
fill ~11 ~9 ~1 ~11 ~9 ~7 stripped_spruce_wood
fill ~-1 ~10 ~1 ~11 ~10 ~1 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~7 ~11 ~10 ~7 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~2 ~-1 ~10 ~6 stripped_spruce_wood
fill ~11 ~10 ~2 ~11 ~10 ~6 stripped_spruce_wood
fill ~-1 ~11 ~2 ~11 ~11 ~2 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~6 ~11 ~11 ~6 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~3 ~-1 ~11 ~5 stripped_spruce_wood
fill ~11 ~11 ~3 ~11 ~11 ~5 stripped_spruce_wood
fill ~-1 ~12 ~3 ~11 ~12 ~3 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~5 ~11 ~12 ~5 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~4 ~-1 ~12 ~4 stripped_spruce_wood
fill ~11 ~12 ~4 ~11 ~12 ~4 stripped_spruce_wood
fill ~-1 ~13 ~4 ~11 ~13 ~4 stripped_spruce_wood

# trade features
# oven chimney
fill ~8 ~8 ~6 ~9 ~14 ~6 brick_block

say Bakery T1 shell placed.
