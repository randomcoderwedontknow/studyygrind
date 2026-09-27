import { useState } from "react";
import { ShoppingBag, Sparkles } from "lucide-react";
import { EquipButton } from "../components/shop/EquipButton";
import { WishlistStrip } from "../components/shop/WishlistCard";
import { DailyDealCard } from "../components/home/DailyDealCard";
import { useStudyGrind } from "../context/StudyGrindContext";
import { themes, themeAppearance, vipThemes, honoraryThemes } from "../data/themes";
import {
  ALL_SHOP_ITEMS,
  SHOP_HUB_ITEMS,
  boosters,
  type ShopCategory,
  type ShopItem,
} from "../data/shop-catalog";
import { UNLOCK_IDS, CUSTOM_TITLE_UNLOCK_PRICE } from "../data/constants";
import { dailyShopThemes } from "../lib/weekly-rotation";
import { getDayKey } from "../lib/week";
import { PURCHASABLE_TITLES } from "../data/titles";
import type { ThemeId } from "../types";
import { TIMER_END_SOUNDS, previewTimerEndSound } from "../lib/timer-audio";
import {
  canRedeemTrophyCredit,
  canRedeemTrophyCreditForTheme,
  canRedeemTrophyCreditForTitle,
  TROPHY_CREDIT_MAX_PRICE,
} from "../lib/trophy-rewards";
import { themeSwatchStyle } from "../lib/theme-swatch";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { Modal } from "../components/ui/Modal";
import { HorizontalTabBar } from "../components/ui/HorizontalTabBar";

type ShopView = ShopCategory | "all" | "themes" | "boosters" | "daily" | "owned";

const SHOP_TABS: { id: ShopView; label: string }[] = [
  { id: "daily", label: "Today" },
  { id: "owned", label: "Owned" },
  { id: "all", label: "All" },
  { id: "hubs", label: "Pages" },
  { id: "titles", label: "Titles" },
  { id: "themes", label: "Themes" },
  { id: "boosters", label: "Boosters" },
  { id: "games", label: "Games" },
  { id: "analytics", label: "Analytics" },
  { id: "effects", label: "Effects" },
  { id: "sounds", label: "Sounds" },
  { id: "ui", label: "UI" },
  { id: "qol", label: "Free" },
  { id: "owner", label: "Owner" },
];

const ALL_SECTIONS: { key: ShopCategory; title: string }[] = [
  { key: "hubs", title: "Pages & labs (unlock in menu)" },
  { key: "titles", title: "Display titles & custom name" },
  { key: "games", title: "Break activities" },
  { key: "analytics", title: "Analytics upgrades" },
  { key: "effects", title: "Focus effects" },
  { key: "sounds", title: "Timer sounds" },
  { key: "ui", title: "UI effects" },
  { key: "qol", title: "Free QoL" },
  { key: "owner", title: "Owner fun" },
];

