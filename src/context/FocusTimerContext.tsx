import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pointsEventMultiplier } from "../lib/point-multiplier";
import { computeSessionReward } from "../lib/points";
import { comboMultiplier } from "../lib/combo";
import { addWeeklyMinutes } from "../lib/week";
import { dayDiff, todayKey } from "../lib/dates";
import { SESSION_LOG_CAP } from "../data/constants";
import { playTimerEndSound } from "../lib/timer-audio";
import { hapticSuccess } from "../lib/haptics";
import { setSoundscapeVolume, startSoundscape, stopSoundscape, type SoundscapeId } from "../lib/soundscapes";
import { useStudyGrind } from "./StudyGrindContext";
import type { SessionReflection, TimerPhase, UserData } from "../types";

export type SessionMeta = {
  focusRating?: 1 | 2 | 3 | 4 | 5;
  reflection?: SessionReflection;
};

export type FinishSessionResult = {
  earned: number;
  studied: number;
  shieldNote: string;
};

type FocusTimerCtx = {
  phase: TimerPhase;
  secondsLeft: number;
  running: boolean;
  setRunning: (r: boolean) => void;
  breakMessage: string;
  setBreakMessage: (m: string) => void;
  focusSecondsThisSession: number;
  focusBlockCompleted: boolean;
  completedFullFocus: boolean;
  pendingPoints: number;
  pendingBase: number;
  comboMult: number;
  eventMult: number;
  ownerMult: number;
  focusMin: number;
  breakMin: number;
  applyDurations: (f: number, b: number) => void;
  finishSession: (early: boolean, sessionMeta?: SessionMeta) => FinishSessionResult | null;
  progressRatio: number;
  moodBefore: string;
  moodAfter: string;
  setMoodBefore: (m: string) => void;
  setMoodAfter: (m: string) => void;
};

const FocusTimerContext = createContext<FocusTimerCtx | null>(null);

