import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { OWNER_EMAIL, UNLOCK_IDS } from "../data/constants";
import { themes } from "../data/themes";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { HorizontalTabBar } from "../components/ui/HorizontalTabBar";
import { Modal } from "../components/ui/Modal";
import type { Role, ThemeId, UserData } from "../types";

type Section = "personal" | "users" | "themes" | "broadcast" | "moderation" | "mentor" | "system";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "users", label: "Users" },
  { id: "themes", label: "Themes" },
  { id: "broadcast", label: "Broadcast" },
  { id: "moderation", label: "Moderation" },
  { id: "mentor", label: "Mentor" },
  { id: "system", label: "System" },
];

const ROLES: Role[] = ["user", "vip", "moderator", "admin"];

const ALL_GAMES = [
  "word-scramble",
  "number-ninja",
  "memory-sprint",
  "logic-burst",
  "pattern-rush",
  "micro-chess",
  "reaction-tap",
  "memory-tiles",
  "math-sprint",
  "focus-dodge",
  "pattern-repeat",
  "typing-burst",
  "coin-catcher",
  "timer-rush",
];

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" className={`toggle ${on ? "on" : ""}`} onClick={onClick} aria-label={label} aria-pressed={on}>
      <span />
    </button>
  );
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  return new Date(iso).toLocaleDateString();
}

export function OwnerSettingsPage() {
  const { user, goTab } = useStudyGrind();
  const [section, setSection] = useState<Section>("personal");

  if (!user || user.role !== "owner") {
    return (
      <section className="card">
        <h4>Owner only</h4>
        <p className="soft">This page is reserved for the owner account.</p>
        <PressableButton onClick={() => goTab("settings")}>Back to Settings</PressableButton>
      </section>
    );
  }

  return (
    <PageTransition>
      <section className="hero-panel owner-hero">
        <div>
          <h4>
            <ShieldCheck size={16} /> Owner Settings
          </h4>
          <p>Admin tools for {user.username}. Changes are logged to the audit trail.</p>
        </div>
        <PressableButton variant="ghost" onClick={() => goTab("settings")}>
          <ArrowLeft size={14} /> Settings
        </PressableButton>
      </section>

      <section className="card owner-tabs-card">
        <HorizontalTabBar tabs={SECTIONS} active={section} onChange={setSection} ariaLabel="Owner sections" />
      </section>

      {section === "personal" && <PersonalSection />}
      {section === "users" && <UsersSection />}
      {section === "themes" && <ThemesSection />}
      {section === "broadcast" && <BroadcastSection />}
      {section === "moderation" && <ModerationSection />}
      {section === "mentor" && <MentorSection />}
      {section === "system" && <SystemSection />}
    </PageTransition>
  );
}

/* ---------------- Personal ---------------- */

