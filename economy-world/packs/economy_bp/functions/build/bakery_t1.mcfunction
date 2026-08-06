# Bakery - Tier 1 shell
# footprint 11 x 9, wall height 6
# builds from the player's position toward +x / +z

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
fill ~0 ~2 ~0 ~10 ~6 ~8 white_terracotta
fill ~1 ~2 ~1 ~9 ~6 ~7 air

# corner posts
fill ~0 ~1 ~0 ~0 ~6 ~0 spruce_log
fill ~10 ~1 ~0 ~10 ~6 ~0 spruce_log
fill ~0 ~1 ~8 ~0 ~6 ~8 spruce_log
fill ~10 ~1 ~8 ~10 ~6 ~8 spruce_log

# protruding pilasters
fill ~3 ~1 ~-1 ~3 ~6 ~-1 spruce_log
fill ~3 ~1 ~9 ~3 ~6 ~9 spruce_log
fill ~7 ~1 ~-1 ~7 ~6 ~-1 spruce_log
fill ~7 ~1 ~9 ~7 ~6 ~9 spruce_log
fill ~-1 ~1 ~3 ~-1 ~6 ~3 spruce_log
fill ~11 ~1 ~3 ~11 ~6 ~3 spruce_log

# overhanging eave band
fill ~-1 ~7 ~-1 ~11 ~7 ~9 spruce_planks
fill ~0 ~7 ~0 ~10 ~7 ~8 air

# front entrance
fill ~4 ~1 ~0 ~5 ~3 ~0 air
# door awning
fill ~3 ~4 ~-1 ~6 ~4 ~-1 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]

# back door
fill ~5 ~1 ~8 ~5 ~3 ~8 air

# windows with trim
fill ~1 ~3 ~0 ~1 ~4 ~0 glass_pane
fill ~1 ~2 ~0 ~1 ~2 ~0 spruce_planks
fill ~1 ~5 ~0 ~1 ~5 ~0 spruce_planks
fill ~2 ~3 ~0 ~2 ~4 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~2 ~0 spruce_planks
fill ~2 ~5 ~0 ~2 ~5 ~0 spruce_planks
fill ~8 ~3 ~0 ~8 ~4 ~0 glass_pane
fill ~8 ~2 ~0 ~8 ~2 ~0 spruce_planks
fill ~8 ~5 ~0 ~8 ~5 ~0 spruce_planks
fill ~9 ~3 ~0 ~9 ~4 ~0 glass_pane
fill ~9 ~2 ~0 ~9 ~2 ~0 spruce_planks
fill ~9 ~5 ~0 ~9 ~5 ~0 spruce_planks
fill ~0 ~3 ~2 ~0 ~4 ~2 glass_pane
fill ~0 ~2 ~2 ~0 ~2 ~2 spruce_planks
fill ~0 ~5 ~2 ~0 ~5 ~2 spruce_planks
fill ~10 ~3 ~2 ~10 ~4 ~2 glass_pane
fill ~10 ~2 ~2 ~10 ~2 ~2 spruce_planks
fill ~10 ~5 ~2 ~10 ~5 ~2 spruce_planks
fill ~0 ~3 ~5 ~0 ~4 ~5 glass_pane
fill ~0 ~2 ~5 ~0 ~2 ~5 spruce_planks
fill ~0 ~5 ~5 ~0 ~5 ~5 spruce_planks
fill ~10 ~3 ~5 ~10 ~4 ~5 glass_pane
fill ~10 ~2 ~5 ~10 ~2 ~5 spruce_planks
fill ~10 ~5 ~5 ~10 ~5 ~5 spruce_planks

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~9 ~6 ~4 white_terracotta
fill ~5 ~1 ~4 ~5 ~3 ~4 air

# roof - closed solid layers, stairs as trim only
fill ~-1 ~8 ~-1 ~11 ~8 ~9 stripped_spruce_wood
fill ~0 ~8 ~1 ~10 ~8 ~7 air
fill ~-1 ~8 ~-1 ~11 ~8 ~-1 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~9 ~11 ~8 ~9 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~0 ~11 ~9 ~8 stripped_spruce_wood
fill ~0 ~9 ~2 ~10 ~9 ~6 air
fill ~-1 ~9 ~0 ~11 ~9 ~0 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~8 ~11 ~9 ~8 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~1 ~11 ~10 ~7 stripped_spruce_wood
fill ~0 ~10 ~3 ~10 ~10 ~5 air
fill ~-1 ~10 ~1 ~11 ~10 ~1 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~7 ~11 ~10 ~7 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~2 ~11 ~11 ~6 stripped_spruce_wood
fill ~0 ~11 ~4 ~10 ~11 ~4 air
fill ~-1 ~11 ~2 ~11 ~11 ~2 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~6 ~11 ~11 ~6 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~3 ~11 ~12 ~5 stripped_spruce_wood
fill ~-1 ~12 ~3 ~11 ~12 ~3 spruce_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~5 ~11 ~12 ~5 spruce_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~4 ~11 ~13 ~4 stripped_spruce_wood

# trade features
# oven chimney
fill ~8 ~7 ~6 ~9 ~13 ~6 brick_block

say Bakery T1 shell placed. Decorate away.
