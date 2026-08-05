/**
 * Transaction flavor table.
 * Writing pass will expand tone/variety per trade.
 */
export interface FlavorPool {
  buy: string[];
  sell: string[];
}

export const storefrontFlavor: Record<string, FlavorPool> = {
  stone_quarry: {
    buy: ["Take it before the dust settles.", "Stone's honest. Keep your footing.", "Heavy load. Fair price."],
    sell: ["Good cut. Quarry pays today.", "That stack earns its keep.", "Gruff nod. Stone accepted."],
  },
  ore_mine: {
    buy: ["Fresh haul from the shaft.", "Mind the edges on that lot.", "Iron keeps towns standing."],
    sell: ["Ore logged and weighed.", "Solid haul. Ledger likes it.", "Mine takes it. Keep digging."],
  },
  precious_mine: {
    buy: ["Bright stock, close watch.", "Handled once, priced once.", "Gold moves quietly here."],
    sell: ["Assayed and accepted.", "Shine checks out. Paid.", "Clean ingots. Good trade."],
  },
  lumber_camp: {
    buy: ["Straight cuts, dry stack.", "Camp wood burns clean.", "Take the bundle while it's dry."],
    sell: ["Raw logs go to work fast.", "Good grain. Camp buys.", "Stack's solid. Paid in full."],
  },
  crop_farm: {
    buy: ["Fresh lot from the fields.", "Farm stock rotates daily.", "Take the grain while it's warm."],
    sell: ["Clean harvest. Farm approves.", "Good weight. Paid.", "Field crew thanks you."],
  },
  sawmill: {
    buy: ["Planed smooth and ready.", "Warm boards off the line.", "Sawmill stock, no splinters promised."],
    sell: ["Raw logs go to the Lumber Camp.", "Lumber in, paid out.", "Boards start with clean logs."],
  },
  smeltery: {
    buy: ["Hot metal, careful hands.", "Smeltery run finished clean.", "Fresh iron, shelf-stable now."],
    sell: ["Ore route is the Ore Mine.", "Metal flow stays strict here.", "Smeltery pays on clean stock."],
  },
  bakery: {
    buy: ["Warm bread, mind your hands.", "Fresh batch just out.", "Bakery shelf smells like a win."],
    sell: ["Bread in, smiles out.", "Nice crumb. Paid.", "Warm loaves keep us in business."],
  },
  fishery: {
    buy: ["Cold catch, cleaned and packed.", "Net came in full this dawn.", "Fishery stock is fresh today."],
    sell: ["Good catch. Fishery pays.", "Scales checked. Accepted.", "Dock crew signs this one off."],
  },
  general_store: {
    buy: ["Welcome in. Keep what you need.", "Store shelf turns quick.", "You've got good timing today."],
    sell: ["Stock helps everyone eat.", "Good handoff. Paid.", "Store keeps moving with that."],
  },
};

export function pickStorefrontFlavor(
  trade: string,
  kind: "buy" | "sell",
  rng: () => number = Math.random
): string | undefined {
  const pool = storefrontFlavor[trade]?.[kind];
  if (!pool?.length) return undefined;
  const idx = Math.floor(rng() * pool.length);
  return pool[Math.max(0, Math.min(pool.length - 1, idx))];
}
