# Ore Mine - Tier 1 shell
# footprint 13 x 11, wall height 6
# builds from the player's position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~15 ~17 ~13 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~13 ~-1 ~11 cobblestone
fill ~-1 ~0 ~-1 ~13 ~0 ~11 cobblestone
fill ~0 ~0 ~0 ~12 ~0 ~10 deepslate_tiles

# base course
fill ~0 ~1 ~0 ~12 ~1 ~10 cobblestone
fill ~1 ~1 ~1 ~11 ~1 ~9 air

# walls
fill ~0 ~2 ~0 ~12 ~6 ~10 cobbled_deepslate
fill ~1 ~2 ~1 ~11 ~6 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~6 ~0 polished_deepslate
fill ~12 ~1 ~0 ~12 ~6 ~0 polished_deepslate
fill ~0 ~1 ~10 ~0 ~6 ~10 polished_deepslate
fill ~12 ~1 ~10 ~12 ~6 ~10 polished_deepslate

# protruding pilasters
fill ~3 ~1 ~-1 ~3 ~6 ~-1 polished_deepslate
fill ~3 ~1 ~11 ~3 ~6 ~11 polished_deepslate
fill ~7 ~1 ~-1 ~7 ~6 ~-1 polished_deepslate
fill ~7 ~1 ~11 ~7 ~6 ~11 polished_deepslate
fill ~-1 ~1 ~3 ~-1 ~6 ~3 polished_deepslate
fill ~13 ~1 ~3 ~13 ~6 ~3 polished_deepslate
fill ~-1 ~1 ~7 ~-1 ~6 ~7 polished_deepslate
fill ~13 ~1 ~7 ~13 ~6 ~7 polished_deepslate

# overhanging eave band
fill ~-1 ~7 ~-1 ~13 ~7 ~11 polished_deepslate
fill ~0 ~7 ~0 ~12 ~7 ~10 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air
# door awning
fill ~4 ~4 ~-1 ~7 ~4 ~-1 deepslate_tile_stairs["weirdo_direction"=3,"upside_down_bit"=false]

# back door
fill ~6 ~1 ~10 ~6 ~3 ~10 air

# windows with trim
fill ~1 ~3 ~0 ~1 ~4 ~0 glass_pane
fill ~1 ~2 ~0 ~1 ~2 ~0 polished_deepslate
fill ~1 ~5 ~0 ~1 ~5 ~0 polished_deepslate
fill ~2 ~3 ~0 ~2 ~4 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~2 ~0 polished_deepslate
fill ~2 ~5 ~0 ~2 ~5 ~0 polished_deepslate
fill ~10 ~3 ~0 ~10 ~4 ~0 glass_pane
fill ~10 ~2 ~0 ~10 ~2 ~0 polished_deepslate
fill ~10 ~5 ~0 ~10 ~5 ~0 polished_deepslate
fill ~11 ~3 ~0 ~11 ~4 ~0 glass_pane
fill ~11 ~2 ~0 ~11 ~2 ~0 polished_deepslate
fill ~11 ~5 ~0 ~11 ~5 ~0 polished_deepslate
fill ~0 ~3 ~2 ~0 ~4 ~2 glass_pane
fill ~0 ~2 ~2 ~0 ~2 ~2 polished_deepslate
fill ~0 ~5 ~2 ~0 ~5 ~2 polished_deepslate
fill ~12 ~3 ~2 ~12 ~4 ~2 glass_pane
fill ~12 ~2 ~2 ~12 ~2 ~2 polished_deepslate
fill ~12 ~5 ~2 ~12 ~5 ~2 polished_deepslate
fill ~0 ~3 ~5 ~0 ~4 ~5 glass_pane
fill ~0 ~2 ~5 ~0 ~2 ~5 polished_deepslate
fill ~0 ~5 ~5 ~0 ~5 ~5 polished_deepslate
fill ~12 ~3 ~5 ~12 ~4 ~5 glass_pane
fill ~12 ~2 ~5 ~12 ~2 ~5 polished_deepslate
fill ~12 ~5 ~5 ~12 ~5 ~5 polished_deepslate
fill ~0 ~3 ~8 ~0 ~4 ~8 glass_pane
fill ~0 ~2 ~8 ~0 ~2 ~8 polished_deepslate
fill ~0 ~5 ~8 ~0 ~5 ~8 polished_deepslate
fill ~12 ~3 ~8 ~12 ~4 ~8 glass_pane
fill ~12 ~2 ~8 ~12 ~2 ~8 polished_deepslate
fill ~12 ~5 ~8 ~12 ~5 ~8 polished_deepslate

# front-of-house / back-of-house partition
fill ~1 ~1 ~5 ~11 ~6 ~5 cobbled_deepslate
fill ~6 ~1 ~5 ~6 ~3 ~5 air

# roof - closed solid layers, stairs as trim only
fill ~-1 ~8 ~-1 ~13 ~8 ~11 chiseled_deepslate
fill ~0 ~8 ~1 ~12 ~8 ~9 air
fill ~-1 ~8 ~-1 ~13 ~8 ~-1 deepslate_tile_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~11 ~13 ~8 ~11 deepslate_tile_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~0 ~13 ~9 ~10 chiseled_deepslate
fill ~0 ~9 ~2 ~12 ~9 ~8 air
fill ~-1 ~9 ~0 ~13 ~9 ~0 deepslate_tile_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~10 ~13 ~9 ~10 deepslate_tile_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~1 ~13 ~10 ~9 chiseled_deepslate
fill ~0 ~10 ~3 ~12 ~10 ~7 air
fill ~-1 ~10 ~1 ~13 ~10 ~1 deepslate_tile_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~9 ~13 ~10 ~9 deepslate_tile_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~2 ~13 ~11 ~8 chiseled_deepslate
fill ~0 ~11 ~4 ~12 ~11 ~6 air
fill ~-1 ~11 ~2 ~13 ~11 ~2 deepslate_tile_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~8 ~13 ~11 ~8 deepslate_tile_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~3 ~13 ~12 ~7 chiseled_deepslate
fill ~0 ~12 ~5 ~12 ~12 ~5 air
fill ~-1 ~12 ~3 ~13 ~12 ~3 deepslate_tile_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~7 ~13 ~12 ~7 deepslate_tile_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~4 ~13 ~13 ~6 chiseled_deepslate
fill ~-1 ~13 ~4 ~13 ~13 ~4 deepslate_tile_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~6 ~13 ~13 ~6 deepslate_tile_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~14 ~5 ~13 ~14 ~5 chiseled_deepslate

# trade features
# adit mouth in the back wall
fill ~5 ~1 ~10 ~7 ~4 ~10 air

say Ore Mine T1 shell placed. Decorate away.
