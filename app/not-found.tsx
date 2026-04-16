"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animated dot grid — signal noise
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const GAP = 28
    let frame: number
    let t = 0

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const cols = Math.ceil(canvas.width / GAP) + 1
      const rows = Math.ceil(canvas.height / GAP) + 1

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * GAP
          const y = r * GAP
          const noise = Math.sin(c * 0.4 + t) * Math.cos(r * 0.4 - t * 0.7)
          const alpha = Math.max(0, Math.min(0.35, (noise + 1) * 0.18))
          const radius = 1 + noise * 0.8
          ctx.beginPath()
          ctx.arc(x, y, Math.max(0.5, radius), 0, Math.PI * 2)
          ctx.fillStyle = `rgba(247,224,24,${alpha})`
          ctx.fill()
        }
      }

      t += 0.018
      frame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-jsconf-bg flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Animated dot grid */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Horizontal rule top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-jsconf-border" aria-hidden="true" />
      {/* Horizontal rule bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-jsconf-border" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl w-full">

        {/* Mono tag */}
        <span className="font-mono text-xs text-jsconf-muted uppercase tracking-[0.3em] mb-8">
          Error · Signal Lost
        </span>

        {/* Giant 404 */}
        <div className="relative w-full flex items-center justify-center mb-8">
          {/* Left vertical rule */}
          <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-24 bg-jsconf-border" aria-hidden="true" />
          {/* Right vertical rule */}
          <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-24 bg-jsconf-border" aria-hidden="true" />

          <h1
            className="font-display font-bold text-white leading-none tracking-tighter"
            style={{ fontSize: "clamp(7rem, 22vw, 18rem)" }}
          >
            4
            <span style={{ color: "#F7E018" }}>0</span>
            4
          </h1>
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-jsconf-border mb-8" aria-hidden="true" />

        {/* Copy */}
        <p className="font-display font-bold text-white text-xl uppercase tracking-widest mb-3 text-balance">
          Nothing here
        </p>
        <p className="font-mono text-sm text-jsconf-muted leading-relaxed mb-10 max-w-sm text-balance">
          This page doesn&apos;t exist or was moved. Check the URL or head back to the dashboard.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-white hover:border-white transition-all duration-150"
          >
            Home
          </Link>
        </div>

        {/* EVOCA branding */}
        <span className="font-mono text-xs text-jsconf-border uppercase tracking-[0.3em] mt-16">
          EVOCA
        </span>
      </div>
    </div>
  )
}
