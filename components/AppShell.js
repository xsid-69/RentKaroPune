"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import Logo from "./Logo";
import MotionDirector from "./MotionDirector";
import { useMarketplace } from "@/lib/marketplace-context";

const navLink = "flex min-h-11 items-center gap-2 rounded-[11px] px-3.5 font-semibold transition-[color,background-color] duration-200 ease-[cubic-bezier(.22,1,.36,1)]";
const inactiveNavLink = "text-[#6b6b65] hover:bg-[#f7f7f4] hover:text-[#11110f]";
const activeNavLink = "bg-[#11110f] text-white [&>svg]:text-[#ff5a1f]";
const mobileLink = "flex min-h-[60px] translate-y-4 items-center gap-3 rounded-[14px] px-4 text-[26px] font-bold tracking-[-.03em] text-[#11110f] opacity-0 transition-[opacity,transform,background-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] [&>svg]:text-[#ff5a1f]";

export default function AppShell({ children }) {
  const path = usePathname();
  const { toast } = useMarketplace();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [path]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return () => { document.body.style.overflow = ""; };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const isDiscover = path === "/";
  const isDashboard = path.startsWith("/dashboard");

  return <>
    <MotionDirector />
    <div id="scroll-progress" data-scroll-progress className="fixed left-0 top-0 z-[81] h-[3px] w-full origin-left scale-x-0 bg-linear-to-r from-[#ff5a1f] to-[#d94210] shadow-[0_0_18px_rgba(255,90,31,.42)] will-change-transform" aria-hidden="true" />
    <div className="pointer-events-none fixed inset-0 z-[2] bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%22160%22_height=%22160%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%22.85%22_numOctaves=%222%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-[.04] mix-blend-multiply" aria-hidden="true" />
    <a className="fixed -top-[100px] left-4 z-[80] rounded-[10px] bg-[#11110f] px-[18px] py-3 text-white focus:top-4" href="#main-content">Skip to content</a>

    <header className="fixed left-1/2 top-3.5 z-[70] flex h-[70px] w-[min(1240px,calc(100%-32px))] -translate-x-1/2 items-center gap-7 rounded-[18px] border border-white/[.68] bg-white/[.82] py-2 pl-[18px] pr-[9px] shadow-[0_18px_54px_rgba(25,20,15,.1),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-[22px] backdrop-saturate-150 max-[720px]:gap-2.5">
      <Link className="mr-[22px] inline-flex items-center gap-2.5 whitespace-nowrap text-xl font-extrabold tracking-[-.035em]" href="/" aria-label="RentKaro home"><Logo className="max-[720px]:[&_[data-logo-word]]:hidden" /></Link>
      <nav className="mx-auto flex items-center gap-1 max-[860px]:hidden" aria-label="Primary navigation">
        <Link className={`${navLink} ${isDiscover ? activeNavLink : inactiveNavLink}`} href="/"><Icon name="search" size={18} /> Discover</Link>
        <Link className={`${navLink} ${isDashboard ? activeNavLink : inactiveNavLink}`} href="/dashboard"><Icon name="grid" size={18} /> Live dashboard</Link>
      </nav>
      <Link className="group inline-flex min-h-[52px] items-center justify-center gap-[9px] rounded-[13px] bg-[#ff5a1f] py-0 pl-5 pr-2 font-bold text-white transition-colors duration-200 hover:bg-[#d94210] max-[860px]:hidden" data-magnetic href="/dashboard?role=owner">List property <span className="grid size-[30px] place-items-center rounded-full bg-white/20 transition-[transform,background-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-[3px] group-hover:-translate-y-px group-hover:-rotate-[8deg] group-hover:bg-[#ff5a1f]"><Icon name="arrow" size={16} /></span></Link>
      <button className="hidden size-[46px] flex-col items-center justify-center gap-[5px] rounded-xl border border-[oklch(0.9_0.006_55)] bg-white p-0 max-[860px]:flex" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)}>
        <span className={`h-0.5 w-5 rounded-sm bg-[#11110f] transition-transform duration-300 ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} /><span className={`h-0.5 w-5 rounded-sm bg-[#11110f] transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} /><span className={`h-0.5 w-5 rounded-sm bg-[#11110f] transition-transform duration-300 ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
      </button>
    </header>

    <div id="mobile-navigation" className={`fixed inset-0 z-[60] flex flex-col justify-center gap-2 bg-white/90 px-6 pb-12 pt-24 backdrop-blur-[22px] transition-[opacity,visibility] duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${menuOpen ? "visible opacity-100 [&>a]:translate-y-0 [&>a]:opacity-100" : "invisible opacity-0"}`} aria-hidden={!menuOpen}>
      <Link className={`${mobileLink} ${isDiscover ? "bg-[#f7f7f4]" : ""}`} href="/" style={{ transitionDelay: "80ms" }}><Icon name="search" size={20} /> Discover</Link>
      <Link className={`${mobileLink} ${isDashboard ? "bg-[#f7f7f4]" : ""}`} href="/dashboard" style={{ transitionDelay: "140ms" }}><Icon name="grid" size={20} /> Live dashboard</Link>
      <Link className="mt-3 flex min-h-12 w-full translate-y-4 items-center justify-center gap-[9px] rounded-xl border border-[#ff5a1f] bg-[#ff5a1f] px-5 text-[17px] font-bold text-white opacity-0 transition-[opacity,transform,background-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#d94210]" href="/dashboard?role=owner" style={{ transitionDelay: "200ms" }}>List your property <Icon name="arrow" size={17} /></Link>
    </div>

    <main id="main-content" className="overflow-clip">{children}</main>

    <footer className="mx-auto grid max-w-[1240px] grid-cols-[1fr_1.3fr_auto] items-center gap-10 border-t border-[oklch(0.9_0.006_55)] bg-[#f7f7f4] px-6 py-12 max-[980px]:grid-cols-2 max-[720px]:grid-cols-1 max-[720px]:px-4 [&>div:last-child]:max-[980px]:col-span-full [&>div:last-child]:max-[720px]:col-auto">
      <div><Link className="inline-flex items-center gap-2.5 whitespace-nowrap text-xl font-extrabold tracking-[-.035em] [&_[data-logo-word]]:text-[23px]" href="/"><Logo /></Link><p className="mb-0 mt-1.5 text-[#6b6b65]">Rent smarter, pay less brokerage.</p></div>
      <div className="flex items-center gap-3"><Icon name="shield" /><span className="block text-[13px] text-[#6b6b65]"><strong className="block text-[#11110f]">Trust-first rentals</strong>Owner documents and broker KYC are verified before closure.</span></div>
      <div><strong>Pune, Maharashtra</strong><p className="mb-0 mt-1.5 text-[#6b6b65]">Phase 1 · Flats, villas &amp; bungalows</p></div>
    </footer>

    <div className={`pointer-events-none fixed bottom-[22px] right-[22px] z-[80] flex max-w-[min(420px,calc(100vw-44px))] translate-y-3 items-center gap-2.5 rounded-xl bg-[#11110f] px-[18px] py-3.5 text-white opacity-0 shadow-[0_28px_80px_rgba(10,10,10,.16)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(.22,1,.36,1)] [&>svg]:text-[#ff5a1f] ${toast ? "translate-y-0 opacity-100" : ""}`} role="status" aria-live="polite"><Icon name="check" />{toast}</div>
  </>;
}
