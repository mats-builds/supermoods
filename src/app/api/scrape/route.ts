import { NextResponse } from 'next/server'

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|avif)(\?[^"'\s]*)?/i
const IMAGE_ATTR_RE = /(?:src|data-src|data-zoom-image|content)=["']([^"']+\.(?:png|jpe?g|webp|avif)[^"']*)["']/gi
const META_OG_IMAGE_RE = /<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/gi
const META_OG_IMAGE_ALT = /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/gi
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i
const OG_TITLE_RE = /<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i
const OG_DESC_RE = /<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["']/i
const OG_SITE_RE = /<meta[^>]+(?:property|name)=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
const JSONLD_RE = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

function decode(s: string) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function absUrl(rel: string, base: string): string | undefined {
  try { return new URL(decode(rel), base).toString() } catch { return undefined }
}

function scoreImage(url: string) {
  const l = url.toLowerCase()
  let s = 0
  if (/transparent|packshot|cutout/.test(l)) s += 40
  if (/large_default|zoom|_xl|2048|1500|1200/.test(l)) s += 20
  if (/white|plain|product/.test(l)) s += 8
  if (/og.?image|share/.test(l)) s += 12
  if (/thumb|thumbnail|icon|favicon|logo|swatch|sprite|placeholder|blank|loading/.test(l)) s -= 60
  if (/room|lifestyle|ambience|inspiration/.test(l)) s -= 30
  return s
}

function extractImages(html: string, base: string): string[] {
  const set = new Set<string>()
  for (const m of html.matchAll(META_OG_IMAGE_RE)) { const u = absUrl(m[1], base); if (u) set.add(u) }
  for (const m of html.matchAll(META_OG_IMAGE_ALT)) { const u = absUrl(m[1], base); if (u) set.add(u) }
  for (const m of html.matchAll(IMAGE_ATTR_RE)) {
    for (const piece of m[1].split(',')) {
      const u = absUrl(piece.trim().split(/\s+/)[0], base)
      if (u) set.add(u)
    }
  }
  return Array.from(set).filter(u => IMAGE_EXT_RE.test(u) && scoreImage(u) > -50).sort((a, b) => scoreImage(b) - scoreImage(a))
}

type JsonLdProduct = { name?: string; brand?: string; description?: string; image?: string[]; price?: string }

function extractJsonLd(html: string): JsonLdProduct[] {
  const out: JsonLdProduct[] = []
  for (const m of html.matchAll(JSONLD_RE)) {
    try {
      const walk = (node: unknown) => {
        if (!node || typeof node !== 'object') return
        if (Array.isArray(node)) { node.forEach(walk); return }
        const o = node as Record<string, unknown>
        const t = o['@type']
        if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) {
          const imgs: string[] = []
          const img = o.image
          if (typeof img === 'string') imgs.push(img)
          else if (Array.isArray(img)) img.forEach(i => { if (typeof i === 'string') imgs.push(i) })
          let brand: string | undefined
          const b = o.brand
          if (typeof b === 'string') brand = b
          else if (b && typeof b === 'object') brand = (b as { name?: string }).name
          let price: string | undefined
          const offers = o.offers as Record<string, unknown> | undefined
          const first = Array.isArray(offers) ? offers[0] : offers
          if (first) { const p = (first as Record<string, unknown>).price; if (p != null) price = `${(first as Record<string, unknown>).priceCurrency ?? ''}${p}`.trim() }
          out.push({ name: typeof o.name === 'string' ? o.name : undefined, brand, description: typeof o.description === 'string' ? o.description : undefined, image: imgs, price })
        }
        Object.values(o).forEach(walk)
      }
      walk(JSON.parse(m[1].trim()))
    } catch { /* skip */ }
  }
  return out
}

export async function POST(req: Request) {
  try {
    const { url: rawUrl } = await req.json() as { url: string }
    if (!rawUrl?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    let url = rawUrl.trim()
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`

    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) return NextResponse.json({ error: `Could not fetch that page (${res.status})` }, { status: 422 })
    const html = await res.text()
    const finalUrl = res.url || url

    const jsonLd = extractJsonLd(html)
    const ld = jsonLd[0]
    const title = decode(html.match(OG_TITLE_RE)?.[1] || html.match(TITLE_RE)?.[1] || '')
    const desc = decode(html.match(OG_DESC_RE)?.[1] || ld?.description || '')
    const site = decode(html.match(OG_SITE_RE)?.[1] || '')
    const hostname = (() => { try { return new URL(finalUrl).hostname.replace(/^www\./, '') } catch { return '' } })()

    const name = (ld?.name || title).replace(new RegExp(`\\s*[-–—|·]\\s*${site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`, 'i'), '').trim()
    const maker = ld?.brand || site || hostname

    const images = extractImages(html, finalUrl)
    const ldImages = (ld?.image ?? []).map(i => absUrl(i, finalUrl)).filter(Boolean) as string[]
    const allImages = [...new Set([...ldImages, ...images])]

    if (!name && allImages.length === 0) {
      return NextResponse.json({ error: "Couldn't extract anything useful from that page. Try the direct product URL." }, { status: 422 })
    }

    return NextResponse.json({
      sourceUrl: finalUrl,
      name: name || 'Untitled piece',
      maker,
      price: ld?.price || '',
      description: desc || '',
      image_url: allImages[0] || '',
      gallery: allImages.slice(1, 8),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Scrape failed' }, { status: 500 })
  }
}
