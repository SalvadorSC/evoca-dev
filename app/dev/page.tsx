"use client"

import { useState, useEffect, useMemo } from "react"
import { useParty } from "@/hooks/use-party"
import type { Attendance } from "@/lib/types"

export default function DevDashboard() {
  const { state, send, connectionCount, isConnected } = useParty()
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [timeSinceSync, setTimeSinceSync] = useState<number>(0)
  const [rawJsonExpanded, setRawJsonExpanded] = useState(false)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const [wipeConfirm, setWipeConfirm] = useState(false)

  // Track last sync time
  useEffect(() => {
    setLastSyncTime(Date.now())
  }, [state])

  // Update time since sync counter every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSyncTime) {
        setTimeSinceSync(Date.now() - lastSyncTime)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lastSyncTime])

  // Ensure attendance is an array
  const safeAttendance = Array.isArray(state.attendance) ? state.attendance : []

  // Group attendance by session
  const attendanceBySession = useMemo(() => {
    const map = new Map<string, { going: Attendance[]; maybe: Attendance[] }>()
    safeAttendance.forEach((a) => {
      if (!map.has(a.sessionId)) {
        map.set(a.sessionId, { going: [], maybe: [] })
      }
      const group = map.get(a.sessionId)!
      if (a.status === "going") {
        group.going.push(a)
      } else if (a.status === "maybe") {
        group.maybe.push(a)
      }
    })
    return map
  }, [safeAttendance])

  // Count flags per message
  const flagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    state.reactions.forEach((r) => {
      if (r.flags > 0) {
        counts.set(r.id, r.flags)
      }
    })
    return counts
  }, [state.reactions])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(state, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWipeDB = () => {
    if (!wipeConfirm) {
      setWipeConfirm(true)
      setTimeout(() => setWipeConfirm(false), 3000)
      return
    }
    send({ type: "wipe" })
    setWipeConfirm(false)
  }

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const truncate = (str: string, len: number) => {
    return str.length > len ? str.slice(0, len) + "..." : str
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] font-mono text-sm p-4">
      {/* DEV ONLY Banner */}
      <div className="bg-red-600 text-white text-center py-2 font-bold uppercase tracking-widest mb-4">
        DEV ONLY - DEBUG DASHBOARD
      </div>

      {/* Header */}
      <header className="border border-[#333] bg-[#111] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-xl font-bold text-white">DEV DASHBOARD</h1>
          
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            />
            <span className="text-[#888]">{connectionCount} connections</span>
          </div>

          <span
            className={`px-2 py-1 text-xs uppercase ${
              state.mode === "wall" ? "bg-green-800 text-green-200" : "bg-blue-800 text-blue-200"
            }`}
          >
            {state.mode}
          </span>

          <span className="text-[#666]">
            Last sync: {timeSinceSync}ms ago
          </span>

          <button
            onClick={handleWipeDB}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border transition-all ml-auto ${
              wipeConfirm
                ? "bg-red-600 border-red-600 text-white animate-pulse"
                : "bg-transparent border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
            }`}
          >
            {wipeConfirm ? "Click again to confirm" : "Wipe DB"}
          </button>
        </div>
      </header>

      {/* Connection Status */}
      <section className="border border-[#333] bg-[#111] p-4 mb-4">
        <h2 className="text-white font-bold mb-2 border-b border-[#333] pb-2">CONNECTION STATUS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-[#666]">isConnected: </span>
            {isConnected ? (
              <span className="text-green-400">true</span>
            ) : (
              <span className="text-red-400">false</span>
            )}
          </div>
          <div>
            <span className="text-[#666]">currentTalk: </span>
            <span className="text-yellow-400">{state.currentTalk || "(empty)"}</span>
          </div>
          <div>
            <span className="text-[#666]">alert: </span>
            <span className="text-orange-400">
              {state.alert ? state.alert.text : "null"}
            </span>
          </div>
        </div>
      </section>

      {/* Reactions */}
      <section className="border border-[#333] bg-[#111] p-4 mb-4">
        <h2 className="text-white font-bold mb-2 border-b border-[#333] pb-2">
          REACTIONS ({state.reactions.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[#666] border-b border-[#333]">
                <th className="py-1 pr-4">id</th>
                <th className="py-1 pr-4">name</th>
                <th className="py-1 pr-4">emoji</th>
                <th className="py-1 pr-4">text</th>
                <th className="py-1 pr-4">ts</th>
                <th className="py-1">flags</th>
              </tr>
            </thead>
            <tbody>
              {[...state.reactions]
                .sort((a, b) => b.ts - a.ts)
                .slice(0, 50)
                .map((r) => (
                  <tr key={r.id} className="border-b border-[#222] hover:bg-[#1a1a1a]">
                    <td className="py-1 pr-4 text-[#666]">{truncate(r.id, 8)}</td>
                    <td className="py-1 pr-4 text-cyan-400">{r.name}</td>
                    <td className="py-1 pr-4">{r.emoji}</td>
                    <td className="py-1 pr-4 text-[#888]">{truncate(r.text, 30)}</td>
                    <td className="py-1 pr-4 text-[#666]">{formatTime(r.ts)}</td>
                    <td className={`py-1 ${r.flags >= 3 ? "text-red-500 font-bold" : ""}`}>
                      {r.flags}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {state.reactions.length === 0 && (
            <p className="text-[#444] py-2">No reactions</p>
          )}
        </div>
      </section>

      {/* Questions */}
      <section className="border border-[#333] bg-[#111] p-4 mb-4">
        <h2 className="text-white font-bold mb-2 border-b border-[#333] pb-2">
          QUESTIONS ({state.questions.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[#666] border-b border-[#333]">
                <th className="py-1 pr-4">id</th>
                <th className="py-1 pr-4">name</th>
                <th className="py-1 pr-4">text</th>
                <th className="py-1 pr-4">votes</th>
                <th className="py-1">answered</th>
              </tr>
            </thead>
            <tbody>
              {[...state.questions]
                .sort((a, b) => b.votes - a.votes)
                .map((q) => (
                  <tr key={q.id} className="border-b border-[#222] hover:bg-[#1a1a1a]">
                    <td className="py-1 pr-4 text-[#666]">{truncate(q.id, 8)}</td>
                    <td className="py-1 pr-4 text-cyan-400">{q.name}</td>
                    <td className="py-1 pr-4 text-[#888]">{truncate(q.text, 40)}</td>
                    <td className="py-1 pr-4 text-yellow-400">{q.votes}</td>
                    <td className="py-1">
                      {q.answered ? (
                        <span className="text-green-400">true</span>
                      ) : (
                        <span className="text-[#666]">false</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {state.questions.length === 0 && (
            <p className="text-[#444] py-2">No questions</p>
          )}
        </div>
      </section>

      {/* Sessions */}
      <section className="border border-[#333] bg-[#111] p-4 mb-4">
        <h2 className="text-white font-bold mb-2 border-b border-[#333] pb-2">
          SESSIONS ({state.sessions.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[#666] border-b border-[#333]">
                <th className="py-1 pr-4">id</th>
                <th className="py-1 pr-4">type</th>
                <th className="py-1 pr-4">title</th>
                <th className="py-1 pr-4">start</th>
                <th className="py-1 pr-4">end</th>
                <th className="py-1 pr-4">track</th>
                <th className="py-1">cancelled</th>
              </tr>
            </thead>
            <tbody>
              {state.sessions.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-[#222] hover:bg-[#1a1a1a] ${
                    s.cancelled ? "opacity-50" : ""
                  }`}
                >
                  <td className="py-1 pr-4 text-[#666]">{s.id}</td>
                  <td className="py-1 pr-4 text-purple-400">{s.type}</td>
                  <td className="py-1 pr-4 text-[#888]">{truncate(s.title, 30)}</td>
                  <td className="py-1 pr-4 text-cyan-400">{s.start}</td>
                  <td className="py-1 pr-4 text-cyan-400">{s.end}</td>
                  <td className="py-1 pr-4 text-yellow-400">{s.track}</td>
                  <td className="py-1">
                    {s.cancelled ? (
                      <span className="text-red-400">true</span>
                    ) : (
                      <span className="text-[#666]">false</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {state.sessions.length === 0 && (
            <p className="text-[#444] py-2">No sessions</p>
          )}
        </div>
      </section>

      {/* Attendance */}
      <section className="border border-[#333] bg-[#111] p-4 mb-4">
        <h2 className="text-white font-bold mb-2 border-b border-[#333] pb-2">
          ATTENDANCE ({safeAttendance.length} entries)
        </h2>
        <div className="space-y-2">
          {Array.from(attendanceBySession.entries()).map(([sessionId, { going, maybe }]) => (
            <div key={sessionId} className="border border-[#333] bg-[#0d0d0d] p-2">
              <button
                onClick={() => toggleSessionExpanded(sessionId)}
                className="w-full flex items-center justify-between text-left hover:bg-[#1a1a1a] p-1"
              >
                <span className="text-[#888]">{sessionId}</span>
                <span>
                  <span className="text-green-400">{going.length} going</span>
                  <span className="text-[#666]"> / </span>
                  <span className="text-yellow-400">{maybe.length} maybe</span>
                </span>
              </button>
              {expandedSessions.has(sessionId) && (
                <div className="mt-2 pl-4 text-xs">
                  {going.length > 0 && (
                    <div className="mb-1">
                      <span className="text-green-400">Going: </span>
                      {going.map((a) => a.displayName || a.userId).join(", ")}
                    </div>
                  )}
                  {maybe.length > 0 && (
                    <div>
                      <span className="text-yellow-400">Maybe: </span>
                      {maybe.map((a) => a.displayName || a.userId).join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {attendanceBySession.size === 0 && (
            <p className="text-[#444]">No attendance data</p>
          )}
        </div>
      </section>

      {/* Flags */}
      <section className="border border-[#333] bg-[#111] p-4 mb-4">
        <h2 className="text-white font-bold mb-2 border-b border-[#333] pb-2">
          FLAGS ({flagCounts.size} flagged messages)
        </h2>
        <div className="space-y-1">
          {Array.from(flagCounts.entries()).map(([messageId, count]) => (
            <div
              key={messageId}
              className={`flex justify-between p-1 ${
                count >= 3 ? "bg-red-900/30 text-red-400" : ""
              }`}
            >
              <span className="text-[#666]">{truncate(messageId, 20)}</span>
              <span className={count >= 3 ? "font-bold" : ""}>{count} flags</span>
            </div>
          ))}
          {flagCounts.size === 0 && (
            <p className="text-[#444]">No flagged messages</p>
          )}
        </div>
      </section>

      {/* Raw JSON */}
      <section className="border border-[#333] bg-[#111] p-4">
        <button
          onClick={() => setRawJsonExpanded(!rawJsonExpanded)}
          className="w-full flex items-center justify-between text-white font-bold border-b border-[#333] pb-2 hover:text-[#00ff00]"
        >
          <span>RAW JSON</span>
          <span>{rawJsonExpanded ? "[-]" : "[+]"}</span>
        </button>
        {rawJsonExpanded && (
          <div className="mt-4">
            <button
              onClick={copyToClipboard}
              className="mb-2 px-3 py-1 bg-[#333] hover:bg-[#444] text-white text-xs"
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
            <pre className="overflow-auto max-h-96 bg-[#0a0a0a] border border-[#333] p-4 text-xs text-[#888]">
              {JSON.stringify(state, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  )
}
