"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { ReactTab } from "@/components/attendee/react-tab"
import { AskTab } from "@/components/attendee/ask-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AppState, ClientMessage } from "@/lib/types"

// ─── Phone Frame ──────────────────────────────────────────────────────────────
// The pure chrome shell — notch, border, home bar. Accepts children as screen.
export function PhoneFrame({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`relative w-[260px] h-[520px] rounded-[2.5rem] border-4 border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden ${className}`}
      style={style}
    >
      {/* Top notch */}
      <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[72px] h-[20px] bg-black rounded-full z-10" />

      {/* Screen area */}
      <div className="h-full flex flex-col rounded-[2rem] bg-jsconf-bg overflow-hidden p-2">
        {children}
      </div>

      {/* Home bar */}
      <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-[80px] h-[4px] bg-white/30 rounded-full z-10" />
    </div>
  )
}

// ─── Demo Phone Mockup ────────────────────────────────────────────────────────
// Live version used in /demo — connected to PartyKit, tab synced with wall.
export function DemoPhoneMockup({
  send,
  questions,
  qrUrl,
  activeTab,
  onTabChange,
}: {
  send: (m: ClientMessage) => void
  questions: AppState["questions"]
  qrUrl: string
  activeTab: "wall" | "qa"
  onTabChange: (tab: "wall" | "qa") => void
}) {
  const phoneTab = activeTab === "wall" ? "react" : "ask"

  return (
    <div className="flex items-start gap-6">
      {/* Phone frame */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <p className="font-mono text-xs text-jsconf-muted uppercase tracking-widest">Attendee View</p>
        <PhoneFrame>
          {/* Status bar */}
          <div className="shrink-0 bg-jsconf-bg flex items-center justify-between px-5 pt-6 pb-1 z-10" />

          {/* Tabs — controlled by shared activeTab */}
          <Tabs
            value={phoneTab}
            onValueChange={(v) => onTabChange(v === "react" ? "wall" : "qa")}
            className="flex-1 flex flex-col min-h-0 px-1"
          >
            <div
              style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }}
              className="shrink-0"
            >
              <TabsList className="grid w-full grid-cols-2 bg-jsconf-surface border border-jsconf-border rounded-none h-auto p-0 mb-0">
                <TabsTrigger
                  value="react"
                  className="rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black font-display font-bold uppercase tracking-wide py-2.5 text-xs"
                >
                  React
                </TabsTrigger>
                <TabsTrigger
                  value="ask"
                  className="rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black font-display font-bold uppercase tracking-wide py-2.5 text-xs"
                >
                  Ask
                </TabsTrigger>
              </TabsList>
            </div>

            {/* React tab: no scroll */}
            <TabsContent value="react" className="mt-0 flex-1 min-h-0">
              <div
                style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }}
                className="pb-4"
              >
                <ReactTab send={send} />
              </div>
            </TabsContent>

            {/* Ask tab: scrollable, no scrollbar */}
            <TabsContent
              value="ask"
              className="mt-0 flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <div
                style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }}
                className="pb-8"
              >
                <AskTab send={send} questions={questions} />
              </div>
            </TabsContent>
          </Tabs>
        </PhoneFrame>
      </div>

      {/* QR Code */}
      {qrUrl && (
        <div className="flex flex-col items-center gap-2 pt-8">
          <div className="bg-white p-2 rounded">
            <QRCodeSVG value={qrUrl} size={72} />
          </div>
          <p className="font-mono text-[10px] text-jsconf-muted leading-relaxed text-center max-w-[80px]">
            Scan to try on your phone
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Static Phone Mockup ──────────────────────────────────────────────────────
// Self-contained version for the landing page — no PartyKit, 3D transform.
export function StaticPhoneMockup({ role }: { role: "speaker" | "organizer" }) {
  const [activeTab, setActiveTab] = useState<"react" | "ask">("react")
  const [inputText, setInputText] = useState("")
  const [reaction, setReaction] = useState("🔥")
  const [qrUrl, setQrUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(window.location.origin + "/demo")
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 w-full overflow-hidden">
      <div className="flex flex-col md:flex-col items-center md:items-start gap-12">
        {/* Phone with 3D transform */}
        <div
          className="relative transition-transform duration-500 hover:scale-105 cursor-pointer"
          style={{ transform: "perspective(1000px) rotateY(-15deg) rotateX(5deg)" }}
        >
          {/* Phone shell — slightly larger for the landing 3D effect */}
          <div
            className="relative border-[6px] border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
            style={{
              borderRadius: "40px",
              boxShadow: "0 0 0 1px #111, inset 0 0 0 1px #333",
              width: "280px",
              height: "560px",
            }}
          >
            {/* Notch */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bg-zinc-900 z-20"
              style={{ top: "14px", width: "72px", height: "6px", borderRadius: "3px" }}
            />

            {/* Screen */}
            <div
              className="overflow-hidden bg-zinc-950 flex flex-col relative z-10"
              style={{ borderRadius: "32px", margin: "8px", height: "calc(100% - 16px)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-8 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">EVOCA</span>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                  </span>
                  <span className="font-mono text-zinc-500" style={{ fontSize: "10px" }}>LIVE</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border border-zinc-800 mx-4 mb-4 rounded-sm overflow-hidden shrink-0">
                <button
                  onClick={() => setActiveTab("react")}
                  className={`flex-1 py-2 text-center font-mono text-xs font-bold transition-colors ${
                    activeTab === "react" ? "bg-yellow-400 text-black" : "bg-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  React
                </button>
                <div className="bg-zinc-800" style={{ width: "1px" }} />
                <button
                  onClick={() => setActiveTab("ask")}
                  className={`flex-1 py-2 text-center font-mono text-xs font-bold transition-colors ${
                    activeTab === "ask" ? "bg-yellow-400 text-black" : "bg-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Ask
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 px-4 flex flex-col min-h-0">
                {activeTab === "react" ? (
                  <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <div className="mb-4 shrink-0">
                      <input
                        type="text"
                        placeholder="Your Name (Optional)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2 mb-4 shrink-0">
                      {["🔥", "👏", "🤯", "🚀", "😂"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setReaction(emoji)}
                          className={`aspect-square flex items-center justify-center text-lg border rounded-lg transition-all ${
                            reaction === emoji
                              ? "border-yellow-400 bg-yellow-400/10 scale-110"
                              : "border-zinc-800 bg-transparent hover:border-zinc-600"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="mt-auto mb-6 shrink-0">
                      <button className="w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wide bg-yellow-400 text-black hover:bg-yellow-500 transition-transform active:scale-95">
                        Send {reaction}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <div className="mb-4 flex-1 flex flex-col min-h-0">
                      <textarea
                        placeholder="What's on your mind? Ask the speaker a question..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-3 font-mono text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-yellow-400 transition-colors"
                      />
                    </div>
                    <div className="mt-auto mb-6 shrink-0">
                      <button
                        disabled={!inputText.trim()}
                        className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wide transition-all active:scale-95 ${
                          inputText.trim()
                            ? "bg-yellow-400 text-black hover:bg-yellow-500"
                            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        }`}
                      >
                        Submit Question
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Home bar */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bg-zinc-700"
                style={{ bottom: "10px", width: "80px", height: "4px", borderRadius: "2px" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
