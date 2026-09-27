import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { STUDY_DAY_FIRE_MINUTES } from "../../data/constants";
import type { SessionLogEntry } from "../../types";

type Props = {
  history: Record<string, number>;
  sessionLog: SessionLogEntry[];
};

function monthMatrix(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function keyFor(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function StudyStreakCalendar({ history, sessionLog }: Props) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [picked, setPicked] = useState<string | null>(null);

  const rows = useMemo(() => monthMatrix(cursor.y, cursor.m), [cursor.y, cursor.m]);
  const label = new Date(cursor.y, cursor.m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });

  const pickedDetail = useMemo(() => {
    if (!picked) return null;
    const mins = history[picked] ?? 0;
    const sessions = sessionLog.filter((s) => s.at.slice(0, 10) === picked).length;
    return { mins, sessions };
  }, [picked, history, sessionLog]);

  return (
    <section className="card liquid-surface">
      <div className="row">
        <h4>
          <Flame size={16} /> Study calendar
        </h4>
        <div className="row">
          <button type="button" className="ghost icon-btn" aria-label="Previous month" onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}>
            <ChevronLeft size={18} />
          </button>
          <span className="soft">{label}</span>
          <button type="button" className="ghost icon-btn" aria-label="Next month" onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <p className="soft">Fire on days with at least {STUDY_DAY_FIRE_MINUTES} minutes of focus.</p>
      <div className="study-calendar-grid" style={{ marginTop: 8 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
          <small key={d} className="soft center">
            {d}
          </small>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="study-calendar-grid">
          {row.map((d, ci) => {
            if (!d) return <div key={ci} className="study-cal-cell empty" />;
            const k = keyFor(d);
            const mins = history[k] ?? 0;
            const onFire = mins >= STUDY_DAY_FIRE_MINUTES;
            return (
              <button
                key={k}
                type="button"
                className={`study-cal-cell ${onFire ? "on-fire" : ""}`}
                onClick={() => setPicked(k)}
                aria-label={`${d.getDate()} ${mins} minutes`}
              >
                <span>{d.getDate()}</span>
                {onFire && (
                  <span className="study-cal-fire" aria-hidden="true">
                    <Flame size={14} fill="currentColor" />
                  </span>
                )}
                {mins > 0 && !onFire && <small>{mins}m</small>}
              </button>
            );
          })}
        </div>
      ))}
      {pickedDetail && picked && (
        <p className="soft" style={{ marginTop: 12 }}>
          {picked}: {pickedDetail.mins} min · {pickedDetail.sessions} session{pickedDetail.sessions === 1 ? "" : "s"}
        </p>
      )}
    </section>
  );
}
