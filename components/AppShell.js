"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import Logo from "./Logo";
import SmoothScroll from "./SmoothScroll";
import AccountControl from "./AccountControl";
import { useMarketplace } from "@/lib/marketplace-context";
import { useAuth } from "@/lib/auth-context";

const logoColors = "[&_svg]:!text-[#0A0A0A] [&_[data-logo-word]>span:first-child]:!text-[#0A0A0A] [&_[data-logo-word]>span:last-child]:!text-[#FF5B00]";
const desktopLink = "inline-flex min-h-10 items-center border-b-2 px-1 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF5B00]";

export default function AppShell({ children }) {
  const path = usePathname();
  const { toast } = useMarketplace();
  const { user } = useAuth();
  const isStaff = Boolean(user && (user.admin === 1 || user.role === "consultant"));

  const mobileRoutes = [
    { href: "/", label: "Discover", subtitle: "Browse verified homes across Pune", route: "discover" },
    ...(isStaff ? [{ href: "/dashboard", label: "Dashboard", subtitle: "Manage listings, visits and settlements", route: "dashboard" }] : []),
    ...(user ? [{ href: "/profile", label: "Profile", subtitle: "Your rentals, loyalty and listings", route: "profile" }] : []),
    { href: "/profile", label: "List property", subtitle: "Publish your home for ₹100", accent: true },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const firstMobileLinkRef = useRef(null);

  useEffect(() => { setMenuOpen(false); }, [path]);
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstMobileLinkRef.current?.focus();

    const closeOrTrapFocus = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const mobileLinks = Array.from(document.querySelectorAll("#mobile-navigation [data-mobile-link]"));
      const lastLink = mobileLinks.at(-1);
      if (!event.shiftKey && document.activeElement === lastLink) {
        event.preventDefault();
        menuButtonRef.current?.focus();
      } else if (event.shiftKey && document.activeElement === menuButtonRef.current) {
        event.preventDefault();
        lastLink?.focus();
      }
    };
    const desktopQuery = window.matchMedia("(min-width: 861px)");
    const closeAtDesktop = (event) => { if (event.matches) setMenuOpen(false); };

    document.addEventListener("keydown", closeOrTrapFocus);
    desktopQuery.addEventListener("change", closeAtDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOrTrapFocus);
      desktopQuery.removeEventListener("change", closeAtDesktop);
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const isDiscover = path === "/";
  const isDashboard = path.startsWith("/dashboard");
  const isProfile = path.startsWith("/profile");
  const activeDesktop = "border-[#FF5B00] text-[#0A0A0A]";
  const inactiveDesktop = "border-transparent text-[#666666] hover:border-[#E5E5E5] hover:text-[#161616]";

  return <>
    <SmoothScroll />
    <a className="fixed -top-24 left-4 z-[var(--z-skip)] bg-[#0A0A0A] px-4 py-3 font-semibold text-white focus:top-[calc(env(safe-area-inset-top)+0.5rem)] focus:outline-2 focus:outline-offset-2 focus:outline-[#FF5B00]" href="#main-content" tabIndex={menuOpen ? -1 : undefined}>Skip to content</a>
    <header className="sticky top-0 z-[var(--z-nav)] bg-transparent pb-2 pl-[calc(env(safe-area-inset-left)+0.5rem)] pr-[calc(env(safe-area-inset-right)+0.5rem)] pt-[calc(env(safe-area-inset-top)+0.5rem)] min-[861px]:border-b min-[861px]:border-[#E5E5E5] min-[861px]:bg-white min-[861px]:p-0 min-[861px]:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between rounded-xl border border-[#E5E5E5] bg-white px-3 shadow-[0_8px_24px_rgba(10,10,10,0.08)] min-[861px]:rounded-none min-[861px]:border-0 min-[861px]:px-4 min-[861px]:shadow-none">
        <Link className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF5B00]" href="/" aria-label="RentKaro home" tabIndex={menuOpen ? -1 : undefined}><Logo size={34} className={`${logoColors} gap-2 [&_[data-logo-word]]:text-[20px]`} /></Link>
        <nav className="hidden items-center gap-6 min-[861px]:flex" aria-label="Primary navigation" aria-hidden={menuOpen ? true : undefined}><Link className={`${desktopLink} ${isDiscover ? activeDesktop : inactiveDesktop}`} href="/" tabIndex={menuOpen ? -1 : undefined}>Discover</Link>{isStaff && <Link className={`${desktopLink} ${isDashboard ? activeDesktop : inactiveDesktop}`} href="/dashboard" tabIndex={menuOpen ? -1 : undefined}>Dashboard</Link>}{user && <Link className={`${desktopLink} ${isProfile ? activeDesktop : inactiveDesktop}`} href="/profile" tabIndex={menuOpen ? -1 : undefined}>Profile</Link>}<Link className={`${desktopLink} border-transparent text-[#FF5B00] hover:border-[#FF5B00]`} href="/profile" tabIndex={menuOpen ? -1 : undefined}>List property</Link><AccountControl variant="desktop" tabIndex={menuOpen ? -1 : undefined} /></nav>
        <button ref={menuButtonRef} className="relative flex size-11 items-center justify-center text-[#0A0A0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B00] min-[861px]:hidden" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)}>
          <span className={`absolute h-0.5 w-5 bg-current transition-[transform,opacity] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${menuOpen ? "rotate-45" : "-translate-y-1"}`} />
          <span className={`absolute h-0.5 w-5 bg-current transition-[transform,opacity] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${menuOpen ? "-rotate-45" : "translate-y-1"}`} />
        </button>
      </div>
    </header>

    <div
      id="mobile-navigation"
      className={`fixed inset-0 z-[var(--z-shell)] overflow-y-auto overscroll-contain bg-[#111111]/[0.98] pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pl-[calc(env(safe-area-inset-left)+1.25rem)] pr-[calc(env(safe-area-inset-right)+1.25rem)] pt-[calc(env(safe-area-inset-top)+5.75rem)] backdrop-blur-[2px] min-[861px]:hidden motion-reduce:transition-none ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      style={{ transition: menuOpen ? "opacity 280ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s" : "opacity 220ms cubic-bezier(0.4, 0, 1, 1), visibility 0s linear 220ms", visibility: menuOpen ? "visible" : "hidden" }}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      aria-hidden={!menuOpen}
      inert={!menuOpen}
    >
      <div className="mx-auto flex h-full max-w-xl flex-col justify-between">
        <nav className="pt-[clamp(1rem,5vh,2.5rem)]" aria-label="Mobile navigation links">
          {mobileRoutes.map((item, index) => {
            const active = item.route === "discover" ? isDiscover : item.route === "dashboard" ? isDashboard : item.route === "profile" ? isProfile : false;
            return <Link
              key={item.label}
              ref={index === 0 ? firstMobileLinkRef : undefined}
              data-mobile-link
              className={`group grid min-h-[76px] grid-cols-[20px_1fr] items-center gap-3 border-b border-white/10 py-3.5 text-white opacity-100 transition-[opacity,transform] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF5B00] motion-reduce:transform-none motion-reduce:transition-none ${menuOpen ? "translate-y-0" : "translate-y-3 opacity-0"}`}
              style={{ transitionDelay: menuOpen ? `${110 + index * 55}ms` : `${(mobileRoutes.length - index - 1) * 28}ms` }}
              href={item.href}
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
              aria-current={active ? "page" : undefined}
            >
              <span className={`h-0.5 w-4 transition-opacity duration-200 ${active ? "bg-[#FF5B00] opacity-100" : "bg-transparent opacity-0"}`} aria-hidden="true" />
              <span className="min-w-0">
                <span className={`block text-[clamp(1.45rem,6vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] ${item.accent ? "text-[#FF7A33]" : "text-white"}`}>{item.label}</span>
                <span className="mt-1 block text-[13px] font-medium leading-snug text-white/60">{item.subtitle}</span>
              </span>
            </Link>;
          })}
        </nav>
        <div className="mt-4">
          <AccountControl variant="mobile" tabIndex={menuOpen ? 0 : -1} onNavigate={closeMenu} />
        </div>
        <div className={`border-t border-white/10 pt-4 text-[12px] leading-relaxed text-white/55 transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none ${menuOpen ? "translate-y-0 opacity-100 delay-300" : "translate-y-2 opacity-0"}`}>
          <p className="m-0 font-semibold text-white">RentKaro Pune</p>
          <p className="m-0 mt-0.5">Verified listings · Assigned consultant support · Transparent fees</p>
        </div>
      </div>
    </div>

    <div id="main-content" tabIndex="-1" className="outline-none" inert={menuOpen} aria-hidden={menuOpen ? true : undefined}>{children}</div>
    <footer className="border-t border-[#E5E5E5] bg-white" inert={menuOpen} aria-hidden={menuOpen ? true : undefined}><div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-6 text-sm text-[#666666] sm:flex-row sm:items-center sm:justify-between"><Link className="inline-flex w-fit items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF5B00]" href="/" aria-label="RentKaro home"><Logo size={26} className={`${logoColors} gap-1.5 [&_[data-logo-word]]:text-[17px]`} /></Link><p className="m-0 max-w-[32ch] leading-6">Pune rentals, without the usual friction.</p><div className="flex min-h-11 items-center gap-3" aria-label="Legal information"><span>Privacy</span><span aria-hidden="true">·</span><span>Terms</span></div></div></footer>
    <div className={`pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-[calc(env(safe-area-inset-left)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-[var(--z-toast)] ml-auto flex max-w-[400px] items-center gap-2.5 rounded-xl border border-[#161616] bg-[#0A0A0A] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-lg)] transition-[opacity,transform] duration-200 ${toast ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"}`} role="status" aria-live="polite" aria-atomic="true"><Icon name="check" className="shrink-0 text-[#FF5B00]" />{toast}</div>
  </>;
}
