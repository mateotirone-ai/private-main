# Precious Mine - Tier 1 shell
# footprint 11 x 11, walls 7 high
# builds from the player position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~13 ~18 ~13 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~11 ~-1 ~11 blackstone
fill ~-1 ~0 ~-1 ~11 ~0 ~11 blackstone
fill ~0 ~0 ~0 ~10 ~0 ~10 polished_blackstone

# base course
fill ~0 ~1 ~0 ~10 ~1 ~10 blackstone
fill ~1 ~1 ~1 ~9 ~1 ~9 air

# walls
fill ~0 ~2 ~0 ~10 ~7 ~10 polished_blackstone_bricks
fill ~1 ~2 ~1 ~9 ~7 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~7 ~0 polished_blackstone
fill ~10 ~1 ~0 ~10 ~7 ~0 polished_blackstone
fill ~0 ~1 ~10 ~0 ~7 ~10 polished_blackstone
fill ~10 ~1 ~10 ~10 ~7 ~10 polished_blackstone

# mid pilasters
fill ~5 ~1 ~0 ~5 ~7 ~0 polished_blackstone
fill ~5 ~1 ~10 ~5 ~7 ~10 polished_blackstone
fill ~0 ~1 ~5 ~0 ~7 ~5 polished_blackstone
fill ~10 ~1 ~5 ~10 ~7 ~5 polished_blackstone

# lintel course under the roof
fill ~0 ~7 ~0 ~10 ~7 ~10 gold_block
fill ~1 ~7 ~1 ~9 ~7 ~9 air

# front entrance
fill ~4 ~1 ~0 ~5 ~3 ~0 air
fill ~3 ~4 ~-1 ~6 ~4 ~-1 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]

# back door
fill ~6 ~1 ~10 ~6 ~3 ~10 air

# windows on all four faces
fill ~7 ~3 ~0 ~8 ~4 ~0 glass_pane
fill ~6 ~3 ~0 ~6 ~4 ~0 gold_block
fill ~9 ~3 ~0 ~9 ~4 ~0 gold_block
fill ~7 ~3 ~10 ~8 ~4 ~10 glass_pane
fill ~6 ~3 ~10 ~6 ~4 ~10 gold_block
fill ~9 ~3 ~10 ~9 ~4 ~10 gold_block
fill ~0 ~3 ~2 ~0 ~4 ~3 glass_pane
fill ~0 ~3 ~1 ~0 ~4 ~1 gold_block
fill ~0 ~3 ~4 ~0 ~4 ~4 gold_block
fill ~10 ~3 ~2 ~10 ~4 ~3 glass_pane
fill ~10 ~3 ~1 ~10 ~4 ~1 gold_block
fill ~10 ~3 ~4 ~10 ~4 ~4 gold_block
fill ~0 ~3 ~6 ~0 ~4 ~7 glass_pane
fill ~0 ~3 ~5 ~0 ~4 ~5 gold_block
fill ~0 ~3 ~8 ~0 ~4 ~8 gold_block
fill ~10 ~3 ~6 ~10 ~4 ~7 glass_pane
fill ~10 ~3 ~5 ~10 ~4 ~5 gold_block
fill ~10 ~3 ~8 ~10 ~4 ~8 gold_block

# front-of-house / back-of-house partition
fill ~1 ~1 ~5 ~9 ~6 ~5 polished_blackstone_bricks
fill ~5 ~1 ~5 ~5 ~3 ~5 air

# gabled roof - 45 degree stair slope, solid gable ends
fill ~-1 ~8 ~-1 ~11 ~8 ~-1 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~11 ~11 ~8 ~11 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~0 ~-1 ~8 ~10 chiseled_polished_blackstone
fill ~11 ~8 ~0 ~11 ~8 ~10 chiseled_polished_blackstone
fill ~-1 ~9 ~0 ~11 ~9 ~0 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~10 ~11 ~9 ~10 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~1 ~-1 ~9 ~9 chiseled_polished_blackstone
fill ~11 ~9 ~1 ~11 ~9 ~9 chiseled_polished_blackstone
fill ~-1 ~10 ~1 ~11 ~10 ~1 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~9 ~11 ~10 ~9 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~2 ~-1 ~10 ~8 chiseled_polished_blackstone
fill ~11 ~10 ~2 ~11 ~10 ~8 chiseled_polished_blackstone
fill ~-1 ~11 ~2 ~11 ~11 ~2 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~8 ~11 ~11 ~8 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~3 ~-1 ~11 ~7 chiseled_polished_blackstone
fill ~11 ~11 ~3 ~11 ~11 ~7 chiseled_polished_blackstone
fill ~-1 ~12 ~3 ~11 ~12 ~3 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~7 ~11 ~12 ~7 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~4 ~-1 ~12 ~6 chiseled_polished_blackstone
fill ~11 ~12 ~4 ~11 ~12 ~6 chiseled_polished_blackstone
fill ~-1 ~13 ~4 ~11 ~13 ~4 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~6 ~11 ~13 ~6 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~5 ~-1 ~13 ~5 chiseled_polished_blackstone
fill ~11 ~13 ~5 ~11 ~13 ~5 chiseled_polished_blackstone
fill ~-1 ~14 ~5 ~11 ~14 ~5 chiseled_polished_blackstone

# trade features
# strongroom alcove
fill ~1 ~1 ~7 ~3 ~4 ~9 air

say Precious Mine T1 shell placed.
