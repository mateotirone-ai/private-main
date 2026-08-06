# General Store - Tier 1 shell
# footprint 13 x 11, walls 7 high
# builds from the player position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~15 ~18 ~13 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~13 ~-1 ~11 cobblestone
fill ~-1 ~0 ~-1 ~13 ~0 ~11 cobblestone
fill ~0 ~0 ~0 ~12 ~0 ~10 stone_bricks

# base course
fill ~0 ~1 ~0 ~12 ~1 ~10 cobblestone
fill ~1 ~1 ~1 ~11 ~1 ~9 air

# walls
fill ~0 ~2 ~0 ~12 ~7 ~10 oak_planks
fill ~1 ~2 ~1 ~11 ~7 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~7 ~0 stripped_oak_log
fill ~12 ~1 ~0 ~12 ~7 ~0 stripped_oak_log
fill ~0 ~1 ~10 ~0 ~7 ~10 stripped_oak_log
fill ~12 ~1 ~10 ~12 ~7 ~10 stripped_oak_log

# mid pilasters
fill ~6 ~1 ~0 ~6 ~7 ~0 stripped_oak_log
fill ~6 ~1 ~10 ~6 ~7 ~10 stripped_oak_log
fill ~0 ~1 ~5 ~0 ~7 ~5 stripped_oak_log
fill ~12 ~1 ~5 ~12 ~7 ~5 stripped_oak_log

# lintel course under the roof
fill ~0 ~7 ~0 ~12 ~7 ~10 spruce_planks
fill ~1 ~7 ~1 ~11 ~7 ~9 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air
fill ~4 ~4 ~-1 ~7 ~4 ~-1 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]

# back door
fill ~7 ~1 ~10 ~7 ~3 ~10 air

# windows on all four faces
fill ~2 ~3 ~0 ~3 ~4 ~0 glass_pane
fill ~1 ~3 ~0 ~1 ~4 ~0 spruce_planks
fill ~4 ~3 ~0 ~4 ~4 ~0 spruce_planks
fill ~2 ~3 ~10 ~3 ~4 ~10 glass_pane
fill ~1 ~3 ~10 ~1 ~4 ~10 spruce_planks
fill ~4 ~3 ~10 ~4 ~4 ~10 spruce_planks
fill ~9 ~3 ~0 ~10 ~4 ~0 glass_pane
fill ~8 ~3 ~0 ~8 ~4 ~0 spruce_planks
fill ~11 ~3 ~0 ~11 ~4 ~0 spruce_planks
fill ~9 ~3 ~10 ~10 ~4 ~10 glass_pane
fill ~8 ~3 ~10 ~8 ~4 ~10 spruce_planks
fill ~11 ~3 ~10 ~11 ~4 ~10 spruce_planks
fill ~0 ~3 ~2 ~0 ~4 ~3 glass_pane
fill ~0 ~3 ~1 ~0 ~4 ~1 spruce_planks
fill ~0 ~3 ~4 ~0 ~4 ~4 spruce_planks
fill ~12 ~3 ~2 ~12 ~4 ~3 glass_pane
fill ~12 ~3 ~1 ~12 ~4 ~1 spruce_planks
fill ~12 ~3 ~4 ~12 ~4 ~4 spruce_planks
fill ~0 ~3 ~6 ~0 ~4 ~7 glass_pane
fill ~0 ~3 ~5 ~0 ~4 ~5 spruce_planks
fill ~0 ~3 ~8 ~0 ~4 ~8 spruce_planks
fill ~12 ~3 ~6 ~12 ~4 ~7 glass_pane
fill ~12 ~3 ~5 ~12 ~4 ~5 spruce_planks
fill ~12 ~3 ~8 ~12 ~4 ~8 spruce_planks

# front-of-house / back-of-house partition
fill ~1 ~1 ~7 ~11 ~6 ~7 oak_planks
fill ~6 ~1 ~7 ~6 ~3 ~7 air

# gabled roof - 45 degree stair slope, solid gable ends
fill ~-1 ~8 ~-1 ~13 ~8 ~-1 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~11 ~13 ~8 ~11 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~0 ~-1 ~8 ~10 white_terracotta
fill ~13 ~8 ~0 ~13 ~8 ~10 white_terracotta
fill ~-1 ~9 ~0 ~13 ~9 ~0 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~10 ~13 ~9 ~10 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~1 ~-1 ~9 ~9 white_terracotta
fill ~13 ~9 ~1 ~13 ~9 ~9 white_terracotta
fill ~-1 ~10 ~1 ~13 ~10 ~1 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~9 ~13 ~10 ~9 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~2 ~-1 ~10 ~8 white_terracotta
fill ~13 ~10 ~2 ~13 ~10 ~8 white_terracotta
fill ~-1 ~11 ~2 ~13 ~11 ~2 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~8 ~13 ~11 ~8 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~3 ~-1 ~11 ~7 white_terracotta
fill ~13 ~11 ~3 ~13 ~11 ~7 white_terracotta
fill ~-1 ~12 ~3 ~13 ~12 ~3 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~7 ~13 ~12 ~7 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~4 ~-1 ~12 ~6 white_terracotta
fill ~13 ~12 ~4 ~13 ~12 ~6 white_terracotta
fill ~-1 ~13 ~4 ~13 ~13 ~4 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~6 ~13 ~13 ~6 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~5 ~-1 ~13 ~5 white_terracotta
fill ~13 ~13 ~5 ~13 ~13 ~5 white_terracotta
fill ~-1 ~14 ~5 ~13 ~14 ~5 white_terracotta

# trade features
# stockroom hatch in the back wall
fill ~2 ~1 ~10 ~3 ~3 ~10 air

say General Store T1 shell placed.