export function ShopPage() {
  const {
    user,
    buyTheme,
    buyBooster,
    purchaseShopItem,
    buyTitle,
    equipTitle,
    equipTheme,
    buyRotatingTheme,
    spin,
    spinResult,
    hasUnlock,
    previewTheme,
    setPreviewTheme,
    updateUser,
    setToast,
    addToWishlist,
    isWishlisted,
  } = useStudyGrind();
  const [category, setCategory] = useState<ShopView>("daily");
  const [confirm, setConfirm] = useState<{ id: string; name: string; price: number; unlockKey: string } | null>(null);
  const [shopFilter, setShopFilter] = useState<"all" | "core" | "premium" | "vip" | "honour">("all");

  if (!user) return null;
  const hasVip = user.role === "owner" || user.vipAccess;
  const hasHonour = user.role === "owner" || user.honoraryAccess;
  const trophyCredits = user.trophyShopCredits ?? 0;

  const shopTabs = SHOP_TABS.filter((t) => t.id !== "owner" || user.role === "owner");
  const themeFilterTabs = [
    { id: "all" as const, label: "All" },
    { id: "core" as const, label: "Core" },
    { id: "premium" as const, label: "Premium" },
    { id: "vip" as const, label: "VIP" },
    { id: "honour" as const, label: "Honour" },
  ];

  const items = ALL_SHOP_ITEMS.filter((i) => {
    if (i.ownerOnly && user.role !== "owner") return false;
    if (category === "boosters" || category === "themes" || category === "all" || category === "daily" || category === "owned")
      return false;
    return i.category === category;
  });

  const ownedUnlock = (key?: string) => (key ? hasUnlock(key) : false);

  const openConfirm = (item: ShopItem) => {
    const final = item.free ? 0 : Math.max(0, item.price - Math.floor((item.price * user.discount) / 100));
    setConfirm({ id: item.id, name: item.name, price: final, unlockKey: item.unlockKey ?? item.id });
  };

  const renderCatalogItem = (item: ShopItem) => {
    const owned = item.free || ownedUnlock(item.unlockKey);
    const final = item.free ? 0 : Math.max(0, item.price - Math.floor((item.price * user.discount) / 100));
    const canUseCredit = trophyCredits > 0 && !owned && canRedeemTrophyCredit(item);
    const soundMeta = TIMER_END_SOUNDS.find((s) => s.shopKey === item.unlockKey);
    return (
      <article key={item.id} className={`shop-item-card ${owned ? "owned" : ""}`}>
        <b>{item.name}</b>
        <p className="soft">{item.description}</p>
        <div className="row shop-item-foot wrap">
          <span className="pill">
            {item.free ? "Free" : owned ? "Unlocked" : canUseCredit ? "Free credit" : `${final} pts`}
          </span>
          {soundMeta && owned && (
            <>
              <PressableButton variant="ghost" onClick={() => previewTimerEndSound(soundMeta.id)}>
                Preview
              </PressableButton>
              <EquipButton
                equipped={user.timerEndSoundId === soundMeta.id}
                onEquip={() => updateUser({ ...user, timerEndSoundId: soundMeta.id })}
              />
            </>
          )}
          {!owned && !item.free && (
            <PressableButton variant="ghost" onClick={() => addToWishlist(item.id, "catalog", final)}>
              {isWishlisted(item.id) ? "Pinned" : "Pin"}
            </PressableButton>
          )}
          <PressableButton
            disabled={owned && !item.free && !soundMeta}
            onClick={() => {
              if (item.free) {
                if (item.unlockKey) {
                  updateUser({ ...user, unlocks: { ...user.unlocks, [item.unlockKey]: true } });
                  setToast(`${item.name} enabled.`);
                }
                return;
              }
              if (owned) return;
              openConfirm(item);
            }}
          >
            {owned ? "Owned" : "Buy"}
          </PressableButton>
        </div>
      </article>
    );
  };

  const renderTitles = () => (
    <section className="theme-grid">
      {PURCHASABLE_TITLES.map((t) => {
        const owned = user.ownedTitles.includes(t.id);
        const canUseCredit = trophyCredits > 0 && !owned && canRedeemTrophyCreditForTitle(t.id, t.price);
        return (
          <article key={t.id} className="theme-card">
            <div className="theme-body">
              <b>{t.label}</b>
              <p className="soft">{t.description}</p>
                  <PressableButton
                    disabled={owned && user.equippedTitleId === t.id}
                    onClick={() => (owned ? equipTitle(t.id) : buyTitle(t.id, t.price))}
                  >
                    {owned
                      ? user.equippedTitleId === t.id
                        ? "Equipped"
                        : "Equip"
                      : canUseCredit
                        ? "Free credit"
                        : `${t.price} pts`}
                  </PressableButton>
            </div>
          </article>
        );
      })}
      <article className="theme-card">
        <div className="theme-body">
          <b>Custom Name</b>
          <p className="soft">{CUSTOM_TITLE_UNLOCK_PRICE.toLocaleString()} pts — your own title text</p>
          <PressableButton
            disabled={hasUnlock(UNLOCK_IDS.customName)}
            onClick={() =>
              setConfirm({
                id: UNLOCK_IDS.customName,
                name: "Custom Name",
                price: CUSTOM_TITLE_UNLOCK_PRICE,
                unlockKey: UNLOCK_IDS.customName,
              })
            }
          >
            {hasUnlock(UNLOCK_IDS.customName) ? "Unlocked" : `${CUSTOM_TITLE_UNLOCK_PRICE.toLocaleString()} pts`}
          </PressableButton>
        </div>
      </article>
    </section>
  );

  const renderThemes = () => (
    <section className="card">
      <HorizontalTabBar tabs={themeFilterTabs} active={shopFilter} onChange={setShopFilter} ariaLabel="Theme tiers" />
      <div className="theme-grid">
        {Object.entries(themes)
          .filter(([id, meta]) => {
            const tid = id as ThemeId;
            if (vipThemes.includes(tid) && !hasVip) return false;
            if (honoraryThemes.includes(tid) && !hasHonour) return false;
            if (shopFilter === "all") return true;
            return meta.tier === shopFilter;
          })
          .map(([id, meta]) => {
            const tid = id as ThemeId;
            const owned = user.ownedThemes.includes(tid);
            const final = Math.max(0, meta.price - Math.floor((meta.price * user.discount) / 100));
            const canUseCredit = trophyCredits > 0 && !owned && canRedeemTrophyCreditForTheme(tid);
            return (
              <article key={id} className={`theme-card ${user.equippedTheme === tid ? "equipped" : ""} ${owned ? "unlock-glow" : ""}`} style={{ "--theme-color": meta.color } as React.CSSProperties}>
                <div className="theme-swatch" style={themeSwatchStyle(meta)} />
                <div className="theme-body">
                  <b>{meta.name}</b>
                  <small>{owned ? "Owned" : canUseCredit ? "Free credit" : `${final} pts`}</small>
                  <div className="row wrap">
                    {!owned ? (
                      <>
                        <PressableButton onClick={() => buyTheme(tid)}>Buy</PressableButton>
                        <PressableButton variant="ghost" onClick={() => addToWishlist(tid, "theme", final)}>
                          {isWishlisted(tid) ? "Pinned" : "Pin"}
                        </PressableButton>
                      </>
                    ) : (
                      <EquipButton equipped={user.equippedTheme === tid} onEquip={() => equipTheme(tid)} />
                    )}
                    <PressableButton variant="ghost" onClick={() => setPreviewTheme(tid)}>Preview</PressableButton>
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );

  const renderDaily = () => (
    <section className="card shop-tab-panel">
      <h4>Today&apos;s focus colours</h4>
      <p className="soft">Rotates daily — bought colours stay in Owned Colours forever.</p>
      <div className="theme-grid">
        {dailyShopThemes(getDayKey()).map((t) => {
          const owned = user.ownedRotatingThemeIds.includes(t.id);
          const final = Math.max(0, t.price - Math.floor((t.price * user.discount) / 100));
          const swatch = themeSwatchStyle({ color: t.color, color2: t.color2, gradient: t.gradient });
          return (
            <article
              key={t.id}
              className={`theme-card ${user.equippedTheme === t.id ? "equipped" : ""}`}
              style={{ "--theme-color": t.color } as React.CSSProperties}
            >
              <div className="theme-swatch" style={swatch} />
              <div className="theme-body">
                <b>{t.name}</b>
                <small>{t.tier} · {owned ? "Owned" : `${final} pts`}</small>
                <div className="row wrap">
                  {!owned ? (
                    <PressableButton onClick={() => buyRotatingTheme(t.id, final)}>Buy</PressableButton>
                  ) : (
                    <EquipButton equipped={user.equippedTheme === t.id} onEquip={() => equipTheme(t.id)} />
                  )}
                  <PressableButton variant="ghost" onClick={() => setPreviewTheme(t.id)}>
                    Preview
                  </PressableButton>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );

  const renderOwned = () => (
    <section className="card shop-tab-panel">
      <h4>Owned colours</h4>
      <p className="soft">Built-in, rotating shop, and custom themes — always equippable.</p>
      <div className="theme-grid">
        {[
          ...user.ownedThemes.map((id) => ({ id })),
          ...user.ownedRotatingThemeIds.map((id) => ({ id })),
          ...user.savedCustomThemes.map((c) => ({ id: c.id })),
        ].map(({ id }) => {
          const meta = themeAppearance(id, [], user.savedCustomThemes);
          return (
            <article key={id} className={`theme-card ${user.equippedTheme === id ? "equipped" : ""}`}>
              <div className="theme-swatch" style={themeSwatchStyle(meta)} />
              <div className="theme-body">
                <b>{meta.name}</b>
                <EquipButton equipped={user.equippedTheme === id} onEquip={() => equipTheme(id)} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );

  const renderBoosters = () => (
    <section className="booster-grid">
      {boosters.map((b) => {
        const final = Math.max(0, b.price - Math.floor((b.price * user.discount) / 100));
        return (
          <article key={b.id} className={`booster-card ${user.focusPoints < final ? "dim" : ""}`}>
            <div className="booster-icon">
              <Sparkles size={18} />
            </div>
            <div className="booster-body">
              <b>{b.name}</b>
              <p className="soft">{b.description}</p>
              <div className="row">
                <span className="pill">{final} pts</span>
                <PressableButton onClick={() => buyBooster(b)} disabled={user.focusPoints < final}>
                  Buy
                </PressableButton>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );

  return (
    <PageTransition stagger>
      <section className="hero-panel shop-hero">
        <div className="hero-main">
          <span className="eyebrow">Focus Shop</span>
          <h4>
            <ShoppingBag size={20} /> Spend your points
          </h4>
          <p>Pages, titles, colours, boosters and extras. Locked pages open once you buy them here.</p>
        </div>
        <div className="hero-side">
          <span className="pill points-pill">{user.focusPoints.toLocaleString()} pts</span>
          {trophyCredits > 0 && (
            <span className="pill trophy-credit-pill">{trophyCredits} free shop credit{trophyCredits === 1 ? "" : "s"}</span>
          )}
          {user.discount > 0 && <span className="pill discount-pill">{user.discount}% off</span>}
        </div>
      </section>

      {trophyCredits > 0 && (
        <section className="card trophy-credit-banner">
          <p className="soft">
            You have <b>{trophyCredits}</b> free shop credit{trophyCredits === 1 ? "" : "s"} from trophies. Use them on
            items up to {TROPHY_CREDIT_MAX_PRICE.toLocaleString()} pts (games, sounds, effects, titles, and core themes).
          </p>
        </section>
      )}

      <WishlistStrip />

      <section className="card shop-tabs-card">
        <HorizontalTabBar tabs={shopTabs} active={category} onChange={setCategory} ariaLabel="Shop categories" />
      </section>

      {category === "daily" && (
        <>
          <DailyDealCard />
          {renderDaily()}
        </>
      )}
      {category === "owned" && renderOwned()}

      {(category === "daily" || category === "all") && (
        <section className="card spin-card">
          <div className="row">
            <div>
              <h4>
                <Sparkles size={16} /> Daily spin
              </h4>
              <p className="soft">One free spin a day for points or a discount.</p>
            </div>
            <PressableButton onClick={spin}>Spin</PressableButton>
          </div>
          {spinResult && <p className="break" style={{ marginTop: 10 }}>{spinResult}</p>}
        </section>
      )}

      {category === "all" && (
        <>
          <section className="shop-all-section">
            <h5 className="shop-section-title">Pages & labs</h5>
            <div className="shop-items-grid">{SHOP_HUB_ITEMS.map(renderCatalogItem)}</div>
          </section>
          <section className="shop-all-section">
            <h5 className="shop-section-title">Display titles</h5>
            {renderTitles()}
          </section>
          <section className="shop-all-section">
            <h5 className="shop-section-title">Built-in themes</h5>
            {renderThemes()}
          </section>
          {ALL_SECTIONS.filter((s) => s.key !== "hubs" && s.key !== "titles").map((section) => {
            const sectionItems = ALL_SHOP_ITEMS.filter((i) => {
              if (i.ownerOnly && user.role !== "owner") return false;
              return i.category === section.key;
            });
            if (sectionItems.length === 0) return null;
            return (
              <section key={section.key} className="shop-all-section">
                <h5 className="shop-section-title">{section.title}</h5>
                <div className="shop-items-grid">{sectionItems.map(renderCatalogItem)}</div>
              </section>
            );
          })}
          <section className="shop-all-section">
            <h5 className="shop-section-title">Boosters</h5>
            {renderBoosters()}
          </section>
        </>
      )}

      {category === "boosters" && renderBoosters()}
      {category === "themes" && renderThemes()}
      {category === "titles" && renderTitles()}

      {category !== "all" &&
        category !== "themes" &&
        category !== "boosters" &&
        category !== "titles" &&
        category !== "daily" &&
        category !== "owned" && (
        <section className="shop-items-grid">
          {category === "hubs" ? SHOP_HUB_ITEMS.map(renderCatalogItem) : items.map(renderCatalogItem)}
        </section>
      )}

      <Modal
        open={!!confirm}
        title="Confirm purchase"
        onClose={() => setConfirm(null)}
        footer={
          confirm && (() => {
            const useCredit =
              trophyCredits > 0 && canRedeemTrophyCredit({ price: confirm.price, unlockKey: confirm.unlockKey });
            return (
              <PressableButton
                className="shop-buy-shake"
                onClick={() => {
                  purchaseShopItem(confirm.unlockKey, confirm.price, confirm.name);
                  setConfirm(null);
                }}
              >
                {useCredit ? "Redeem free credit" : `Buy for ${confirm.price} pts`}
              </PressableButton>
            );
          })()
        }
      >
        {confirm && (() => {
          const useCredit =
            trophyCredits > 0 && canRedeemTrophyCredit({ price: confirm.price, unlockKey: confirm.unlockKey });
          return (
            <p>
              Unlock <b>{confirm.name}</b>{" "}
              {useCredit ? "using a free trophy shop credit?" : `for ${confirm.price} focus points?`}
            </p>
          );
        })()}
      </Modal>

      {previewTheme && (
        <p className="soft preview-row">
          Previewing {themeAppearance(previewTheme, [], user.savedCustomThemes).name}
          <PressableButton variant="ghost" onClick={() => setPreviewTheme(null)}>
            Close
          </PressableButton>
        </p>
      )}
    </PageTransition>
  );
}
