# Smeltery - Tier 1 shell
# footprint 13 x 13, wall height 6
# builds from the player's position toward +x / +z

# clear site
fill ~-2 ~0 ~-2 ~14 ~15 ~14 air

# foundation and floor
fill ~-1 ~-1 ~-1 ~13 ~-1 ~13 blackstone
fill ~0 ~0 ~0 ~12 ~0 ~12 blackstone

# walls
fill ~0 ~1 ~0 ~12 ~6 ~12 brick_block
fill ~1 ~1 ~1 ~11 ~6 ~11 air

# corner posts
fill ~0 ~1 ~0 ~0 ~6 ~0 polished_blackstone
fill ~12 ~1 ~0 ~12 ~6 ~0 polished_blackstone
fill ~0 ~1 ~12 ~0 ~6 ~12 polished_blackstone
fill ~12 ~1 ~12 ~12 ~6 ~12 polished_blackstone

# top trim course
fill ~0 ~6 ~0 ~12 ~6 ~12 smooth_stone
fill ~1 ~6 ~1 ~11 ~6 ~11 air

# front entrance
fill ~5 ~1 ~0 ~6 ~3 ~0 air

# back door
fill ~6 ~1 ~12 ~6 ~3 ~12 air

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
fill ~1 ~1 ~5 ~11 ~5 ~5 brick_block
fill ~6 ~1 ~5 ~6 ~3 ~5 air

# roof
fill ~-1 ~7 ~-1 ~13 ~7 ~-1 brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~7 ~13 ~13 ~7 ~13 brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~7 ~0 ~-1 ~7 ~12 chiseled_polished_blackstone
fill ~13 ~7 ~0 ~13 ~7 ~12 chiseled_polished_blackstone
fill ~-1 ~8 ~0 ~13 ~8 ~0 brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~12 ~13 ~8 ~12 brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~1 ~-1 ~8 ~11 chiseled_polished_blackstone
fill ~13 ~8 ~1 ~13 ~8 ~11 chiseled_polished_blackstone
fill ~-1 ~9 ~1 ~13 ~9 ~1 brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~11 ~13 ~9 ~11 brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~2 ~-1 ~9 ~10 chiseled_polished_blackstone
fill ~13 ~9 ~2 ~13 ~9 ~10 chiseled_polished_blackstone
fill ~-1 ~10 ~2 ~13 ~10 ~2 brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~10 ~13 ~10 ~10 brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~3 ~-1 ~10 ~9 chiseled_polished_blackstone
fill ~13 ~10 ~3 ~13 ~10 ~9 chiseled_polished_blackstone
fill ~-1 ~11 ~3 ~13 ~11 ~3 brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~9 ~13 ~11 ~9 brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~4 ~-1 ~11 ~8 chiseled_polished_blackstone
fill ~13 ~11 ~4 ~13 ~11 ~8 chiseled_polished_blackstone
fill ~-1 ~12 ~4 ~13 ~12 ~4 brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~8 ~13 ~12 ~8 brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~5 ~-1 ~12 ~7 chiseled_polished_blackstone
fill ~13 ~12 ~5 ~13 ~12 ~7 chiseled_polished_blackstone
fill ~-1 ~13 ~5 ~13 ~13 ~5 brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~7 ~13 ~13 ~7 brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]

# trade features
# chimney stack
fill ~9 ~7 ~9 ~10 ~13 ~10 brick_block
fill ~9 ~7 ~9 ~10 ~12 ~10 air

say Smeltery T1 shell placed. Decorate away.
