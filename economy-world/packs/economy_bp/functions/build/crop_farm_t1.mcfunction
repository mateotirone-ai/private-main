# Crop Farm - Tier 1 shell
# footprint 15 x 11, wall height 6
# builds from the player's position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~17 ~17 ~13 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~15 ~-1 ~11 cobblestone
fill ~-1 ~0 ~-1 ~15 ~0 ~11 cobblestone
fill ~0 ~0 ~0 ~14 ~0 ~10 coarse_dirt

# base course
fill ~0 ~1 ~0 ~14 ~1 ~10 cobblestone
fill ~1 ~1 ~1 ~13 ~1 ~9 air

# walls
fill ~0 ~2 ~0 ~14 ~6 ~10 oak_planks
fill ~1 ~2 ~1 ~13 ~6 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~6 ~0 oak_log
fill ~14 ~1 ~0 ~14 ~6 ~0 oak_log
fill ~0 ~1 ~10 ~0 ~6 ~10 oak_log
fill ~14 ~1 ~10 ~14 ~6 ~10 oak_log

# protruding pilasters
fill ~3 ~1 ~-1 ~3 ~6 ~-1 oak_log
fill ~3 ~1 ~11 ~3 ~6 ~11 oak_log
fill ~7 ~1 ~-1 ~7 ~6 ~-1 oak_log
fill ~7 ~1 ~11 ~7 ~6 ~11 oak_log
fill ~11 ~1 ~-1 ~11 ~6 ~-1 oak_log
fill ~11 ~1 ~11 ~11 ~6 ~11 oak_log
fill ~-1 ~1 ~3 ~-1 ~6 ~3 oak_log
fill ~15 ~1 ~3 ~15 ~6 ~3 oak_log
fill ~-1 ~1 ~7 ~-1 ~6 ~7 oak_log
fill ~15 ~1 ~7 ~15 ~6 ~7 oak_log

# overhanging eave band
fill ~-1 ~7 ~-1 ~15 ~7 ~11 oak_wood
fill ~0 ~7 ~0 ~14 ~7 ~10 air

# front entrance
fill ~6 ~1 ~0 ~7 ~3 ~0 air
# door awning
fill ~5 ~4 ~-1 ~8 ~4 ~-1 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]

# back door
fill ~7 ~1 ~10 ~7 ~3 ~10 air

# windows with trim
fill ~1 ~3 ~0 ~1 ~4 ~0 glass_pane
fill ~1 ~2 ~0 ~1 ~2 ~0 oak_wood
fill ~1 ~5 ~0 ~1 ~5 ~0 oak_wood
fill ~2 ~3 ~0 ~2 ~4 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~2 ~0 oak_wood
fill ~2 ~5 ~0 ~2 ~5 ~0 oak_wood
fill ~12 ~3 ~0 ~12 ~4 ~0 glass_pane
fill ~12 ~2 ~0 ~12 ~2 ~0 oak_wood
fill ~12 ~5 ~0 ~12 ~5 ~0 oak_wood
fill ~13 ~3 ~0 ~13 ~4 ~0 glass_pane
fill ~13 ~2 ~0 ~13 ~2 ~0 oak_wood
fill ~13 ~5 ~0 ~13 ~5 ~0 oak_wood
fill ~0 ~3 ~2 ~0 ~4 ~2 glass_pane
fill ~0 ~2 ~2 ~0 ~2 ~2 oak_wood
fill ~0 ~5 ~2 ~0 ~5 ~2 oak_wood
fill ~14 ~3 ~2 ~14 ~4 ~2 glass_pane
fill ~14 ~2 ~2 ~14 ~2 ~2 oak_wood
fill ~14 ~5 ~2 ~14 ~5 ~2 oak_wood
fill ~0 ~3 ~5 ~0 ~4 ~5 glass_pane
fill ~0 ~2 ~5 ~0 ~2 ~5 oak_wood
fill ~0 ~5 ~5 ~0 ~5 ~5 oak_wood
fill ~14 ~3 ~5 ~14 ~4 ~5 glass_pane
fill ~14 ~2 ~5 ~14 ~2 ~5 oak_wood
fill ~14 ~5 ~5 ~14 ~5 ~5 oak_wood
fill ~0 ~3 ~8 ~0 ~4 ~8 glass_pane
fill ~0 ~2 ~8 ~0 ~2 ~8 oak_wood
fill ~0 ~5 ~8 ~0 ~5 ~8 oak_wood
fill ~14 ~3 ~8 ~14 ~4 ~8 glass_pane
fill ~14 ~2 ~8 ~14 ~2 ~8 oak_wood
fill ~14 ~5 ~8 ~14 ~5 ~8 oak_wood

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~13 ~6 ~4 oak_planks
fill ~7 ~1 ~4 ~7 ~3 ~4 air

# roof - closed solid layers, stairs as trim only
fill ~-1 ~8 ~-1 ~15 ~8 ~11 stripped_oak_wood
fill ~0 ~8 ~1 ~14 ~8 ~9 air
fill ~-1 ~8 ~-1 ~15 ~8 ~-1 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~11 ~15 ~8 ~11 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~0 ~15 ~9 ~10 stripped_oak_wood
fill ~0 ~9 ~2 ~14 ~9 ~8 air
fill ~-1 ~9 ~0 ~15 ~9 ~0 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~10 ~15 ~9 ~10 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~1 ~15 ~10 ~9 stripped_oak_wood
fill ~0 ~10 ~3 ~14 ~10 ~7 air
fill ~-1 ~10 ~1 ~15 ~10 ~1 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~9 ~15 ~10 ~9 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~2 ~15 ~11 ~8 stripped_oak_wood
fill ~0 ~11 ~4 ~14 ~11 ~6 air
fill ~-1 ~11 ~2 ~15 ~11 ~2 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~8 ~15 ~11 ~8 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~3 ~15 ~12 ~7 stripped_oak_wood
fill ~0 ~12 ~5 ~14 ~12 ~5 air
fill ~-1 ~12 ~3 ~15 ~12 ~3 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~7 ~15 ~12 ~7 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~4 ~15 ~13 ~6 stripped_oak_wood
fill ~-1 ~13 ~4 ~15 ~13 ~4 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~6 ~15 ~13 ~6 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~14 ~5 ~15 ~14 ~5 stripped_oak_wood

# trade features
# barn doors on the back wall
fill ~6 ~1 ~10 ~8 ~5 ~10 air

say Crop Farm T1 shell placed. Decorate away.
