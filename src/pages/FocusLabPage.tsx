import { useMemo } from "react";
import { FlaskConical, Target } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { UNLOCK_IDS, FOCUS_LAB_PRICE } from "../data/constants";
import { WeeklyChallengeCard } from "../components/weekly/WeeklyChallengeCard";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";

export function FocusLabPage() {
  const { user, updateUser, hasUnlock, goTab, setToast, showReward } = useStudyGrind();
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMins = user?.weeklyHistory[todayKey] ?? 0;

  const mission = useMemo(() => {
    const day = new Date().getDate() % 4;
    const missions = [
      { text: "Complete 15 focus minutes today", check: () => todayMins >= 15, reward: 80 },
      { text: "Start a session before noon", check: () => (user?.sessionLog ?? []).some((s) => s.at.startsWith(todayKey) && s.hour < 12), reward: 60 },
      { text: "Link a task to your timer", check: () => (user?.sessionLog ?? []).some((s) => s.taskId), reward: 50 },
      { text: "Try a 45-min focus preset", check: () => (user?.focusDurationMin ?? 0) >= 45, reward: 40 },
    ];
    return missions[day];
  }, [todayMins, user?.sessionLog, user?.focusDurationMin, todayKey]);

  if (!user) return null;
  if (!hasUnlock(UNLOCK_IDS.focusLab)) {
    return (
      <section className="card">
        <h4>Focus Lab locked</h4>
        <p className="soft">Unlock for {FOCUS_LAB_PRICE.toLocaleString()} pts in the shop.</p>
        <PressableButton onClick={() => goTab("shop")}>Go to shop</PressableButton>
      </section>
    );
  }

  const fls = user.focusLabStats;

  const claimMission = () => {
    if (fls.lastMissionDate === new Date().toDateString()) return setToast("Mission already claimed today.");
    if (!mission.check()) return setToast("Mission not complete yet.");
    updateUser({
      ...user,
      focusPoints: user.focusPoints + mission.reward,
      focusLabStats: {
        ...fls,
        lastMissionDate: new Date().toDateString(),
        missionsCompleted: fls.missionsCompleted + 1,
      },
    });
    showReward("Daily mission!", mission.text, mission.reward);
  };

  return (
    <PageTransition stagger>
      <section className="hero-panel">
        <h4>
          <FlaskConical size={16} /> Focus Lab
        </h4>
        <p>See your focus habits, stats, and simple daily goals.</p>
      </section>

      <WeeklyChallengeCard />

      <section className="grid3 page-enter-stagger">
        <article className="metric">
          <small>Best session</small>
          <b>{fls.bestSessionMinutes}m</b>
        </article>
        <article className="metric">
          <small>Favourite length</small>
          <b>{fls.favouriteFocusMin}m</b>
        </article>
        <article className="metric">
          <small>Best hour</small>
          <b>{fls.bestHour}:00</b>
        </article>
        <article className="metric">
          <small>Focus streak</small>
          <b>{user.streak}d</b>
        </article>
        <article className="metric">
          <small>Today</small>
          <b>{todayMins}m</b>
        </article>
        <article className="metric">
          <small>Missions done</small>
          <b>{fls.missionsCompleted}</b>
        </article>
      </section>

      <section className="card mission-card">
        <h4>
          <Target size={14} /> Daily focus mission
        </h4>
        <p>{mission.text}</p>
        <p className="soft">Reward: {mission.reward} pts</p>
        <PressableButton onClick={claimMission}>
          {fls.lastMissionDate === new Date().toDateString() ? "Claimed today" : "Claim reward"}
        </PressableButton>
      </section>

      <section className="card">
        <h4>Focus challenges</h4>
        <ul>
          <li>Beat your best session ({fls.bestSessionMinutes}m)</li>
          <li>Study at your best hour ({fls.bestHour}:00)</li>
          <li>Complete 3 sessions this week</li>
        </ul>
        <PressableButton onClick={() => goTab("timer")}>Open timer</PressableButton>
      </section>

      <section className="card">
        <h4>Experiment</h4>
        <p className="soft">Set default focus/break in Timer — changes sync here.</p>
        <p>
          Current: {user.focusDurationMin}m focus / {user.breakDurationMin}m break
        </p>
      </section>
    </PageTransition>
  );
}
