# Smeltery - Tier 1 shell
# footprint 13 x 13, walls 7 high
# builds from the player position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~15 ~20 ~15 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~13 ~-1 ~13 blackstone
fill ~-1 ~0 ~-1 ~13 ~0 ~13 blackstone
fill ~0 ~0 ~0 ~12 ~0 ~12 blackstone

# base course
fill ~0 ~1 ~0 ~12 ~1 ~12 blackstone
fill ~1 ~1 ~1 ~11 ~1 ~11 air

# walls
fill ~0 ~2 ~0 ~12 ~7 ~12 brick_block
fill ~1 ~2 ~1 ~11 ~7 ~11 air

# corner posts
fill ~0 ~1 ~0 ~0 ~7 ~0 polished_blackstone
fill ~12 ~1 ~0 ~12 ~7 ~0 polished_blackstone
fill ~0 ~1 ~12 ~0 ~7 ~12 polished_blackstone
fill ~12 ~1 ~12 ~12 ~7 ~12 polished_blackstone

# mid pilasters
fill ~6 ~1 ~0 ~6 ~7 ~0 polished_blackstone
fill ~6 ~1 ~12 ~6 ~7 ~12 polished_blackstone
fill ~0 ~1 ~6 ~0 ~7 ~6 polished_blackstone
fill ~12 ~1 ~6 ~12 ~7 ~6 polished_blackstone

# lintel course under the roof
fill ~0 ~7 ~0 ~12 ~7 ~12 smooth_stone
fill ~1 ~7 ~1 ~11 ~7 ~11 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air
fill ~4 ~4 ~-1 ~7 ~4 ~-1 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]

# back door
fill ~7 ~1 ~12 ~7 ~3 ~12 air

# windows on all four faces
fill ~2 ~3 ~0 ~3 ~4 ~0 glass_pane
fill ~1 ~3 ~0 ~1 ~4 ~0 smooth_stone
fill ~4 ~3 ~0 ~4 ~4 ~0 smooth_stone
fill ~2 ~3 ~12 ~3 ~4 ~12 glass_pane
fill ~1 ~3 ~12 ~1 ~4 ~12 smooth_stone
fill ~4 ~3 ~12 ~4 ~4 ~12 smooth_stone
fill ~9 ~3 ~0 ~10 ~4 ~0 glass_pane
fill ~8 ~3 ~0 ~8 ~4 ~0 smooth_stone
fill ~11 ~3 ~0 ~11 ~4 ~0 smooth_stone
fill ~9 ~3 ~12 ~10 ~4 ~12 glass_pane
fill ~8 ~3 ~12 ~8 ~4 ~12 smooth_stone
fill ~11 ~3 ~12 ~11 ~4 ~12 smooth_stone
fill ~0 ~3 ~2 ~0 ~4 ~3 glass_pane
fill ~0 ~3 ~1 ~0 ~4 ~1 smooth_stone
fill ~0 ~3 ~4 ~0 ~4 ~4 smooth_stone
fill ~12 ~3 ~2 ~12 ~4 ~3 glass_pane
fill ~12 ~3 ~1 ~12 ~4 ~1 smooth_stone
fill ~12 ~3 ~4 ~12 ~4 ~4 smooth_stone

# front-of-house / back-of-house partition
fill ~1 ~1 ~5 ~11 ~6 ~5 brick_block
fill ~6 ~1 ~5 ~6 ~3 ~5 air

# gabled roof - 45 degree stair slope, solid gable ends
fill ~-1 ~8 ~-1 ~13 ~8 ~-1 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~13 ~13 ~8 ~13 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~0 ~-1 ~8 ~12 chiseled_polished_blackstone
fill ~13 ~8 ~0 ~13 ~8 ~12 chiseled_polished_blackstone
fill ~-1 ~9 ~0 ~13 ~9 ~0 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~12 ~13 ~9 ~12 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~1 ~-1 ~9 ~11 chiseled_polished_blackstone
fill ~13 ~9 ~1 ~13 ~9 ~11 chiseled_polished_blackstone
fill ~-1 ~10 ~1 ~13 ~10 ~1 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~11 ~13 ~10 ~11 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~2 ~-1 ~10 ~10 chiseled_polished_blackstone
fill ~13 ~10 ~2 ~13 ~10 ~10 chiseled_polished_blackstone
fill ~-1 ~11 ~2 ~13 ~11 ~2 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~10 ~13 ~11 ~10 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~3 ~-1 ~11 ~9 chiseled_polished_blackstone
fill ~13 ~11 ~3 ~13 ~11 ~9 chiseled_polished_blackstone
fill ~-1 ~12 ~3 ~13 ~12 ~3 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~9 ~13 ~12 ~9 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~4 ~-1 ~12 ~8 chiseled_polished_blackstone
fill ~13 ~12 ~4 ~13 ~12 ~8 chiseled_polished_blackstone
fill ~-1 ~13 ~4 ~13 ~13 ~4 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~8 ~13 ~13 ~8 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~5 ~-1 ~13 ~7 chiseled_polished_blackstone
fill ~13 ~13 ~5 ~13 ~13 ~7 chiseled_polished_blackstone
fill ~-1 ~14 ~5 ~13 ~14 ~5 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~14 ~7 ~13 ~14 ~7 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~14 ~6 ~-1 ~14 ~6 chiseled_polished_blackstone
fill ~13 ~14 ~6 ~13 ~14 ~6 chiseled_polished_blackstone
fill ~-1 ~15 ~6 ~13 ~15 ~6 chiseled_polished_blackstone

# trade features
# chimney stack
fill ~9 ~8 ~9 ~10 ~17 ~10 brick_block

say Smeltery T1 shell placed.
