# Places all ten Tier 1 shells in a 5 x 2 grid
# Stand in open flat ground with ~110 blocks of room to +x and ~50 to +z

execute positioned ~0 ~0 ~0 run function build/stone_quarry_t1
execute positioned ~22 ~0 ~0 run function build/ore_mine_t1
execute positioned ~44 ~0 ~0 run function build/precious_mine_t1
execute positioned ~66 ~0 ~0 run function build/lumber_camp_t1
execute positioned ~88 ~0 ~0 run function build/crop_farm_t1
execute positioned ~0 ~0 ~22 run function build/sawmill_t1
execute positioned ~22 ~0 ~22 run function build/smeltery_t1
execute positioned ~44 ~0 ~22 run function build/bakery_t1
execute positioned ~66 ~0 ~22 run function build/fishery_t1
execute positioned ~88 ~0 ~22 run function build/general_store_t1

say All ten Tier 1 shells placed.
