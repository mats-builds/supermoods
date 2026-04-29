export type Category = "Seating" | "Tables" | "Lighting" | "Storage" | "Decor" | "Textiles" | "Art"

export type Role = "floor" | "ground" | "surface" | "hanging" | "standing" | "wall" | "prop"

export interface Product {
  id: string
  name: string
  maker: string
  price: string
  category: Category
  src: string
  colors: string[]
  role: Role
  description?: string
  gallery?: string[]
  details?: Record<string, string>
  dims?: { w: number; h: number; d?: number }
  sourceUrl?: string
}

export interface LayoutOverride {
  xPct?: number
  yPct?: number
  scale?: number
  flipX?: boolean
  z?: number
  locked?: boolean
}

export type LayoutMap = Record<string, LayoutOverride>

export const colorMap: Record<string, string> = {
  rust: "oklch(0.55 0.14 40)",
  walnut: "oklch(0.34 0.05 50)",
  travertine: "oklch(0.86 0.025 75)",
  linen: "oklch(0.94 0.018 80)",
  cream: "oklch(0.96 0.015 85)",
  brass: "oklch(0.74 0.09 80)",
  charcoal: "oklch(0.28 0.01 60)",
  ink: "oklch(0.22 0.02 50)",
  jute: "oklch(0.7 0.07 70)",
  terracotta: "oklch(0.62 0.13 40)",
  sage: "oklch(0.72 0.04 145)",
  bone: "oklch(0.92 0.012 85)",
  gold: "oklch(0.78 0.11 85)",
  clay: "oklch(0.65 0.1 50)",
}

export interface Palette {
  id: string
  name: string
  colors: string[]
}

export interface Scene {
  id: string
  name: string
  kind: "palette" | "image"
  src?: string
}

export const curatedPalettes: Palette[] = [
  { id: "rust-walnut", name: "Rust & Walnut", colors: ["rust", "walnut", "travertine", "linen", "brass"] },
  { id: "coastal", name: "Coastal Calm", colors: ["bone", "linen", "sage", "travertine", "jute"] },
  { id: "mono-warm", name: "Warm Mono", colors: ["cream", "linen", "bone", "jute", "ink"] },
  { id: "terracotta", name: "Terracotta Sun", colors: ["terracotta", "clay", "cream", "brass", "walnut"] },
  { id: "noir", name: "Noir Editorial", colors: ["ink", "charcoal", "linen", "brass", "bone"] },
]

export function generateAIPalette(productIds: string[], catalog: Product[]): Palette {
  if (productIds.length === 0) return curatedPalettes[0]
  const tally = new Map<string, number>()
  for (const id of productIds) {
    const p = catalog.find(c => c.id === id)
    if (!p) continue
    p.colors.forEach((c, i) => tally.set(c, (tally.get(c) ?? 0) + (3 - i)))
  }
  let ranked = Array.from(tally.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k)
  const neutrals = ["linen", "cream", "bone", "travertine"]
  const accents = ["brass", "gold", "rust", "terracotta"]
  if (!ranked.some(c => neutrals.includes(c))) ranked.push("linen")
  if (!ranked.some(c => accents.includes(c))) ranked.push("brass")
  return { id: "ai", name: "AI Curated", colors: ranked.slice(0, 5) }
}

export const scenes: Scene[] = [
  { id: "palette", name: "Palette", kind: "palette" },
  { id: "living", name: "Living Room", kind: "image", src: "/assets/room-living.jpg" },
  { id: "kitchen", name: "Kitchen", kind: "image", src: "/assets/room-kitchen.jpg" },
  { id: "bedroom", name: "Bedroom", kind: "image", src: "/assets/room-bedroom.jpg" },
]

export const categories: Category[] = ["Seating", "Tables", "Lighting", "Storage", "Decor", "Textiles", "Art"]

// Legacy canvas item type (used by LeadCaptureModal / API)
export interface CanvasItem {
  id: string
  product_id: string
  product: Omit<Product, 'price'> & { price: number; images: string[]; visible: boolean }
  x: number
  y: number
  width: number
  height: number
  scaleX: number
  scaleY: number
}
