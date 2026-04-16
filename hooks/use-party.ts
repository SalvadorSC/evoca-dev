"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import PartySocket from "partysocket"
import type { AppState, ClientMessage, ServerMessage } from "@/lib/types"

const PARTY_HOST = "jsconf-live-wall.salvadorsc.partykit.dev"
const DEFAULT_ROOM = "jsconf-wall"

const initialState: AppState = {
  reactions: [],
  questions: [],
  currentTalk: "",
  mode: "wall",
  alert: null,
  sessions: [],
  attendance: {},
}

export function useParty(
  roomName: string = DEFAULT_ROOM,
  onMessage?: (message: ServerMessage) => void,
) {
  const [state, setState] = useState<AppState>(initialState)
  const [connectionCount, setConnectionCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<PartySocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    // Guard: only run in browser
    if (typeof window === "undefined") return
    
    const socket = new PartySocket({
      host: PARTY_HOST,
      room: roomName,
    })

    socketRef.current = socket

    socket.addEventListener("open", () => {
      setIsConnected(true)
    })

    socket.addEventListener("close", () => {
      setIsConnected(false)
    })

    socket.addEventListener("message", (event) => {
      const data = event.data
      // Skip non-string or non-JSON messages (heartbeats, pings, binary, etc.)
      if (typeof data !== "string") return

      // Only attempt to parse if it looks like a complete JSON object
      const trimmed = data.trim()
      if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return

      let message: ServerMessage
      try {
        message = JSON.parse(trimmed)
      } catch {
        // Silently ignore malformed JSON
        return
      }

      if (message.type === "sync") {
        setState(message.state)
      } else if (message.type === "connections") {
        setConnectionCount(message.count)
      } else {
        // Forward any other message types (slide_next, slide_prev, highlight_question, etc.)
        onMessageRef.current?.(message)
      }
    })

    return () => {
      socket.close()
    }
  }, [roomName])

  const send = useCallback((message: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    }
  }, [])

  return {
    state,
    connectionCount,
    isConnected,
    send,
  }
}
