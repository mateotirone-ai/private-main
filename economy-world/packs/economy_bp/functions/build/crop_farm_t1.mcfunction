# Crop Farm - Tier 1 shell
# footprint 15 x 11, wall height 5
# builds from the player's position toward +x / +z

# clear site
fill ~-2 ~0 ~-2 ~16 ~13 ~12 air

# foundation and floor
fill ~-1 ~-1 ~-1 ~15 ~-1 ~11 coarse_dirt
fill ~0 ~0 ~0 ~14 ~0 ~10 coarse_dirt

# walls
fill ~0 ~1 ~0 ~14 ~5 ~10 oak_planks
fill ~1 ~1 ~1 ~13 ~5 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~5 ~0 oak_log
fill ~14 ~1 ~0 ~14 ~5 ~0 oak_log
fill ~0 ~1 ~10 ~0 ~5 ~10 oak_log
fill ~14 ~1 ~10 ~14 ~5 ~10 oak_log

# top trim course
fill ~0 ~5 ~0 ~14 ~5 ~10 oak_wood
fill ~1 ~5 ~1 ~13 ~5 ~9 air

# front entrance
fill ~6 ~1 ~0 ~7 ~3 ~0 air

# back door
fill ~7 ~1 ~10 ~7 ~3 ~10 air

# windows
fill ~1 ~2 ~0 ~1 ~3 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~3 ~0 glass_pane
fill ~12 ~2 ~0 ~12 ~3 ~0 glass_pane
fill ~13 ~2 ~0 ~13 ~3 ~0 glass_pane
fill ~0 ~2 ~2 ~0 ~3 ~2 glass_pane
fill ~14 ~2 ~2 ~14 ~3 ~2 glass_pane
fill ~0 ~2 ~5 ~0 ~3 ~5 glass_pane
fill ~14 ~2 ~5 ~14 ~3 ~5 glass_pane
fill ~0 ~2 ~8 ~0 ~3 ~8 glass_pane
fill ~14 ~2 ~8 ~14 ~3 ~8 glass_pane

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~13 ~4 ~4 oak_planks
fill ~7 ~1 ~4 ~7 ~3 ~4 air

# roof
fill ~-1 ~6 ~-1 ~15 ~6 ~-1 oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~6 ~11 ~15 ~6 ~11 oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~6 ~0 ~-1 ~6 ~10 stripped_oak_wood
fill ~15 ~6 ~0 ~15 ~6 ~10 stripped_oak_wood
fill ~-1 ~7 ~0 ~15 ~7 ~0 oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~7 ~10 ~15 ~7 ~10 oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~7 ~1 ~-1 ~7 ~9 stripped_oak_wood
fill ~15 ~7 ~1 ~15 ~7 ~9 stripped_oak_wood
fill ~-1 ~8 ~1 ~15 ~8 ~1 oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~9 ~15 ~8 ~9 oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~2 ~-1 ~8 ~8 stripped_oak_wood
fill ~15 ~8 ~2 ~15 ~8 ~8 stripped_oak_wood
fill ~-1 ~9 ~2 ~15 ~9 ~2 oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~8 ~15 ~9 ~8 oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~3 ~-1 ~9 ~7 stripped_oak_wood
fill ~15 ~9 ~3 ~15 ~9 ~7 stripped_oak_wood
fill ~-1 ~10 ~3 ~15 ~10 ~3 oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~7 ~15 ~10 ~7 oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~4 ~-1 ~10 ~6 stripped_oak_wood
fill ~15 ~10 ~4 ~15 ~10 ~6 stripped_oak_wood
fill ~-1 ~11 ~4 ~15 ~11 ~4 oak_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~6 ~15 ~11 ~6 oak_stairs ["weirdo_direction"=2,"upside_down_bit"=false]

# trade features
# barn doors on the back wall
fill ~6 ~1 ~10 ~8 ~4 ~10 air

say Crop Farm T1 shell placed. Decorate away.
