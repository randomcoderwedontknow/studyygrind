import { useState } from "react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { PURCHASABLE_TITLES, CUSTOM_NAME_TITLE_ID, STARTER_TITLE_ID, titleById } from "../../data/titles";
import { CUSTOM_TITLE_UNLOCK_PRICE } from "../../data/constants";
import { Modal } from "../ui/Modal";
import { PressableButton } from "../ui/PressableButton";

export function TitleHubModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, buyTitle, equipTitle, updateUser, setToast, hasUnlock } = useStudyGrind();
  const [titleDraft, setTitleDraft] = useState("");
  const [tab, setTab] = useState<"equip" | "shop" | "weekly">("equip");

  if (!user) return null;

  const weekly = user.weeklyTitleInventory ?? [];

  return (
    <Modal open={open} title="Titles" onClose={onClose}>
      <div className="chip-group">
        <button type="button" className={`chip ${tab === "equip" ? "chip-active" : ""}`} onClick={() => setTab("equip")}>
          Equip
        </button>
        <button type="button" className={`chip ${tab === "shop" ? "chip-active" : ""}`} onClick={() => setTab("shop")}>
          Buy titles
        </button>
        <button type="button" className={`chip ${tab === "weekly" ? "chip-active" : ""}`} onClick={() => setTab("weekly")}>
          Weekly earned
        </button>
      </div>

      {tab === "equip" && (
        <div className="title-hub-list">
          {[STARTER_TITLE_ID, ...user.ownedTitles.filter((id) => id !== STARTER_TITLE_ID)].map((id) => {
            const weeklyT = weekly.find((w) => w.id === id);
            const shopT = titleById(id);
            const label = weeklyT?.label ?? shopT?.label ?? id;
            return (
              <article key={id} className={`title-hub-row ${user.equippedTitleId === id ? "equipped" : ""}`}>
                <b>{label}</b>
                <PressableButton variant="ghost" onClick={() => equipTitle(id)}>
                  {user.equippedTitleId === id ? "Equipped" : "Equip"}
                </PressableButton>
              </article>
            );
          })}
          {weekly
            .filter((w) => !user.ownedTitles.includes(w.id))
            .map((w) => (
              <article key={w.id} className={`title-hub-row ${user.equippedTitleId === w.id ? "equipped" : ""}`}>
                <b>{w.label}</b>
                <PressableButton variant="ghost" onClick={() => equipTitle(w.id)}>
                  {user.equippedTitleId === w.id ? "Equipped" : "Equip"}
                </PressableButton>
              </article>
            ))}
        </div>
      )}

      {tab === "shop" && (
        <div className="title-hub-list">
          {PURCHASABLE_TITLES.map((t) => {
            const owned = user.ownedTitles.includes(t.id);
            return (
              <article key={t.id} className="title-hub-row">
                <div>
                  <b>{t.label}</b>
                  <p className="soft">{t.description}</p>
                </div>
                {owned ? (
                  <PressableButton variant="ghost" onClick={() => equipTitle(t.id)}>
                    {user.equippedTitleId === t.id ? "Equipped" : "Equip"}
                  </PressableButton>
                ) : (
                  <PressableButton onClick={() => buyTitle(t.id, t.price)}>{t.price} pts</PressableButton>
                )}
              </article>
            );
          })}
          <article className="title-hub-row">
            <div>
              <b>Custom Name</b>
              <p className="soft">Your own title text (max 32 chars)</p>
            </div>
            {hasUnlock(CUSTOM_NAME_TITLE_ID) || user.customTitleUnlocked ? (
              <div className="row wrap">
                <input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value.slice(0, 32))} placeholder="Your title" />
                <PressableButton
                  onClick={() => {
                    updateUser({
                      ...user,
                      customRankName: titleDraft.trim(),
                      equippedTitleId: CUSTOM_NAME_TITLE_ID,
                    });
                    setToast("Custom title equipped.");
                    onClose();
                  }}
                >
                  Save & equip
                </PressableButton>
              </div>
            ) : (
              <PressableButton onClick={() => setToast(`Unlock in Focus Shop titles tab (${CUSTOM_TITLE_UNLOCK_PRICE} pts)`)}>
                {CUSTOM_TITLE_UNLOCK_PRICE} pts in shop
              </PressableButton>
            )}
          </article>
        </div>
      )}

      {tab === "weekly" && (
        <div className="title-hub-list">
          {weekly.length === 0 && <p className="soft">Earn weekly titles by hitting focus minute goals each week.</p>}
          {weekly.map((w) => (
            <article key={w.id} className="title-hub-row">
              <div>
                <b>{w.label}</b>
                <small className="soft">
                  {w.threshold}m · {w.weekKey}
                </small>
              </div>
              <PressableButton variant="ghost" onClick={() => equipTitle(w.id)}>
                {user.equippedTitleId === w.id ? "Equipped" : "Equip"}
              </PressableButton>
            </article>
          ))}
        </div>
      )}
    </Modal>
  );
}
