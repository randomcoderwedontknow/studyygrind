import { useState } from "react";
import { Palette } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { UNLOCK_IDS, COLOUR_MAKER_PRICE } from "../data/constants";
import { applyThemeToDocument } from "../lib/theme-engine";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";

export function ThemeStudioPage() {
  const { user, updateUser, hasUnlock, goTab, setToast } = useStudyGrind();
  const [name, setName] = useState("My Theme");
  const [color, setColor] = useState("#31be83");
  const [color2, setColor2] = useState("#2d9ce2");
  const [gradient, setGradient] = useState(true);

  if (!user) return null;
  if (!hasUnlock(UNLOCK_IDS.colourMaker)) {
    return (
      <section className="card">
        <h4>Colour Studio locked</h4>
        <p className="soft">Unlock for {COLOUR_MAKER_PRICE.toLocaleString()} pts in the shop.</p>
        <PressableButton onClick={() => goTab("shop")}>Go to shop</PressableButton>
      </section>
    );
  }

  const runPreview = () => {
    document.body.style.setProperty("--primary", color);
    if (gradient) {
      document.body.style.setProperty("--primary-2", color2);
      document.body.dataset.gradient = "true";
    }
  };

  const saveTheme = () => {
    const id = `user-theme-${crypto.randomUUID().slice(0, 8)}`;
    const entry = { id, name, color, color2: gradient ? color2 : undefined, gradient, createdAt: new Date().toISOString() };
    updateUser({
      ...user,
      savedCustomThemes: [...user.savedCustomThemes, entry],
      equippedTheme: id,
    });
    applyThemeToDocument(id, [], [...user.savedCustomThemes, entry]);
    setToast("Custom theme saved and equipped.");
  };

  return (
    <PageTransition>
      <section className="card theme-studio">
        <h4>
          <Palette size={16} /> Colour & Gradient Studio
        </h4>
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
          <span>Preview strip</span>
        </div>
        <div className="theme-liquid-preview">
          <div className="liquid-surface mini-card">
            <small className="soft">Card</small>
            <b>Liquid surface</b>
          </div>
          <div className="liquid-surface mini-card" style={{ background: gradient ? `linear-gradient(135deg,${color},${color2})` : color, color: "#fff" }}>
            <small>Accent</small>
            <b>Nav chip</b>
          </div>
        </div>
        <div className="row wrap">
          <PressableButton onClick={runPreview}>Preview</PressableButton>
          <PressableButton onClick={saveTheme}>Save & equip</PressableButton>
        </div>
        {user.savedCustomThemes.length > 0 && (
          <>
            <h5>Saved themes</h5>
            <div className="chip-group">
              {user.savedCustomThemes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="chip"
                  onClick={() => {
                    updateUser({ ...user, equippedTheme: t.id });
                    applyThemeToDocument(t.id, [], user.savedCustomThemes);
                    setToast(`${t.name} equipped.`);
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </PageTransition>
  );
}