function PersonalSection() {
  const { user, updateUser, resetUserAsOwner, setToast } = useStudyGrind();
  const [resetOpen, setResetOpen] = useState(false);
  if (!user) return null;
  const flags = user.ownerFlags;
  return (
    <>
      <section className="card owner-panel">
        <h4>Owner perks</h4>
        <div className="setting-row">
          <div>
            <span>Points boost</span>
            <small className="soft block">2x focus points on your own sessions</small>
          </div>
          <Toggle
            on={flags.pointsBoostOn}
            label="Points boost"
            onClick={() => updateUser({ ...user, ownerFlags: { ...flags, pointsBoostOn: !flags.pointsBoostOn } })}
          />
        </div>
        <div className="setting-row">
          <div>
            <span>Extra particles</span>
            <small className="soft block">Particle trail across the app</small>
          </div>
          <Toggle
            on={flags.extraParticles}
            label="Extra particles"
            onClick={() => updateUser({ ...user, ownerFlags: { ...flags, extraParticles: !flags.extraParticles } })}
          />
        </div>
      </section>

      <section className="card owner-panel">
        <h4>Quick actions</h4>
        <div className="row wrap">
          <PressableButton
            onClick={() => {
              updateUser({ ...user, focusPoints: user.focusPoints + 1337 });
              setToast("+1337 pts");
            }}
          >
            +1337 pts
          </PressableButton>
          <PressableButton
            onClick={() => {
              updateUser({ ...user, focusPoints: user.focusPoints + 100_000 });
              setToast("+100,000 pts");
            }}
          >
            +100k pts
          </PressableButton>
          <PressableButton
            variant="ghost"
            onClick={() => {
              updateUser({
                ...user,
                unlocks: {
                  ...user.unlocks,
                  [UNLOCK_IDS.focusLab]: true,
                  [UNLOCK_IDS.colourMaker]: true,
                  [UNLOCK_IDS.mentorHub]: true,
                  [UNLOCK_IDS.customName]: true,
                },
                gamesUnlocked: ALL_GAMES,
                ownedThemes: Object.keys(themes) as ThemeId[],
              });
              setToast("Everything unlocked on this account.");
            }}
          >
            Unlock all (local)
          </PressableButton>
          <PressableButton
            variant="ghost"
            onClick={() => updateUser({ ...user, ownerFlags: { ...flags, debugOpen: !flags.debugOpen } })}
          >
            {flags.debugOpen ? "Hide" : "Show"} debug
          </PressableButton>
          <PressableButton variant="ghost" onClick={() => setResetOpen(true)}>
            Reset my account
          </PressableButton>
        </div>
        {flags.debugOpen && (
          <pre className="owner-debug">
            {JSON.stringify(
              {
                email: user.email,
                dataVersion: user.dataVersion,
                supabaseId: user.supabaseId || null,
                unlocks: user.unlocks,
                streak: user.streak,
                loginStreak: user.loginStreak,
              },
              null,
              2,
            )}
          </pre>
        )}
      </section>

      <Modal
        open={resetOpen}
        title="Reset your owner account?"
        onClose={() => setResetOpen(false)}
        footer={
          <PressableButton
            onClick={() => {
              resetUserAsOwner(OWNER_EMAIL);
              setResetOpen(false);
            }}
          >
            Yes, reset everything
          </PressableButton>
        }
      >
        <p>
          Wipes <b>all</b> progress, points, unlocks, themes, titles, trophies, tasks, notes, and shop credits back to a
          fresh account. Your login, username, and owner role stay — but you will <b>not</b> auto-own everything on next login.
        </p>
        <p className="soft">Use <b>Unlock all (local)</b> above if you want the old cheat back.</p>
      </Modal>
    </>
  );
}

/* ---------------- Users ---------------- */

