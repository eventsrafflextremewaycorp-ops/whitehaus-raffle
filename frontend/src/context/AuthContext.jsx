import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, getCurrentAdmin, logout } from "@/lib/api";

/**
 * Who is signed in, shared by the header, the login page and every staff screen.
 *
 * status: "checking" | "guest" | "admin" | "error"
 *
 * Visitors who never signed in make no request at all: a small marker in localStorage (`gx-staff-hint`,
 * set at sign-in, cleared at sign-out) tells us whether it is worth asking the server. The server still
 * decides what a session may do on every request; this only controls what the screens show.
 */
const AuthContext = createContext(null);
const HINT_KEY = "gx-staff-hint";

function readHint() {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function writeHint(on) {
  try {
    if (on) localStorage.setItem(HINT_KEY, "1");
    else localStorage.removeItem(HINT_KEY);
  } catch {
    // ignore (storage blocked)
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => (readHint() ? { status: "checking" } : { status: "guest", notice: null }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!readHint()) return;
    let stale = false;
    getCurrentAdmin()
      .then((user) => {
        if (stale) return;
        if (user.is_admin) setState({ status: "admin", user });
        else {
          writeHint(false);
          setState({ status: "guest", notice: "This account does not have access." });
        }
      })
      .catch((e) => {
        if (stale) return;
        if (e instanceof ApiError && (e.isUnauthenticated || e.status === 403)) {
          writeHint(false);
          setState({ status: "guest", notice: null });
        } else setState({ status: "error", message: e instanceof Error ? e.message : "Could not check your session." });
      });
    return () => {
      stale = true;
    };
  }, [attempt]);

  const signIn = useCallback((user) => {
    writeHint(true);
    setState({ status: "admin", user });
  }, []);

  const expire = useCallback((notice = "Your session has expired. Please sign in again.") => {
    writeHint(false);
    setState({ status: "guest", notice });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      writeHint(false);
      setState({ status: "guest", notice: "You have been signed out." });
    }
  }, []);

  const retry = useCallback(() => {
    setState({ status: "checking" });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.status === "admin" ? state.user : null,
      notice: state.status === "guest" ? state.notice : null,
      error: state.status === "error" ? state.message : null,
      signIn,
      signOut,
      expire,
      retry,
    }),
    [state, signIn, signOut, expire, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** "Gerry Santos" -> "GS", "Madonna" -> "MA", no name -> first letter of the email. */
export function initials(name, email) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((email || "?")[0] || "?").toUpperCase();
}
