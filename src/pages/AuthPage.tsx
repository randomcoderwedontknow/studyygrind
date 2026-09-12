import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { PressableButton } from "../components/ui/PressableButton";

export function AuthPage() {
  const { auth, setAuth, authMode, setAuthMode, login, signup } = useStudyGrind();
  const [showPass, setShowPass] = useState(false);
  const isSignup = authMode === "signup";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void (isSignup ? signup() : login());
  };

  return (
    <div className="auth-shell">
      <form className="center-card page-enter" onSubmit={submit} noValidate>
        <div className="auth-brand">
          <span className="logo">SG</span>
          <div>
            <h2>StudyGrind</h2>
            <small className="soft">Timer · tasks · notes · flashcards</small>
          </div>
        </div>

        <div>
          <h3>{isSignup ? "Create your account" : "Welcome back"}</h3>
          <p className="soft">{isSignup ? "Pick a username to get started." : "Sign in to continue your streak."}</p>
        </div>

        <div className="auth-fields">
          {isSignup && (
            <label className="field">
              <span>Username</span>
              <input
                placeholder="e.g. studybee"
                value={auth.username}
                onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                autoComplete="username"
                autoCapitalize="none"
              />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              type="text"
              inputMode="email"
              placeholder="you@example.com"
              value={auth.email}
              onChange={(e) => setAuth({ ...auth, email: e.target.value })}
              autoComplete="email"
              autoCapitalize="none"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="field-with-btn">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={auth.password}
                onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="ghost icon-btn"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        </div>

        <PressableButton type="submit">{isSignup ? "Create account" : "Sign in"}</PressableButton>
        <PressableButton variant="ghost" onClick={() => setAuthMode((m) => (m === "signup" ? "signin" : "signup"))}>
          {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
        </PressableButton>
      </form>
    </div>
  );
}
