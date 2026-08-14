"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import PropertyListingForm from "./PropertyListingForm";
import { useAuth } from "@/lib/auth-context";

const BUTTON_BASE = "min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border px-5 font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] focus-visible:ring-offset-2";
const BUTTON_PRIMARY = `${BUTTON_BASE} border-[var(--orange)] bg-[var(--orange)] text-white hover:bg-[var(--orange-dark)]`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink-2)]`;
const SECTION_STYLES = "rounded-[var(--radius)] border border-[var(--line)] bg-white p-6 max-[640px]:p-4";

function Avatar({ user, size = 56 }) {
  const initial = (user.name || user.email || user.phone || "?").charAt(0).toUpperCase();
  if (user.photoURL) {
    return <img src={user.photoURL} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return <span className="grid place-items-center rounded-full bg-[var(--orange)] font-extrabold text-white" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">{initial}</span>;
}

function ConsultantCard({ user, applyForConsultant }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isConsultant = user.role === "consultant";
  const isAdmin = user.admin === 1;
  const pending = user.consultantStatus === "pending";

  const apply = async () => {
    setBusy(true);
    setError("");
    const result = await applyForConsultant();
    setBusy(false);
    if (result?.error) setError(result.error);
  };

  if (isAdmin || isConsultant) {
    return <section className={`${SECTION_STYLES} border-[var(--ink)]`} aria-labelledby="consultant-access-title">
      <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--orange-dark)]"><Icon name="shield" size={16}/> {isAdmin ? "Admin access" : "Consultant access"}</span>
      <h2 className="mt-1 mb-1 text-[24px]" id="consultant-access-title">You can post and manage properties</h2>
      <p className="m-0 mb-4 max-w-[62ch] text-sm text-[var(--muted)]">{isAdmin ? "The admin dashboard has approvals, callback requests, and visitor analytics. Submit verified homes with the listing tool below." : "Submit verified Pune properties using the listing tool below. An admin reviews each home before it goes live."}</p>
      {isAdmin && <Link className={BUTTON_PRIMARY} href="/dashboard">Open admin dashboard <Icon name="arrow" size={16}/></Link>}
    </section>;
  }

  return <section className={SECTION_STYLES} aria-labelledby="become-consultant-title">
    <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--orange-dark)]"><Icon name="building" size={16}/> Consultant program</span>
    <h2 className="mt-1 mb-1 text-[24px]" id="become-consultant-title">Become a consultant</h2>
    <p className="m-0 mb-4 max-w-[62ch] text-sm text-[var(--muted)]">Consultants can post verified Pune properties and manage client visits. Access is granted after admin approval.</p>
    {error && <p className="m-0 mb-4 flex items-center gap-2 rounded-[10px] bg-[oklch(0.96_0.025_28)] px-3.5 py-3 text-sm font-semibold text-[var(--red)]" role="alert"><Icon name="info" size={16}/>{error}</p>}
    {pending
      ? <span className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--orange-soft)] px-3.5 py-3 text-sm font-bold text-[var(--orange-dark)]"><Icon name="info" size={16}/> Application under review</span>
      : <button className={BUTTON_PRIMARY} type="button" disabled={busy} onClick={apply}>{busy ? "Submitting…" : "Request consultant access"}</button>}
  </section>;
}

export default function Profile() {
  const router = useRouter();
  const { user, loading, signOut, applyForConsultant } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/profile");
  }, [loading, user, router]);

  if (loading || !user) {
    return <main className="bg-transparent"><div className="site-container min-h-[70dvh] pt-10 pb-16"><div className="h-10 w-1/3 animate-pulse rounded-[10px] bg-[var(--soft)]"/><div className="mt-4 h-40 animate-pulse rounded-[14px] bg-[var(--soft)]"/></div></main>;
  }

  const roleLabel = user.admin === 1 ? "Admin" : user.role === "consultant" ? "Consultant" : "Member";
  const contact = user.email || (user.phone ? `+91 ${user.phone}` : "");

  return <main className="bg-transparent text-[var(--ink)] [&_h2]:leading-tight [&_h2]:tracking-[-0.02em]">
    <div className="site-container min-h-[75dvh] pt-8 pb-24 max-[640px]:pt-5">
      <header className="flex items-center justify-between gap-5 border-b border-[var(--line)] py-6 max-[640px]:flex-col max-[640px]:items-start">
        <div className="flex items-center gap-4"><Avatar user={user}/><div><span className="inline-flex items-center gap-2 rounded-full bg-[var(--soft)] px-2.5 py-1 text-xs font-bold text-[var(--ink-2)]"><Icon name="user" size={13}/> {roleLabel}</span><h1 className="mt-1.5 text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] max-[640px]:text-[26px]">{user.name || "Your profile"}</h1>{contact && <p className="m-0 mt-0.5 text-sm text-[var(--muted)]">{contact}</p>}</div></div>
        <button className={`${BUTTON_SECONDARY} shrink-0 max-[640px]:w-full`} type="button" onClick={() => signOut()}><Icon name="arrow" size={16} className="rotate-180"/> Sign out</button>
      </header>
      <div className="mt-6 grid gap-5 max-[640px]:gap-4">
        <ConsultantCard user={user} applyForConsultant={applyForConsultant}/>
        <section className={SECTION_STYLES} aria-labelledby="optional-account-title"><span className="text-sm font-bold text-[var(--orange-dark)]">Optional account</span><h2 className="mb-1 mt-1 text-[24px]" id="optional-account-title">Browse without signing in</h2><p className="m-0 max-w-[62ch] text-sm text-[var(--muted)]">Your account is only needed for profile, consultant, and admin tools. Property browsing, WhatsApp enquiries, and callback requests stay public.</p></section>
        <section aria-labelledby="list-your-property-title"><h2 className="mb-4 text-[24px] font-extrabold tracking-[-0.02em]" id="list-your-property-title">List your property</h2><PropertyListingForm heading="List your home" subheading="Submit your Pune property for admin verification before it goes live." listedByRole="owner"/></section>
      </div>
    </div>
  </main>;
}
