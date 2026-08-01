"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import PaymentModal from "./PaymentModal";
import PropertyListingForm from "./PropertyListingForm";
import FirestoreApprovalQueue from "./FirestoreApprovalQueue";
import { useMarketplace } from "@/lib/marketplace-context";
import { useAuth } from "@/lib/auth-context";

// Dashboard is for consultants and admins only. Clients use /profile.
const ROLES = [
  { id: "listings", label: "Listings", icon: "building" },
  { id: "consultant", label: "Consultant", icon: "user" },
  { id: "admin", label: "Admin", icon: "shield" },
];

const BUTTON_BASE = "min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border px-5 font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] focus-visible:ring-offset-2";
const BUTTON_PRIMARY = `${BUTTON_BASE} border-[var(--orange)] bg-[var(--orange)] text-white hover:bg-[var(--orange-dark)]`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink-2)]`;
const BUTTON_SMALL = "min-h-11 px-3.5 text-sm";
const SECTION_STYLES = "rounded-[var(--radius)] border border-[var(--line)] bg-white p-6 max-[640px]:p-4";
const SECTION_HEAD_STYLES = "mb-5 flex items-end justify-between gap-4 max-[640px]:mb-4 max-[640px]:items-start max-[430px]:flex-col";
const MONEY_STYLES = "tabular-nums tracking-[-0.025em]";
const VIEW_STYLES = "grid gap-5 max-[640px]:gap-4";
const STATUS_BASE = "inline-flex min-h-7 w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold before:h-[7px] before:w-[7px] before:rounded-full before:bg-current";
const STATUS_UTILITIES = {
  Success: "bg-[var(--green-soft)] text-[oklch(0.4_0.13_155)]",
  Available: "bg-[var(--green-soft)] text-[oklch(0.4_0.13_155)]",
  Visited: "bg-[var(--green-soft)] text-[oklch(0.4_0.13_155)]",
  Closed: "bg-[var(--green-soft)] text-[oklch(0.4_0.13_155)]",
  Pending: "bg-[var(--orange-soft)] text-[oklch(0.49_0.17_48)]",
  Scheduled: "bg-[var(--orange-soft)] text-[oklch(0.49_0.17_48)]",
  Unlocked: "bg-[var(--orange-soft)] text-[oklch(0.49_0.17_48)]",
  "Under hold": "bg-[var(--orange-soft)] text-[oklch(0.49_0.17_48)]",
  "Token paid": "bg-[var(--soft)] text-[var(--ink-2)]",
  Cancelled: "bg-[var(--soft)] text-[var(--ink-2)]",
};
const CHART_BAR_UTILITIES = {
  listing: "bg-[var(--orange)]",
  unlock: "bg-[var(--orange)]",
  visit: "bg-[var(--orange-dark)]",
  cancellation: "bg-[var(--ink-2)]",
  token: "bg-[var(--ink-2)]",
  brokerage: "bg-[oklch(0.52_0.14_155)]",
  refund: "bg-[var(--muted)]",
};
const LEDGER_TYPE_UTILITIES = {
  listing: "bg-[var(--orange-soft)] text-[var(--orange-dark)]",
  unlock: "bg-[var(--orange-soft)] text-[var(--orange-dark)]",
  visit: "bg-[var(--orange-soft)] text-[var(--orange-dark)]",
  cancellation: "bg-[var(--soft)] text-[var(--ink)]",
  token: "bg-[var(--soft)] text-[var(--ink-2)]",
  brokerage: "bg-[var(--green-soft)] text-[oklch(0.4_0.13_155)]",
  refund: "bg-[var(--soft)] text-[var(--ink-2)]",
  other: "bg-[var(--soft)] text-[var(--ink-2)]",
};

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const typeKey = (type = "") => {
  const value = type.toLowerCase();
  if (value.includes("listing")) return "listing";
  if (value.includes("unlock")) return "unlock";
  if (value.includes("visit")) return "visit";
  if (value.includes("cancellation")) return "cancellation";
  if (value.includes("refund")) return "refund";
  if (value.includes("token")) return "token";
  if (value.includes("brokerage")) return "brokerage";
  return "other";
};


function StatusChip({ status }) {
  return <span className={`${STATUS_BASE} ${STATUS_UTILITIES[status] || "bg-[var(--soft)] text-[var(--ink-2)]"}`}>{status}</span>;
}

function EmptyState({ icon, title, copy, action }) {
  return <div className="col-span-full grid min-h-[220px] place-items-center rounded-[14px] border border-dashed border-[var(--line)] p-8 text-center [&>svg]:text-[var(--orange)]">
    <Icon name={icon} size={30}/>
    <h3 className="mt-3.5 mb-1.5">{title}</h3>
    <p className="m-0 max-w-[46ch] text-[var(--muted)]">{copy}</p>
    {action && <div className="mt-[18px]">{action}</div>}
  </div>;
}

function PropertySummary({ property }) {
  if (!property) return null;
  return <div className="flex min-w-0 flex-1 items-start justify-between gap-[22px] max-[640px]:flex-col">
    <div>
      <Link className="block text-[19px] font-bold leading-tight hover:text-[var(--orange-dark)]" href={`/properties/${property.id}`}>{property.title}</Link>
      <span className="mt-1 block text-[13px] text-[var(--muted)]">{property.locality} · {property.bhk}</span>
    </div>
    <strong className={`${MONEY_STYLES} whitespace-nowrap text-lg`}>{money(property.rent)}<small className="mt-1 block text-[13px] text-[var(--muted)]">/month</small></strong>
  </div>;
}

function DashboardSkeleton() {
  const placeholder = "animate-pulse rounded-[10px] bg-[var(--soft)]";
  return <main className="bg-transparent" aria-busy="true" aria-label="Loading marketplace dashboard">
    <div className="site-container grid min-h-[75dvh] gap-4 pt-[72px] pb-16 max-[640px]:pt-10">
      <div className={`${placeholder} h-[42px] w-2/5`}/>
      <div className={`${placeholder} h-[20px] w-[65%]`}/>
      <div className="grid grid-cols-3 gap-2">{ROLES.map((role) => <div className={`${placeholder} h-11`} key={role.id}/>)}</div>
      <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
        <div className={`${placeholder} h-[200px] rounded-[14px]`}/><div className={`${placeholder} h-[200px] rounded-[14px]`}/><div className={`${placeholder} h-[200px] rounded-[14px]`}/>
      </div>
    </div>
  </main>;
}

// Exported so the client profile page can reuse the loyalty + activity view.
export function ClientView({ state, propertiesById, tierFor, onToken, cancelToken }) {
  const leads = state.leads || [];
  const closedDeals = state.closedDeals || 0;
  const nextBooking = closedDeals + 1;
  const currentTier = tierFor(nextBooking);
  const currentMilestone = Math.min(closedDeals, 2);
  const [referralFeedback, setReferralFeedback] = useState("");

  const copyReferral = async (text) => {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setReferralFeedback("Referral link copied");
  };

  const referFriend = async () => {
    const shareData = {
      title: "RentkaroPune",
      text: "Find verified Pune rentals with transparent ₹100 unlocks and consultant-assisted visits.",
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setReferralFeedback("Referral shared");
      } else await copyReferral(`${shareData.text} ${shareData.url}`);
    } catch (error) {
      if (error?.name === "AbortError") return;
      try { await copyReferral(`${shareData.text} ${shareData.url}`); }
      catch { setReferralFeedback("Could not share. Please copy the page URL."); }
    }
    window.setTimeout(() => setReferralFeedback(""), 3500);
  };

  return <div className={VIEW_STYLES}>
    <section className={`${SECTION_STYLES} border-[var(--ink)]`} aria-labelledby="client-loyalty-title">
      <div className="flex items-start justify-between gap-4 max-[640px]:flex-col">
        <div>
          <span className="text-sm font-bold text-[var(--orange-dark)]">Loyalty Card</span>
          <h2 className="mt-1 mb-1 text-[24px] max-[640px]:text-[22px]" id="client-loyalty-title">{currentTier}% off your next rental brokerage</h2>
          <p className="m-0 max-w-[62ch] text-sm text-[var(--muted)]">Rental {nextBooking} uses your current loyalty tier. Unlock a verified home for ₹100, then complete the rental to advance.</p>
        </div>
        <div className="flex min-w-[168px] items-center justify-between gap-3 rounded-[10px] bg-[var(--ink)] px-4 py-3 text-white max-[640px]:w-full">
          <span className="text-sm text-[oklch(0.78_0_0)]">Completed rentals</span>
          <strong className={`${MONEY_STYLES} text-2xl`}>{closedDeals}</strong>
        </div>
      </div>

      <ol className="my-5 grid list-none grid-cols-3 gap-2 p-0" aria-label="Loyalty milestones">
        {[10, 20, 30].map((discount, index) => {
          const isCurrent = index === currentMilestone;
          const isCompleted = closedDeals > index;
          const status = isCurrent ? "Current" : isCompleted ? "Completed" : "Upcoming";
          return <li className={`min-w-0 rounded-[10px] border p-3 text-center ${isCurrent ? "border-[var(--orange)] bg-[var(--orange-soft)]" : isCompleted ? "border-[var(--ink)] bg-[var(--soft)]" : "border-[var(--line)] bg-white"}`} aria-current={isCurrent ? "step" : undefined} key={discount}>
            <span className={`mx-auto mb-2 grid h-9 w-9 place-items-center rounded-[8px] ${isCurrent ? "bg-[var(--orange)] text-white" : isCompleted ? "bg-[var(--ink)] text-white" : "bg-[var(--soft)] text-[var(--muted)]"}`}><Icon name="home" size={18}/></span>
            <strong className="block text-lg">{discount}%</strong>
            <span className="block truncate text-xs text-[var(--muted)]">{status}</span>
          </li>;
        })}
      </ol>

      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-[var(--line)] pt-4 max-[430px]:flex-col">
        <p className="m-0 text-sm text-[var(--ink-2)]"><strong>Next rental:</strong> save {currentTier}% on the one-month brokerage baseline.</p>
        <div className="shrink-0 text-right max-[430px]:w-full max-[430px]:text-left">
          <button className={`${BUTTON_SECONDARY} ${BUTTON_SMALL} max-[430px]:w-full`} type="button" onClick={referFriend}>Refer a friend</button>
          <span className="mt-1 block min-h-4 text-xs font-semibold text-[oklch(0.4_0.13_155)]" role="status" aria-live="polite">{referralFeedback}</span>
        </div>
      </div>
    </section>

    <section className={SECTION_STYLES} aria-labelledby="client-leads-title">
      <div className={`${SECTION_HEAD_STYLES} flex-wrap`}><div><h2 className="text-[28px] max-[640px]:text-[24px]" id="client-leads-title">Unlocked homes and visits</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Track every verified Pune home from ₹100 unlock to token hold.</p></div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex min-h-8 items-center rounded-full bg-[var(--soft)] px-2.5 text-xs font-bold text-[var(--ink-2)]">{state.totalVisits || 0} marketplace visits</span><Link className={`${BUTTON_SECONDARY} ${BUTTON_SMALL}`} href="/#homes">Browse homes <Icon name="arrow" size={16}/></Link></div></div>
      {leads.length ? <div className="grid">{leads.map((lead) => {
        const property = propertiesById.get(lead.propertyId);
        const tokenAmount = Math.round((property?.rent || 0) * 0.15);
        const visitFee = Number(lead.visitFee) === 50 ? money(50) : "Free";
        return <article className="border-t border-[var(--line)] py-5 first:border-t-0 first:pt-0 last:pb-0" key={lead.id}>
          <div className="flex items-start justify-between gap-4 max-[640px]:flex-col"><PropertySummary property={property}/><StatusChip status={lead.status}/></div>
          <dl className="my-4 grid grid-cols-4 gap-2 max-[760px]:grid-cols-2 max-[390px]:grid-cols-1">
            <div className="rounded-[10px] bg-[var(--soft)] p-3"><dt className="text-xs text-[var(--muted)]">Assigned consultant</dt><dd className="mt-1 mb-0 font-semibold">{lead.broker?.name || "Assignment pending"}</dd></div>
            <div className="rounded-[10px] bg-[var(--soft)] p-3"><dt className="text-xs text-[var(--muted)]">Visit status</dt><dd className="mt-1 mb-0 font-semibold">{lead.visitDate || "Not booked"}</dd></div>
            <div className="rounded-[10px] bg-[var(--soft)] p-3"><dt className="text-xs text-[var(--muted)]">Visit fee</dt><dd className="mt-1 mb-0 font-semibold">{visitFee}</dd></div>
            <div className="rounded-[10px] bg-[var(--soft)] p-3"><dt className="text-xs text-[var(--muted)]">Token hold</dt><dd className="mt-1 mb-0 font-semibold">{lead.tokenPaid ? money(lead.tokenPaid) : `${money(tokenAmount)} (15%)`}</dd></div>
          </dl>
          <div className="flex flex-wrap items-center justify-end gap-2 max-[640px]:justify-start">
            {lead.status === "Visited" && <button className={`${BUTTON_PRIMARY} ${BUTTON_SMALL}`} type="button" onClick={() => onToken(property)}><Icon name="wallet" size={16}/> Pay 15% token</button>}
            {lead.status === "Token paid" && <details className="relative"><summary className="flex min-h-10 cursor-pointer list-none items-center rounded-[10px] border border-[var(--line)] px-[13px] font-bold [&::-webkit-details-marker]:hidden">Cancel token</summary><div className="mt-2 max-w-[420px] rounded-[10px] bg-[var(--orange-soft)] p-[15px]"><p className="mt-0 mb-3 text-[var(--ink-2)]">You will receive a 75% refund of {money(lead.tokenPaid)}. The remaining 25% is recorded as a cancellation charge.</p><button className={`${BUTTON_SECONDARY} ${BUTTON_SMALL}`} type="button" onClick={() => cancelToken(lead.propertyId)}>Confirm cancellation</button></div></details>}
            {lead.status === "Scheduled" && <p className="m-0 inline-flex items-center gap-2 text-sm text-[var(--muted)]"><Icon name="calendar" size={16}/> Token payment unlocks after the consultant marks this visit complete.</p>}
            {lead.status === "Unlocked" && <p className="m-0 inline-flex items-center gap-2 text-sm text-[var(--muted)]"><Icon name="info" size={16}/> Contact your assigned consultant to schedule a visit.</p>}
            {lead.status === "Closed" && <p className="m-0 inline-flex items-center gap-2 text-sm text-[oklch(0.4_0.13_155)]"><Icon name="check" size={16}/> Rental completed with {lead.discount ?? tierFor(Math.max(1, closedDeals))}% loyalty savings.</p>}
          </div>
        </article>;
      })}</div> : <EmptyState icon="home" title="No homes unlocked yet" copy="Browse verified Pune listings and unlock a consultant-assisted visit when a home fits." action={<Link className={BUTTON_PRIMARY} href="/#homes">Find a Pune home</Link>}/>}
    </section>
  </div>;
}

function ListingsView({ state, propertiesById }) {
  const ownerProperties = (state.properties || []).filter((property) => property.owner === "You (Owner)");
  const ownerIds = new Set(ownerProperties.map((property) => property.id));
  const ownerVisits = (state.leads || []).filter((lead) => ownerIds.has(lead.propertyId) && lead.visitDate && lead.visitDate !== "Not booked");

  return <div className={VIEW_STYLES}>
    <PropertyListingForm heading="Add a Pune property" subheading="Consultants and owners can list homes here. Pay ₹100 after review; admin verification is required before it goes live." listedByRole="consultant"/>
    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="listing-inventory-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="listing-inventory-title">Listing inventory</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Review verification state, asking rent and live marketplace status.</p></div></div>
      {ownerProperties.length ? <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">{ownerProperties.map((property) => <article className="flex min-h-[250px] flex-col rounded-[14px] bg-[var(--soft)] p-5" key={property.id}><div className="flex items-start justify-between gap-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[var(--orange-soft)] text-[var(--orange)]"><Icon name="home"/></span><StatusChip status={property.status}/></div><h3 className="mt-[18px] mb-[7px] text-xl"><Link href={`/properties/${property.id}`}>{property.title}</Link></h3><p className="text-[var(--muted)]">{property.locality} · {property.bhk} · {Number(property.area).toLocaleString("en-IN")} sq ft</p><div className="mt-auto flex items-end gap-1.5 pt-[18px]"><strong className={`${MONEY_STYLES} text-2xl`}>{money(property.rent)}</strong><span className="text-[var(--muted)]">per month</span></div><small className="text-[var(--muted)]">{property.approved ? "Ownership documents verified" : "Awaiting admin document review"}</small></article>)}</div> : <EmptyState icon="building" title="No listings yet" copy="Complete the form above to send your first Pune property for verification."/>}
    </section>
    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="listing-visits-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="listing-visits-title">Tenant visit schedule</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Upcoming and completed visits for your verified inventory.</p></div></div>
      {ownerVisits.length ? <div className="grid">{ownerVisits.map((lead) => <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-[var(--line)] py-4 first:border-t-0 max-[640px]:grid-cols-[auto_1fr]" key={lead.id}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[var(--orange-soft)] text-[var(--orange)]"><Icon name="calendar"/></span><div className="grid gap-1"><strong>{propertiesById.get(lead.propertyId)?.title}</strong><span className="text-[13px] text-[var(--muted)]">{lead.visitDate}</span></div><div className="grid justify-items-end gap-1 max-[640px]:col-start-2 max-[640px]:justify-items-start"><span className="text-[13px] text-[var(--muted)]">{lead.broker?.name}</span><StatusChip status={lead.status}/></div></article>)}</div> : <EmptyState icon="calendar" title="No tenant visits scheduled" copy="Confirmed visit slots will appear here after clients coordinate with their assigned consultant."/>}
    </section>
  </div>;
}

function ConsultantView({ state, broker, propertiesById, tierFor, onVisited, onClose }) {
  const assigned = (state.leads || []).filter((lead) => !lead.broker?.name || lead.broker.name === broker.name);
  const scheduled = assigned.filter((lead) => lead.visitDate && lead.visitDate !== "Not booked" && !["Closed", "Cancelled"].includes(lead.status));
  const earned = assigned.filter((lead) => lead.status === "Closed").reduce((sum, lead) => sum + Number(lead.brokerShare || 0), 0);
  const tokenPaidLeads = assigned.filter((lead) => lead.status === "Token paid");
  const pendingPayout = tokenPaidLeads.reduce((sum, lead, index) => {
    const property = propertiesById.get(lead.propertyId);
    const discount = tierFor((state.closedDeals || 0) + index + 1);
    const projectedBrokerage = Math.round((property?.rent || 0) * (1 - discount / 100));
    return sum + Math.round(projectedBrokerage * 0.6);
  }, 0);

  return <div className={VIEW_STYLES}>
    <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 rounded-[var(--radius)] bg-[var(--ink)] p-6 text-white max-[760px]:grid-cols-1 max-[640px]:p-4" aria-labelledby="consultant-profile-title">
      <div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[var(--orange)] font-extrabold text-white" aria-hidden="true">AS</span><div><span className="text-[13px] text-[oklch(0.78_0_0)]">Assigned marketplace consultant</span><h2 className="my-0.5 text-[24px]" id="consultant-profile-title">{broker.name}</h2><p className="m-0 text-sm text-[oklch(0.78_0_0)]">{broker.zone} · {broker.rating} verified rating</p></div></div>
      <div className="grid grid-cols-2 gap-2 max-[760px]:w-full"><div className="rounded-[10px] border border-white/20 p-3"><span className="block text-xs text-[oklch(0.78_0_0)]">Closed payouts</span><strong className={`${MONEY_STYLES} mt-1 block text-xl`}>{money(earned)}</strong></div><div className="rounded-[10px] border border-white/20 p-3"><span className="block text-xs text-[oklch(0.78_0_0)]">Projected payout</span><strong className={`${MONEY_STYLES} mt-1 block text-xl`}>{money(pendingPayout)}</strong></div><div className="col-span-2 flex items-center justify-between rounded-[10px] bg-white px-3 py-2 text-[var(--ink)]"><strong>Closure split</strong><span className="text-sm"><b className="text-[var(--orange-dark)]">60% consultant</b> / <b>40% platform</b></span></div></div>
    </section>

    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="consultant-leads-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="consultant-leads-title">Assigned leads</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Move each client through a documented visit and closure workflow.</p></div><span className="inline-flex min-h-8 items-center whitespace-nowrap rounded-full bg-[var(--soft)] px-2.5 text-xs font-bold text-[var(--ink-2)]">{assigned.length} active records</span></div>
      {assigned.length ? <div className="grid">{assigned.map((lead) => {
        const property = propertiesById.get(lead.propertyId);
        const projectedDiscount = tierFor((state.closedDeals || 0) + 1);
        const projectedBrokerage = Math.round((property?.rent || 0) * (1 - projectedDiscount / 100));
        return <article className="border-t border-[var(--line)] py-[22px] first:border-t-0 first:pt-0 last:pb-0" key={lead.id}><div className="flex items-start justify-between gap-5 max-[640px]:flex-col"><PropertySummary property={property}/><StatusChip status={lead.status}/></div><dl className="my-[18px] grid grid-cols-4 gap-2 max-[760px]:grid-cols-2 max-[390px]:grid-cols-1"><div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Client journey</dt><dd className="mt-1 mb-0 font-semibold">{lead.status}</dd></div><div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Visit</dt><dd className="mt-1 mb-0 font-semibold">{lead.visitDate || "Not booked"}</dd></div><div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Visit fee</dt><dd className="mt-1 mb-0 font-semibold">{Number(lead.visitFee) === 50 ? money(50) : "Free"}</dd></div><div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Your payout</dt><dd className="mt-1 mb-0 font-semibold">{lead.brokerShare ? money(lead.brokerShare) : `${money(Math.round(projectedBrokerage * 0.6))} projected (${projectedDiscount}% loyalty)`}</dd></div></dl><div className="flex flex-wrap items-center justify-end gap-2 max-[640px]:justify-start">{lead.status === "Scheduled" && <button className={`${BUTTON_PRIMARY} ${BUTTON_SMALL}`} type="button" onClick={() => onVisited(lead.propertyId)}><Icon name="check" size={16}/> Mark as visited</button>}{lead.status === "Token paid" && <button className={`${BUTTON_PRIMARY} ${BUTTON_SMALL}`} type="button" onClick={() => onClose(property)}><Icon name="wallet" size={16}/> Close deal</button>}{lead.status === "Closed" && <p className="m-0 inline-flex items-center gap-2 text-sm text-[oklch(0.4_0.13_155)]"><Icon name="check" size={16}/> Paid {money(lead.brokerShare)}. Your share is 60% of collected brokerage.</p>}</div></article>;
      })}</div> : <EmptyState icon="user" title="No assigned leads" copy="New client unlocks in your Pune zone will be routed here."/>}
    </section>

    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="visit-calendar-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="visit-calendar-title">Visit calendar</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Consultant-attended visits with the property and current handoff status.</p></div></div>
      {scheduled.length ? <div className="grid">{scheduled.map((lead) => <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-[var(--line)] py-4 first:border-t-0 max-[640px]:grid-cols-[auto_1fr]" key={lead.id}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[var(--orange-soft)] text-[var(--orange)]"><Icon name="calendar"/></span><div className="grid gap-1"><strong>{lead.visitDate}</strong><span className="text-[13px] text-[var(--muted)]">{propertiesById.get(lead.propertyId)?.title}</span></div><div className="grid justify-items-end gap-1 max-[640px]:col-start-2 max-[640px]:justify-items-start"><span className="text-[13px] text-[var(--muted)]">{propertiesById.get(lead.propertyId)?.locality}</span><StatusChip status={lead.status}/></div></article>)}</div> : <EmptyState icon="calendar" title="Calendar is clear" copy="Scheduled client visits will appear here with the property and handoff status."/>}
    </section>
  </div>;
}

function ConsultantApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/consultant/applications", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) setApplications(data.applications || []);
      else setError(data.error || "Could not load applications.");
    } catch {
      setError("Network error while loading applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/consultant/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      if (response.ok) setApplications((current) => current.filter((item) => item.id !== id));
      else {
        const data = await response.json();
        setError(data.error || "Could not approve this applicant.");
      }
    } catch {
      setError("Network error while approving.");
    } finally {
      setBusyId("");
    }
  };

  return <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="consultant-applications-title">
    <div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="consultant-applications-title">Consultant applications</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Approve members who requested consultant access. Approved consultants can post properties.</p></div><span className="inline-flex min-h-8 items-center whitespace-nowrap rounded-full bg-[var(--soft)] px-2.5 text-xs font-bold text-[var(--ink-2)]">{applications.length} pending</span></div>
    {error && <p className="m-0 mb-4 flex items-center gap-[9px] rounded-[10px] bg-[oklch(0.96_0.025_28)] px-3.5 py-3 font-semibold text-[var(--red)]" role="alert"><Icon name="info" size={16}/>{error}</p>}
    {loading ? <div className="grid min-h-[120px] place-items-center text-[var(--muted)]">Loading applications…</div>
      : applications.length ? <div className="grid gap-3">{applications.map((applicant) => <article className="flex items-center justify-between gap-4 rounded-[12px] bg-[var(--soft)] p-4 max-[520px]:flex-col max-[520px]:items-start" key={applicant.id}><div className="min-w-0"><strong className="block truncate text-lg">{applicant.name || applicant.email || applicant.id}</strong><span className="block truncate text-sm text-[var(--muted)]">{applicant.email || applicant.phone || applicant.id}</span></div><button className={`${BUTTON_PRIMARY} ${BUTTON_SMALL} shrink-0 max-[520px]:w-full`} type="button" disabled={busyId === applicant.id} onClick={() => approve(applicant.id)}><Icon name="check" size={16}/> {busyId === applicant.id ? "Approving…" : "Approve consultant"}</button></article>)}</div>
      : <EmptyState icon="user" title="No pending applications" copy="Members who request consultant access will appear here for approval."/>}
  </section>;
}

function AdminView({ state, approveProperty }) {
  const properties = state.properties || [];
  const pending = properties.filter((property) => !property.approved);
  const ledger = state.ledger || [];
  const totalVolume = ledger.reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0);
  const refunds = ledger.filter((item) => typeKey(item.type) === "refund").reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0);
  const visitFees = ledger.filter((item) => typeKey(item.type) === "visit").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const cancellationCharges = ledger.filter((item) => typeKey(item.type) === "cancellation").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const platformRevenue = ledger.reduce((sum, item) => sum + Number(item.platformShare || 0), 0);
  const brokerageMargin = ledger.filter((item) => typeKey(item.type) === "brokerage").reduce((sum, item) => sum + Number(item.platformShare || Math.round(Number(item.amount || 0) * 0.4)), 0);
  const chartData = [
    { key: "listing", label: "Listings" },
    { key: "unlock", label: "Unlocks" },
    { key: "visit", label: "Visit fees" },
    { key: "cancellation", label: "Cancellation charges" },
    { key: "token", label: "Tokens" },
    { key: "brokerage", label: "Brokerage" },
    { key: "refund", label: "Refunds" },
  ].map((category) => ({ ...category, value: ledger.filter((item) => typeKey(item.type) === category.key).reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0) }));
  const chartMax = Math.max(...chartData.map((item) => item.value), 1);

  return <div className={VIEW_STYLES}>
    <section className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[390px]:grid-cols-1" aria-label="Transaction key performance indicators">
      {[
        ["Marketplace volume", totalVolume, `${ledger.length} ledger entries`],
        ["Platform revenue", platformRevenue, "All retained marketplace fees"],
        ["Visit fees", visitFees, "₹50 after the free first visit"],
        ["Cancellation charges", cancellationCharges, "25% retained on cancellation"],
        ["40% brokerage margin", brokerageMargin, "After 60% consultant payouts"],
        ["Token refunds", refunds, "75% returned on cancellation"],
      ].map(([label, value, copy], index) => <article className={`flex min-h-[118px] flex-col justify-between rounded-[12px] p-4 ${index === 1 ? "bg-[var(--ink)] text-white [&>small]:text-[oklch(0.78_0_0)] [&>span]:text-[oklch(0.78_0_0)]" : "border border-[var(--line)] bg-white [&>small]:text-[var(--muted)] [&>span]:text-[var(--muted)]"}`} key={label}><span className="text-sm">{label}</span><strong className={`${MONEY_STYLES} text-[24px] max-[640px]:text-xl`}>{money(value)}</strong><small>{copy}</small></article>)}
    </section>

    <ConsultantApplications/>
    <FirestoreApprovalQueue/>

    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="approval-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="approval-title">Pending ownership approvals</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Publish only after all ownership and identity evidence is checked.</p></div><span className="inline-flex min-h-8 items-center whitespace-nowrap rounded-full bg-[var(--soft)] px-2.5 text-xs font-bold text-[var(--ink-2)]">{pending.length} pending</span></div>
      {pending.length ? <div className="grid gap-3.5">{pending.map((property) => <article className="rounded-[14px] bg-[var(--soft)] p-5" key={property.id}><div className="flex items-start justify-between gap-5 max-[640px]:flex-col"><div><StatusChip status={property.status}/><h3 className="mt-2.5 mb-1 text-[21px]">{property.title}</h3><p className="m-0 text-[var(--muted)]">{property.ownerName || property.owner} · {property.locality} · {property.bhk}</p></div><strong className={`${MONEY_STYLES} whitespace-nowrap text-xl`}>{money(property.rent)}<small className="text-[var(--muted)]">/month</small></strong></div><fieldset className="my-[18px] grid grid-cols-2 gap-2 border-0 p-0 max-[640px]:grid-cols-1"><legend className="mb-[9px] font-bold">Ownership-document checklist</legend>{["Registered ownership proof received", "Owner identity matches the legal record", "Rent, area and address reviewed", "₹100 listing payment confirmed"].map((label) => <label className="flex items-start gap-[11px] rounded-[10px] bg-white p-[13px] text-[13px]" key={label}><input className="mt-[3px] h-[18px] w-[18px] shrink-0 accent-[var(--orange)]" type="checkbox" checked readOnly/><span>{label}</span></label>)}</fieldset><button className={BUTTON_PRIMARY} type="button" onClick={() => approveProperty(property.id)}><Icon name="shield" size={17}/> Approve and publish</button></article>)}</div> : <EmptyState icon="check" title="Approval queue is clear" copy="New owner submissions will appear here for document verification."/>}
    </section>

    <section className={SECTION_STYLES} aria-labelledby="transactions-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px] max-[640px]:text-[24px]" id="transactions-title">Transaction performance</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Gross movement by transaction type, paired with the auditable ledger below.</p></div></div>
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(250px,.6fr)] gap-4 max-[900px]:grid-cols-1"><figure className="m-0 min-w-0 rounded-[12px] bg-[var(--soft)] p-4" aria-labelledby="chart-caption"><figcaption className="font-bold" id="chart-caption">Transaction volume by type</figcaption><div className="mt-4 grid gap-3">{chartData.map((item) => <div key={item.key} aria-label={`${item.label}: ${money(item.value)}`}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span>{item.label}</span><strong className={MONEY_STYLES}>{money(item.value)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-white"><span className={`block h-full rounded-full ${CHART_BAR_UTILITIES[item.key]}`} style={{ width: `${Math.max(item.value ? 8 : 2, Math.round((item.value / chartMax) * 100))}%` }}/></div></div>)}</div></figure><aside className="rounded-[12px] bg-[var(--ink)] p-5 text-white [&>svg]:text-[var(--orange)]"><Icon name="chart" size={26}/><h3 className="mt-4 mb-2 text-[23px]">Closure split</h3><p className="text-[oklch(0.78_0_0)]">Every closed rental sends 60% of collected brokerage to the assigned consultant. RentkaroPune retains 40%.</p><dl className="mt-4 mb-0 grid"><div className="flex justify-between border-t border-white/20 py-2.5"><dt>Consultant payout</dt><dd className="font-extrabold text-[var(--orange)]">60%</dd></div><div className="flex justify-between border-t border-white/20 py-2.5"><dt>Platform margin</dt><dd className="font-extrabold text-[var(--orange)]">40%</dd></div></dl></aside></div>
      <div className="mt-5 overflow-x-auto overscroll-x-contain rounded-xl border border-[var(--line)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--orange-soft)]" role="region" aria-label="Scrollable marketplace transaction ledger" tabIndex="0"><table className="min-w-[760px] w-full border-collapse text-sm"><caption className="pb-2.5 text-left font-bold">Marketplace transaction ledger</caption><thead><tr>{["Date", "Type", "Reference", "Gross amount", "Consultant payout", "Platform share"].map((heading, index) => <th className={`whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px] text-left text-xs text-[var(--muted)] ${index >= 3 ? "text-right tabular-nums" : ""}`} scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{ledger.length ? ledger.map((item) => {
        const ledgerKey = typeKey(item.type);
        return <tr className="hover:bg-[var(--soft)]" key={item.id}><td className="whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px]">{item.date}</td><td className="whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px]"><span className={`inline-flex min-h-[26px] items-center rounded-[7px] px-2 text-xs font-bold ${LEDGER_TYPE_UTILITIES[ledgerKey]}`}>{item.type}</span></td><td className="whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px]">{item.reference}</td><td className={`${MONEY_STYLES} whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px] text-right`}>{ledgerKey === "refund" ? "-" : ""}{money(Math.abs(item.amount))}</td><td className={`${MONEY_STYLES} whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px] text-right`}>{item.brokerShare ? money(item.brokerShare) : "Not applicable"}</td><td className={`${MONEY_STYLES} whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px] text-right`}>{item.platformShare ? money(item.platformShare) : ledgerKey === "token" || ledgerKey === "refund" ? "Held funds" : money(0)}</td></tr>;
      }) : <tr><td className="border-b border-[var(--line)] px-[11px] py-[13px]" colSpan="6">No transactions have been recorded.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}

export default function Dashboard() {
  const { state, ready, broker, approveProperty, markVisited, payToken, cancelToken, closeDeal, resetDemo, tierFor } = useMarketplace();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState("listings");
  const [roleReady, setRoleReady] = useState(false);
  const [payment, setPayment] = useState(null);

  const isAdmin = user?.admin === 1;
  const isConsultant = user?.role === "consultant";
  const allowed = isAdmin || isConsultant;

  // Access control: only consultants and admins may use the dashboard.
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login?next=/dashboard"); return; }
    if (!allowed) router.replace("/profile");
  }, [loading, user, allowed, router]);

  const availableRoles = useMemo(() => (isAdmin ? ROLES : ROLES.filter((item) => item.id !== "admin")), [isAdmin]);
  const effectiveRole = availableRoles.some((item) => item.id === role) ? role : "listings";

  useEffect(() => {
    const requestedRole = new URLSearchParams(window.location.search).get("role")?.toLowerCase();
    if (ROLES.some((item) => item.id === requestedRole)) setRole(requestedRole);
    setRoleReady(true);
  }, []);

  useEffect(() => {
    if (!roleReady) return;
    const url = new URL(window.location.href);
    url.searchParams.set("role", effectiveRole);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [effectiveRole, roleReady]);

  const propertiesById = useMemo(() => new Map((state.properties || []).map((property) => [property.id, property])), [state.properties]);
  const activeRole = ROLES.find((item) => item.id === effectiveRole) || ROLES[0];

  if (!ready || loading || !allowed) return <DashboardSkeleton/>;

  const openTokenPayment = (property) => {
    if (!property) return;
    setPayment({ kind: "token", propertyId: property.id, amount: Math.round(property.rent * 0.15), title: `Reserve ${property.title}`, note: "Pay a 15% token hold after your completed visit. Cancelling before closure returns 75%." });
  };
  const openClosePayment = (property) => {
    if (!property) return;
    const discount = tierFor((state.closedDeals || 0) + 1);
    const brokerage = Math.round(property.rent * (1 - discount / 100));
    const brokerShare = Math.round(brokerage * 0.6);
    setPayment({ kind: "closure", propertyId: property.id, amount: brokerage, title: "Confirm brokerage and close deal", note: `${discount}% loyalty discount applied. ${money(brokerShare)} is the consultant's 60% payout and ${money(brokerage - brokerShare)} is the 40% platform margin.` });
  };
  const completePayment = () => {
    if (!payment) return;
    if (payment.kind === "token") payToken(payment.propertyId);
    if (payment.kind === "closure") closeDeal(payment.propertyId);
  };

  return <main className="bg-transparent text-[var(--ink)] [&_h2]:leading-tight [&_h2]:tracking-[-0.02em] [&_h3]:leading-tight">
    <div className="site-container min-h-[75dvh] pt-8 pb-24 max-[640px]:pt-5 max-[390px]:pb-16">
      <header data-motion-reveal className="flex items-end justify-between gap-5 border-b border-[var(--line)] py-6 max-[640px]:flex-col max-[640px]:items-start max-[640px]:py-5">
        <div><span className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-[var(--orange-dark)]"><Icon name={activeRole.icon} size={17}/> Live marketplace workspace</span><h1 className="max-w-[720px] text-[48px] font-extrabold leading-[1.08] tracking-[-0.035em] max-[640px]:text-[32px]">{isAdmin ? "Admin" : "Consultant"} dashboard</h1><p className="mt-2 mb-0 max-w-[620px] leading-6 text-[var(--muted)]">Post verified homes, manage Pune visits and track marketplace settlements in one place.</p></div>
        <button className={`${BUTTON_SECONDARY} ${BUTTON_SMALL} shrink-0`} type="button" onClick={() => { if (window.confirm("Restore the original RentkaroPune demo data? Your local changes will be removed.")) resetDemo(); }}><Icon name="reset" size={16}/> Reset demo</button>
      </header>

      <nav data-motion-reveal className="my-5 flex snap-x gap-1 overflow-x-auto scroll-px-1 border-b border-[var(--line)] pb-2" aria-label="Dashboard section">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Switch dashboard section">{availableRoles.map((item) => <button key={item.id} id={`role-tab-${item.id}`} className={`inline-flex min-h-11 snap-start items-center gap-1.5 rounded-[8px] border-0 px-3.5 text-sm font-bold transition-[color,background-color,transform] duration-200 hover:bg-[var(--soft)] hover:text-[var(--ink)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] motion-reduce:transform-none ${effectiveRole === item.id ? "bg-[var(--ink)] text-white hover:bg-[var(--ink)] hover:text-white" : "bg-transparent text-[var(--muted)]"}`} type="button" role="tab" aria-selected={effectiveRole === item.id} aria-controls={`role-panel-${item.id}`} tabIndex={effectiveRole === item.id ? 0 : -1} onClick={() => setRole(item.id)}><Icon name={item.icon} size={16}/><span>{item.label}</span></button>)}</div>
      </nav>

      <div id={`role-panel-${effectiveRole}`} role="tabpanel" aria-labelledby={`role-tab-${effectiveRole}`} tabIndex="0">
        {effectiveRole === "listings" && <ListingsView state={state} propertiesById={propertiesById}/>}
        {effectiveRole === "consultant" && <ConsultantView state={state} broker={broker} propertiesById={propertiesById} tierFor={tierFor} onVisited={markVisited} onClose={openClosePayment}/>}
        {effectiveRole === "admin" && isAdmin && <AdminView state={state} approveProperty={approveProperty}/>}
      </div>
    </div>

    <PaymentModal open={Boolean(payment)} onClose={() => setPayment(null)} amount={payment?.amount || 0} title={payment?.title || "Secure payment"} note={payment?.note || "Review and confirm this marketplace payment."} onSuccess={completePayment}/>
  </main>;
}
