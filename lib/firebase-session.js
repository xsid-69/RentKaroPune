"use client";

import { signInWithCustomToken } from "firebase/auth";
import { auth, firebaseConfigured } from "./firebase";

let pendingSession = null;
let pendingUserId = null;

export async function syncFirebaseSession(userId) {
  if (!firebaseConfigured || !auth) throw new Error("Firebase is not configured.");
  if (!userId) throw new Error("Sign in before accessing property data.");
  if (auth.currentUser?.uid === userId) return auth.currentUser;
  if (pendingSession && pendingUserId === userId) return pendingSession;

  pendingUserId = userId;
  pendingSession = fetch("/api/auth/firebase-token", {
    method: "POST",
    signal: AbortSignal.timeout(12_000),
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) throw new Error(data.error || "Could not start a secure upload session.");
      return signInWithCustomToken(auth, data.token);
    })
    .then((credential) => credential.user)
    .catch((error) => {
      if (error?.name === "TimeoutError") throw new Error("Secure upload authorization timed out. Check your connection and retry.");
      throw error;
    })
    .finally(() => {
      pendingSession = null;
      pendingUserId = null;
    });

  return pendingSession;
}
