import { Tag } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { dailyDealForUser } from "../../lib/daily-deal";
import { grantThemeSurface } from "../../lib/theme-variants";
import type { ThemeId } from "../../types";
import { PressableButton } from "../ui/PressableButton";

export function DailyDealCard() {
  const { user, updateUser, purchaseShopItem, setToast, goTab } = useStudyGrind();
  if (!user) return null;

  const deal = dailyDealForUser(user.email);
  const purchased = user.dailyDealPurchasedKey === deal.dayKey + deal.id;

  const buy = () => {
    if (purchased) {
      setToast("Already grabbed today's deal.");
      return;
    }
    if (user.focusPoints < deal.dealPrice) {
      setToast("Not enough points for today's deal.");
      goTab("shop");
      return;
    }
    if (deal.kind === "theme" && deal.themeId) {
      if (user.ownedThemes.includes(deal.themeId)) {
        setToast("You already own this theme.");
        return;
      }
      const tid = deal.themeId as ThemeId;
      let themeVariantsOwned = grantThemeSurface(user.themeVariantsOwned ?? {}, tid, "classic");
      themeVariantsOwned = grantThemeSurface(themeVariantsOwned, tid, "liquid");
      updateUser({
        ...user,
        focusPoints: user.focusPoints - deal.dealPrice,
        ownedThemes: user.ownedThemes.includes(tid) ? user.ownedThemes : [...user.ownedThemes, tid],
        themeVariantsOwned,
        equippedTheme: tid,
        equippedThemeSurface: "liquid",
        dailyDealPurchasedKey: deal.dayKey + deal.id,
      });
    } else if (deal.unlockKey) {
      const ok = purchaseShopItem(deal.unlockKey, deal.dealPrice, deal.name);
      if (!ok) return;
      updateUser({ ...user, dailyDealPurchasedKey: deal.dayKey + deal.id });
    }
    setToast(`Deal unlocked: ${deal.name}`);
  };

  return (
    <section className="card daily-deal-card">
      <div className="row">
        <h4>
          <Tag size={16} /> Daily deal
        </h4>
        <span className="pill discount-pill">-{deal.discountPct}%</span>
      </div>
      <p className="soft">{deal.name} — {deal.description}</p>
      <div className="row wrap">
        <span className="soft" style={{ textDecoration: "line-through" }}>
          {deal.basePrice.toLocaleString()} pts
        </span>
        <b>{deal.dealPrice.toLocaleString()} pts</b>
        <PressableButton onClick={buy} disabled={purchased}>
          {purchased ? "Claimed" : "Claim deal"}
        </PressableButton>
      </div>
    </section>
  );
}
