import { put } from '@vercel/blob'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Accepts extracted slide images (base64-encoded PNGs) and uploads them to Blob.
 * Returns a single JSON file URL containing all slides for the presenter to render.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const { slides, talkSlug } = await req.json() as {
      slides: string[]
      talkSlug: string
    }

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: 'No slides provided' }, { status: 400 })
    }

    if (!talkSlug) {
      return NextResponse.json({ error: 'Talk slug required' }, { status: 400 })
    }

    // Create a JSON manifest with all slide URLs
    // We'll upload individual slide images and store their URLs
    const slideUrls: string[] = []

    for (let i = 0; i < slides.length; i++) {
      const base64 = slides[i]
      const buffer = Buffer.from(base64.split(',')[1], 'base64')

      const blob = await put(`talks/${talkSlug}/slide-${i + 1}.png`, buffer, {
        access: 'public',
        contentType: 'image/png',
      })

      slideUrls.push(blob.url)
    }

    // Create a manifest JSON file with all slide URLs
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
      },
    )

    return NextResponse.json({
      url: manifestBlob.url,
      totalSlides: slideUrls.length,
    })
  } catch (error) {
    console.error('Upload slides error:', error)
    return NextResponse.json(
      { error: 'Failed to upload slides' },
      { status: 500 },
    )
  }
}
