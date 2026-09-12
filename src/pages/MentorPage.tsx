import { Crown } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { UNLOCK_IDS, MENTOR_HUB_PRICE } from "../data/constants";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";

export function MentorPage() {
  const { user, hasUnlock, goTab, store } = useStudyGrind();
  if (!user) return null;

  const canAccess = hasUnlock(UNLOCK_IDS.mentorHub) || user.honoraryAccess || user.role === "owner";

  if (!canAccess) {
    return (
      <section className="card">
        <h4>Mentor Hub</h4>
        <p className="soft">Unlock for {MENTOR_HUB_PRICE.toLocaleString()} pts in the shop.</p>
        <PressableButton onClick={() => goTab("shop")}>Go to shop</PressableButton>
      </section>
    );
  }

  const mentees = Object.values(store.users).filter((u) => u.mentorMessage?.from === user.email);

  return (
    <PageTransition>
      <section className="hero-panel honour-hero">
        <h4>
          <Crown size={16} /> Mentor Hub
        </h4>
        <p>Mentees: {mentees.length}</p>
      </section>
      {user.mentorMessage && (
        <section className="card mentor-card">
          <h4>Your mentor says</h4>
          <p>{user.mentorMessage.text}</p>
          <small className="soft">— {user.mentorMessage.fromName}</small>
        </section>
      )}
      {store.activeChallenge && (
        <section className="card">
          <h4>Active challenge</h4>
          <p>{store.activeChallenge.text}</p>
        </section>
      )}
    </PageTransition>
  );
}
