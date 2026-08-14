"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Slim top progress bar shown during client-side navigation. It starts when an
 * internal link is clicked and completes once the pathname changes.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const [state, setState] = useState("idle"); // idle | loading | done

  useEffect(() => {
    // Pathname changed => navigation finished.
    setState((current) => (current === "loading" ? "done" : current));
    const timer = window.setTimeout(() => setState("idle"), 350);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      if (!href || !href.startsWith("/") || target === "_blank" || anchor.hasAttribute("download")) return;
      const nextPath = href.split(/[?#]/)[0];
      if (nextPath === pathname) return;
      setState("loading");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  return <div className={`rk-route-progress rk-route-progress--${state}`} aria-hidden="true" />;
}
