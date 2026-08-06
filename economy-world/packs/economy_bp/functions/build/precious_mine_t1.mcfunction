# Precious Mine - Tier 1 shell
# footprint 11 x 11, wall height 6
# builds from the player's position toward +x / +z

# clear site
fill ~-3 ~0 ~-3 ~13 ~17 ~13 air

# plinth and floor
fill ~-1 ~-1 ~-1 ~11 ~-1 ~11 blackstone
fill ~-1 ~0 ~-1 ~11 ~0 ~11 blackstone
fill ~0 ~0 ~0 ~10 ~0 ~10 polished_blackstone

# base course
fill ~0 ~1 ~0 ~10 ~1 ~10 blackstone
fill ~1 ~1 ~1 ~9 ~1 ~9 air

# walls
fill ~0 ~2 ~0 ~10 ~6 ~10 polished_blackstone_bricks
fill ~1 ~2 ~1 ~9 ~6 ~9 air

# corner posts
fill ~0 ~1 ~0 ~0 ~6 ~0 polished_blackstone
fill ~10 ~1 ~0 ~10 ~6 ~0 polished_blackstone
fill ~0 ~1 ~10 ~0 ~6 ~10 polished_blackstone
fill ~10 ~1 ~10 ~10 ~6 ~10 polished_blackstone

# protruding pilasters
fill ~3 ~1 ~-1 ~3 ~6 ~-1 polished_blackstone
fill ~3 ~1 ~11 ~3 ~6 ~11 polished_blackstone
fill ~7 ~1 ~-1 ~7 ~6 ~-1 polished_blackstone
fill ~7 ~1 ~11 ~7 ~6 ~11 polished_blackstone
fill ~-1 ~1 ~3 ~-1 ~6 ~3 polished_blackstone
fill ~11 ~1 ~3 ~11 ~6 ~3 polished_blackstone
fill ~-1 ~1 ~7 ~-1 ~6 ~7 polished_blackstone
fill ~11 ~1 ~7 ~11 ~6 ~7 polished_blackstone

# overhanging eave band
fill ~-1 ~7 ~-1 ~11 ~7 ~11 gold_block
fill ~0 ~7 ~0 ~10 ~7 ~10 air

# front entrance
fill ~4 ~1 ~0 ~5 ~3 ~0 air
# door awning
fill ~3 ~4 ~-1 ~6 ~4 ~-1 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]

# back door
fill ~5 ~1 ~10 ~5 ~3 ~10 air

# windows with trim
fill ~1 ~3 ~0 ~1 ~4 ~0 glass_pane
fill ~1 ~2 ~0 ~1 ~2 ~0 gold_block
fill ~1 ~5 ~0 ~1 ~5 ~0 gold_block
fill ~2 ~3 ~0 ~2 ~4 ~0 glass_pane
fill ~2 ~2 ~0 ~2 ~2 ~0 gold_block
fill ~2 ~5 ~0 ~2 ~5 ~0 gold_block
fill ~8 ~3 ~0 ~8 ~4 ~0 glass_pane
fill ~8 ~2 ~0 ~8 ~2 ~0 gold_block
fill ~8 ~5 ~0 ~8 ~5 ~0 gold_block
fill ~9 ~3 ~0 ~9 ~4 ~0 glass_pane
fill ~9 ~2 ~0 ~9 ~2 ~0 gold_block
fill ~9 ~5 ~0 ~9 ~5 ~0 gold_block
fill ~0 ~3 ~2 ~0 ~4 ~2 glass_pane
fill ~0 ~2 ~2 ~0 ~2 ~2 gold_block
fill ~0 ~5 ~2 ~0 ~5 ~2 gold_block
fill ~10 ~3 ~2 ~10 ~4 ~2 glass_pane
fill ~10 ~2 ~2 ~10 ~2 ~2 gold_block
fill ~10 ~5 ~2 ~10 ~5 ~2 gold_block
fill ~0 ~3 ~5 ~0 ~4 ~5 glass_pane
fill ~0 ~2 ~5 ~0 ~2 ~5 gold_block
fill ~0 ~5 ~5 ~0 ~5 ~5 gold_block
fill ~10 ~3 ~5 ~10 ~4 ~5 glass_pane
fill ~10 ~2 ~5 ~10 ~2 ~5 gold_block
fill ~10 ~5 ~5 ~10 ~5 ~5 gold_block
fill ~0 ~3 ~8 ~0 ~4 ~8 glass_pane
fill ~0 ~2 ~8 ~0 ~2 ~8 gold_block
fill ~0 ~5 ~8 ~0 ~5 ~8 gold_block
fill ~10 ~3 ~8 ~10 ~4 ~8 glass_pane
fill ~10 ~2 ~8 ~10 ~2 ~8 gold_block
fill ~10 ~5 ~8 ~10 ~5 ~8 gold_block

# front-of-house / back-of-house partition
fill ~1 ~1 ~5 ~9 ~6 ~5 polished_blackstone_bricks
fill ~5 ~1 ~5 ~5 ~3 ~5 air

# roof - closed solid layers, stairs as trim only
fill ~-1 ~8 ~-1 ~11 ~8 ~11 chiseled_polished_blackstone
fill ~0 ~8 ~1 ~10 ~8 ~9 air
fill ~-1 ~8 ~-1 ~11 ~8 ~-1 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~8 ~11 ~11 ~8 ~11 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~9 ~0 ~11 ~9 ~10 chiseled_polished_blackstone
fill ~0 ~9 ~2 ~10 ~9 ~8 air
fill ~-1 ~9 ~0 ~11 ~9 ~0 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~9 ~10 ~11 ~9 ~10 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~10 ~1 ~11 ~10 ~9 chiseled_polished_blackstone
fill ~0 ~10 ~3 ~10 ~10 ~7 air
fill ~-1 ~10 ~1 ~11 ~10 ~1 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~10 ~9 ~11 ~10 ~9 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~11 ~2 ~11 ~11 ~8 chiseled_polished_blackstone
fill ~0 ~11 ~4 ~10 ~11 ~6 air
fill ~-1 ~11 ~2 ~11 ~11 ~2 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~11 ~8 ~11 ~11 ~8 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~12 ~3 ~11 ~12 ~7 chiseled_polished_blackstone
fill ~0 ~12 ~5 ~10 ~12 ~5 air
fill ~-1 ~12 ~3 ~11 ~12 ~3 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~12 ~7 ~11 ~12 ~7 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~13 ~4 ~11 ~13 ~6 chiseled_polished_blackstone
fill ~-1 ~13 ~4 ~11 ~13 ~4 polished_blackstone_brick_stairs["weirdo_direction"=3,"upside_down_bit"=false]
fill ~-1 ~13 ~6 ~11 ~13 ~6 polished_blackstone_brick_stairs["weirdo_direction"=2,"upside_down_bit"=false]
fill ~-1 ~14 ~5 ~11 ~14 ~5 chiseled_polished_blackstone

# trade features
# strongroom alcove, back-left
fill ~1 ~1 ~7 ~3 ~4 ~9 air

say Precious Mine T1 shell placed. Decorate away.
