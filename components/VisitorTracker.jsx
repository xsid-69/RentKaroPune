"use client";

import { useEffect } from "react";

// Module-level guard: survives React re-renders and Strict Mode's double effect
// invocation so a single browser load never fires more than one tracking call.
let tracked = false;
const STORAGE_KEY = "rk_visitor_tracked";

export default function VisitorTracker() {
  useEffect(() => {
    if (tracked) return undefined;
    tracked = true;

    // Already counted on this browser (persists across visits) — skip entirely so
    // repeat visits never inflate the unique count.
    try { if (window.localStorage.getItem(STORAGE_KEY) === "1") return undefined; } catch {}

    const controller = new AbortController();
    fetch("/api/visitors", { method: "POST", credentials: "same-origin", signal: controller.signal, keepalive: true })
      .then((response) => { if (response.ok) { try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch {} } else { tracked = false; } })
      .catch(() => { tracked = false; });
    return () => controller.abort();
  }, []);

  return null;
}
