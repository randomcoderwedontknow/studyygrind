import { CheckSquare, Clock3, Home, Menu, ShoppingBag } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { hapticSelection } from "../../lib/haptics";
import type { Tab } from "../../types";

type NavItem = { id: Tab | "more"; label: string; icon: React.ReactNode };

const ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: <Home size={22} /> },
  { id: "tasks", label: "Tasks", icon: <CheckSquare size={22} /> },
  { id: "timer", label: "Timer", icon: <Clock3 size={24} /> },
  { id: "shop", label: "Shop", icon: <ShoppingBag size={22} /> },
  { id: "more", label: "More", icon: <Menu size={22} /> },
];

const PRIMARY_TABS = new Set<Tab>(["home", "tasks", "timer", "shop"]);

export function BottomNav() {
  const { tab, goTab, menuOpen, setMenuOpen, timerSnapshot, user, timerRunning } = useStudyGrind();

  const running = Boolean(timerSnapshot?.running);
  const minutesLeft = running ? Math.max(0, Math.ceil((timerSnapshot?.secondsLeft ?? 0) / 60)) : 0;
  const moreActive = menuOpen || !PRIMARY_TABS.has(tab);

  return (
    <nav className="bottom-nav liquid-nav" aria-label="Primary">
      {ITEMS.map((item) => {
        const isCenter = item.id === "timer";
        const active = item.id === "more" ? moreActive : tab === item.id && !menuOpen;
        const tabId = item.id === "more" ? null : item.id;
        const navLocked =
          tabId &&
          timerRunning &&
          user?.focusLockOn &&
          (user.lockedTabs ?? []).includes(tabId);
        const onClick = () => {
          hapticSelection();
          if (item.id === "more") {
            setMenuOpen(true);
            return;
          }
          if (menuOpen) setMenuOpen(false);
          goTab(item.id);
        };
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-item ${active ? "active" : ""} ${isCenter ? "center" : ""} ${navLocked ? "nav-locked" : ""}`}
            aria-disabled={navLocked || undefined}
            onClick={onClick}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            {!isCenter && <span className="nav-pill" aria-hidden="true" />}
            {isCenter ? <span className="nav-fab">{item.icon}</span> : item.icon}
            {isCenter && running && <span className="nav-badge">{minutesLeft}m</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
