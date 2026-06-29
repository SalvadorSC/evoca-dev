"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import features from "@/features.json";
import ideas from "@/ideas.json";

type Subtask = {
  id: string;
  name: string;
  complete: boolean;
};

type Item = {
  id: string;
  name: string;
  description: string;
  complexity: "low" | "medium" | "high";
  priority: "low" | "medium" | "high";
  category?: string;
  phase?: number;
  status: string;
  complete: boolean;
  subtasks?: Subtask[];
};

// Testing status for each item / subtask. Absence = untested.
type TestStatus = "pass" | "fail" | "untested";

const PHASE_META: Record<number, { label: string; color: string }> = {
  0: { label: "DX / Tooling",              color: "#64748b" },
  1: { label: "Billing Foundation",        color: "#f59e0b" },
  2: { label: "Conference Management",     color: "#3b82f6" },
  3: { label: "Q&A Moderation",            color: "#ef4444" },
  4: { label: "Presentation Formats",      color: "#8b5cf6" },
  5: { label: "Speaker Experience",        color: "#10b981" },
  6: { label: "Polish & Responsive",       color: "#ec4899" },
  7: { label: "Other",                     color: "#0ea5e9" },
};

const PRIORITY_DOT: Record<string, string> = {
  high:   "#e24b4a",
  medium: "#ef9f27",
  low:    "#93c5fd",
};

const COMPLEXITY_LABEL: Record<string, string> = {
  low:    "easy",
  medium: "mid",
  high:   "hard",
};

const STATUS_COLOR: Record<TestStatus, string> = {
  pass:     "#22c55e",
  fail:     "#e24b4a",
  untested: "#d1d5db",
};

// Cycle order when clicking a status box.
const NEXT_STATUS: Record<TestStatus, TestStatus> = {
  untested: "pass",
  pass:     "fail",
  fail:     "untested",
};

// ─── Tri-state status box (untested → pass → fail → untested) ─────────────────
function StatusBox({ status, size = 14 }: { status: TestStatus; size?: number }) {
  const color = STATUS_COLOR[status];
  const filled = status !== "untested";
  return (
    <span
      style={{
        flexShrink: 0,
        marginTop: 1,
        width: size,
        height: size,
        borderRadius: size <= 11 ? 2 : 3,
        border: `1.5px solid ${color}`,
        background: filled ? color : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size - 3,
        fontWeight: 700,
        lineHeight: 1,
        transition: "all 0.15s",
      }}
      title={status}
    >
      {status === "pass" ? "✓" : status === "fail" ? "✕" : ""}
    </span>
  );
}

// ─── Subtask row ────────────────────────────────────────────────────────────
function SubtaskRow({
  subtask,
  status,
  onCycle,
}: {
  subtask: Subtask;
  status: TestStatus;
  onCycle: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onCycle(subtask.id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 7,
        padding: "3px 0 3px 22px",
        cursor: "pointer",
      }}
    >
      <StatusBox status={status} size={11} />
      <span style={{ fontSize: 11, color: "#444", lineHeight: 1.4 }}>
        {subtask.name}
      </span>
    </div>
  );
}

