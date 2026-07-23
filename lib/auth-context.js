"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider, firebaseConfigured } from "./firebase";

const AuthContext = createContext(null);

const normalizeGoogle = (firebaseUser) => ({
  id: firebaseUser.uid,
  name: firebaseUser.displayName || firebaseUser.email || "Google user",
  email: firebaseUser.email || null,
  phone: null,
  photoURL: firebaseUser.photoURL || null,
  admin: 0,
  role: "client",
  consultantStatus: "none",
  provider: "google",
});

const readError = async (response, fallback) => {
  try {
    const data = await response.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
};

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [jwtUser, setJwtUser] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [jwtReady, setJwtReady] = useState(false);

  // Firebase (Google) session. Skip entirely when Firebase isn't configured.
  useEffect(() => {
    if (!auth) { setFirebaseReady(true); return; }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setFirebaseUser(nextUser ? normalizeGoogle(nextUser) : null);
      setFirebaseReady(true);
    });
    return unsubscribe;
  }, []);

  // JWT (email/phone + password) session.
  const refreshJwt = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await response.json();
      setJwtUser(data?.user || null);
    } catch {
      setJwtUser(null);
    } finally {
      setJwtReady(true);
    }
  }, []);

  useEffect(() => { refreshJwt(); }, [refreshJwt]);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseConfigured || !auth || !googleProvider) {
      return { error: "Google sign-in isn't configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables." };
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Exchange the Firebase ID token for our own JWT session so the Google
      // identity is linked to the shared Firestore user record (and its admin
      // flag) by email. jwtUser then takes precedence over the raw Google user.
      const idToken = await result.user.getIdToken();
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        await firebaseSignOut(auth).catch(() => {});
        return { error: await readError(response, "Google sign-in could not be completed.") };
      }
      const data = await response.json();
      setJwtUser(data.user);
      return { user: data.user };
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return { cancelled: true };
      }
      // Map the common Firebase config errors to actionable messages.
      const messages = {
        "auth/operation-not-allowed":
          "Google sign-in is not enabled. Enable Google in Firebase Console → Authentication → Sign-in method.",
        "auth/unauthorized-domain":
          "This domain isn't authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.",
        "auth/configuration-not-found":
          "Firebase Authentication isn't set up. Enable Authentication and the Google provider in the Firebase Console.",
        "auth/popup-blocked":
          "Your browser blocked the sign-in popup. Allow popups for this site and try again.",
        "auth/invalid-api-key":
          "The Firebase API key is invalid. Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local.",
      };
      return { error: messages[code] || `Google sign-in failed (${code || "unknown error"}).` };
    }
  }, []);

  const loginWithPassword = useCallback(async ({ identifier, password }) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      if (!response.ok) return { error: await readError(response, "Could not sign you in.") };
      const data = await response.json();
      setJwtUser(data.user);
      return { user: data.user };
    } catch {
      return { error: "Network error. Please try again." };
    }
  }, []);

  const registerWithPassword = useCallback(async ({ identifier, password, name }) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, name }),
      });
      if (!response.ok) return { error: await readError(response, "Could not create the account.") };
      const data = await response.json();
      // Registration does NOT sign the user in — they must log in explicitly.
      return { registered: true, user: data.user };
    } catch {
      return { error: "Network error. Please try again." };
    }
  }, []);

  const applyForConsultant = useCallback(async () => {
    try {
      const response = await fetch("/api/consultant/apply", { method: "POST" });
      if (!response.ok) return { error: await readError(response, "Could not submit your request.") };
      const data = await response.json();
      await refreshJwt();
      return { status: data.status };
    } catch {
      return { error: "Network error. Please try again." };
    }
  }, [refreshJwt]);

  const signOut = useCallback(async () => {
    // Sign out of whichever session is active (or both).
    const tasks = [];
    if (firebaseUser && auth) tasks.push(firebaseSignOut(auth).catch(() => {}));
    if (jwtUser) {
      tasks.push(
        fetch("/api/auth/logout", { method: "POST" })
          .then(() => setJwtUser(null))
          .catch(() => {})
      );
    }
    await Promise.all(tasks);
  }, [firebaseUser, jwtUser]);

  const user = jwtUser || firebaseUser;
  const loading = !firebaseReady || !jwtReady;

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, loginWithPassword, registerWithPassword, applyForConsultant, signOut, refreshJwt }),
    [user, loading, signInWithGoogle, loginWithPassword, registerWithPassword, applyForConsultant, signOut, refreshJwt]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
