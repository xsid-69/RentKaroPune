"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import Logo from "./Logo";
import MotionDirector from "./MotionDirector";
import { useMarketplace } from "@/lib/marketplace-context";

export default function AppShell({ children }) {
  const path = usePathname();
  const { toast } = useMarketplace();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [path]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isDiscover = path === "/";
  const isDashboard = path.startsWith("/dashboard");

  return <>
    <MotionDirector />
    <div className="scroll-progress" id="scroll-progress" aria-hidden="true" />
    <div className="grain" aria-hidden="true" />
    <a className="skip-link" href="#main-content">Skip to content</a>

    <header className="site-header">
      <Link className="brand" href="/" aria-label="RentKaro home"><Logo /></Link>
      <nav className="main-nav" aria-label="Primary navigation">
        <Link className={isDiscover ? "active" : ""} href="/"><Icon name="search" size={18} /> Discover</Link>
        <Link className={isDashboard ? "active" : ""} href="/dashboard"><Icon name="grid" size={18} /> Live dashboard</Link>
      </nav>
      <Link className="header-cta" data-magnetic href="/dashboard?role=owner">List property <span className="cta-orb"><Icon name="arrow" size={16} /></span></Link>
      <button className={`nav-toggle ${menuOpen ? "open" : ""}`} type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)}>
        <span /><span /><span />
      </button>
    </header>

    <div className={`mobile-menu ${menuOpen ? "show" : ""}`} aria-hidden={!menuOpen}>
      <Link className={isDiscover ? "active" : ""} href="/" style={{ transitionDelay: "80ms" }}><Icon name="search" size={20} /> Discover</Link>
      <Link className={isDashboard ? "active" : ""} href="/dashboard" style={{ transitionDelay: "140ms" }}><Icon name="grid" size={20} /> Live dashboard</Link>
      <Link className="button primary full" href="/dashboard?role=owner" style={{ transitionDelay: "200ms" }}>List your property <Icon name="arrow" size={17} /></Link>
    </div>

    <main id="main-content">{children}</main>

    <footer className="site-footer">
      <div><Link className="brand footer-brand" href="/"><Logo /></Link><p>Rent smarter, pay less brokerage.</p></div>
      <div className="footer-trust"><Icon name="shield" /><span><strong>Trust-first rentals</strong>Owner documents and broker KYC are verified before closure.</span></div>
      <div><strong>Pune, Maharashtra</strong><p>Phase 1 · Flats, villas &amp; bungalows</p></div>
    </footer>

    <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite"><Icon name="check" />{toast}</div>
  </>;
}
