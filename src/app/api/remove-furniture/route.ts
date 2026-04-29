import { NextRequest, NextResponse } from 'next/server'

const PROMPT = `TASK: Create an unfurnished version of the input interior image. REMOVE: All loose, movable, or decorative objects, including: sofas, couches, armchairs, chairs, benches, stools, dining tables, coffee tables, side tables, desks, consoles, cabinets, sideboards, shelving units, freestanding storage, beds, cushions, throws, blankets, rugs, carpets, mats, lamps, pendant lights, chandeliers, wall lights, floor lamps, table lamps, mirrors, artwork, paintings, frames, posters, plants, vases, sculptures, books, bowls, candles, accessories, electronics, appliances, and all staging objects. KEEP: Only permanent architectural elements including walls, ceilings, floors, windows, doors, archways, fireplaces and built-in mantels, wall panels, moldings, cornices, baseboards, ceiling details, structural columns, stairs, built-in niches, and fixed architectural detailing. RECONSTRUCT: For every removed object, realistically recreate the hidden background. Continue the correct wall, floor, ceiling, trim, texture, material, shadow, reflection, and perspective. The result must look seamless and natural. STYLE: Keep the exact same room, same camera angle, same perspective, same natural lighting, same shadows, same color grading, and same architectural character. Do not redesign, modernize, simplify, or add new objects. OUTPUT: Return the edited image in the same aspect ratio as the original input image. The final image should look like a realistic empty interior photograph of the original room.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { imageDataUrl } = await req.json() as { imageDataUrl: string }
    if (!imageDataUrl) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    // Convert data URL to blob
    const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64, 'base64')

    const formData = new FormData()
    formData.append('model', 'gpt-image-1')
    formData.append('prompt', PROMPT)
    formData.append('n', '1')
    formData.append('size', '1536x1024')

    // Append image as a file
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    formData.append('image[]', blob, 'room.png')

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json({ error: err?.error?.message ?? `OpenAI error ${response.status}` }, { status: response.status })
    }

    const result = await response.json()
    const b64 = result?.data?.[0]?.b64_json
    const url = result?.data?.[0]?.url

    if (b64) return NextResponse.json({ dataUrl: `data:image/png;base64,${b64}` })
    if (url) return NextResponse.json({ url })

    return NextResponse.json({ error: 'No image in response' }, { status: 500 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
