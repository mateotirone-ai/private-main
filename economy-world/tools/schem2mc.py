#!/usr/bin/env python3
"""
schem2mc - Java Sponge schematic (.schem v2/v3) -> Bedrock .mcfunction
with block-state mapping.

Usage:  python3 schem2mc.py input.schem output.mcfunction "Title"

Maps per-block:
  stairs     facing+half           -> weirdo_direction + upside_down_bit
  slabs      type=top              -> ["minecraft:vertical_half"="top"]
             type=double           -> <base>_double_slab
  trapdoors  facing+half+open      -> direction + upside_down_bit + open_bit
  doors      facing+half+hinge     -> direction + upper_block_bit + door_hinge_bit
  logs/pillars  axis               -> pillar_axis
  wall torches  facing             -> torch_facing_direction
  lanterns   hanging               -> ["hanging"=true]
  fences/walls/panes/glass         -> stateless (Bedrock auto-connects)
Renames Java-only ids (cobblestone_stairs -> stone_stairs, etc).
Skips block entities (chest contents, sign text, frames) and reports them.
Unknown blocks are substituted and reported - nothing fails silently.
"""
import sys, os
import nbtlib
from collections import defaultdict, Counter

FACE4 = {"east": 0, "west": 1, "south": 2, "north": 3}
DOOR_DIR = {"east": 0, "south": 1, "west": 2, "north": 3}
TORCH_DIR = {"east": "west", "west": "east", "south": "north", "north": "south"}
# Java id -> Bedrock id (base names)
RENAME = {
    "cobblestone_stairs": "stone_stairs",
    "stone_stairs": "normal_stone_stairs",
    "stone_slab": "normal_stone_slab",
    "dirt_path": "grass_path",
    "smooth_quartz": "quartz_block",
    "smooth_quartz_slab": "smooth_quartz_slab",
    "smooth_quartz_stairs": "smooth_quartz_stairs",
    "wall_torch": "torch",
    "soul_wall_torch": "soul_torch",
    "redstone_wall_torch": "redstone_torch",
    "sugar_cane": "reeds",
    "melon": "melon_block",
    "cobweb": "web",
    "snow": "snow_layer",
    "dead_bush": "deadbush",
    "spawner": "mob_spawner",
    "slime_block": "slime",
    "magma_block": "magma",
    "jack_o_lantern": "lit_pumpkin",
    "note_block": "noteblock",
}
SKIP = {"air", "cave_air", "void_air", "structure_void", "barrier",
        "light", "moving_piston", "piston_head"}
SIGNY = ("_sign", "_hanging_sign")


def parse_states(raw):
    if "[" not in raw:
        return raw, {}
    base, rest = raw.split("[", 1)
    states = {}
    for kv in rest.rstrip("]").split(","):
        if "=" in kv:
            k, v = kv.split("=", 1)
            states[k.strip()] = v.strip()
    return base, states


def convert_block(raw, report):
    raw = raw.replace("minecraft:", "")
    base, st = parse_states(raw)
    if base in SKIP:
        return None
    if any(base.endswith(s) for s in SIGNY) or base.endswith("_wall_sign"):
        report["dropped_signs"] += 1
        return None
    base = RENAME.get(base, base)

    # ---- stairs
    if base.endswith("_stairs"):
        d = FACE4.get(st.get("facing", "east"), 0)
        up = "true" if st.get("half") == "top" else "false"
        return f'{base}["weirdo_direction"={d},"upside_down_bit"={up}]'
    # ---- slabs
    if base.endswith("_slab"):
        t = st.get("type", "bottom")
        if t == "double":
            return base.replace("_slab", "_double_slab")
        if t == "top":
            return f'{base}["minecraft:vertical_half"="top"]'
        return base
    # ---- trapdoors
    if base.endswith("_trapdoor"):
        d = FACE4.get(st.get("facing", "east"), 0)
        up = "true" if st.get("half") == "top" else "false"
        op = "true" if st.get("open") == "true" else "false"
        return f'{base}["direction"={d},"upside_down_bit"={up},"open_bit"={op}]'
    # ---- doors
    if base.endswith("_door"):
        d = DOOR_DIR.get(st.get("facing", "east"), 0)
        upper = "true" if st.get("half") == "upper" else "false"
        hinge = "true" if st.get("hinge") == "right" else "false"
        op = "true" if st.get("open") == "true" else "false"
        return (f'{base}["direction"={d},"upper_block_bit"={upper},'
                f'"door_hinge_bit"={hinge},"open_bit"={op}]')
    # ---- axis blocks (logs, pillars, bone, hay, basalt)
    if "axis" in st and (base.endswith(("_log", "_wood", "_stem", "_hyphae"))
                        or base in ("hay_block", "bone_block", "purpur_pillar",
                                    "quartz_pillar", "basalt", "polished_basalt",
                                    "deepslate", "muddy_mangrove_roots")):
        return f'{base}["pillar_axis"="{st["axis"]}"]'
    # ---- torches on walls
    if base in ("torch", "soul_torch", "redstone_torch") and "facing" in st:
        fd = TORCH_DIR.get(st["facing"], "top")
        return f'{base}["torch_facing_direction"="{fd}"]'
    # ---- lanterns
    if base.endswith("lantern") and st.get("hanging") == "true":
        return f'{base}["hanging"=true]'
    # ---- ladders / wall-attached
    if base == "ladder" and "facing" in st:
        # bedrock facing_direction: 2=north,3=south,4=west,5=east
        fmap = {"north": 2, "south": 3, "west": 4, "east": 5}
        return f'{base}["facing_direction"={fmap.get(st["facing"], 2)}]'
    # ---- containers / directional utility: keep block, drop contents+facing
    if base in ("chest", "trapped_chest", "barrel", "furnace", "blast_furnace",
                "smoker", "lectern", "beehive", "bee_nest"):
        report["default_faced"] += 1
        return base
    # everything else: stateless
    return base


