import type { PaletteId } from "./palettes";

export const artworks = {
  station: {
    title: "Gare Montparnasse (The Melancholy of Departure)",
    date: "1914",
    image: "/images/art/montparnasse.jpg",
    width: 2000,
    height: 1510,
    alt: "Giorgio de Chirico: an empty piazza, deep architectural shadows, a distant clock tower and train.",
    museum: "MoMA",
    source: "https://www.moma.org/collection/works/80538",
    credit: "© 2026 Artists Rights Society (ARS), New York / SIAE, Rome",
  },
  tower: {
    title: "The Nostalgia of the Infinite",
    date: "1912–13? (dated 1911)",
    image: "/images/art/nostalgia.jpg",
    width: 957,
    height: 2000,
    alt: "Giorgio de Chirico: a solitary tower against a deep green sky, tiny figures and long shadows.",
    museum: "MoMA",
    source: "https://www.moma.org/collection/works/78738",
    credit: "© 2026 Artists Rights Society (ARS), New York / SIAE, Rome",
  },
  street: {
    title: "Mistero e malinconia di una strada, fanciulla con cerchio",
    date: "Late 1960s replica; backdated 1948",
    image: "/images/art/street.jpg",
    width: 451,
    height: 600,
    alt: "Giorgio de Chirico: a sunlit empty street between arcades, a girl with a hoop and an open wagon.",
    museum: "Museo Carlo Bilotti",
    source:
      "https://www.museocarlobilotti.it/it/percorsi/percorsi_per_sale/sala_2/mistero_e_malinconia_di_una_strada_fanciulla_con_cerchio",
    credit:
      "Image source: Museo Carlo Bilotti, Rome. Late replica by the artist.",
  },
} as const;

export const artDesigns = [
  {
    id: "piazza",
    number: "01",
    name: "午后广场",
    english: "The Piazza",
    work: "station",
    palette: "olive",
    theme: "light",
  },
  {
    id: "tower",
    number: "02",
    name: "远方的塔",
    english: "The Distant Tower",
    work: "tower",
    palette: "teal",
    theme: "light",
  },
  {
    id: "gallery",
    number: "03",
    name: "留白画廊",
    english: "The Quiet Gallery",
    work: "street",
    palette: "clay",
    theme: "light",
  },
  {
    id: "nocturne",
    number: "04",
    name: "暮色展厅",
    english: "The Nocturne",
    work: "station",
    palette: "olive",
    theme: "dark",
  },
  {
    id: "cover",
    number: "05",
    name: "走入画中",
    english: "Inside the Painting",
    work: "station",
    palette: "forest",
    theme: "light",
  },
] as const satisfies readonly {
  id: string;
  number: string;
  name: string;
  english: string;
  work: keyof typeof artworks;
  palette: PaletteId;
  theme: "light" | "dark";
}[];

export type ArtDesignId = (typeof artDesigns)[number]["id"] | "none";

export function isArtDesignId(value: string | null): value is ArtDesignId {
  return value === "none" || artDesigns.some((design) => design.id === value);
}

export function getInitialArtDesign(): ArtDesignId {
  const requested = new URLSearchParams(window.location.search).get("art");
  if (isArtDesignId(requested)) return requested;
  try {
    const saved = window.localStorage.getItem("academic-art-design");
    if (isArtDesignId(saved)) return saved;
  } catch {
    /* The chooser works without browser storage. */
  }
  return "piazza";
}

export function getArtDesign(id: ArtDesignId) {
  return artDesigns.find((design) => design.id === id);
}
