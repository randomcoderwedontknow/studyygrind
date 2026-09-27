import { useEffect, useRef, useState } from "react";
import { Clock3, Maximize2, Minimize2 } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { isAndroid } from "../../lib/native";

const POS_KEY = "studygrind_mini_timer_pos";

export function FloatingMiniTimer() {
  const { tab, goTab, timerSnapshot, setTimerSnapshot } = useStudyGrind();
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState(() => {
    try {
      const raw = sessionStorage.getItem(POS_KEY);
      if (raw) return JSON.parse(raw) as { x: number; y: number };
    } catch {
      /* ignore */
    }
    return { x: 16, y: 72 };
  });

  useEffect(() => {
    sessionStorage.setItem(POS_KEY, JSON.stringify(pos));
  }, [pos]);

  if (!timerSnapshot?.running || tab === "timer") return null;

  const mm = String(Math.floor(timerSnapshot.secondsLeft / 60)).padStart(2, "0");
  const ss = String(timerSnapshot.secondsLeft % 60).padStart(2, "0");
  const collapsed = timerSnapshot.collapsed;

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const x = Math.max(8, Math.min(window.innerWidth - 120, e.clientX - dragOffset.current.x));
    const y = Math.max(8, Math.min(window.innerHeight - 80, e.clientY - dragOffset.current.y));
    setPos({ x, y });
  };

  const onPointerUp = () => setDragging(false);

  // On Android the pill is docked above the bottom nav instead of being draggable.
  const dragProps = isAndroid
    ? {}
    : {
        style: { left: pos.x, top: pos.y },
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: onPointerUp,
      };

  return (
    <div
      className={`floating-mini-timer liquid-surface ${collapsed ? "collapsed" : ""} ${isAndroid ? "docked" : ""}`}
      {...dragProps}
    >
      <button
        type="button"
        className="mini-timer-body"
        onClick={() => goTab("timer")}
        aria-label="Open focus timer"
      >
        <Clock3 size={collapsed ? 16 : 18} />
        <span className="mini-timer-time">
          {mm}:{ss}
        </span>
        {!collapsed && <small className="mini-timer-phase">{timerSnapshot.phase}</small>}
      </button>
      <button
        type="button"
        className="mini-timer-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setTimerSnapshot({ collapsed: !collapsed });
        }}
        aria-label={collapsed ? "Expand mini timer" : "Collapse mini timer"}
      >
        {collapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
      </button>
    </div>
  );
}
