import { put } from '@vercel/blob'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Writes a slide manifest JSON for a talk.
 *
 * The slide IMAGES are uploaded directly from the browser to Blob (via the
 * /api/talks/slides-upload-token client-upload route), so this endpoint only
 * receives the resulting URL list — a tiny payload well under the request body
 * limit. The presenter view fetches `slide_url` and renders `manifest.slides`.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const { slideUrls, talkSlug } = (await req.json()) as {
      slideUrls: string[]
      talkSlug: string
    }

    if (!slideUrls || !Array.isArray(slideUrls) || slideUrls.length === 0) {
      return NextResponse.json({ error: 'No slide URLs provided' }, { status: 400 })
    }

    if (!talkSlug) {
      return NextResponse.json({ error: 'Talk slug required' }, { status: 400 })
    }

    const manifest = {
      talkSlug,
      slides: slideUrls,
      totalSlides: slideUrls.length,
      uploadedAt: new Date().toISOString(),
    }

    const manifestBlob = await put(
      `talks/${talkSlug}/manifest.json`,
      JSON.stringify(manifest),
      {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: true,
      },
    )

    return NextResponse.json({
      url: manifestBlob.url,
      totalSlides: slideUrls.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save slides'
    console.error('[v0] Save slide manifest error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
