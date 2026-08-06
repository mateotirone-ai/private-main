# Stone Quarry - Tier 1 shell
# footprint 13 x 11, walls 7 high
# builds from the player position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~15 ~18 ~13 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~13 ~-1 ~11 cobblestone
fill ~-1 ~0 ~-1 ~13 ~0 ~11 cobblestone
fill ~0 ~0 ~0 ~12 ~0 ~10 smooth_stone

# base course
fill ~0 ~1 ~0 ~12 ~1 ~10 cobblestone
fill ~1 ~1 ~1 ~11 ~1 ~9 air

# walls
fill ~0 ~2 ~0 ~12 ~7 ~10 stone_bricks
fill ~1 ~2 ~1 ~11 ~7 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~7 ~0 polished_andesite
fill ~12 ~1 ~0 ~12 ~7 ~0 polished_andesite
fill ~0 ~1 ~10 ~0 ~7 ~10 polished_andesite
fill ~12 ~1 ~10 ~12 ~7 ~10 polished_andesite

# mid pilasters
fill ~6 ~1 ~0 ~6 ~7 ~0 polished_andesite
fill ~6 ~1 ~10 ~6 ~7 ~10 polished_andesite
fill ~0 ~1 ~5 ~0 ~7 ~5 polished_andesite
fill ~12 ~1 ~5 ~12 ~7 ~5 polished_andesite

# lintel course under the roof
fill ~0 ~7 ~0 ~12 ~7 ~10 polished_andesite
fill ~1 ~7 ~1 ~11 ~7 ~9 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air
fill ~4 ~4 ~-1 ~7 ~4 ~-1 stone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]

# back door
fill ~7 ~1 ~10 ~7 ~3 ~10 air

# windows on all four faces
fill ~2 ~3 ~0 ~3 ~4 ~0 glass_pane
fill ~1 ~3 ~0 ~1 ~4 ~0 polished_andesite
fill ~4 ~3 ~0 ~4 ~4 ~0 polished_andesite
fill ~2 ~3 ~10 ~3 ~4 ~10 glass_pane
fill ~1 ~3 ~10 ~1 ~4 ~10 polished_andesite
fill ~4 ~3 ~10 ~4 ~4 ~10 polished_andesite
fill ~9 ~3 ~0 ~10 ~4 ~0 glass_pane
fill ~8 ~3 ~0 ~8 ~4 ~0 polished_andesite
fill ~11 ~3 ~0 ~11 ~4 ~0 polished_andesite
fill ~9 ~3 ~10 ~10 ~4 ~10 glass_pane
fill ~8 ~3 ~10 ~8 ~4 ~10 polished_andesite
fill ~11 ~3 ~10 ~11 ~4 ~10 polished_andesite
fill ~0 ~3 ~2 ~0 ~4 ~3 glass_pane
fill ~0 ~3 ~1 ~0 ~4 ~1 polished_andesite
fill ~0 ~3 ~4 ~0 ~4 ~4 polished_andesite
fill ~12 ~3 ~2 ~12 ~4 ~3 glass_pane
fill ~12 ~3 ~1 ~12 ~4 ~1 polished_andesite
fill ~12 ~3 ~4 ~12 ~4 ~4 polished_andesite
fill ~0 ~3 ~6 ~0 ~4 ~7 glass_pane
fill ~0 ~3 ~5 ~0 ~4 ~5 polished_andesite
fill ~0 ~3 ~8 ~0 ~4 ~8 polished_andesite
fill ~12 ~3 ~6 ~12 ~4 ~7 glass_pane
fill ~12 ~3 ~5 ~12 ~4 ~5 polished_andesite
fill ~12 ~3 ~8 ~12 ~4 ~8 polished_andesite

# front-of-house / back-of-house partition
fill ~1 ~1 ~5 ~11 ~6 ~5 stone_bricks
fill ~6 ~1 ~5 ~6 ~3 ~5 air

# gabled roof - 45 degree stair slope, solid gable ends
fill ~-1 ~8 ~-1 ~13 ~8 ~-1 stone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~11 ~13 ~8 ~11 stone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~0 ~-1 ~8 ~10 chiseled_stone_bricks
fill ~13 ~8 ~0 ~13 ~8 ~10 chiseled_stone_bricks
fill ~-1 ~9 ~0 ~13 ~9 ~0 stone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~10 ~13 ~9 ~10 stone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~1 ~-1 ~9 ~9 chiseled_stone_bricks
fill ~13 ~9 ~1 ~13 ~9 ~9 chiseled_stone_bricks
fill ~-1 ~10 ~1 ~13 ~10 ~1 stone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~9 ~13 ~10 ~9 stone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~2 ~-1 ~10 ~8 chiseled_stone_bricks
fill ~13 ~10 ~2 ~13 ~10 ~8 chiseled_stone_bricks
fill ~-1 ~11 ~2 ~13 ~11 ~2 stone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~8 ~13 ~11 ~8 stone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~3 ~-1 ~11 ~7 chiseled_stone_bricks
fill ~13 ~11 ~3 ~13 ~11 ~7 chiseled_stone_bricks
fill ~-1 ~12 ~3 ~13 ~12 ~3 stone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~7 ~13 ~12 ~7 stone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~4 ~-1 ~12 ~6 chiseled_stone_bricks
fill ~13 ~12 ~4 ~13 ~12 ~6 chiseled_stone_bricks
fill ~-1 ~13 ~4 ~13 ~13 ~4 stone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~6 ~13 ~13 ~6 stone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~5 ~-1 ~13 ~5 chiseled_stone_bricks
fill ~13 ~13 ~5 ~13 ~13 ~5 chiseled_stone_bricks
fill ~-1 ~14 ~5 ~13 ~14 ~5 chiseled_stone_bricks

# trade features
# ore-cart bay in the back wall
fill ~9 ~1 ~10 ~11 ~4 ~10 air

say Stone Quarry T1 shell placed.
