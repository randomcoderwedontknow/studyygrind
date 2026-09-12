import { useEffect, useRef } from "react";

export type TabOption<T extends string> = { id: T; label: string };

export function HorizontalTabBar<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel = "Categories",
}: {
  tabs: TabOption<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const btn = root.querySelector<HTMLElement>(`[data-tab-id="${active}"]`);
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  return (
    <div className="horizontal-tabs-wrap">
      <div className="horizontal-tabs" ref={scrollerRef} role="tablist" aria-label={ariaLabel}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            data-tab-id={t.id}
            aria-selected={active === t.id}
            className={`horizontal-tab ${active === t.id ? "active" : ""}`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
