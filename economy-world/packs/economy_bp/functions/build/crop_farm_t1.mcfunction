# Crop Farm - Tier 1 shell
# footprint 15 x 11, walls 7 high
# builds from the player position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~17 ~18 ~13 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~15 ~-1 ~11 cobblestone
fill ~-1 ~0 ~-1 ~15 ~0 ~11 cobblestone
fill ~0 ~0 ~0 ~14 ~0 ~10 coarse_dirt

# base course
fill ~0 ~1 ~0 ~14 ~1 ~10 cobblestone
fill ~1 ~1 ~1 ~13 ~1 ~9 air

# walls
fill ~0 ~2 ~0 ~14 ~7 ~10 oak_planks
fill ~1 ~2 ~1 ~13 ~7 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~7 ~0 oak_log
fill ~14 ~1 ~0 ~14 ~7 ~0 oak_log
fill ~0 ~1 ~10 ~0 ~7 ~10 oak_log
fill ~14 ~1 ~10 ~14 ~7 ~10 oak_log

# mid pilasters
fill ~7 ~1 ~0 ~7 ~7 ~0 oak_log
fill ~7 ~1 ~10 ~7 ~7 ~10 oak_log
fill ~0 ~1 ~5 ~0 ~7 ~5 oak_log
fill ~14 ~1 ~5 ~14 ~7 ~5 oak_log

# lintel course under the roof
fill ~0 ~7 ~0 ~14 ~7 ~10 oak_wood
fill ~1 ~7 ~1 ~13 ~7 ~9 air

# front entrance
fill ~6 ~1 ~0 ~7 ~3 ~0 air
fill ~5 ~4 ~-1 ~8 ~4 ~-1 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]

# back door
fill ~8 ~1 ~10 ~8 ~3 ~10 air

# windows on all four faces
fill ~2 ~3 ~0 ~3 ~4 ~0 glass_pane
fill ~1 ~3 ~0 ~1 ~4 ~0 oak_wood
fill ~4 ~3 ~0 ~4 ~4 ~0 oak_wood
fill ~2 ~3 ~10 ~3 ~4 ~10 glass_pane
fill ~1 ~3 ~10 ~1 ~4 ~10 oak_wood
fill ~4 ~3 ~10 ~4 ~4 ~10 oak_wood
fill ~11 ~3 ~0 ~12 ~4 ~0 glass_pane
fill ~10 ~3 ~0 ~10 ~4 ~0 oak_wood
fill ~13 ~3 ~0 ~13 ~4 ~0 oak_wood
fill ~11 ~3 ~10 ~12 ~4 ~10 glass_pane
fill ~10 ~3 ~10 ~10 ~4 ~10 oak_wood
fill ~13 ~3 ~10 ~13 ~4 ~10 oak_wood
fill ~0 ~3 ~2 ~0 ~4 ~3 glass_pane
fill ~0 ~3 ~1 ~0 ~4 ~1 oak_wood
fill ~0 ~3 ~4 ~0 ~4 ~4 oak_wood
fill ~14 ~3 ~2 ~14 ~4 ~3 glass_pane
fill ~14 ~3 ~1 ~14 ~4 ~1 oak_wood
fill ~14 ~3 ~4 ~14 ~4 ~4 oak_wood
fill ~0 ~3 ~6 ~0 ~4 ~7 glass_pane
fill ~0 ~3 ~5 ~0 ~4 ~5 oak_wood
fill ~0 ~3 ~8 ~0 ~4 ~8 oak_wood
fill ~14 ~3 ~6 ~14 ~4 ~7 glass_pane
fill ~14 ~3 ~5 ~14 ~4 ~5 oak_wood
fill ~14 ~3 ~8 ~14 ~4 ~8 oak_wood

# front-of-house / back-of-house partition
fill ~1 ~1 ~4 ~13 ~6 ~4 oak_planks
fill ~7 ~1 ~4 ~7 ~3 ~4 air

# gabled roof - 45 degree stair slope, solid gable ends
fill ~-1 ~8 ~-1 ~15 ~8 ~-1 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~11 ~15 ~8 ~11 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~0 ~-1 ~8 ~10 stripped_oak_wood
fill ~15 ~8 ~0 ~15 ~8 ~10 stripped_oak_wood
fill ~-1 ~9 ~0 ~15 ~9 ~0 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~10 ~15 ~9 ~10 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~1 ~-1 ~9 ~9 stripped_oak_wood
fill ~15 ~9 ~1 ~15 ~9 ~9 stripped_oak_wood
fill ~-1 ~10 ~1 ~15 ~10 ~1 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~9 ~15 ~10 ~9 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~2 ~-1 ~10 ~8 stripped_oak_wood
fill ~15 ~10 ~2 ~15 ~10 ~8 stripped_oak_wood
fill ~-1 ~11 ~2 ~15 ~11 ~2 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~8 ~15 ~11 ~8 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~3 ~-1 ~11 ~7 stripped_oak_wood
fill ~15 ~11 ~3 ~15 ~11 ~7 stripped_oak_wood
fill ~-1 ~12 ~3 ~15 ~12 ~3 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~7 ~15 ~12 ~7 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~4 ~-1 ~12 ~6 stripped_oak_wood
fill ~15 ~12 ~4 ~15 ~12 ~6 stripped_oak_wood
fill ~-1 ~13 ~4 ~15 ~13 ~4 oak_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~6 ~15 ~13 ~6 oak_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~5 ~-1 ~13 ~5 stripped_oak_wood
fill ~15 ~13 ~5 ~15 ~13 ~5 stripped_oak_wood
fill ~-1 ~14 ~5 ~15 ~14 ~5 stripped_oak_wood

# trade features
# barn doors on the back wall
fill ~6 ~1 ~10 ~8 ~5 ~10 air

say Crop Farm T1 shell placed.
