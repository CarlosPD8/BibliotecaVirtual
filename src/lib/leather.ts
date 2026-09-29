import { hashString } from "./random";

// Bookbinding leathers. Deep, desaturated tones so the gold tooling reads.
export const LEATHERS = [
  "#5b1c1c", // oxblood
  "#213b2e", // bottle green
  "#1d2742", // navy
  "#6a3a1f", // cognac
  "#2b1d16", // dark calf
  "#3e2035", // aubergine
  "#4a4527", // olive
  "#1a1715", // black morocco
  "#7a2e22", // brick
  "#284048", // slate teal
] as const;

export function leatherFor(id: string, stored?: string | null): string {
  if (stored) return stored;
  return LEATHERS[hashString(id) % LEATHERS.length];
}
