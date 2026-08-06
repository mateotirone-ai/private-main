# Lumber Camp - Tier 1 shell
# footprint 13 x 11, wall height 5
# builds from the player's position toward +x / +z

# clear site
fill ~-2 ~0 ~-2 ~14 ~13 ~12 air

# foundation and floor
fill ~-1 ~-1 ~-1 ~13 ~-1 ~11 stripped_spruce_log
fill ~0 ~0 ~0 ~12 ~0 ~10 stripped_spruce_log

# walls
fill ~0 ~1 ~0 ~12 ~5 ~10 spruce_planks
fill ~1 ~1 ~1 ~11 ~5 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~5 ~0 spruce_log
fill ~12 ~1 ~0 ~12 ~5 ~0 spruce_log
fill ~0 ~1 ~10 ~0 ~5 ~10 spruce_log
fill ~12 ~1 ~10 ~12 ~5 ~10 spruce_log

# top trim course
fill ~0 ~5 ~0 ~12 ~5 ~10 spruce_wood
fill ~1 ~5 ~1 ~11 ~5 ~9 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air

# back door
fill ~6 ~1 ~10 ~6 ~3 ~10 air

# windows
fill ~1 ~2 ~0 ~1 ~3 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~3 ~0 glass_pane
fill ~10 ~2 ~0 ~10 ~3 ~0 glass_pane
fill ~11 ~2 ~0 ~11 ~3 ~0 glass_pane
fill ~0 ~2 ~2 ~0 ~3 ~2 glass_pane
fill ~12 ~2 ~2 ~12 ~3 ~2 glass_pane
fill ~0 ~2 ~5 ~0 ~3 ~5 glass_pane
fill ~12 ~2 ~5 ~12 ~3 ~5 glass_pane
fill ~0 ~2 ~8 ~0 ~3 ~8 glass_pane
fill ~12 ~2 ~8 ~12 ~3 ~8 glass_pane

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~11 ~4 ~4 spruce_planks
fill ~6 ~1 ~4 ~6 ~3 ~4 air

# roof
fill ~-1 ~6 ~-1 ~13 ~6 ~-1 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~6 ~11 ~13 ~6 ~11 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~6 ~0 ~-1 ~6 ~10 stripped_spruce_wood
fill ~13 ~6 ~0 ~13 ~6 ~10 stripped_spruce_wood
fill ~-1 ~7 ~0 ~13 ~7 ~0 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~7 ~10 ~13 ~7 ~10 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~7 ~1 ~-1 ~7 ~9 stripped_spruce_wood
fill ~13 ~7 ~1 ~13 ~7 ~9 stripped_spruce_wood
fill ~-1 ~8 ~1 ~13 ~8 ~1 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~9 ~13 ~8 ~9 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~2 ~-1 ~8 ~8 stripped_spruce_wood
fill ~13 ~8 ~2 ~13 ~8 ~8 stripped_spruce_wood
fill ~-1 ~9 ~2 ~13 ~9 ~2 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~8 ~13 ~9 ~8 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~3 ~-1 ~9 ~7 stripped_spruce_wood
fill ~13 ~9 ~3 ~13 ~9 ~7 stripped_spruce_wood
fill ~-1 ~10 ~3 ~13 ~10 ~3 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~7 ~13 ~10 ~7 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~4 ~-1 ~10 ~6 stripped_spruce_wood
fill ~13 ~10 ~4 ~13 ~10 ~6 stripped_spruce_wood
fill ~-1 ~11 ~4 ~13 ~11 ~4 spruce_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~6 ~13 ~11 ~6 spruce_stairs ["weirdo_direction"=2,"upside_down_bit"=false]

# trade features
# open log-yard side (removes the +x wall behind the partition)
fill ~12 ~1 ~5 ~12 ~4 ~9 air

say Lumber Camp T1 shell placed. Decorate away.
