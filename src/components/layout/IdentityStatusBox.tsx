import { useMemo } from "react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { themeAppearance } from "../../data/themes";
import { comboLabel, comboMultiplier } from "../../lib/combo";

export function IdentityStatusBox() {
  const { user, store, studyRankLabel, displayTitle, previewTheme, setTitleHubOpen } = useStudyGrind();

  const stats = useMemo(() => {
    if (!user) return { pendingTasks: 0, taggedMinutes: 0, themeName: "" };
    const pendingTasks = user.tasks.filter((t) => t.status !== "done").length;
    const taggedMinutes = Object.values(user.tags).reduce((sum, m) => sum + m, 0);
    const themeId = previewTheme ?? user.equippedTheme;
    const themeName = themeAppearance(themeId, store.customThemes, user.savedCustomThemes).name;
    return { pendingTasks, taggedMinutes, themeName };
  }, [user, store.customThemes, previewTheme]);

  if (!user) return null;

  return (
    <section className="identity-status-box" aria-label="Your rank, title, and study snapshot">
      <button type="button" className="identity-main pressable" onClick={() => setTitleHubOpen(true)}>
        <span className="identity-rank">{studyRankLabel}</span>
        <strong className="identity-title">{displayTitle}</strong>
        <span className="identity-theme">
          Active theme: <b>{stats.themeName}</b>
          {previewTheme && <em className="identity-preview"> (preview)</em>}
        </span>
        <span className="identity-theme soft">{comboLabel(comboMultiplier(user))}</span>
      </button>
      <div className="identity-stats">
        <article className="identity-stat">
          <small>Pending tasks</small>
          <b>{stats.pendingTasks}</b>
        </article>
        <article className="identity-stat">
          <small>Tagged minutes</small>
          <b>{stats.taggedMinutes}</b>
        </article>
      </div>
    </section>
  );
}
