import { useMemo } from "react";
import { CalendarCheck, CheckSquare, Flame, Tag, Timer, TrendingDown, TrendingUp } from "lucide-react";
import { Modal } from "../ui/Modal";
import { PressableButton } from "../ui/PressableButton";
import { buildWeeklyRecap } from "../../lib/recap";
import type { UserData } from "../../types";

function RecapBars({ days }: { days: { key: string; label: string; minutes: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.minutes));
  return (
    <div className="weekly-chart recap-chart" aria-label="Last week's focus by day">
      <div className="bars recap-bars">
        {days.map((d) => (
          <div className="bar-col" key={d.key}>
            <div className="bar bar-animate" style={{ height: `${Math.max(4, (d.minutes / max) * 100)}%` }} title={`${d.minutes} min`} />
            <small>{d.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyRecapModal({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: UserData;
  onClose: () => void;
}) {
  const recap = useMemo(() => buildWeeklyRecap(user), [user]);
  const delta = recap.deltaPct;
  const deltaTone = delta === null ? "" : delta >= 0 ? "up" : "down";

  return (
    <Modal
      open={open}
      title="Weekly recap"
      onClose={onClose}
      footer={<PressableButton onClick={onClose}>Done</PressableButton>}
    >
      <div className="recap-head">
        <span className="eyebrow">{recap.rangeLabel}</span>
        <div className="recap-total">
          <b className="tabular">{recap.totalMinutes}</b>
          <span>min focused</span>
        </div>
        <span className={`pill recap-delta ${deltaTone}`}>
          {delta === null ? (
            recap.totalMinutes > 0 ? "First tracked week" : "No data yet"
          ) : (
            <>
              {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {delta >= 0 ? "+" : ""}
              {delta}% vs week before
            </>
          )}
        </span>
      </div>

      <RecapBars days={recap.days} />

      <div className="recap-grid">
        <article className="metric recap-metric">
          <small>
            <CalendarCheck size={12} /> Best day
          </small>
          <b>{recap.bestDay ? `${recap.bestDay.label} · ${recap.bestDay.minutes}m` : "—"}</b>
        </article>
        <article className="metric recap-metric">
          <small>
            <Timer size={12} /> Sessions
          </small>
          <b>
            {recap.sessions}
            {recap.fullSessions > 0 && <small className="soft"> ({recap.fullSessions} full)</small>}
          </b>
        </article>
        <article className="metric recap-metric">
          <small>
            <CheckSquare size={12} /> Tasks done
          </small>
          <b>{recap.tasksDone}</b>
        </article>
        <article className="metric recap-metric">
          <small>
            <Tag size={12} /> Top tag
          </small>
          <b>{recap.topTag ? `#${recap.topTag.tag}` : "—"}</b>
        </article>
      </div>

      <div className="recap-streak">
        <Flame size={16} />
        <div>
          <b>{recap.streakLabel}</b>
          <small className="soft block">Current study streak: {recap.streakAtEnd} day{recap.streakAtEnd === 1 ? "" : "s"}</small>
        </div>
      </div>
    </Modal>
  );
}