function UsersSection() {
  const { store, user, updateOtherUser, createUserAsOwner, impersonateUser, resetUserAsOwner, pushToUserInbox, setToast, patchStore } =
    useStudyGrind();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTargetOpen, setResetTargetOpen] = useState(false);
  const [draft, setDraft] = useState({ email: "", username: "", password: "", role: "user" as Role, vip: false, honour: false });
  const [giftAmount, setGiftAmount] = useState(500);
  const [dm, setDm] = useState("");
  const [warnOpen, setWarnOpen] = useState(false);
  const [pendingImpersonate, setPendingImpersonate] = useState("");

  const users = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.values(store.users)
      .filter((u) => u.email !== OWNER_EMAIL)
      .filter((u) => !q || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
      .sort((a, b) => b.totalStudyMinutes - a.totalStudyMinutes);
  }, [store.users, search]);

  const target = selected ? store.users[selected] : undefined;

  const doImpersonate = (email: string) => {
    if (!store.ownerSwitchWarningSeen) {
      setPendingImpersonate(email);
      setWarnOpen(true);
      return;
    }
    impersonateUser(email);
  };

  const patch = (p: Partial<UserData>) => target && updateOtherUser(target.email, p);

  return (
    <>
      <section className="card owner-panel">
        <div className="row wrap">
          <h4>Users ({users.length})</h4>
          <PressableButton onClick={() => setCreateOpen(true)}>Create user</PressableButton>
        </div>
        <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
        {users.length === 0 && <p className="soft">No other accounts on this device yet.</p>}
        <div className="owner-user-list">
          {users.map((u) => (
            <button
              key={u.email}
              type="button"
              className={`card owner-user ${u.flagged ? "flagged" : ""} ${selected === u.email ? "selected" : ""}`}
              onClick={() => setSelected(u.email)}
            >
              <div className="owner-user-head">
                <div>
                  <b>{u.username}</b>
                  <small className="soft block">{u.email}</small>
                </div>
                <div className="owner-user-badges">
                  <span className="pill">{u.role}</span>
                  {u.vipAccess && <span className="pill">VIP</span>}
                  {u.honoraryAccess && <span className="pill">Honour</span>}
                  {u.banned && <span className="pill danger">Banned</span>}
                  {u.muted && <span className="pill">Muted</span>}
                </div>
              </div>
              <small className="soft">
                {u.totalStudyMinutes}m studied · {u.focusPoints.toLocaleString()} pts · streak {u.streak}
              </small>
            </button>
          ))}
        </div>
      </section>

      {target && (
        <section className="card owner-panel owner-user-editor">
          <div className="row wrap">
            <h4>Editing {target.username}</h4>
            <PressableButton variant="ghost" onClick={() => setSelected("")}>
              Close
            </PressableButton>
          </div>

          <h5>Role and access</h5>
          <div className="chip-group">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                className={`chip ${target.role === r ? "chip-active" : ""}`}
                onClick={() => patch({ role: r, vipAccess: r === "vip" ? true : target.vipAccess })}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="setting-row">
            <span>VIP access</span>
            <Toggle on={target.vipAccess} label="VIP" onClick={() => patch({ vipAccess: !target.vipAccess })} />
          </div>
          <div className="setting-row">
            <span>Honourable access</span>
            <Toggle on={target.honoraryAccess} label="Honour" onClick={() => patch({ honoraryAccess: !target.honoraryAccess })} />
          </div>

          <h5>Expiry</h5>
          <ExpiryRow label="Role expires" value={target.roleExpiresAt} onSet={(v) => patch({ roleExpiresAt: v })} />
          <ExpiryRow label="VIP expires" value={target.vipExpiresAt} onSet={(v) => patch({ vipExpiresAt: v })} />
          <ExpiryRow label="Honour expires" value={target.honoraryExpiresAt} onSet={(v) => patch({ honoraryExpiresAt: v })} />

          <h5>Moderation</h5>
          <div className="setting-row">
            <span>Banned</span>
            <Toggle on={target.banned} label="Banned" onClick={() => patch({ banned: !target.banned })} />
          </div>
          <div className="setting-row">
            <span>Muted</span>
            <Toggle
              on={target.muted}
              label="Muted"
              onClick={() => patch({ muted: !target.muted, mutedUntil: target.muted ? "" : daysFromNow(7) })}
            />
          </div>
          <div className="setting-row">
            <div>
              <span>Flagged / watchlist</span>
              {target.watchlistReason && <small className="soft block">{target.watchlistReason}</small>}
            </div>
            <Toggle on={target.flagged} label="Flagged" onClick={() => patch({ flagged: !target.flagged })} />
          </div>
          <div className="row wrap">
            <PressableButton
              variant="ghost"
              onClick={() => patch({ suspendedUntil: target.suspendedUntil ? "" : daysFromNow(3) })}
            >
              {target.suspendedUntil && new Date(target.suspendedUntil).getTime() > Date.now()
                ? `Unsuspend (until ${fmtDate(target.suspendedUntil)})`
                : "Suspend 3 days"}
            </PressableButton>
            <PressableButton
              variant="ghost"
              onClick={() => {
                patch({ warningCount: target.warningCount + 1 });
                pushToUserInbox(target.email, "Warning from the owner: please follow the community guidelines.");
                setToast(`Warning ${target.warningCount + 1} issued.`);
              }}
            >
              Issue warning ({target.warningCount})
            </PressableButton>
          </div>
          <label className="soft">Watchlist reason</label>
          <input
            value={target.watchlistReason}
            placeholder="Why is this account on the watchlist?"
            onChange={(e) => patch({ watchlistReason: e.target.value })}
          />
          <label className="soft">Owner notes (private)</label>
          <textarea value={target.ownerNotes} placeholder="Private notes about this user..." onChange={(e) => patch({ ownerNotes: e.target.value })} />

          <h5>Gift and message</h5>
          <div className="row wrap">
            <input
              type="number"
              min={1}
              value={giftAmount}
              onChange={(e) => setGiftAmount(Math.max(1, Number(e.target.value) || 0))}
              aria-label="Gift amount"
              className="owner-num"
            />
            <PressableButton
              onClick={() => {
                patch({
                  focusPoints: target.focusPoints + giftAmount,
                  giftedAmount: target.giftedAmount + giftAmount,
                  lastGiftDate: new Date().toISOString(),
                });
                pushToUserInbox(target.email, `The owner gifted you ${giftAmount.toLocaleString()} focus points!`);
                setToast(`Gifted ${giftAmount} pts.`);
              }}
            >
              Gift points
            </PressableButton>
          </div>
          <small className="soft">
            Total gifted: {target.giftedAmount.toLocaleString()} · last {fmtDate(target.lastGiftDate)}
          </small>
          <div className="row wrap">
            <input value={dm} placeholder="Direct message to inbox..." onChange={(e) => setDm(e.target.value)} aria-label="Direct message" />
            <PressableButton
              onClick={() => {
                if (pushToUserInbox(target.email, dm)) {
                  setDm("");
                  setToast("Message delivered.");
                }
              }}
            >
              Send
            </PressableButton>
          </div>

          <h5>Themes</h5>
          <div className="chip-group">
            {store.customThemes.map((t) => {
              const owned = target.ownedCustomThemes.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`chip ${owned ? "chip-active" : ""}`}
                  onClick={() =>
                    patch({
                      ownedCustomThemes: owned
                        ? target.ownedCustomThemes.filter((id) => id !== t.id)
                        : [...target.ownedCustomThemes, t.id],
                    })
                  }
                >
                  {t.name}
                </button>
              );
            })}
            {store.customThemes.length === 0 && <small className="soft">Publish a global theme first.</small>}
          </div>

          <h5>Account</h5>
          <div className="row wrap">
            <PressableButton variant="ghost" onClick={() => doImpersonate(target.email)}>
              View as this user
            </PressableButton>
            <PressableButton
              variant="ghost"
              onClick={() => {
                patch({ password: "studygrind123" });
                setToast("Password reset to studygrind123");
              }}
            >
              Reset password
            </PressableButton>
            <PressableButton variant="ghost" onClick={() => setResetTargetOpen(true)}>
              Reset account
            </PressableButton>
          </div>
          {user && (
            <small className="soft">
              Joined {fmtDate(target.createdAt)} · Supabase {target.supabaseId ? "linked" : "not linked"} · owner: {user.username}
            </small>
          )}
        </section>
      )}

      <Modal
        open={resetTargetOpen && !!target}
        title={`Reset ${target?.username ?? "user"}?`}
        onClose={() => setResetTargetOpen(false)}
        footer={
          target && (
            <PressableButton
              onClick={() => {
                resetUserAsOwner(target.email);
                setResetTargetOpen(false);
                setSelected("");
              }}
            >
              Yes, reset account
            </PressableButton>
          )
        }
      >
        {target && (
          <p>
            Wipes all progress, points, unlocks, themes, titles, trophies, tasks, and notes for <b>{target.email}</b>.
            Login email and password stay the same; role resets to <b>user</b>.
          </p>
        )}
      </Modal>

      <Modal
        open={createOpen}
        title="Create user"
        onClose={() => setCreateOpen(false)}
        footer={
          <PressableButton
            onClick={() => {
              if (createUserAsOwner(draft)) {
                setCreateOpen(false);
                setDraft({ email: "", username: "", password: "", role: "user", vip: false, honour: false });
              }
            }}
          >
            Create
          </PressableButton>
        }
      >
        <input placeholder="Email / login" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        <input placeholder="Username" value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} />
        <input placeholder="Password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
        <div className="chip-group">
          {ROLES.map((r) => (
            <button key={r} type="button" className={`chip ${draft.role === r ? "chip-active" : ""}`} onClick={() => setDraft({ ...draft, role: r })}>
              {r}
            </button>
          ))}
        </div>
        <div className="setting-row">
          <span>VIP</span>
          <Toggle on={draft.vip} label="VIP" onClick={() => setDraft({ ...draft, vip: !draft.vip })} />
        </div>
        <div className="setting-row">
          <span>Honourable</span>
          <Toggle on={draft.honour} label="Honour" onClick={() => setDraft({ ...draft, honour: !draft.honour })} />
        </div>
      </Modal>

      <Modal
        open={warnOpen}
        title="View as another user"
        onClose={() => setWarnOpen(false)}
        footer={
          <PressableButton
            onClick={() => {
              patchStore({ ownerSwitchWarningSeen: true });
              setWarnOpen(false);
              impersonateUser(pendingImpersonate);
            }}
          >
            Continue
          </PressableButton>
        }
      >
        <p>
          You will see the app exactly as this user does. Anything you do (sessions, purchases, edits) is saved to <b>their</b> account.
          Use the banner at the top to return to the owner account.
        </p>
        <p className="soft">This warning only shows once.</p>
      </Modal>
    </>
  );
}