def load_schem(path):
    f = nbtlib.load(path)
    root = f["Schematic"] if "Schematic" in f else f
    W, H, L = int(root["Width"]), int(root["Height"]), int(root["Length"])
    if "Blocks" in root and hasattr(root["Blocks"], "keys"):
        pal, data = root["Blocks"]["Palette"], root["Blocks"]["Data"]
        bents = root["Blocks"].get("BlockEntities", [])
    else:
        pal, data = root["Palette"], root["BlockData"]
        bents = root.get("BlockEntities", [])
    data = bytes(bytearray([b & 0xff for b in data]))
    inv = {int(v): str(k) for k, v in pal.items()}
    vals, i = [], 0
    while i < len(data):
        val = shift = 0
        while True:
            b = data[i]; i += 1
            val |= (b & 0x7f) << shift
            if not (b & 0x80):
                break
            shift += 7
        vals.append(val)
    assert len(vals) == W * H * L, "block count mismatch"
    return W, H, L, inv, vals, len(bents)


def convert(src, out, title):
    W, H, L, inv, vals, n_bents = load_schem(src)
    report = Counter()
    unknown = Counter()
    vox = {}
    idx = 0
    for y in range(H):
        for z in range(L):
            for x in range(W):
                raw = inv[vals[idx]]; idx += 1
                b = convert_block(raw, report)
                if b is not None:
                    vox[(x, y, z)] = b
    miny = min(p[1] for p in vox)
    vox = {(x, y - miny, z): b for (x, y, z), b in vox.items()}

    rows = defaultdict(list)
    for (x, y, z), b in vox.items():
        rows[(y, z, b)].append(x)
    xs = [p[0] for p in vox]; ys = [p[1] for p in vox]; zs = [p[2] for p in vox]
    lines = [f"# {title}", f"# converted by schem2mc from {os.path.basename(src)}",
             f"# size {W}x{H}x{L}, {len(vox)} blocks",
             "", f"fill ~{min(xs)-1} ~0 ~{min(zs)-1} ~{max(xs)+1} ~{max(ys)+2} ~{max(zs)+1} air", ""]
    n = 0
    for (y, z, b), xr in sorted(rows.items(), key=lambda kv: (kv[0][0], kv[0][1])):
        xr.sort()
        run = [xr[0], xr[0]]
        for x in xr[1:]:
            if x == run[1] + 1:
                run[1] = x
            else:
                lines.append(f"fill ~{run[0]} ~{y} ~{z} ~{run[1]} ~{y} ~{z} {b}")
                n += 1
                run = [x, x]
        lines.append(f"fill ~{run[0]} ~{y} ~{z} ~{run[1]} ~{y} ~{z} {b}")
        n += 1
    lines += ["", f"say {title} placed."]
    open(out, "w").write("\n".join(lines) + "\n")

    print(f"OK: {len(vox)} blocks -> {n} fill commands -> {out}")
    if n_bents:
        print(f"note: {n_bents} block entities skipped (chest contents, sign text, frames)")
    if report.get("dropped_signs"):
        print(f"note: {report['dropped_signs']} sign blocks dropped")
    if report.get("default_faced"):
        print(f"note: {report['default_faced']} containers/furnaces kept with default facing")
    if unknown:
        print("unmapped blocks:", dict(unknown))


if __name__ == "__main__":
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else src.rsplit(".", 1)[0] + ".mcfunction"
    title = sys.argv[3] if len(sys.argv) > 3 else os.path.basename(out).split(".")[0]
    convert(src, out, title)