// ─── Item row ────────────────────────────────────────────────────────────────
function ItemRow({
  item,
  status,
  onCycle,
  statusFor,
  readOnly = false,
}: {
  item: Item;
  status: TestStatus;
  onCycle: (id: string) => void;
  statusFor: (id: string) => TestStatus;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const subtasksTotal = item.subtasks?.length ?? 0;
  const hasSubtasks = subtasksTotal > 0;
  const subtasksPassed = item.subtasks
    ? item.subtasks.filter((s) => statusFor(s.id) === "pass").length
    : 0;

  return (
    <div
      style={{
        borderBottom: "0.5px solid rgba(0,0,0,0.07)",
        transition: "opacity 0.15s",
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "6px 0",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Status box — stop propagation so clicking it cycles instead of expanding */}
        {!readOnly && (
          <span
            onClick={(e) => { e.stopPropagation(); onCycle(item.id); }}
            title="Click to cycle: untested → pass → fail"
          >
            <StatusBox status={status} />
          </span>
        )}

        {/* Priority dot */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: PRIORITY_DOT[item.priority] ?? "#ccc",
            flexShrink: 0,
          }}
          title={`Priority: ${item.priority}`}
        />

        {/* Name */}
        <span
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 500,
            color: "#1a1a1a",
            lineHeight: 1.35,
          }}
        >
          {item.name}
        </span>

        {/* Right side meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          {hasSubtasks && (
            <span
              style={{
                fontSize: 10,
                color: subtasksPassed === subtasksTotal ? "#22c55e" : "#94a3b8",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {subtasksPassed}/{subtasksTotal}
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              color: "#94a3b8",
              background: "#f1f5f9",
              borderRadius: 4,
              padding: "1px 5px",
            }}
          >
            {COMPLEXITY_LABEL[item.complexity] ?? item.complexity}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#94a3b8",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.15s",
              lineHeight: 1,
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ paddingBottom: 6 }}>
          <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px 21px", lineHeight: 1.5 }}>
            {item.description}
          </p>
          {hasSubtasks && !readOnly && (
            <div>
              {item.subtasks!.map((s) => (
                <SubtaskRow
                  key={s.id}
                  subtask={s}
                  status={statusFor(s.id)}
                  onCycle={onCycle}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Phase group ─────────────────────────────────────────────────────────────
function PhaseGroup({
  phase,
  items,
  statusFor,
  onCycle,
}: {
  phase: number;
  items: Item[];
  statusFor: (id: string) => TestStatus;
  onCycle: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = PHASE_META[phase] ?? { label: `Phase ${phase}`, color: "#94a3b8" };
  const total = items.length;
  const passed = items.filter((i) => statusFor(i.id) === "pass").length;
  const failed = items.filter((i) => statusFor(i.id) === "fail").length;
  const allPassed = passed === total;

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Phase header */}
      <div
        onClick={() => setCollapsed((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 0 5px",
          cursor: "pointer",
          userSelect: "none",
          borderBottom: collapsed ? "none" : `1.5px solid ${meta.color}22`,
        }}
      >
        {/* Colored pill */}
        <span
          style={{
            width: 3,
            height: 14,
            borderRadius: 99,
            background: meta.color,
            flexShrink: 0,
            opacity: allPassed ? 0.4 : 1,
          }}
        />
        <span
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 700,
            color: allPassed ? "#94a3b8" : "#111",
            letterSpacing: 0.1,
          }}
        >
          {meta.label}
        </span>
        {failed > 0 && (
          <span style={{ fontSize: 10, color: "#e24b4a", fontVariantNumeric: "tabular-nums" }} title="failing">
            {failed}✕
          </span>
        )}
        <span
          style={{
            fontSize: 10,
            color: allPassed ? "#22c55e" : "#94a3b8",
            fontVariantNumeric: "tabular-nums",
          }}
          title="passing / total"
        >
          {allPassed ? "all pass" : `${passed}/${total}`}
        </span>
        <span style={{ fontSize: 10, color: "#cbd5e1", transform: collapsed ? "none" : "rotate(180deg)", transition: "transform 0.15s" }}>
          ▾
        </span>
      </div>

      {!collapsed && (
        <div style={{ paddingLeft: 6 }}>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              status={statusFor(item.id)}
              onCycle={onCycle}
              statusFor={statusFor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export function DevOverlay() {
  if (process.env.NODE_ENV !== "development") return null;
  return <DevOverlayInner />;
}

const STORAGE_KEY = "testtracker:status";

function DevOverlayInner() {
  const [visible, setVisible] = useState(true);
  // Minimized by default so the floating panel stays out of the way (and does
  // not intercept clicks) unless a developer explicitly expands it.
  const [minimized, setMinimized] = useState(true);
  const [tab, setTab] = useState<"tests" | "ideas">("tests");
  const [pos, setPos] = useState({ x: 16, y: 80 });
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
    catch { return {}; }
  });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const statusFor = useCallback(
    (id: string): TestStatus => statuses[id] ?? "untested",
    [statuses]
  );

  const cycleStatus = useCallback((id: string) => {
    setStatuses((prev) => {
      const current = prev[id] ?? "untested";
      const next = { ...prev, [id]: NEXT_STATUS[current] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setStatuses({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      e.preventDefault();
    },
    [pos]
  );

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

  const featureItems = features as Item[];
  const ideaItems = ideas as Item[];

  const totalFeatures = featureItems.length;
  const passedFeatures = featureItems.filter((i) => statusFor(i.id) === "pass").length;
  const failedFeatures = featureItems.filter((i) => statusFor(i.id) === "fail").length;
  const untestedCount = totalFeatures - passedFeatures - failedFeatures;

  // Group by phase
  const byPhase: Record<number, Item[]> = {};
  featureItems.forEach((f) => {
    const p = f.phase ?? 99;
    if (!byPhase[p]) byPhase[p] = [];
    byPhase[p].push(f);
  });
  const phaseKeys = Object.keys(byPhase).map(Number).sort((a, b) => a - b);

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
          fontWeight: 600,
          padding: "5px 12px",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          background: "#fff",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          color: "#475569",
        }}
      >
        {untestedCount} untested{failedFeatures > 0 ? ` · ${failedFeatures}✕` : ""}
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: pos.y,
        left: pos.x,
        zIndex: 9999,
        width: 340,
        maxHeight: minimized ? "auto" : "72vh",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        onMouseDown={onMouseDown}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 12px",
          borderBottom: "1px solid #f1f5f9",
          cursor: "grab",
          userSelect: "none",
          background: "#fafafa",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Testing Tracker</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
            {passedFeatures}/{totalFeatures} pass
            {failedFeatures > 0 ? ` · ${failedFeatures} fail` : ""}
            {untestedCount > 0 ? ` · ${untestedCount} untested` : ""}
          </div>
        </div>
        {/* Mini progress bar (pass = green, fail = red) */}
        <div style={{ width: 60, height: 4, borderRadius: 99, background: "#f1f5f9", overflow: "hidden", display: "flex" }}>
          <div style={{ height: "100%", width: `${(passedFeatures / totalFeatures) * 100}%`, background: "#22c55e" }} />
          <div style={{ height: "100%", width: `${(failedFeatures / totalFeatures) * 100}%`, background: "#e24b4a" }} />
        </div>
        <button
          onClick={() => setMinimized((v) => !v)}
          style={{ fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: "0 2px" }}
        >
          {minimized ? "+" : "−"}
        </button>
        <button
          onClick={() => setVisible(false)}
          style={{ fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: "0 2px" }}
        >
          ×
        </button>
      </div>

      {!minimized && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
            {(["tests", "ideas"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: 11,
                  fontWeight: tab === t ? 600 : 400,
                  background: "none",
                  border: "none",
                  borderBottom: tab === t ? "2px solid #0f172a" : "2px solid transparent",
                  cursor: "pointer",
                  color: tab === t ? "#0f172a" : "#94a3b8",
                  transition: "color 0.15s",
                }}
              >
                {t === "tests" ? "Tests" : "Ideas"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ overflowY: "auto", padding: "4px 12px 10px", flex: 1 }}>
            {tab === "tests" ? (
              phaseKeys.map((phase) => (
                <PhaseGroup
                  key={phase}
                  phase={phase}
                  items={byPhase[phase]}
                  statusFor={statusFor}
                  onCycle={cycleStatus}
                />
              ))
            ) : (
              ideaItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  status="untested"
                  onCycle={cycleStatus}
                  statusFor={statusFor}
                  readOnly
                />
              ))
            )}
          </div>

          {/* Footer legend */}
          <div
            style={{
              padding: "4px 12px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 10,
              color: "#94a3b8",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#22c55e", display: "inline-block" }} /> pass
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#e24b4a", display: "inline-block" }} /> fail
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, border: "1.5px solid #d1d5db", display: "inline-block" }} /> untested
            </span>
            <button
              onClick={resetAll}
              style={{ marginLeft: "auto", fontSize: 10, background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", textDecoration: "underline" }}
              title="Reset all testing status"
            >
              reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