function ExpiryRow({ label, value, onSet }: { label: string; value: string; onSet: (iso: string) => void }) {
  return (
    <div className="setting-row">
      <div>
        <span>{label}</span>
        <small className="soft block">{value ? fmtDate(value) : "Never"}</small>
      </div>
      <div className="row wrap owner-expiry-btns">
        <button type="button" className="chip" onClick={() => onSet(daysFromNow(7))}>
          7d
        </button>
        <button type="button" className="chip" onClick={() => onSet(daysFromNow(30))}>
          30d
        </button>
        <button type="button" className="chip" onClick={() => onSet("")}>
          Never
        </button>
      </div>
    </div>
  );
}

/* ---------------- Themes ---------------- */

function ThemesSection() {
  const { store, user, patchStore, updateUser, setToast } = useStudyGrind();
  const [name, setName] = useState("Owner Theme");
  const [color, setColor] = useState("#31be83");
  const [color2, setColor2] = useState("#2d9ce2");
  const [gradient, setGradient] = useState(true);
  if (!user) return null;

  const publish = () => {
    if (!name.trim()) return setToast("Give the theme a name.");
    const entry = {
      id: `custom-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      color,
      color2: gradient ? color2 : undefined,
      gradient,
      createdBy: user.email,
      createdAt: new Date().toISOString(),
    };
    patchStore({ customThemes: [...store.customThemes, entry] });
    setToast(`Published "${entry.name}" globally.`);
  };

  return (
    <>
      <section className="card owner-panel theme-studio">
        <h4>Publish global theme</h4>
        <p className="soft">Global themes are available to every account you grant them to, unlike Theme Studio which is per-user.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Theme name" />
        <label className="soft">Primary colour</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Primary colour" />
        <label>
          <input type="checkbox" checked={gradient} onChange={(e) => setGradient(e.target.checked)} /> Gradient
        </label>
        {gradient && (
          <>
            <label className="soft">Second colour</label>
            <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} aria-label="Second colour" />
          </>
        )}
        <div className="theme-preview-strip" style={{ background: gradient ? `linear-gradient(135deg,${color},${color2})` : color }}>
          <span>{name || "Preview"}</span>
        </div>
        <PressableButton onClick={publish}>Publish</PressableButton>
      </section>

      <section className="card owner-panel">
        <h4>Published themes ({store.customThemes.length})</h4>
        {store.customThemes.length === 0 && <p className="soft">Nothing published yet.</p>}
        <div className="custom-theme-chip-row">
          {store.customThemes.map((t) => (
            <span key={t.id} className="custom-theme-chip">
              <span
                className="swatch"
                style={{ background: t.gradient && t.color2 ? `linear-gradient(135deg,${t.color},${t.color2})` : t.color }}
              />
              {t.name}
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  updateUser({ ...user, equippedTheme: t.id });
                  setToast(`Equipped ${t.name}.`);
                }}
                aria-label={`Equip ${t.name}`}
              >
                Equip
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => patchStore({ customThemes: store.customThemes.filter((x) => x.id !== t.id) })}
                aria-label={`Delete ${t.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <p className="soft">Grant a published theme to a specific user from Users → Themes.</p>
      </section>
    </>
  );
}

/* ---------------- Broadcast ---------------- */

function BroadcastSection() {
  const { store, user, patchStore, massBroadcastInbox, setToast } = useStudyGrind();
  const [text, setText] = useState("");
  const [days, setDays] = useState(3);
  const [eventLabel, setEventLabel] = useState("Double points event");
  const [mult, setMult] = useState(2);
  const [eventDays, setEventDays] = useState(2);
  const [inboxMsg, setInboxMsg] = useState("");
  if (!user) return null;

  return (
    <>
      <section className="card owner-panel">
        <h4>Announcement banner</h4>
        {store.announcement ? (
          <div className="setting-row">
            <div>
              <span>{store.announcement.text}</span>
              <small className="soft block">Expires {fmtDate(store.announcement.expiresAt)}</small>
            </div>
            <PressableButton variant="ghost" onClick={() => patchStore({ announcement: null })}>
              Clear
            </PressableButton>
          </div>
        ) : (
          <p className="soft">No active announcement.</p>
        )}
        <textarea value={text} placeholder="Shown on every Home page and in the bell..." onChange={(e) => setText(e.target.value)} />
        <div className="row wrap">
          <label className="soft">
            Days:{" "}
            <input type="number" min={1} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} className="owner-num" />
          </label>
          <PressableButton
            onClick={() => {
              if (!text.trim()) return setToast("Write something first.");
              patchStore({
                announcement: { text: text.trim(), expiresAt: daysFromNow(days), createdBy: user.email, createdAt: new Date().toISOString() },
              });
              setText("");
              setToast("Announcement live.");
            }}
          >
            Publish
          </PressableButton>
        </div>
      </section>

      <section className="card owner-panel">
        <h4>Global points event</h4>
        <p className="soft">
          Automatic 2× points run every Wednesday, Friday, and Sunday in each user&apos;s local timezone. Start a manual event below to stack an extra multiplier on top.
        </p>
        {store.globalEvent ? (
          <div className="setting-row">
            <div>
              <span>
                {store.globalEvent.label} · {store.globalEvent.multiplier}x
              </span>
              <small className="soft block">Ends {fmtDate(store.globalEvent.expiresAt)}</small>
            </div>
            <PressableButton variant="ghost" onClick={() => patchStore({ globalEvent: null })}>
              End event
            </PressableButton>
          </div>
        ) : (
          <p className="soft">No event running.</p>
        )}
        <input value={eventLabel} onChange={(e) => setEventLabel(e.target.value)} placeholder="Event label" />
        <div className="row wrap">
          <label className="soft">
            Multiplier:{" "}
            <input type="number" min={1} max={5} step={0.5} value={mult} onChange={(e) => setMult(Number(e.target.value) || 1)} className="owner-num" />
          </label>
          <label className="soft">
            Days:{" "}
            <input type="number" min={1} value={eventDays} onChange={(e) => setEventDays(Math.max(1, Number(e.target.value) || 1))} className="owner-num" />
          </label>
          <PressableButton
            onClick={() => {
              patchStore({ globalEvent: { label: eventLabel.trim() || "Points event", multiplier: mult, expiresAt: daysFromNow(eventDays), createdBy: user.email } });
              setToast("Event started.");
            }}
          >
            Start event
          </PressableButton>
        </div>
      </section>

      <section className="card owner-panel">
        <h4>Mass inbox message</h4>
        <p className="soft">Delivers to every user's inbox (shows in their notification bell).</p>
        <textarea value={inboxMsg} placeholder="Message to all users..." onChange={(e) => setInboxMsg(e.target.value)} />
        <PressableButton
          onClick={() => {
            if (massBroadcastInbox(inboxMsg)) setInboxMsg("");
          }}
        >
          Send to everyone
        </PressableButton>
      </section>
    </>
  );
}

/* ---------------- Moderation ---------------- */

function ModerationSection() {
  const { store, user, patchStore, updateOtherUser, updateUser, setToast } = useStudyGrind();
  if (!user) return null;
  const open = store.reports.filter((r) => r.status === "open");
  const closed = store.reports.filter((r) => r.status !== "open");

  const setStatus = (id: string, status: "resolved" | "dismissed") =>
    patchStore({ reports: store.reports.map((r) => (r.id === id ? { ...r, status } : r)) });

  return (
    <>
      <section className="card owner-panel">
        <h4>Owner inbox ({user.inbox.length})</h4>
        {user.inbox.length === 0 ? (
          <p className="soft">No messages. Honourable members can write to you from their Home page.</p>
        ) : (
          <>
            <ul className="owner-inbox-list">
              {user.inbox.map((m, i) => (
                <li key={`${i}-${m.slice(0, 12)}`}>{m}</li>
              ))}
            </ul>
            <PressableButton variant="ghost" onClick={() => updateUser({ ...user, inbox: [] })}>
              Clear inbox
            </PressableButton>
          </>
        )}
      </section>

      <section className="card owner-panel">
        <h4>Open reports ({open.length})</h4>
        {open.length === 0 && <p className="soft">Queue is clear.</p>}
        {open.map((r) => (
          <details key={r.id} className="report-details">
            <summary>
              <b>{store.users[r.reportee]?.username ?? r.reportee}</b> reported by {store.users[r.reporter]?.username ?? r.reporter} · {fmtDate(r.timestamp)}
            </summary>
            <p>{r.reason}</p>
            <div className="row wrap">
              <PressableButton
                onClick={() => {
                  setStatus(r.id, "resolved");
                  setToast("Report resolved.");
                }}
              >
                Resolve
              </PressableButton>
              <PressableButton variant="ghost" onClick={() => setStatus(r.id, "dismissed")}>
                Dismiss
              </PressableButton>
              {store.users[r.reportee] && (
                <PressableButton
                  variant="ghost"
                  onClick={() => {
                    updateOtherUser(r.reportee, { flagged: true, watchlistReason: `Report: ${r.reason.slice(0, 80)}` });
                    setStatus(r.id, "resolved");
                    setToast("User flagged.");
                  }}
                >
                  Flag user
                </PressableButton>
              )}
            </div>
          </details>
        ))}
      </section>

      {closed.length > 0 && (
        <section className="card owner-panel">
          <div className="row wrap">
            <h4>Closed reports ({closed.length})</h4>
            <PressableButton variant="ghost" onClick={() => patchStore({ reports: open })}>
              Purge closed
            </PressableButton>
          </div>
          {closed.slice(0, 20).map((r) => (
            <small key={r.id} className="soft block">
              [{r.status}] {store.users[r.reportee]?.username ?? r.reportee} — {r.reason.slice(0, 60)}
            </small>
          ))}
        </section>
      )}
    </>
  );
}

/* ---------------- Mentor ---------------- */

function MentorSection() {
  const { store, user, patchStore, setToast } = useStudyGrind();
  const [reply, setReply] = useState("");
  const [challenge, setChallenge] = useState("");
  if (!user) return null;
  const pending = store.pendingChallenges.filter((c) => c.status === "pending");

  return (
    <>
      <section className="card owner-panel">
        <h4>Active challenge</h4>
        {store.activeChallenge ? (
          <div className="setting-row">
            <div>
              <span>{store.activeChallenge.text}</span>
              <small className="soft block">
                by {store.users[store.activeChallenge.submittedBy]?.username ?? store.activeChallenge.submittedBy} · {fmtDate(store.activeChallenge.activatedAt)}
              </small>
            </div>
            <PressableButton variant="ghost" onClick={() => patchStore({ activeChallenge: null })}>
              End
            </PressableButton>
          </div>
        ) : (
          <p className="soft">No active challenge on Home / Mentor Hub.</p>
        )}
        <textarea value={challenge} placeholder="Write a new community challenge..." onChange={(e) => setChallenge(e.target.value)} />
        <PressableButton
          onClick={() => {
            if (!challenge.trim()) return setToast("Write the challenge first.");
            patchStore({ activeChallenge: { text: challenge.trim(), submittedBy: user.email, activatedAt: new Date().toISOString() } });
            setChallenge("");
            setToast("Challenge is live.");
          }}
        >
          Set as active
        </PressableButton>
      </section>

      <section className="card owner-panel">
        <h4>Submitted challenges ({pending.length})</h4>
        {pending.length === 0 && <p className="soft">No pending submissions.</p>}
        {pending.map((c) => (
          <div key={c.id} className="setting-row">
            <div>
              <span>{c.text}</span>
              <small className="soft block">
                {store.users[c.submittedBy]?.username ?? c.submittedBy} · {fmtDate(c.submittedAt)}
              </small>
            </div>
            <div className="row wrap">
              <button
                type="button"
                className="chip chip-active"
                onClick={() =>
                  patchStore({
                    pendingChallenges: store.pendingChallenges.map((x) => (x.id === c.id ? { ...x, status: "approved" } : x)),
                    activeChallenge: { text: c.text, submittedBy: c.submittedBy, activatedAt: new Date().toISOString() },
                  })
                }
              >
                Approve
              </button>
              <button
                type="button"
                className="chip"
                onClick={() =>
                  patchStore({ pendingChallenges: store.pendingChallenges.map((x) => (x.id === c.id ? { ...x, status: "rejected" } : x)) })
                }
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="card owner-panel">
        <h4>Mentor quick replies</h4>
        <div className="chip-group">
          {store.quickReplies.map((q, i) => (
            <span key={`${i}-${q}`} className="quickreply-pill chip">
              {q}
              <button
                type="button"
                className="ghost"
                aria-label="Remove reply"
                onClick={() => patchStore({ quickReplies: store.quickReplies.filter((_, idx) => idx !== i) })}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="row wrap">
          <input value={reply} placeholder="New quick reply..." onChange={(e) => setReply(e.target.value)} />
          <PressableButton
            onClick={() => {
              if (!reply.trim()) return;
              patchStore({ quickReplies: [...store.quickReplies, reply.trim()] });
              setReply("");
            }}
          >
            Add
          </PressableButton>
        </div>
      </section>
    </>
  );
}

/* ---------------- System ---------------- */

function SystemSection() {
  const { store, patchStore, exportStoreBackup, importStoreBackup, setToast, maintenance, setMaintenanceMode, refreshMaintenance } = useStudyGrind();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmImport, setConfirmImport] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [maintMsg, setMaintMsg] = useState(maintenance.message);
  const [maintBusy, setMaintBusy] = useState(false);
  const log = showAll ? store.auditLog : store.auditLog.slice(0, 30);

  const toggleMaintenance = async () => {
    const next = !maintenance.on;
    setMaintBusy(true);
    const ok = await setMaintenanceMode(next, maintMsg.trim());
    setMaintBusy(false);
    patchStore({
      announcement: next
        ? { text: "StudyGrind is in maintenance mode. Some features may be unavailable.", expiresAt: daysFromNow(30), createdBy: OWNER_EMAIL, createdAt: new Date().toISOString() }
        : store.announcement?.text.startsWith("StudyGrind is in maintenance mode")
          ? null
          : store.announcement,
    });
    if (ok) setToast(next ? "Maintenance mode ON for all devices." : "Maintenance mode OFF for all devices.");
  };

  return (
    <>
      <section className="card owner-panel">
        <h4>App controls</h4>
        <div className="setting-row">
          <div>
            <span>Maintenance mode</span>
            <small className="soft block">
              Locks every non-owner device out (synced via Supabase).{" "}
              {maintenance.checking ? "Checking…" : maintenance.remoteOk ? "Remote: connected" : "Remote: unreachable — using local cache"}
            </small>
          </div>
          <Toggle on={maintenance.on} label="Maintenance mode" onClick={() => void toggleMaintenance()} />
        </div>
        <div className="row wrap" style={{ marginBottom: 10 }}>
          <input
            value={maintMsg}
            placeholder="Message shown to locked-out users (optional)"
            onChange={(e) => setMaintMsg(e.target.value.slice(0, 200))}
            aria-label="Maintenance message"
          />
          <PressableButton
            variant="ghost"
            disabled={maintBusy}
            onClick={async () => {
              setMaintBusy(true);
              const ok = await setMaintenanceMode(maintenance.on, maintMsg.trim());
              setMaintBusy(false);
              if (ok) setToast("Maintenance message saved.");
            }}
          >
            Save message
          </PressableButton>
          <PressableButton variant="ghost" onClick={() => void refreshMaintenance()}>
            Refresh status
          </PressableButton>
        </div>
        {!maintenance.remoteOk && !maintenance.checking && (
          <p className="soft" style={{ fontSize: 12 }}>
            To sync across devices, create the <code>app_config</code> table in Supabase (SQL is documented in <code>src/lib/app-config.ts</code>).
          </p>
        )}
        <div className="setting-row">
          <div>
            <span>Force appearance</span>
            <small className="soft block">Override every user's dark/light preference</small>
          </div>
          <div className="chip-group">
            {(["off", "dark", "light"] as const).map((m) => (
              <button key={m} type="button" className={`chip ${store.forceMode === m ? "chip-active" : ""}`} onClick={() => patchStore({ forceMode: m })}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <span>Reset "view as user" warning</span>
          <PressableButton variant="ghost" onClick={() => patchStore({ ownerSwitchWarningSeen: false })}>
            Reset
          </PressableButton>
        </div>
      </section>

      <section className="card owner-panel">
        <h4>Backup</h4>
        <p className="soft">Export the whole local store as JSON, or restore from a previous export. Import replaces everything on this device.</p>
        <div className="row wrap">
          <PressableButton onClick={exportStoreBackup}>Export backup</PressableButton>
          <PressableButton variant="ghost" onClick={() => fileRef.current?.click()}>
            Import backup
          </PressableButton>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              f.text().then((raw) => setConfirmImport(raw));
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="card owner-panel">
        <div className="row wrap">
          <h4>Audit log ({store.auditLog.length})</h4>
          <div className="row wrap">
            {store.auditLog.length > 30 && (
              <PressableButton variant="ghost" onClick={() => setShowAll((s) => !s)}>
                {showAll ? "Show less" : "Show all"}
              </PressableButton>
            )}
          </div>
        </div>
        {log.length === 0 && <p className="soft">Nothing logged yet.</p>}
        <div className="owner-audit-list">
          {log.map((e) => (
            <small key={e.id} className="block">
              <span className="soft">{new Date(e.timestamp).toLocaleString()}</span> · <b>{e.action}</b> → {e.target}
              {e.detail ? ` (${e.detail})` : ""}
            </small>
          ))}
        </div>
      </section>

      <Modal
        open={confirmImport !== null}
        title="Replace all local data?"
        onClose={() => setConfirmImport(null)}
        footer={
          <PressableButton
            onClick={() => {
              if (confirmImport && importStoreBackup(confirmImport)) setConfirmImport(null);
            }}
          >
            Yes, restore backup
          </PressableButton>
        }
      >
        <p>This overwrites every account and setting on this device with the backup file. Export a fresh backup first if unsure.</p>
      </Modal>
    </>
  );
}
