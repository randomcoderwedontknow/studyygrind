export function WeeklyChart({ history, days: dayCount = 14 }: { history: Record<string, number>; days?: number }) {
  const days: { label: string; mins: number; key: string }[] = [];
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      mins: history[key] || 0,
    });
  }
  const max = Math.max(1, ...days.map((d) => d.mins));
  const total = days.reduce((a, d) => a + d.mins, 0);
  return (
    <div className="weekly-chart">
      <div className="bars">
        {days.map((d) => (
          <div className="bar-col" key={d.key}>
            <div
              className="bar bar-animate"
              style={{ height: `${Math.max(4, (d.mins / max) * 100)}%` }}
              title={`${d.mins} min`}
            />
            <small>{d.label}</small>
          </div>
        ))}
      </div>
      <p className="soft chart-summary">
        {dayCount}-day total: <b>{total}m</b> · daily avg: <b>{Math.round(total / dayCount)}m</b> · best day: <b>{max}m</b>
      </p>
    </div>
  );
}
