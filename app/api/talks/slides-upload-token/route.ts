import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { requireAuth } from '@/lib/auth'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Issues short-lived client-upload tokens so slide images stream directly from
 * the browser to Blob. This bypasses the ~4.5 MB serverless request body limit
 * that breaks a single large JSON POST of base64 images.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody

  try {
    // Reject anonymous callers before issuing any upload token.
    await requireAuth()

    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/png', 'image/jpeg', 'image/webp'],
        addRandomSuffix: true,
        maximumSizeInBytes: 15 * 1024 * 1024, // 15 MB per slide image
      }),
      // No-op: we collect URLs from the client `upload()` return value.
      // (This callback can't fire on localhost without a public URL anyway.)
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(json)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload token failed'
    console.error('[v0] Slides upload token error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