export function useFocusTimer() {
  const c = useContext(FocusTimerContext);
  if (!c) throw new Error("useFocusTimer outside FocusTimerProvider");
  return c;
}

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const {
    store,
    user,
    updateUser,
    setToast,
    enqueueCelebration,
    selectedTaskId,
    setTimerRunning,
    setTimerSnapshot,
  } = useStudyGrind();

  const [moodBefore, setMoodBefore] = useState("Focused");
  const [moodAfter, setMoodAfter] = useState("Proud");

  const focusMin = user?.focusDurationMin ?? 25;
  const breakMin = user?.breakDurationMin ?? 5;
  const [phase, setPhase] = useState<TimerPhase>("focus");
  const [secondsLeft, setSecondsLeft] = useState(focusMin * 60);
  const [running, setRunningState] = useState(false);
  const [breakMessage, setBreakMessage] = useState("");
  const [focusSecondsThisSession, setFocusSecondsThisSession] = useState(0);
  const [focusBlockCompleted, setFocusBlockCompleted] = useState(false);
  const timerAnchorRef = useRef<{ startedAt: number; baseSeconds: number } | null>(null);
  const phaseRef = useRef(phase);
  const runningRef = useRef(running);
  phaseRef.current = phase;
  runningRef.current = running;

  const selectedTask = user?.tasks.find((t) => t.id === selectedTaskId);
  const activeTaskTag = selectedTask?.tag ?? "General";
  const ownerBoost = user?.role === "owner" && user.ownerFlags.pointsBoostOn;

  const comboMult = user ? comboMultiplier(user) : 1;
  const eventMult = pointsEventMultiplier(store);
  const ownerMult = ownerBoost ? 2 : 1;
  const rewardPreview = computeSessionReward(focusSecondsThisSession, comboMult, ownerMult, eventMult);
  const requiredFocusSeconds = focusMin * 60;
  const completedFullFocus =
    focusBlockCompleted || focusSecondsThisSession >= requiredFocusSeconds;

  const setRunning = useCallback(
    (r: boolean) => {
      setRunningState(r);
      setTimerRunning(r);
    },
    [setTimerRunning],
  );

  const resetToFocus = useCallback(
    (f = focusMin) => {
      setPhase("focus");
      setSecondsLeft(f * 60);
      setBreakMessage("");
      setFocusSecondsThisSession(0);
      setFocusBlockCompleted(false);
      phaseRef.current = "focus";
    },
    [focusMin],
  );

  useEffect(() => {
    if (!user || runningRef.current) return;
    setSecondsLeft(user.focusDurationMin * 60);
    setPhase("focus");
    phaseRef.current = "focus";
  }, [user?.focusDurationMin, user?.breakDurationMin, user?.email]);

  useEffect(() => {
    setTimerSnapshot({
      running,
      phase,
      secondsLeft,
      focusMin,
    });
    if (!running) setTimerSnapshot({ running: false });
  }, [running, phase, secondsLeft, focusMin, setTimerSnapshot]);

  useEffect(() => {
    if (!running) {
      timerAnchorRef.current = null;
      return;
    }
    timerAnchorRef.current = { startedAt: Date.now(), baseSeconds: secondsLeft };
    let lastEmitted = secondsLeft;
    const tick = () => {
      const anchor = timerAnchorRef.current;
      if (!anchor) return;
      const now = Date.now();
      const elapsed = Math.floor((now - anchor.startedAt) / 1000);
      const n = Math.max(0, anchor.baseSeconds - elapsed);
      if (phaseRef.current === "focus" && n < lastEmitted) {
        const delta = lastEmitted - n;
        setFocusSecondsThisSession((s) => s + delta);
      }
      lastEmitted = n;
      setSecondsLeft(n);
      if (n === 0) {
        if (phaseRef.current === "focus") {
          hapticSuccess();
          playTimerEndSound(user?.timerEndSoundId, user?.soundEffects ?? true);
          setFocusBlockCompleted(true);
          setPhase("break");
          setBreakMessage(`Break time — ${breakMin} min. Rest and recharge.`);
          setSecondsLeft(breakMin * 60);
          timerAnchorRef.current = { startedAt: Date.now(), baseSeconds: breakMin * 60 };
          phaseRef.current = "break";
          lastEmitted = breakMin * 60;
        } else {
          setBreakMessage("");
          setPhase("focus");
          phaseRef.current = "focus";
          setSecondsLeft(focusMin * 60);
          timerAnchorRef.current = { startedAt: Date.now(), baseSeconds: focusMin * 60 };
          lastEmitted = focusMin * 60;
        }
      }
    };
    const i = setInterval(tick, 250);
    tick();
    return () => clearInterval(i);
  }, [running, focusMin, breakMin, user?.timerEndSoundId, user?.soundEffects]);

  // Focus soundscape: play only while running in the focus phase; fade out on break/pause/end.
  const soundscapeId = (user?.soundscapeId ?? "off") as SoundscapeId;
  const soundscapeVolume = user?.soundscapeVolume ?? 0.5;
  const soundscapeAutoRef = useRef(false);
  useEffect(() => {
    if (running && phase === "focus" && soundscapeId !== "off") {
      soundscapeAutoRef.current = true;
      void startSoundscape(soundscapeId, soundscapeVolume);
    } else if (soundscapeAutoRef.current) {
      // Only stop what this effect started — leaves chip previews alone.
      soundscapeAutoRef.current = false;
      stopSoundscape();
    }
  }, [running, phase, soundscapeId, soundscapeVolume]);
  useEffect(() => {
    setSoundscapeVolume(soundscapeVolume);
  }, [soundscapeVolume]);
  useEffect(() => () => stopSoundscape(), []);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState !== "visible") return;
      const anchor = timerAnchorRef.current;
      if (!anchor) return;
      const elapsed = Math.floor((Date.now() - anchor.startedAt) / 1000);
      setSecondsLeft(Math.max(0, anchor.baseSeconds - elapsed));
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const finishSession = useCallback(
    (early: boolean, sessionMeta?: SessionMeta): FinishSessionResult | null => {
      if (!user) return null;
      const studied = Math.floor(focusSecondsThisSession / 60);
      const fullFocus = completedFullFocus && !early;

      if (early && studied === 0) {
        setRunning(false);
        setBreakMessage("");
        timerAnchorRef.current = null;
        resetToFocus();
        setToast("Session ended (no minutes logged).");
        return null;
      }

      if (early && !fullFocus && studied === 0) {
        setRunning(false);
        resetToFocus();
        setToast("Session ended early — no minutes logged.");
        return null;
      }

      const reward = computeSessionReward(focusSecondsThisSession, comboMult, ownerMult, eventMult);
      const earned = reward.finalPoints;
      const today = todayKey();
      const lastKey = user.lastStudyDate || "";
      let streak = user.streak;
      let shields = user.streakShields;
      let shieldNote = "";

      if (!lastKey) {
        streak = 1;
      } else {
        const gap = dayDiff(lastKey);
        if (gap === 0) streak = user.streak;
        else if (gap === 1) streak = user.streak + 1;
        else if (gap > 1 && shields > 0) {
          shields -= 1;
          streak = user.streak + 1;
          shieldNote = " · Streak shield used";
        } else if (gap > 1) streak = 1;
      }

      const tags = { ...user.tags, [activeTaskTag]: (user.tags[activeTaskTag] || 0) + studied };
      const dayKey = todayKey();
      const weeklyHistory = { ...user.weeklyHistory, [dayKey]: (user.weeklyHistory[dayKey] || 0) + studied };
      const hour = new Date().getHours();
      const taskDone = selectedTaskId
        ? user.tasks.find((t) => t.id === selectedTaskId)?.status === "done"
        : false;
      const sessionLog = [
        ...user.sessionLog,
        {
          at: new Date().toISOString(),
          minutes: studied,
          breakMinutes: breakMin,
          taskId: selectedTaskId || undefined,
          hour,
          pointsEarned: earned,
          basePoints: reward.basePoints,
          comboMult: reward.comboMult,
          ownerMult: reward.ownerMult,
          moodBefore,
          moodAfter,
          taskCompleted: taskDone,
          phase: "focus" as const,
          focusRating: fullFocus ? sessionMeta?.focusRating : undefined,
          reflection: fullFocus ? sessionMeta?.reflection : undefined,
          completedFullFocus: fullFocus,
        },
      ].slice(-SESSION_LOG_CAP);
      const fls = { ...user.focusLabStats };
      if (studied > fls.bestSessionMinutes) fls.bestSessionMinutes = studied;
      fls.focusStreak = streak;
      const focusCounts: Record<number, number> = {};
      sessionLog.forEach((s) => {
        focusCounts[s.hour] = (focusCounts[s.hour] || 0) + s.minutes;
      });
      const bestHour = Object.entries(focusCounts).sort((a, b) => b[1] - a[1])[0];
      if (bestHour) fls.bestHour = Number(bestHour[0]);

      let tasks = user.tasks;
      if (selectedTaskId) {
        tasks = tasks.map((t) =>
          t.id === selectedTaskId
            ? { ...t, focusMinutesSpent: t.focusMinutesSpent + studied, status: t.status === "todo" ? "doing" : t.status }
            : t,
        );
      }

      let nextUser: UserData = {
        ...user,
        focusPoints: user.focusPoints + earned,
        totalPointsEarned: user.totalPointsEarned + earned,
        totalStudyMinutes: user.totalStudyMinutes + studied,
        sessionsCompleted: user.sessionsCompleted + 1,
        tags,
        tasks,
        streak,
        streakShields: shields,
        lastStudyDate: today,
        weeklyHistory,
        moodBefore: [...user.moodBefore, moodBefore],
        moodAfter: [...user.moodAfter, moodAfter],
        sessionLog,
        focusLabStats: fls,
      };
      nextUser = addWeeklyMinutes(nextUser, studied);
      updateUser(nextUser);
      setRunning(false);
      setBreakMessage("");
      resetToFocus();
      enqueueCelebration({
        kind: "session",
        title: "Session complete!",
        subtitle: "Points added to balance",
        points: earned,
      });
      setToast(
        `${fullFocus ? "Session completed" : "Session ended"}: +${earned} pts (${reward.basePoints} base × ${reward.comboMult} combo${reward.eventMult > 1 ? ` × ${reward.eventMult} event` : ""}${reward.ownerMult > 1 ? ` × ${reward.ownerMult} owner` : ""}), ${studied} min.${shieldNote}`,
      );
      return { earned, studied, shieldNote };
    },
    [
      user,
      focusSecondsThisSession,
      completedFullFocus,
      activeTaskTag,
      selectedTaskId,
      moodBefore,
      moodAfter,
      comboMult,
      eventMult,
      ownerMult,
      breakMin,
      updateUser,
      setToast,
      enqueueCelebration,
      resetToFocus,
      setRunning,
    ],
  );

  const applyDurations = (f: number, b: number) => {
    if (!user) return;
    updateUser({ ...user, focusDurationMin: f, breakDurationMin: b });
    if (!running) {
      setPhase("focus");
      setSecondsLeft(f * 60);
      setFocusBlockCompleted(false);
      phaseRef.current = "focus";
    }
  };

  const totalSeconds = phase === "focus" ? focusMin * 60 : breakMin * 60;
  const progressRatio = Math.max(0, Math.min(1, 1 - secondsLeft / Math.max(1, totalSeconds)));

  const value: FocusTimerCtx = {
    phase,
    secondsLeft,
    running,
    setRunning,
    breakMessage,
    setBreakMessage,
    focusSecondsThisSession,
    focusBlockCompleted,
    completedFullFocus,
    pendingPoints: rewardPreview.finalPoints,
    pendingBase: rewardPreview.basePoints,
    comboMult,
    eventMult,
    ownerMult,
    focusMin,
    breakMin,
    applyDurations,
    finishSession,
    progressRatio,
    moodBefore,
    moodAfter,
    setMoodBefore,
    setMoodAfter,
  };

  return <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>;
}
