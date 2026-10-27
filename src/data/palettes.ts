export const palettes = [
  { id: "clay", name: "赭棕", englishName: "Clay", color: "#80523f", darkColor: "#dfaf96" },
  { id: "navy", name: "海军蓝", englishName: "Navy", color: "#345779", darkColor: "#a2c0df" },
  { id: "forest", name: "松林绿", englishName: "Forest", color: "#3f6650", darkColor: "#a4c9ae" },
  { id: "teal", name: "石板青", englishName: "Teal", color: "#396971", darkColor: "#9ac9cd" },
  { id: "olive", name: "橄榄绿", englishName: "Olive", color: "#666a3c", darkColor: "#c0c890" },
  { id: "plum", name: "梅紫", englishName: "Plum", color: "#77536a", darkColor: "#d6afc8" },
  { id: "graphite", name: "石墨灰", englishName: "Graphite", color: "#505a62", darkColor: "#bdc8d2" },
] as const;

export type PaletteId = (typeof palettes)[number]["id"];

export function isPaletteId(value: string | null): value is PaletteId {
  return palettes.some((palette) => palette.id === value);
}

export function getInitialPalette(): PaletteId {
  const requested = new URLSearchParams(window.location.search).get("palette");
  if (isPaletteId(requested)) return requested;
  try {
    const saved = window.localStorage.getItem("academic-palette");
    if (isPaletteId(saved)) return saved;
  } catch {
    /* The URL and palette buttons also work without local storage. */
  }
  return "clay";
}
