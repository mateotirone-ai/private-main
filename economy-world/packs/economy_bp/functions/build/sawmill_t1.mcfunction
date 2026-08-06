# Sawmill - Tier 1 shell
# footprint 15 x 11, walls 7 high
# builds from the player position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~17 ~18 ~13 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~15 ~-1 ~11 cobblestone
fill ~-1 ~0 ~-1 ~15 ~0 ~11 cobblestone
fill ~0 ~0 ~0 ~14 ~0 ~10 stone_bricks

# base course
fill ~0 ~1 ~0 ~14 ~1 ~10 cobblestone
fill ~1 ~1 ~1 ~13 ~1 ~9 air

# walls
fill ~0 ~2 ~0 ~14 ~7 ~10 spruce_planks
fill ~1 ~2 ~1 ~13 ~7 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~7 ~0 spruce_log
fill ~14 ~1 ~0 ~14 ~7 ~0 spruce_log
fill ~0 ~1 ~10 ~0 ~7 ~10 spruce_log
fill ~14 ~1 ~10 ~14 ~7 ~10 spruce_log

# mid pilasters
fill ~7 ~1 ~0 ~7 ~7 ~0 spruce_log
fill ~7 ~1 ~10 ~7 ~7 ~10 spruce_log
fill ~0 ~1 ~5 ~0 ~7 ~5 spruce_log
fill ~14 ~1 ~5 ~14 ~7 ~5 spruce_log

# lintel course under the roof
fill ~0 ~7 ~0 ~14 ~7 ~10 smooth_stone
fill ~1 ~7 ~1 ~13 ~7 ~9 air

# front entrance
fill ~6 ~1 ~0 ~7 ~3 ~0 air
fill ~5 ~4 ~-1 ~8 ~4 ~-1 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]

# back door
fill ~8 ~1 ~10 ~8 ~3 ~10 air

# windows on all four faces
fill ~2 ~3 ~0 ~3 ~4 ~0 glass_pane
fill ~1 ~3 ~0 ~1 ~4 ~0 smooth_stone
fill ~4 ~3 ~0 ~4 ~4 ~0 smooth_stone
fill ~2 ~3 ~10 ~3 ~4 ~10 glass_pane
fill ~1 ~3 ~10 ~1 ~4 ~10 smooth_stone
fill ~4 ~3 ~10 ~4 ~4 ~10 smooth_stone
fill ~11 ~3 ~0 ~12 ~4 ~0 glass_pane
fill ~10 ~3 ~0 ~10 ~4 ~0 smooth_stone
fill ~13 ~3 ~0 ~13 ~4 ~0 smooth_stone
fill ~11 ~3 ~10 ~12 ~4 ~10 glass_pane
fill ~10 ~3 ~10 ~10 ~4 ~10 smooth_stone
fill ~13 ~3 ~10 ~13 ~4 ~10 smooth_stone
fill ~0 ~3 ~2 ~0 ~4 ~3 glass_pane
fill ~0 ~3 ~1 ~0 ~4 ~1 smooth_stone
fill ~0 ~3 ~4 ~0 ~4 ~4 smooth_stone
fill ~14 ~3 ~2 ~14 ~4 ~3 glass_pane
fill ~14 ~3 ~1 ~14 ~4 ~1 smooth_stone
fill ~14 ~3 ~4 ~14 ~4 ~4 smooth_stone
fill ~0 ~3 ~6 ~0 ~4 ~7 glass_pane
fill ~0 ~3 ~5 ~0 ~4 ~5 smooth_stone
fill ~0 ~3 ~8 ~0 ~4 ~8 smooth_stone
fill ~14 ~3 ~6 ~14 ~4 ~7 glass_pane
fill ~14 ~3 ~5 ~14 ~4 ~5 smooth_stone
fill ~14 ~3 ~8 ~14 ~4 ~8 smooth_stone

# front-of-house / back-of-house partition
fill ~1 ~1 ~5 ~13 ~6 ~5 spruce_planks
fill ~7 ~1 ~5 ~7 ~3 ~5 air

# gabled roof - 45 degree stair slope, solid gable ends
fill ~-1 ~8 ~-1 ~15 ~8 ~-1 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~11 ~15 ~8 ~11 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~0 ~-1 ~8 ~10 stripped_spruce_wood
fill ~15 ~8 ~0 ~15 ~8 ~10 stripped_spruce_wood
fill ~-1 ~9 ~0 ~15 ~9 ~0 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~10 ~15 ~9 ~10 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~1 ~-1 ~9 ~9 stripped_spruce_wood
fill ~15 ~9 ~1 ~15 ~9 ~9 stripped_spruce_wood
fill ~-1 ~10 ~1 ~15 ~10 ~1 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~9 ~15 ~10 ~9 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~2 ~-1 ~10 ~8 stripped_spruce_wood
fill ~15 ~10 ~2 ~15 ~10 ~8 stripped_spruce_wood
fill ~-1 ~11 ~2 ~15 ~11 ~2 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~8 ~15 ~11 ~8 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~3 ~-1 ~11 ~7 stripped_spruce_wood
fill ~15 ~11 ~3 ~15 ~11 ~7 stripped_spruce_wood
fill ~-1 ~12 ~3 ~15 ~12 ~3 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~7 ~15 ~12 ~7 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~4 ~-1 ~12 ~6 stripped_spruce_wood
fill ~15 ~12 ~4 ~15 ~12 ~6 stripped_spruce_wood
fill ~-1 ~13 ~4 ~15 ~13 ~4 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~6 ~15 ~13 ~6 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~5 ~-1 ~13 ~5 stripped_spruce_wood
fill ~15 ~13 ~5 ~15 ~13 ~5 stripped_spruce_wood
fill ~-1 ~14 ~5 ~15 ~14 ~5 stripped_spruce_wood

# trade features
# saw floor opening on the water side
fill ~0 ~2 ~7 ~0 ~6 ~9 air

say Sawmill T1 shell placed.
