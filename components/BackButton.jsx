"use client";

import { useRouter, usePathname } from "next/navigation";
import Icon from "./Icon";

/**
 * Global back control shown on every page except the home feed. Uses the
 * browser history when available and falls back to the home page.
 */
export default function BackButton({ hidden = false }) {
  const router = useRouter();
  const path = usePathname();

  if (path === "/") return null;

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <div className="site-container pt-[max(env(safe-area-inset-top),0.75rem)] sm:pt-4">
      <button
        type="button"
        onClick={goBack}
        tabIndex={hidden ? -1 : undefined}
        className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#e5e1da] bg-white/90 pl-2.5 pr-4 text-sm font-bold text-[#282622] shadow-[0_6px_18px_rgb(40_38_34/8%)] backdrop-blur transition-[background-color,transform,border-color] duration-200 ease-[cubic-bezier(.22,1,.36,1)] hover:border-[#282622] active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B00]"
        aria-label="Go back to the previous page"
      >
        <span className="grid size-7 place-items-center rounded-full bg-[#f3efe8] text-[#282622] transition-transform duration-200 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-x-0.5"><Icon name="arrow" size={16} className="rotate-180" /></span>
        Back
      </button>
    </div>
  );
}
