import { Crown } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { OWNER_EMAIL } from "../data/constants";
import { PageTransition } from "../components/ui/PageTransition";

export function HonourPage() {
  const { store } = useStudyGrind();
  const users = Object.values(store.users).filter((u) => u.honoraryAccess || u.role === "owner");
  const leaderboard = Object.values(store.users)
    .filter((u) => u.email !== OWNER_EMAIL)
    .sort((a, b) => b.totalStudyMinutes - a.totalStudyMinutes)
    .slice(0, 12);

  return (
    <PageTransition>
      <section className="hero-panel honour-hero">
        <h4>
          <Crown size={16} /> Hall of Honour
        </h4>
        <p>Top studiers and honourable members.</p>
      </section>
      <section className="card">
        <h4>Honour roll</h4>
        {users.map((u) => (
          <p key={u.email}>
            <b>{u.username}</b> — {u.totalStudyMinutes}m · streak {u.streak}
          </p>
        ))}
      </section>
      <section className="card">
        <h4>Leaderboard</h4>
        {leaderboard.map((u, i) => (
          <p key={u.email}>
            #{i + 1} {u.username} — {u.totalStudyMinutes}m
          </p>
        ))}
      </section>
    </PageTransition>
  );
}
