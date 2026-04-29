import type { Product } from './types'
import { catalog } from './catalog'

export type Brand = {
  slug: string
  name: string
  tagline: string
  origin: string
  description: string
  coverImage?: string          // optional hero image
  accentColor?: string         // oklch color string
  pieceCount: number
  foundedYear?: number         // shown in logo tile
  makers?: string[]            // demo brands: match by maker in catalog
  products?: Product[]         // real brands: explicit product list
  logoFit?: 'cover' | 'contain'
}

// ─── Demo brands (products pulled from catalog by maker) ────────────────────

export const brands: Brand[] = [
  {
    slug: 'studio-palerma',
    name: 'Studio Palerma',
    tagline: 'Sculptural forms for the modern interior',
    origin: 'Milan · Italy',
    description: 'Studio Palerma was founded in 2012 by architect Luca Palerma with a singular belief: that furniture should carry the same formal rigour as architecture. Every piece begins as a drawing, resolved for weeks before a prototype is ever built. The result is a range of sofas, chairs and tables that balance taut geometry with sensory warmth — curved backs upholstered in bespoke bouclés, travertine legs cast in the studio’s own workshop.',
    accentColor: 'oklch(0.55 0.14 40)',
    foundedYear: 2012,
    makers: ['Studio Palerma'],
    pieceCount: 1,
  },
  {
    slug: 'atelier-dion',
    name: 'Atelier Dion',
    tagline: 'Art-forward objects for considered spaces',
    origin: 'Paris · France',
    description: 'Atelier Dion sits at the intersection of fine art and functional design. Founded by Isabelle Dion in a Marais courtyard, the atelier produces limited runs of mirrors, candle holders, framed works and accent furniture — each piece numbered and accompanied by a certificate of provenance. Their brass work has become a signature: hand-patinated in-house, never lacquered, meant to develop a living finish over decades.',
    accentColor: 'oklch(0.74 0.09 80)',
    foundedYear: 2009,
    makers: ['Atelier Dion'],
    pieceCount: 7,
  },
  {
    slug: 'northwood',
    name: 'Northwood',
    tagline: 'Solid wood joinery, built to outlast generations',
    origin: 'Oslo · Norway',
    description: 'Northwood was born out of frustration with flatpack. Three Norwegian cabinetmakers left a large furniture group in 2008 to open a small joinery in Grünerløkka. Every shelf, sideboard and pendant they produce is made from FSC-certified walnut, oak and ash — mortise-and-tenon jointed, finished with natural oils. Nothing is glued where it can be pinned. Nothing is pinned where it can be joined.',
    accentColor: 'oklch(0.34 0.05 50)',
    foundedYear: 2008,
    makers: ['Northwood'],
    pieceCount: 3,
  },
  {
    slug: 'casa-reni',
    name: 'Casa Reni',
    tagline: 'Mediterranean luxury in stone and linen',
    origin: 'Barcelona · Spain',
    description: 'Casa Reni draws on the textures of the Mediterranean coast — travertine quarried outside Rome, linen woven in Catalonia, steel welded in a Barcelona workshop the founders have occupied since 1997. Their dining tables are some of the most copied silhouettes in European interiors. The originals are distinguished by a hairline seam running the length of every slab, left visible as a mark of authenticity.',
    accentColor: 'oklch(0.86 0.025 75)',
    foundedYear: 1997,
    makers: ['Casa Reni'],
    pieceCount: 3,
  },
  {
    slug: 'ceramica-vera',
    name: 'Ceramica Vera',
    tagline: 'Hand-thrown ceramics, fired slowly',
    origin: 'Porto · Portugal',
    description: 'Ceramica Vera occupies a former tile factory on the outskirts of Porto. Three kilns run continuously, firing at a pace dictated by the clay rather than a production schedule. Every vase, bowl and sculptural object is thrown by hand — no moulds — which means every piece carries the fingerprints of its maker. Vera Sousa started the studio in 2003 after training at the Royal College of Art; she still throws every morning before the studio day begins.',
    accentColor: 'oklch(0.28 0.01 60)',
    foundedYear: 2003,
    makers: ['Ceramica Vera'],
    pieceCount: 2,
  },
  {
    slug: 'maison-nord',
    name: 'Maison Nord',
    tagline: 'Soft Scandinavian living, refined',
    origin: 'Copenhagen · Denmark',
    description: 'Maison Nord is a Copenhagen-based lifestyle brand with a straightforward philosophy: that a home should feel like a long exhale. Their collection spans upholstered seating, hand-woven textiles and rattan pieces, all developed with a small circle of Scandinavian craftspeople. The palette rarely strays from cream, linen and bone — colours that hold light without competing with it.',
    accentColor: 'oklch(0.94 0.018 80)',
    foundedYear: 2015,
    makers: ['Maison Cru', 'Hanssen Workshop'],
    pieceCount: 5,
  },

  // ─── Real partner brand ────────────────────────────────────────────────────
  {
    slug: 'de-machinekamer',
    name: 'De Machinekamer',
    tagline: 'Hét adres voor design meubels in Haarlem',
    origin: 'Haarlem · Netherlands',
    description: 'Sinds 2006 is De Machinekamer hét adres in Haarlem voor vintage en nieuwe design meubels en woonaccessoires. In de voormalige machinekamer van een historische fabriek presenteren wij een zorgvuldig samengestelde collectie van toonaangevende Europese merken, naast exclusieve eigen ontwerpen. Onze filosofie is eenvoudig: stukken die de tand des tijds doorstaan — in materiaal, vakmanschap en esthetiek.',
    accentColor: 'oklch(0.52 0.13 40)',
    logoFit: 'contain',
    foundedYear: 2006,
    pieceCount: 24,
    products: [
      { id: 'dmk-sofa-ronde', name: 'Model Ronde Bank', maker: 'De Machinekamer', price: '€ 2,490', category: 'Seating', src: '/assets/sofa.png', colors: ['linen', 'cream'], role: 'ground', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-sofa-tove', name: 'Model Tove Bank', maker: 'De Machinekamer', price: '€ 1,199', category: 'Seating', src: '/assets/sofa-cataline.png', colors: ['ink', 'charcoal'], role: 'ground', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-sofa-swann', name: 'Model Swann', maker: 'De Machinekamer', price: '€ 3,200', category: 'Seating', src: '/assets/sofa-fogler.png', colors: ['cream', 'bone', 'linen'], role: 'ground', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-chair-form', name: 'Form Lounge Chair', maker: 'De Machinekamer', price: '€ 1,680', category: 'Seating', src: '/assets/loungechair.png', colors: ['walnut', 'linen'], role: 'ground', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-chair-rib', name: 'Rib Eetkamerstoel', maker: 'De Machinekamer', price: '€ 945', category: 'Seating', src: '/assets/chair-olea.png', colors: ['walnut', 'cream'], role: 'ground', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-chair-wrap', name: 'Wrap Accent Chair', maker: 'De Machinekamer', price: '€ 1,140', category: 'Seating', src: '/assets/chair-jolie.png', colors: ['rust', 'linen'], role: 'ground', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-chair-sling', name: 'Sling Rotan Stoel', maker: 'De Machinekamer', price: '€ 870', category: 'Seating', src: '/assets/armchair.png', colors: ['walnut', 'clay'], role: 'ground', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-pouf-round', name: 'Ronde Poef, Linnen', maker: 'De Machinekamer', price: '€ 290', category: 'Seating', src: '/assets/ottoman.png', colors: ['linen', 'bone'], role: 'surface', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-table-oval', name: 'Ovale Eetkamertafel', maker: 'De Machinekamer', price: '€ 2,890', category: 'Tables', src: '/assets/table.png', colors: ['travertine', 'bone'], role: 'surface', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-table-side', name: 'Bijzettafel Steen', maker: 'De Machinekamer', price: '€ 590', category: 'Tables', src: '/assets/sidetable.png', colors: ['travertine', 'cream'], role: 'surface', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-sideboard-wn', name: 'Walnut Dressoir', maker: 'De Machinekamer', price: '€ 3,490', category: 'Storage', src: '/assets/sideboard.png', colors: ['walnut', 'rust'], role: 'ground', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-shelf-slim', name: 'Slim Wandrek', maker: 'De Machinekamer', price: '€ 1,750', category: 'Storage', src: '/assets/shelf.png', colors: ['walnut'], role: 'ground', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-lamp-pleated', name: 'Geplooide Vloerlamp', maker: 'De Machinekamer', price: '€ 880', category: 'Lighting', src: '/assets/lamp.png', colors: ['linen', 'brass'], role: 'standing', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-pendant-wn', name: 'Walnut Hanglamp', maker: 'De Machinekamer', price: '€ 640', category: 'Lighting', src: '/assets/pendant.png', colors: ['walnut', 'brass'], role: 'hanging', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-candles-brass', name: 'Messing Kandelaars, set', maker: 'De Machinekamer', price: '€ 210', category: 'Lighting', src: '/assets/candles.png', colors: ['brass', 'gold'], role: 'prop', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-vase-charcoal', name: 'Vaas Antraciet', maker: 'De Machinekamer', price: '€ 195', category: 'Decor', src: '/assets/vase.png', colors: ['charcoal', 'ink'], role: 'prop', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-pampas', name: 'Pampas Arrangement', maker: 'De Machinekamer', price: '€ 165', category: 'Decor', src: '/assets/pampas.png', colors: ['bone', 'jute'], role: 'standing', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-books-linen', name: 'Linnen Boeken, set van 4', maker: 'De Machinekamer', price: '€ 125', category: 'Decor', src: '/assets/books.png', colors: ['cream', 'clay'], role: 'prop', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-mirror-brass', name: 'Messing Wandspiegel', maker: 'De Machinekamer', price: '€ 790', category: 'Decor', src: '/assets/mirror.png', colors: ['brass', 'gold'], role: 'wall', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-cushions-pair', name: 'Linnen Kussens, paar', maker: 'De Machinekamer', price: '€ 160', category: 'Textiles', src: '/assets/pillows.png', colors: ['linen', 'cream'], role: 'prop', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-rug-jute', name: 'Handgeweven Jute Vloerkleed', maker: 'De Machinekamer', price: '€ 1,150', category: 'Textiles', src: '/assets/rug.png', colors: ['jute', 'cream'], role: 'floor', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-art-figure', name: 'Figure I, Ingelijst', maker: 'De Machinekamer', price: '€ 1,090', category: 'Art', src: '/assets/art.png', colors: ['bone', 'gold', 'ink'], role: 'wall', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-art-earth', name: 'Earthforms II', maker: 'De Machinekamer', price: '€ 620', category: 'Art', src: '/assets/art2.png', colors: ['terracotta', 'cream', 'clay'], role: 'wall', sourceUrl: 'https://www.demachinekamer.nl' },
      { id: 'dmk-table-coffee', name: 'Salontafel Travertijn', maker: 'De Machinekamer', price: '€ 1,490', category: 'Tables', src: '/assets/table.png', colors: ['travertine'], role: 'surface', sourceUrl: 'https://www.demachinekamer.nl' },
    ],
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns the product list for a given brand */
export function brandProducts(brand: Brand): Product[] {
  if (brand.products) return brand.products
  if (brand.makers) {
    return catalog
      .filter(p => brand.makers!.includes(p.maker))
      .map(p => ({ ...p, id: `${brand.slug}-${p.id}` }))
  }
  return []
}

/** Flat list of all brand products — used for moodboard ID resolution */
export const allBrandProducts: Product[] = brands.flatMap(brandProducts)

/** Cover image for the brand tile: first product image, or undefined */
export function brandCoverImage(brand: Brand): string | undefined {
  return brandProducts(brand)[0]?.src
}

export function getBrand(slug: string): Brand | undefined {
  return brands.find(b => b.slug === slug)
}
