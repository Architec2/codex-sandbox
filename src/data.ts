export type BlockId =
  | "grass"
  | "soil"
  | "stone"
  | "sand"
  | "water"
  | "wood"
  | "leaves"
  | "pinkCrystal"
  | "blueCrystal";
export const BLOCKS: Record<
  BlockId,
  { name: string; color: number; solid: boolean; drop?: string }
> = {
  grass: { name: "Meadow Grass", color: 0x72c86b, solid: true, drop: "soil" },
  soil: { name: "Soft Soil", color: 0x996348, solid: true },
  stone: { name: "Moonstone", color: 0x8d91a5, solid: true },
  sand: { name: "Star Sand", color: 0xe6cf91, solid: true },
  water: { name: "Sparkle Water", color: 0x63b9dd, solid: false },
  wood: { name: "Twilight Wood", color: 0x9a6047, solid: true },
  leaves: { name: "Blossom Leaves", color: 0x78b66f, solid: true },
  pinkCrystal: { name: "Pink Crystal", color: 0xff69bd, solid: true },
  blueCrystal: { name: "Blue Crystal", color: 0x62c7ff, solid: true },
};
export type ItemId =
  | BlockId
  | "planks"
  | "sticks"
  | "wand"
  | "stoneTool"
  | "rabbitTreat";
export const ITEMS: Record<ItemId, { name: string; icon: string }> = {
  grass: { name: "Meadow Grass", icon: "🌿" },
  soil: { name: "Soft Soil", icon: "🟫" },
  stone: { name: "Moonstone", icon: "🪨" },
  sand: { name: "Star Sand", icon: "🟨" },
  water: { name: "Sparkle Water", icon: "💧" },
  wood: { name: "Twilight Wood", icon: "🪵" },
  leaves: { name: "Blossom Leaves", icon: "🍃" },
  pinkCrystal: { name: "Pink Crystal", icon: "💗" },
  blueCrystal: { name: "Blue Crystal", icon: "💎" },
  planks: { name: "Wood Planks", icon: "🟧" },
  sticks: { name: "Twinkle Sticks", icon: "🥢" },
  wand: { name: "Wooden Wand", icon: "🪄" },
  stoneTool: { name: "Stone Trowel", icon: "⛏️" },
  rabbitTreat: { name: "Rabbit Treat", icon: "🥬" },
};
export const RECIPES = [
  { out: "planks" as ItemId, n: 4, needs: { wood: 1 } },
  { out: "sticks" as ItemId, n: 4, needs: { planks: 2 } },
  {
    out: "wand" as ItemId,
    n: 1,
    needs: { sticks: 2, planks: 1, pinkCrystal: 1 },
  },
  { out: "stoneTool" as ItemId, n: 1, needs: { sticks: 2, stone: 3 } },
  { out: "rabbitTreat" as ItemId, n: 1, needs: { leaves: 2, blueCrystal: 1 } },
] as const;
export const PRESETS = {
  VeryLow: { distance: 18, scale: 0.7 },
  Low: { distance: 24, scale: 0.85 },
  Medium: { distance: 32, scale: 1 },
};
