"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import features from "@/features.json";
import ideas from "@/ideas.json";

type Item = {
  id: string;
  name: string;
  description: string;
  complexity: string;
  priority: string;
  status: string;
  complete: boolean;
};

const priorityColor: Record<string, string> = {
  high: "#e24b4a",
  medium: "#ef9f27",
  low: "#639922",
};

const complexityLabel: Record<string, string> = {
  low: "L",
  medium: "M",
  high: "H",
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: "1px 6px",
        borderRadius: 4,
        border: `1px solid ${color}`,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function ItemRow({
  item,
  done,
  onToggleDone,
}: {
  item: Item;
  done: boolean;
  onToggleDone: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        padding: "6px 0",
        opacity: done ? 0.45 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Done checkbox */}
        <span
          title={done ? "Mark as pending" : "Mark as done"}
          onClick={(e) => { e.stopPropagation(); onToggleDone(item.id); }}
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            border: `1.5px solid ${done ? "#639922" : "#ccc"}`,
            background: done ? "#639922" : "transparent",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
            color: "#fff",
            fontSize: 9,
            lineHeight: 1,
          }}
        >
          {done ? "✓" : ""}
        </span>
        <span style={{ fontSize: 11, color: "#888", minWidth: 54 }}>{item.id}</span>
        <span
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 500,
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {item.name}
        </span>
        <Badge label={complexityLabel[item.complexity] ?? item.complexity} color="#888" />
        <Badge
          label={item.priority}
          color={priorityColor[item.priority] ?? "#888"}
        />
        <span style={{ fontSize: 11, color: "#aaa", marginLeft: 2 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>
      {open && (
        <p
          style={{
            fontSize: 11,
            color: "#555",
            margin: "4px 0 0 80px",
            lineHeight: 1.5,
          }}
        >
          {item.description}
        </p>
      )}
    </div>
  );
}

export function DevOverlay() {
  if (process.env.NODE_ENV !== "development") return null;

  return <DevOverlayInner />;
}

const STORAGE_KEY = "devtracker:done";

function DevOverlayInner() {
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [tab, setTab] = useState<"features" | "ideas">("features");
  const [pos, setPos] = useState({ x: 16, y: 80 });
  const [doneOverrides, setDoneOverrides] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
  });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleDone = useCallback((id: string) => {
    setDoneOverrides((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const isDone = (item: Item) => doneOverrides[item.id] !== undefined ? doneOverrides[item.id] : item.complete;
  const pending = (features as Item[]).filter((f) => !isDone(f)).length;
  const items = tab === "features" ? (features as Item[]) : (ideas as Item[]);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 9999,
          fontSize: 11,
          fontWeight: 500,
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid rgba(0,0,0,0.15)",
          background: "#fff",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        📋 Dev overlay
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: pos.y,
        left: pos.x,
        zIndex: 9999,
        width: 340,
        maxHeight: minimized ? "auto" : "70vh",
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 10,
        boxShadow: "0 4px 24px rgba(0,0,0,0.14)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header — drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: "#f5f5f5",
          borderBottom: "0.5px solid rgba(0,0,0,0.1)",
          cursor: "grab",
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, flex: 1, color: "#333" }}>
          🛠 Dev tracker — {pending} pending
        </span>
        <button
          onClick={() => setMinimized((v) => !v)}
          style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#666" }}
        >
          {minimized ? "expand" : "—"}
        </button>
        <button
          onClick={() => setVisible(false)}
          style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#666" }}
        >
          ✕
        </button>
      </div>

      {!minimized && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "0.5px solid rgba(0,0,0,0.1)" }}>
            {(["features", "ideas"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  fontSize: 12,
                  fontWeight: tab === t ? 600 : 400,
                  background: tab === t ? "#fff" : "#f9f9f9",
                  border: "none",
                  borderBottom: tab === t ? "2px solid #333" : "2px solid transparent",
                  cursor: "pointer",
                  color: tab === t ? "#111" : "#888",
                }}
              >
                {t === "features" ? `Features (${(features as Item[]).length})` : `Ideas (${(ideas as Item[]).length})`}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", padding: "4px 10px 8px", flex: 1 }}>
            {items.map((item) => (
              <ItemRow key={item.id} item={item} done={isDone(item)} onToggleDone={toggleDone} />
            ))}
          </div>

          {/* Legend */}
          <div
            style={{
              padding: "4px 10px",
              borderTop: "0.5px solid rgba(0,0,0,0.08)",
              display: "flex",
              gap: 10,
              fontSize: 10,
              color: "#aaa",
            }}
          >
            <span>Complexity: L=low M=med H=high</span>
            <span style={{ marginLeft: "auto" }}>Click row to expand</span>
          </div>
        </>
      )}
    </div>
  );
}
