# Precious Mine - Tier 1 shell
# footprint 11 x 11, wall height 5
# builds from the player's position toward +x / +z

# clear site
fill ~-2 ~0 ~-2 ~12 ~13 ~12 air

# foundation and floor
fill ~-1 ~-1 ~-1 ~11 ~-1 ~11 polished_blackstone
fill ~0 ~0 ~0 ~10 ~0 ~10 polished_blackstone

# walls
fill ~0 ~1 ~0 ~10 ~5 ~10 polished_blackstone_bricks
fill ~1 ~1 ~1 ~9 ~5 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~5 ~0 polished_blackstone
fill ~10 ~1 ~0 ~10 ~5 ~0 polished_blackstone
fill ~0 ~1 ~10 ~0 ~5 ~10 polished_blackstone
fill ~10 ~1 ~10 ~10 ~5 ~10 polished_blackstone

# top trim course
fill ~0 ~5 ~0 ~10 ~5 ~10 gold_block
fill ~1 ~5 ~1 ~9 ~5 ~9 air

# front entrance
fill ~4 ~1 ~0 ~5 ~3 ~0 air

# back door
fill ~5 ~1 ~10 ~5 ~3 ~10 air

# windows
fill ~1 ~2 ~0 ~1 ~3 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~3 ~0 glass_pane
fill ~8 ~2 ~0 ~8 ~3 ~0 glass_pane
fill ~9 ~2 ~0 ~9 ~3 ~0 glass_pane
fill ~0 ~2 ~2 ~0 ~3 ~2 glass_pane
fill ~10 ~2 ~2 ~10 ~3 ~2 glass_pane
fill ~0 ~2 ~5 ~0 ~3 ~5 glass_pane
fill ~10 ~2 ~5 ~10 ~3 ~5 glass_pane
fill ~0 ~2 ~8 ~0 ~3 ~8 glass_pane
fill ~10 ~2 ~8 ~10 ~3 ~8 glass_pane

# front-of-house / back-of-house partition
fill ~1 ~1 ~5 ~9 ~4 ~5 polished_blackstone_bricks
fill ~5 ~1 ~5 ~5 ~3 ~5 air

# roof
fill ~-1 ~6 ~-1 ~11 ~6 ~-1 polished_blackstone_brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~6 ~11 ~11 ~6 ~11 polished_blackstone_brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~6 ~0 ~-1 ~6 ~10 chiseled_polished_blackstone
fill ~11 ~6 ~0 ~11 ~6 ~10 chiseled_polished_blackstone
fill ~-1 ~7 ~0 ~11 ~7 ~0 polished_blackstone_brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~7 ~10 ~11 ~7 ~10 polished_blackstone_brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~7 ~1 ~-1 ~7 ~9 chiseled_polished_blackstone
fill ~11 ~7 ~1 ~11 ~7 ~9 chiseled_polished_blackstone
fill ~-1 ~8 ~1 ~11 ~8 ~1 polished_blackstone_brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~9 ~11 ~8 ~9 polished_blackstone_brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~8 ~2 ~-1 ~8 ~8 chiseled_polished_blackstone
fill ~11 ~8 ~2 ~11 ~8 ~8 chiseled_polished_blackstone
fill ~-1 ~9 ~2 ~11 ~9 ~2 polished_blackstone_brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~8 ~11 ~9 ~8 polished_blackstone_brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~3 ~-1 ~9 ~7 chiseled_polished_blackstone
fill ~11 ~9 ~3 ~11 ~9 ~7 chiseled_polished_blackstone
fill ~-1 ~10 ~3 ~11 ~10 ~3 polished_blackstone_brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~7 ~11 ~10 ~7 polished_blackstone_brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~4 ~-1 ~10 ~6 chiseled_polished_blackstone
fill ~11 ~10 ~4 ~11 ~10 ~6 chiseled_polished_blackstone
fill ~-1 ~11 ~4 ~11 ~11 ~4 polished_blackstone_brick_stairs ["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~6 ~11 ~11 ~6 polished_blackstone_brick_stairs ["weirdo_direction"=2,"upside_down_bit"=false]

# trade features
# strongroom alcove, back-left
fill ~1 ~1 ~7 ~3 ~3 ~9 air

say [build] Precious Mine T1 shell placed. Decorate away.
