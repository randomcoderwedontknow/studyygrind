import { useEffect } from "react";
import { StudyGrindProvider, useStudyGrind } from "./context/StudyGrindContext";
import { FocusTimerProvider } from "./context/FocusTimerContext";
import { canAccessTab } from "./lib/page-access";
import { AppShell } from "./components/layout/AppShell";
import { OnboardingPage } from "./pages/OnboardingPage";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { TasksPage } from "./pages/TasksPage";
import { TimerPage } from "./pages/TimerPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { NotesPage } from "./pages/NotesPage";
import { ShopPage } from "./pages/ShopPage";
import { GamesPage } from "./pages/GamesPage";
import { HonourPage } from "./pages/HonourPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { FocusLabPage } from "./pages/FocusLabPage";
import { ThemeStudioPage } from "./pages/ThemeStudioPage";
import { OwnerSettingsPage } from "./pages/OwnerSettingsPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { AchievementsPage } from "./pages/AchievementsPage";
import { AccessibilityPage } from "./pages/AccessibilityPage";
import { BetaHomePage } from "./pages/beta/BetaHomePage";
import { FocusPresetLabPage } from "./pages/beta/FocusPresetLabPage";
import { RoutineBuilderPage } from "./pages/beta/RoutineBuilderPage";
import { GoalsPage } from "./pages/beta/GoalsPage";
import { BetaShellGate } from "./components/beta/BetaShellGate";
function AppRoutes() {
  const { store, user, tab, setTab, hasUnlock, setToast, maintenance, isBetaShell } = useStudyGrind();

  useEffect(() => {
    if (!user || canAccessTab(tab, user, hasUnlock, store)) return;
    if (tab === "ownerSettings") {
      setTab("settings");
      return;
    }
    setToast("Unlock this page in the Focus Shop first.");
    setTab("shop");
  }, [tab, user, hasUnlock, setTab, setToast, store]);

  // Maintenance lockout: remote flag (Supabase) with local cache fallback. Owner always passes.
  const maintenanceOn = maintenance.on || (!maintenance.remoteOk && store.maintenanceMode);
  if (maintenanceOn && user?.role !== "owner") return <MaintenancePage />;

  if (!store.seenOnboarding) return <OnboardingPage />;
  if (!user) return <AuthPage />;

  const locked = !canAccessTab(tab, user, hasUnlock, store);

  const betaWrap = (node: React.ReactNode) =>
    isBetaShell ? node : <BetaShellGate>{node}</BetaShellGate>;

  let page: React.ReactNode = <HomePage />;
  switch (tab) {
    case "home":
      page = <HomePage />;
      break;
    case "tasks":
      page = <TasksPage />;
      break;
    case "timer":
      page = <TimerPage />;
      break;
    case "cards":
      page = <FlashcardsPage />;
      break;
    case "notes":
      page = <NotesPage />;
      break;
    case "shop":
      page = <ShopPage />;
      break;
    case "games":
      page = <GamesPage />;
      break;
    case "honour":
      page = <HonourPage />;
      break;
    case "analytics":
      page = <AnalyticsPage />;
      break;
    case "profile":
      page = <ProfilePage />;
      break;
    case "settings":
      page = <SettingsPage />;
      break;
    case "focusLab":
      page = locked ? <ShopPage /> : <FocusLabPage />;
      break;
    case "themeStudio":
      page = locked ? <ShopPage /> : <ThemeStudioPage />;
      break;
    case "ownerSettings":
      page = locked ? <SettingsPage /> : <OwnerSettingsPage />;
      break;
    case "achievements":
      page = <AchievementsPage />;
      break;
    case "accessibility":
      page = <AccessibilityPage />;
      break;
    case "betaHome":
      page = betaWrap(<BetaHomePage />);
      break;
    case "focusPresetLab":
      page = betaWrap(<FocusPresetLabPage />);
      break;
    case "routineBuilder":
      page = betaWrap(<RoutineBuilderPage />);
      break;
    case "goals":
      page = betaWrap(<GoalsPage />);
      break;
  }

  return <AppShell>{page}</AppShell>;
}

export default function App() {
  return (
    <StudyGrindProvider>
      <FocusTimerProvider>
        <AppRoutes />
      </FocusTimerProvider>
    </StudyGrindProvider>
  );
}
