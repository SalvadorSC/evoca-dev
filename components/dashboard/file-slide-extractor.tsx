'use client'

import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { extractSlides } from '@/lib/slide-extraction'
import { PDF_ENABLED, PPT_ENABLED } from '@/lib/flags'

interface FileSlideExtractorProps {
  onSlidesExtracted: (slides: string[], totalSlides: number) => void
  onError?: (error: string) => void
}

export function FileSlideExtractor({ onSlidesExtracted, onError }: FileSlideExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Neither format is available — render nothing.
  if (!PDF_ENABLED && !PPT_ENABLED) return null

  const acceptedTypes = [PPT_ENABLED && '.pptx', PDF_ENABLED && '.pdf'].filter(Boolean).join(',')
  const acceptedLabel = [PPT_ENABLED && 'PPTX', PDF_ENABLED && 'PDF'].filter(Boolean).join(' or ')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(false)
    setIsExtracting(true)

    try {
      const result = await extractSlides(file)
      onSlidesExtracted(result.slides, result.totalSlides)
      setSuccess(true)
      onError?.(null!)

      // Reset success state after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract slides'
      setError(message)
      onError?.(message)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 px-4 py-3 border border-jsconf-border cursor-pointer hover:border-jsconf-yellow transition-colors">
        <Upload className="h-4 w-4 text-jsconf-yellow" />
        <span className="font-mono text-sm text-foreground">
          {isExtracting ? 'Extracting...' : `Upload ${acceptedLabel}`}
        </span>
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          disabled={isExtracting}
          className="hidden"
        />
      </label>

      {isExtracting && (
        <div className="flex items-center gap-2 text-sm font-mono text-jsconf-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Extracting slides...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="font-mono text-xs text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <p className="font-mono text-xs text-green-300">Slides extracted successfully</p>
        </div>
      )}
    </div>
  )
}
