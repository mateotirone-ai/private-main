# Bakery - Tier 1 shell
# footprint 11 x 9, wall height 5
# builds from the player's position toward +x / +z

# clear site
fill ~-2 ~0 ~-2 ~12 ~12 ~10 air

# foundation and floor
fill ~-1 ~-1 ~-1 ~11 ~-1 ~9 stone_bricks
fill ~0 ~0 ~0 ~10 ~0 ~8 stone_bricks

# walls
fill ~0 ~1 ~0 ~10 ~5 ~8 white_terracotta
fill ~1 ~1 ~1 ~9 ~5 ~7 air

# corner posts
fill ~0 ~1 ~0 ~0 ~5 ~0 spruce_log
fill ~10 ~1 ~0 ~10 ~5 ~0 spruce_log
fill ~0 ~1 ~8 ~0 ~5 ~8 spruce_log
fill ~10 ~1 ~8 ~10 ~5 ~8 spruce_log

# top trim course
fill ~0 ~5 ~0 ~10 ~5 ~8 spruce_planks
fill ~1 ~5 ~1 ~9 ~5 ~7 air

# front entrance
fill ~4 ~1 ~0 ~5 ~3 ~0 air

# back door
fill ~5 ~1 ~8 ~5 ~3 ~8 air

# windows
fill ~1 ~2 ~0 ~1 ~3 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~3 ~0 glass_pane
fill ~8 ~2 ~0 ~8 ~3 ~0 glass_pane
fill ~9 ~2 ~0 ~9 ~3 ~0 glass_pane
fill ~0 ~2 ~2 ~0 ~3 ~2 glass_pane
fill ~10 ~2 ~2 ~10 ~3 ~2 glass_pane
fill ~0 ~2 ~5 ~0 ~3 ~5 glass_pane
fill ~10 ~2 ~5 ~10 ~3 ~5 glass_pane

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~9 ~4 ~4 white_terracotta
fill ~5 ~1 ~4 ~5 ~3 ~4 air

# roof
fill ~-1 ~6 ~-1 ~11 ~6 ~-1 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~6 ~9 ~11 ~6 ~9 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~6 ~0 ~-1 ~6 ~8 stripped_spruce_wood
fill ~11 ~6 ~0 ~11 ~6 ~8 stripped_spruce_wood
fill ~-1 ~7 ~0 ~11 ~7 ~0 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~7 ~8 ~11 ~7 ~8 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~7 ~1 ~-1 ~7 ~7 stripped_spruce_wood
fill ~11 ~7 ~1 ~11 ~7 ~7 stripped_spruce_wood
fill ~-1 ~8 ~1 ~11 ~8 ~1 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~7 ~11 ~8 ~7 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~2 ~-1 ~8 ~6 stripped_spruce_wood
fill ~11 ~8 ~2 ~11 ~8 ~6 stripped_spruce_wood
fill ~-1 ~9 ~2 ~11 ~9 ~2 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~6 ~11 ~9 ~6 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~3 ~-1 ~9 ~5 stripped_spruce_wood
fill ~11 ~9 ~3 ~11 ~9 ~5 stripped_spruce_wood
fill ~-1 ~10 ~3 ~11 ~10 ~3 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~5 ~11 ~10 ~5 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]

# trade features
# oven chimney
fill ~8 ~6 ~7 ~8 ~11 ~7 bricks
fill ~8 ~6 ~7 ~8 ~10 ~7 air

say [build] Bakery T1 shell placed. Decorate away.
