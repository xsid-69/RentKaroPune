"use client";

import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/visitors", { method: "POST", credentials: "same-origin", signal: controller.signal, keepalive: true }).catch(() => {});
    return () => controller.abort();
  }, []);
  return null;
}
