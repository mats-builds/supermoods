import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url: string }
    if (!url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'accept': 'image/*',
      },
    })
    if (!res.ok) return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 422 })

    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const type = res.headers.get('content-type') || 'image/jpeg'

    return NextResponse.json({ dataUrl: `data:${type};base64,${base64}` })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
