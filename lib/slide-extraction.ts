'use client'

import JSZip from 'jszip'

/**
 * Lazily load pdf.js in the browser only.
 *
 * pdf.js evaluates `new DOMMatrix()` at module-import time (see canvas.js),
 * which is a browser-only API. Importing it at the top level would crash
 * server-side rendering with "DOMMatrix is not defined" — even though this
 * module is marked 'use client', Next.js still evaluates client modules on the
 * server during SSR. Deferring the import to call-time keeps it client-only.
 *
 * pdfjs-dist v4+ ships the worker as an ESM `.mjs` module, so we resolve it
 * from the installed package via import.meta.url. The bundler then serves a
 * version-matched worker locally (no CDN, no version drift).
 */
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString()
      return pdfjsLib
    })
  }
  return pdfjsPromise
}

export interface SlideExtractionResult {
  slides: string[] // Base64-encoded PNG images
  totalSlides: number
  format: 'pptx' | 'pdf'
}

/**
 * Extract embedded images from a PPTX file.
 * PPTX is a ZIP archive; we parse the slide XMLs and extract media.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Failed to read image'))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function extractPptxImages(file: File): Promise<string[]> {
  const zip = new JSZip()
  const content = await zip.loadAsync(file)

  // Preserve slide order: sort slideN.xml numerically.
  const slidePaths = Object.keys(content.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0)
      const nb = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0)
      return na - nb
    })

  const slides: string[] = []

  for (const path of slidePaths) {
    const xml = await content.files[path].async('string')
    // Parse the slide XML to find embedded image references
    const imageMatches = xml.match(/ppt\/media\/image\d+\.\w+/g) || []
    for (const imagePath of imageMatches) {
      try {
        const imageFile = content.files[imagePath]
        if (imageFile && !imageFile.dir) {
          const imageData = await imageFile.async('blob')
          // Await the conversion so the slide is actually collected before we return.
          slides.push(await blobToDataUrl(imageData))
        }
      } catch {
        // Skip images that can't be extracted
      }
    }
  }

  return slides
}

/**
 * Render each page of a PDF as a PNG image using pdf.js.
 */
async function extractPdfPages(file: File): Promise<string[]> {
  const pdfjsLib = await getPdfjs()
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
