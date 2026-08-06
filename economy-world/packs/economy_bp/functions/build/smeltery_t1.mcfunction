# Smeltery - Tier 1 shell
# footprint 13 x 13, wall height 7
# builds from the player's position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~15 ~19 ~15 air

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

# protruding pilasters
fill ~3 ~1 ~-1 ~3 ~7 ~-1 polished_blackstone
fill ~3 ~1 ~13 ~3 ~7 ~13 polished_blackstone
fill ~7 ~1 ~-1 ~7 ~7 ~-1 polished_blackstone
fill ~7 ~1 ~13 ~7 ~7 ~13 polished_blackstone
fill ~-1 ~1 ~3 ~-1 ~7 ~3 polished_blackstone
fill ~13 ~1 ~3 ~13 ~7 ~3 polished_blackstone
fill ~-1 ~1 ~7 ~-1 ~7 ~7 polished_blackstone
fill ~13 ~1 ~7 ~13 ~7 ~7 polished_blackstone

# overhanging eave band
fill ~-1 ~8 ~-1 ~13 ~8 ~13 smooth_stone
fill ~0 ~8 ~0 ~12 ~8 ~12 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air
# door awning
fill ~4 ~4 ~-1 ~7 ~4 ~-1 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]

# back door
fill ~6 ~1 ~12 ~6 ~3 ~12 air

# windows with trim
fill ~1 ~3 ~0 ~1 ~4 ~0 glass_pane
fill ~1 ~2 ~0 ~1 ~2 ~0 smooth_stone
fill ~1 ~5 ~0 ~1 ~5 ~0 smooth_stone
fill ~2 ~3 ~0 ~2 ~4 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~2 ~0 smooth_stone
fill ~2 ~5 ~0 ~2 ~5 ~0 smooth_stone
fill ~10 ~3 ~0 ~10 ~4 ~0 glass_pane
fill ~10 ~2 ~0 ~10 ~2 ~0 smooth_stone
fill ~10 ~5 ~0 ~10 ~5 ~0 smooth_stone
fill ~11 ~3 ~0 ~11 ~4 ~0 glass_pane
fill ~11 ~2 ~0 ~11 ~2 ~0 smooth_stone
fill ~11 ~5 ~0 ~11 ~5 ~0 smooth_stone
fill ~0 ~3 ~2 ~0 ~4 ~2 glass_pane
fill ~0 ~2 ~2 ~0 ~2 ~2 smooth_stone
fill ~0 ~5 ~2 ~0 ~5 ~2 smooth_stone
fill ~12 ~3 ~2 ~12 ~4 ~2 glass_pane
fill ~12 ~2 ~2 ~12 ~2 ~2 smooth_stone
fill ~12 ~5 ~2 ~12 ~5 ~2 smooth_stone
fill ~0 ~3 ~5 ~0 ~4 ~5 glass_pane
fill ~0 ~2 ~5 ~0 ~2 ~5 smooth_stone
fill ~0 ~5 ~5 ~0 ~5 ~5 smooth_stone
fill ~12 ~3 ~5 ~12 ~4 ~5 glass_pane
fill ~12 ~2 ~5 ~12 ~2 ~5 smooth_stone
fill ~12 ~5 ~5 ~12 ~5 ~5 smooth_stone
fill ~0 ~3 ~8 ~0 ~4 ~8 glass_pane
fill ~0 ~2 ~8 ~0 ~2 ~8 smooth_stone
fill ~0 ~5 ~8 ~0 ~5 ~8 smooth_stone
fill ~12 ~3 ~8 ~12 ~4 ~8 glass_pane
fill ~12 ~2 ~8 ~12 ~2 ~8 smooth_stone
fill ~12 ~5 ~8 ~12 ~5 ~8 smooth_stone

# front-of-house / back-of-house partition
fill ~1 ~1 ~5 ~11 ~7 ~5 brick_block
fill ~6 ~1 ~5 ~6 ~3 ~5 air

# roof - closed solid layers, stairs as trim only
fill ~-1 ~9 ~-1 ~13 ~9 ~13 chiseled_polished_blackstone
fill ~0 ~9 ~1 ~12 ~9 ~11 air
fill ~-1 ~9 ~-1 ~13 ~9 ~-1 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~13 ~13 ~9 ~13 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~0 ~13 ~10 ~12 chiseled_polished_blackstone
fill ~0 ~10 ~2 ~12 ~10 ~10 air
fill ~-1 ~10 ~0 ~13 ~10 ~0 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~12 ~13 ~10 ~12 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~1 ~13 ~11 ~11 chiseled_polished_blackstone
fill ~0 ~11 ~3 ~12 ~11 ~9 air
fill ~-1 ~11 ~1 ~13 ~11 ~1 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~11 ~13 ~11 ~11 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~2 ~13 ~12 ~10 chiseled_polished_blackstone
fill ~0 ~12 ~4 ~12 ~12 ~8 air
fill ~-1 ~12 ~2 ~13 ~12 ~2 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~10 ~13 ~12 ~10 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~3 ~13 ~13 ~9 chiseled_polished_blackstone
fill ~0 ~13 ~5 ~12 ~13 ~7 air
fill ~-1 ~13 ~3 ~13 ~13 ~3 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~9 ~13 ~13 ~9 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~14 ~4 ~13 ~14 ~8 chiseled_polished_blackstone
fill ~0 ~14 ~6 ~12 ~14 ~6 air
fill ~-1 ~14 ~4 ~13 ~14 ~4 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~14 ~8 ~13 ~14 ~8 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~15 ~5 ~13 ~15 ~7 chiseled_polished_blackstone
fill ~-1 ~15 ~5 ~13 ~15 ~5 brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~15 ~7 ~13 ~15 ~7 brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~16 ~6 ~13 ~16 ~6 chiseled_polished_blackstone

# trade features
# chimney stack
fill ~9 ~8 ~9 ~10 ~15 ~10 brick_block

say Smeltery T1 shell placed. Decorate away.
