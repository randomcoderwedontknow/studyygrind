import { Clock3, ListTodo, Sliders, Target } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { PageTransition } from "../../components/ui/PageTransition";
import { PressableButton } from "../../components/ui/PressableButton";

export function BetaHomePage() {
  const { goTab, leaveBetaShell } = useStudyGrind();

  const cards = [
    {
      id: "focusPresetLab" as const,
      title: "Focus Preset Lab",
      desc: "Save and edit timer presets — soundscape, lock, durations.",
      icon: <Sliders size={20} />,
    },
    {
      id: "routineBuilder" as const,
      title: "Routine Builder",
      desc: "Chain focus blocks and prompts into reusable routines.",
      icon: <ListTodo size={20} />,
    },
    {
      id: "goals" as const,
      title: "Goals",
      desc: "Long-term goals with milestones and target dates.",
      icon: <Target size={20} />,
    },
  ];

  return (
    <PageTransition>
      <section className="hero-panel beta-hero">
        <h4>Beta hub</h4>
        <p className="soft">You are in the beta area — only tools needed to test new features.</p>
        <PressableButton onClick={() => goTab("timer")}>
          <Clock3 size={16} /> Start focus timer
        </PressableButton>
      </section>

      <div className="beta-feature-grid">
        {cards.map((c) => (
          <article key={c.id} className="card beta-feature-card" onClick={() => goTab(c.id)} role="button" tabIndex={0}>
            <span className="beta-feature-icon">{c.icon}</span>
            <b>{c.title}</b>
            <p className="soft">{c.desc}</p>
            <PressableButton onClick={() => goTab(c.id)}>Open</PressableButton>
          </article>
        ))}
      </div>

      <section className="card">
        <PressableButton variant="ghost" onClick={leaveBetaShell}>
          Leave beta area
        </PressableButton>
      </section>
    </PageTransition>
  );
}
