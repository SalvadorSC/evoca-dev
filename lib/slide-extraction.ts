'use client'

import * as pdfjsLib from 'pdfjs-dist'
import JSZip from 'jszip'

// Set up the PDF.js worker.
// pdfjs-dist v4+ ships the worker as an ESM `.mjs` module — the old cdnjs
// `pdf.worker.min.js` path 404s for these versions. Resolving it from the
// installed package via import.meta.url lets the bundler serve a
// version-matched worker locally (no CDN, no version drift).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface SlideExtractionResult {
  slides: string[] // Base64-encoded PNG images
  totalSlides: number
  format: 'pptx' | 'pdf'
}

/**
 * Extract embedded images from a PPTX file.
 * PPTX is a ZIP archive; we parse the slide XMLs and extract media.
 */
async function extractPptxImages(file: File): Promise<string[]> {
  const zip = new JSZip()
  const content = await zip.loadAsync(file)

  // PPTX slide images are in ppt/media/
  const mediaPromises: Promise<{ name: string; data: Uint8Array }[]> = Promise.resolve([])

  const slides: string[] = []
  const slidePromise: Promise<void>[] = []

  // List all files in ppt/slides/slide*.xml
  for (const [path, file] of Object.entries(content.files)) {
    if (path.match(/^ppt\/slides\/slide\d+\.xml$/)) {
      slidePromise.push(
        file.async('string').then(async (xml) => {
          // Parse the slide XML to find embedded image references
          const imageMatches = xml.match(/ppt\/media\/image\d+\.\w+/g) || []
          for (const imagePath of imageMatches) {
            try {
              const imageFile = content.files[imagePath]
              if (imageFile && !imageFile.dir) {
                const imageData = await imageFile.async('arraybuffer')
                const blob = new Blob([imageData])
                const url = URL.createObjectURL(blob)
                // Convert to base64 for storage
                const reader = new FileReader()
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    slides.push(reader.result)
                  }
                }
                reader.readAsDataURL(blob)
              }
            } catch {
              // Skip images that can't be extracted
            }
          }
        }),
      )
    }
  }

  await Promise.all(slidePromise)
  return slides
}

/**
 * Render each page of a PDF as a PNG image using pdf.js.
 */
async function extractPdfPages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const slides: string[] = []
  const scale = 2 // Higher scale = higher quality

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height

      const context = canvas.getContext('2d')
      if (!context) continue

      await page.render({
        canvasContext: context,
        viewport,
      } as any).promise

      slides.push(canvas.toDataURL('image/png'))
    } catch {
      // Skip pages that fail to render
    }
  }

  return slides
}

/**
 * Extract slides from a PPTX or PDF file.
 * Returns base64-encoded images ready for Blob storage.
 */
export async function extractSlides(file: File): Promise<SlideExtractionResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'pptx') {
    const slides = await extractPptxImages(file)
    return { slides, totalSlides: slides.length, format: 'pptx' }
  } else if (ext === 'pdf') {
    const slides = await extractPdfPages(file)
    return { slides, totalSlides: slides.length, format: 'pdf' }
  } else {
    throw new Error('Unsupported file format. Use .pptx or .pdf')
  }
}
