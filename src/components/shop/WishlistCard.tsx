import { Heart, X } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { themes } from "../../data/themes";
import { ALL_SHOP_ITEMS } from "../../data/shop-catalog";
import { titleById } from "../../data/titles";
import { rotatingThemeById } from "../../data/pools/rotating-themes";
import type { WishlistEntry } from "../../types";

function resolveName(entry: WishlistEntry): string {
  if (entry.kind === "theme") return themes[entry.id as keyof typeof themes]?.name ?? entry.id;
  if (entry.kind === "rotating") return rotatingThemeById(entry.id)?.name ?? entry.id;
  if (entry.kind === "title") return titleById(entry.id.replace("title-", ""))?.label ?? entry.id;
  const item = ALL_SHOP_ITEMS.find((i) => i.id === entry.id || i.unlockKey === entry.id);
  return item?.name ?? entry.id;
}

function ProgressRing({ ratio, size = 44 }: { ratio: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, ratio));
  return (
    <svg width={size} height={size} className="wishlist-ring" aria-hidden="true">
      <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="4" />
      <circle
        className="ring-progress"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function WishlistStrip({ compact }: { compact?: boolean }) {
  const { user, removeFromWishlist, goTab } = useStudyGrind();
  if (!user || user.shopWishlist.length === 0) return null;

  return (
    <section className={`card wishlist-strip ${compact ? "compact" : ""}`}>
      <div className="row">
        <h4>
          <Heart size={16} /> Wishlist
        </h4>
        <button type="button" className="ghost linkish" onClick={() => goTab("shop")}>
          Shop
        </button>
      </div>
      <div className="wishlist-items">
        {user.shopWishlist.slice(0, compact ? 2 : 8).map((entry) => {
          const ratio = entry.targetPrice > 0 ? user.focusPoints / entry.targetPrice : 0;
          const pct = Math.min(100, Math.round(ratio * 100));
          return (
            <article key={entry.id} className="wishlist-item">
              <ProgressRing ratio={ratio} />
              <div className="wishlist-meta">
                <b>{resolveName(entry)}</b>
                <small className="soft">
                  {pct}% · {user.focusPoints.toLocaleString()} / {entry.targetPrice.toLocaleString()} pts
                </small>
              </div>
              <button type="button" className="icon-btn ghost" aria-label="Remove" onClick={() => removeFromWishlist(entry.id)}>
                <X size={16} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
