"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import PaymentModal from "./PaymentModal";
import { useMarketplace } from "@/lib/marketplace-context";

const ROLES = [
  { id: "client", label: "Client", icon: "user" },
  { id: "owner", label: "Owner", icon: "home" },
  { id: "broker", label: "Broker", icon: "building" },
  { id: "admin", label: "Admin", icon: "shield" },
];

const FORM_STEPS = ["Property basics", "Details and documents", "Review and pay"];
const EMPTY_FORM = {
  title: "",
  locality: "Koregaon Park",
  type: "Flat",
  bhk: "2 BHK",
  rent: "",
  area: "",
  furnishing: "Semi-furnished",
  description: "",
  amenities: "Lift, security",
  ownerName: "",
  ownershipProof: false,
  identityProof: false,
  declaration: false,
};

const BUTTON_BASE = "min-h-12 inline-flex items-center justify-center gap-2.5 rounded-xl border px-5 font-bold transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] focus-visible:ring-offset-2";
const BUTTON_PRIMARY = `${BUTTON_BASE} border-[var(--orange)] bg-[var(--orange)] text-white hover:bg-[var(--orange-dark)]`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border-[var(--line)] bg-white text-[var(--ink)]`;
const BUTTON_SMALL = "min-h-10 px-3.5 text-sm";
const SECTION_STYLES = "rounded-[var(--radius)] border border-[var(--line)] bg-white p-7 max-[640px]:px-4 max-[640px]:py-5";
const SECTION_HEAD_STYLES = "mb-6 flex items-end justify-between gap-5 max-[640px]:flex-col max-[640px]:items-start";
const FIELD_STYLES = "grid gap-[7px]";
const FIELD_LABEL_STYLES = "text-[13px] font-bold text-[var(--ink-2)]";
const INPUT_STYLES = "min-h-12 w-full rounded-[10px] border border-[var(--line)] bg-white px-[13px] py-[11px] text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--orange)] focus:shadow-[0_0_0_3px_var(--orange-soft)]";
const MONEY_STYLES = "tabular-nums tracking-[-0.025em]";
const VIEW_STYLES = "grid gap-7 animate-[workspace-in_.22s_var(--ease)]";
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
  listing: "bg-[var(--orange)] group-hover:bg-[var(--orange-dark)]",
  unlock: "bg-[var(--orange)] group-hover:bg-[var(--orange-dark)]",
  token: "bg-[var(--orange)] group-hover:bg-[var(--orange-dark)]",
  brokerage: "bg-[var(--orange)] group-hover:bg-[var(--orange-dark)]",
  refund: "bg-[var(--ink-2)] group-hover:bg-[var(--orange-dark)]",
};
const LEDGER_TYPE_UTILITIES = {
  listing: "bg-[var(--orange-soft)] text-[var(--orange-dark)]",
  unlock: "bg-[var(--orange-soft)] text-[var(--orange-dark)]",
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
  if (value.includes("token")) return "token";
  if (value.includes("brokerage")) return "brokerage";
  if (value.includes("refund")) return "refund";
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
  const shimmer = "animate-shimmer animate-[shimmer_1.2s_infinite] rounded-[10px] bg-[linear-gradient(90deg,var(--soft),oklch(0.93_0.006_55),var(--soft))] bg-[length:200%_100%]";
  return <main className="bg-[linear-gradient(180deg,var(--soft)_0_250px,var(--canvas)_250px)]" aria-busy="true" aria-label="Loading marketplace dashboard">
    <div className="mx-auto grid min-h-[75dvh] max-w-[var(--container)] gap-4 px-6 pt-[72px] pb-24 max-[640px]:px-4 max-[390px]:pb-16">
      <div className={`${shimmer} h-[52px] w-2/5`}/>
      <div className={`${shimmer} h-[22px] w-[65%]`}/>
      <div className="flex gap-2">{ROLES.map((role) => <div className={`${shimmer} h-11 w-[110px]`} key={role.id}/>)}</div>
      <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
        <div className={`${shimmer} h-[220px] rounded-[14px]`}/><div className={`${shimmer} h-[220px] rounded-[14px]`}/><div className={`${shimmer} h-[220px] rounded-[14px]`}/>
      </div>
    </div>
  </main>;
}

function ClientView({ state, propertiesById, tierFor, onToken, cancelToken }) {
  const leads = state.leads || [];
  const nextBooking = (state.closedDeals || 0) + 1;
  const currentTier = tierFor(nextBooking);

  return <div className={VIEW_STYLES}>
    <section data-motion-reveal className="flex items-center justify-between gap-7 rounded-[var(--radius)] bg-[var(--ink)] p-7 text-white max-[640px]:flex-col max-[640px]:items-start" aria-labelledby="client-loyalty-title">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[var(--orange-soft)] text-[var(--orange)]"><Icon name="wallet"/></span>
        <div><span className="text-[13px] text-[oklch(0.74_0_0)]">Next rental loyalty saving</span><strong className="my-[3px] block text-[28px]" id="client-loyalty-title">{currentTier}% off brokerage</strong><small className="block text-[oklch(0.74_0_0)]">{nextBooking === 1 ? "First rental" : nextBooking === 2 ? "Second rental" : "Third rental onward"}</small></div>
      </div>
      <div className="flex gap-1 max-[640px]:w-full" aria-label="Loyalty discount schedule">
        {[20, 40, 60].map((discount, index) => {
          const isCurrent = nextBooking === index + 1 || (nextBooking >= 3 && index === 2);
          return <div className={`min-w-[74px] rounded-[10px] p-3 text-center max-[640px]:min-w-0 max-[640px]:flex-1 ${isCurrent ? "bg-[var(--orange)] text-[var(--ink)]" : "bg-white/8 text-[oklch(0.72_0_0)]"}`} key={discount}><strong className="block text-xl">{discount}%</strong><span className="block text-xs">{index === 0 ? "1st" : index === 1 ? "2nd" : "3rd+"}</span></div>;
        })}
      </div>
    </section>

    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="client-leads-title">
      <div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="client-leads-title">Unlocked homes and visits</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Track every verified Pune home from broker assignment to token hold.</p></div><Link className={`${BUTTON_SECONDARY} ${BUTTON_SMALL}`} href="/#homes">Browse homes <Icon name="arrow" size={16}/></Link></div>
      {leads.length ? <div className="grid">{leads.map((lead) => {
        const property = propertiesById.get(lead.propertyId);
        const tokenAmount = Math.round((property?.rent || 0) * 0.15);
        return <article className="border-t border-[var(--line)] py-[22px] first:border-t-0 first:pt-0 last:pb-0" key={lead.id}>
          <div className="flex items-start justify-between gap-5 max-[640px]:flex-col"><PropertySummary property={property}/><StatusChip status={lead.status}/></div>
          <dl className="my-[18px] grid grid-cols-3 gap-3.5 max-[640px]:grid-cols-1">
            <div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Assigned broker</dt><dd className="mt-1 mb-0 font-semibold">{lead.broker?.name || "Assignment pending"}</dd></div>
            <div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Visit status</dt><dd className="mt-1 mb-0 font-semibold">{lead.visitDate || "Not booked"}</dd></div>
            <div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Token hold</dt><dd className="mt-1 mb-0 font-semibold">{lead.tokenPaid ? money(lead.tokenPaid) : `${money(tokenAmount)} (15%)`}</dd></div>
          </dl>
          <div className="flex flex-wrap items-center justify-end gap-2 max-[640px]:justify-start">
            {lead.status === "Visited" && <button className={`${BUTTON_PRIMARY} ${BUTTON_SMALL}`} type="button" onClick={() => onToken(property)}><Icon name="wallet" size={16}/> Pay 15% token</button>}
            {lead.status === "Token paid" && <details className="relative"><summary className="flex min-h-10 cursor-pointer list-none items-center rounded-[10px] border border-[var(--line)] px-[13px] font-bold [&::-webkit-details-marker]:hidden">Cancel token</summary><div className="mt-2 max-w-[420px] rounded-[10px] bg-[var(--orange-soft)] p-[15px]"><p className="mt-0 mb-3 text-[var(--ink-2)]">You will receive a 75% refund of {money(lead.tokenPaid)}. The remaining 25% covers visit and processing costs.</p><button className={`${BUTTON_SECONDARY} ${BUTTON_SMALL}`} type="button" onClick={() => cancelToken(lead.propertyId)}>Confirm cancellation</button></div></details>}
            {lead.status === "Scheduled" && <p className="m-0 inline-flex items-center gap-2 text-sm text-[var(--muted)]"><Icon name="calendar" size={16}/> Token payment unlocks after the broker marks this visit complete.</p>}
            {lead.status === "Unlocked" && <p className="m-0 inline-flex items-center gap-2 text-sm text-[var(--muted)]"><Icon name="info" size={16}/> Contact your assigned broker to schedule a visit.</p>}
            {lead.status === "Closed" && <p className="m-0 inline-flex items-center gap-2 text-sm text-[oklch(0.4_0.13_155)]"><Icon name="check" size={16}/> Rental completed with {lead.discount}% loyalty savings.</p>}
          </div>
        </article>;
      })}</div> : <EmptyState icon="home" title="No homes unlocked yet" copy="Browse verified Pune listings and unlock a broker-assisted visit when a home fits." action={<Link className={BUTTON_PRIMARY} href="/#homes">Find a Pune home</Link>}/>}
    </section>
  </div>;
}

function OwnerListingForm({ form, setForm, step, setStep, error, setError, onPay }) {
  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };
  const validate = () => {
    if (step === 0 && (!form.title.trim() || !form.locality.trim())) return "Add a property title and Pune locality to continue.";
    if (step === 1 && (!form.rent || !form.area || !form.description.trim() || !form.ownerName.trim())) return "Complete the rent, area, description and owner name.";
    if (step === 1 && (!form.ownershipProof || !form.identityProof || !form.declaration)) return "Confirm all three document declarations before review.";
    return "";
  };
  const next = () => {
    const message = validate();
    if (message) return setError(message);
    setStep((current) => Math.min(current + 1, 2));
  };
  const stepState = (index) => index === step
    ? "bg-[var(--ink)] text-white [&>span]:bg-[var(--orange)] [&>span]:text-white"
    : index < step ? "bg-[var(--soft)] text-[oklch(0.4_0.13_155)]" : "bg-[var(--soft)] text-[var(--muted)]";

  return <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="owner-form-title">
    <div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="owner-form-title">List a Pune property</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Pay ₹100 after review. Admin verification is required before the listing goes live.</p></div></div>
    <ol className="mb-7 grid list-none grid-cols-3 gap-2 p-0 max-[640px]:gap-1" aria-label="Listing progress">{FORM_STEPS.map((label, index) => <li className={`flex items-center gap-[9px] rounded-[10px] p-3 text-[13px] max-[640px]:p-2 ${stepState(index)}`} aria-current={index === step ? "step" : undefined} key={label}><span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-white max-[640px]:m-auto">{index < step ? <Icon name="check" size={15}/> : index + 1}</span><strong className="max-[640px]:sr-only">{label}</strong></li>)}</ol>
    <form className="grid gap-[18px]" onSubmit={(event) => { event.preventDefault(); onPay(); }}>
      {error && <p className="m-0 flex items-center gap-[9px] rounded-[10px] bg-[oklch(0.96_0.025_28)] px-3.5 py-3 font-semibold text-[var(--red)]" role="alert"><Icon name="info" size={16}/>{error}</p>}
      {step === 0 && <fieldset className="min-w-0 border-0 p-0"><legend className="mb-5 text-[22px] font-bold tracking-[-0.02em]">Property basics</legend><div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
        <label className={`${FIELD_STYLES} col-span-full max-[640px]:col-auto`}><span className={FIELD_LABEL_STYLES}>Listing title</span><input className={INPUT_STYLES} name="title" value={form.title} onChange={update} autoComplete="off" required/><small className="text-[var(--muted)]">Use a clear title such as “Quiet 2BHK near Balewadi High Street”.</small></label>
        <label className={FIELD_STYLES}><span className={FIELD_LABEL_STYLES}>Pune locality</span><select className={INPUT_STYLES} name="locality" value={form.locality} onChange={update}><option>Koregaon Park</option><option>Baner</option><option>Kothrud</option><option>Viman Nagar</option><option>Wakad</option><option>Hadapsar</option></select></label>
        <label className={FIELD_STYLES}><span className={FIELD_LABEL_STYLES}>Property type</span><select className={INPUT_STYLES} name="type" value={form.type} onChange={update}><option>Flat</option><option>Villa</option><option>Bungalow</option><option>Independent house</option></select></label>
        <label className={FIELD_STYLES}><span className={FIELD_LABEL_STYLES}>Configuration</span><select className={INPUT_STYLES} name="bhk" value={form.bhk} onChange={update}><option>1 BHK</option><option>2 BHK</option><option>3 BHK</option><option>4 BHK</option></select></label>
        <label className={FIELD_STYLES}><span className={FIELD_LABEL_STYLES}>Furnishing</span><select className={INPUT_STYLES} name="furnishing" value={form.furnishing} onChange={update}><option>Unfurnished</option><option>Semi-furnished</option><option>Fully furnished</option></select></label>
      </div></fieldset>}
      {step === 1 && <fieldset className="min-w-0 border-0 p-0"><legend className="mb-5 text-[22px] font-bold tracking-[-0.02em]">Details and document verification</legend><div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
        <label className={FIELD_STYLES}><span className={FIELD_LABEL_STYLES}>Monthly rent</span><div className="relative flex items-center"><span className="absolute left-[13px] font-bold text-[var(--muted)]">₹</span><input className={`${INPUT_STYLES} pl-[30px]`} name="rent" value={form.rent} onChange={update} type="number" min="5000" step="500" inputMode="numeric" required/></div></label>
        <label className={FIELD_STYLES}><span className={FIELD_LABEL_STYLES}>Carpet area</span><div className="relative flex items-center"><input className={`${INPUT_STYLES} pr-14`} name="area" value={form.area} onChange={update} type="number" min="150" inputMode="numeric" required/><span className="absolute right-[13px] text-[13px] font-bold text-[var(--muted)]">sq ft</span></div></label>
        <label className={`${FIELD_STYLES} col-span-full max-[640px]:col-auto`}><span className={FIELD_LABEL_STYLES}>Home description</span><textarea className={`${INPUT_STYLES} min-h-[110px] resize-y`} name="description" value={form.description} onChange={update} rows="4" required/><small className="text-[var(--muted)]">Mention access, light, building facilities and nearby landmarks.</small></label>
        <label className={`${FIELD_STYLES} col-span-full max-[640px]:col-auto`}><span className={FIELD_LABEL_STYLES}>Amenities</span><input className={INPUT_STYLES} name="amenities" value={form.amenities} onChange={update}/><small className="text-[var(--muted)]">Separate amenities with commas.</small></label>
        <label className={`${FIELD_STYLES} col-span-full max-[640px]:col-auto`}><span className={FIELD_LABEL_STYLES}>Legal owner name</span><input className={INPUT_STYLES} name="ownerName" value={form.ownerName} onChange={update} autoComplete="name" required/></label>
      </div><div className="mt-5 grid gap-2.5" aria-label="Document declarations">
        {[
          ["ownershipProof", form.ownershipProof, "Ownership proof is ready", "Registered sale deed, Index II or current property tax receipt."],
          ["identityProof", form.identityProof, "Owner identity is ready", "PAN and government-issued photo identification match the legal owner."],
          ["declaration", form.declaration, "Listing details are accurate", "I authorise RentkaroPune to verify these records before publishing."],
        ].map(([name, checked, title, copy]) => <label className="flex items-start gap-[11px] rounded-[10px] bg-[var(--soft)] p-[13px]" key={name}><input className="mt-[3px] h-[18px] w-[18px] shrink-0 accent-[var(--orange)]" type="checkbox" name={name} checked={checked} onChange={update}/><span className="block"><strong className="block">{title}</strong><small className="mt-[3px] block text-[var(--muted)]">{copy}</small></span></label>)}
      </div></fieldset>}
      {step === 2 && <fieldset className="min-w-0 border-0 p-0"><legend className="mb-5 text-[22px] font-bold tracking-[-0.02em]">Review and pay</legend>
        <div className="grid grid-cols-[1fr_auto] gap-6 max-[640px]:grid-cols-1"><div><span className="block text-[var(--muted)]">Property</span><strong className="my-1 block text-xl">{form.title}</strong><small className="block text-[var(--muted)]">{form.bhk} {form.type.toLowerCase()} in {form.locality}</small></div><div className="text-right max-[640px]:text-left"><span className="block text-[var(--muted)]">Asking rent</span><strong className={`${MONEY_STYLES} my-1 block text-xl`}>{money(form.rent)}</strong><small className="block text-[var(--muted)]">{Number(form.area).toLocaleString("en-IN")} sq ft · {form.furnishing}</small></div></div>
        <p className="my-0 max-w-[72ch] border-y border-[var(--line)] py-4 text-[var(--muted)]">{form.description}</p>
        <div className="flex flex-wrap gap-[9px]">{[["check", "Ownership records ready"], ["check", "Identity proof ready"], ["shield", "Admin review before publishing"]].map(([icon, label]) => <span className="flex items-center gap-[7px] rounded-[9px] bg-[var(--green-soft)] px-2.5 py-2 text-[13px] font-semibold text-[oklch(0.4_0.13_155)]" key={label}><Icon name={icon} size={16}/>{label}</span>)}</div>
        <div className="mt-5 flex items-center justify-between gap-5 rounded-xl bg-[var(--orange-soft)] p-[18px]"><div><span className="block">One-time listing and verification fee</span><small className="block text-[var(--muted)]">Secure prototype payment</small></div><strong className={`${MONEY_STYLES} text-[26px]`}>₹100</strong></div>
      </fieldset>}
      <div className="flex justify-between gap-3 pt-2">{step > 0 && <button className={BUTTON_SECONDARY} type="button" onClick={() => { setStep((current) => current - 1); setError(""); }}>Back</button>}<span/>{step < 2 ? <button className={BUTTON_PRIMARY} type="button" onClick={next}>Continue <Icon name="arrow" size={17}/></button> : <button className={BUTTON_PRIMARY} type="submit"><Icon name="lock" size={16}/> Pay ₹100 and submit</button>}</div>
    </form>
  </section>;
}

function OwnerView({ state, propertiesById, formProps }) {
  const ownerProperties = (state.properties || []).filter((property) => property.owner === "You (Owner)");
  const ownerIds = new Set(ownerProperties.map((property) => property.id));
  const ownerVisits = (state.leads || []).filter((lead) => ownerIds.has(lead.propertyId) && lead.visitDate && lead.visitDate !== "Not booked");

  return <div className={VIEW_STYLES}>
    <OwnerListingForm {...formProps}/>
    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="owner-inventory-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="owner-inventory-title">Your listing inventory</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Review verification state, asking rent and live marketplace status.</p></div></div>
      {ownerProperties.length ? <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">{ownerProperties.map((property) => <article className="flex min-h-[250px] flex-col rounded-[14px] bg-[var(--soft)] p-5" key={property.id}><div className="flex items-start justify-between gap-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[var(--orange-soft)] text-[var(--orange)]"><Icon name="home"/></span><StatusChip status={property.status}/></div><h3 className="mt-[18px] mb-[7px] text-xl"><Link href={`/properties/${property.id}`}>{property.title}</Link></h3><p className="text-[var(--muted)]">{property.locality} · {property.bhk} · {Number(property.area).toLocaleString("en-IN")} sq ft</p><div className="mt-auto flex items-end gap-1.5 pt-[18px]"><strong className={`${MONEY_STYLES} text-2xl`}>{money(property.rent)}</strong><span className="text-[var(--muted)]">per month</span></div><small className="text-[var(--muted)]">{property.approved ? "Ownership documents verified" : "Awaiting admin document review"}</small></article>)}</div> : <EmptyState icon="building" title="No owner listings yet" copy="Complete the form above to send your first Pune property for verification."/>}
    </section>
    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="owner-visits-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="owner-visits-title">Tenant visit schedule</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Upcoming and completed visits for your verified inventory.</p></div></div>
      {ownerVisits.length ? <div className="grid">{ownerVisits.map((lead) => <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-[var(--line)] py-4 first:border-t-0 max-[640px]:grid-cols-[auto_1fr]" key={lead.id}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[var(--orange-soft)] text-[var(--orange)]"><Icon name="calendar"/></span><div className="grid gap-1"><strong>{propertiesById.get(lead.propertyId)?.title}</strong><span className="text-[13px] text-[var(--muted)]">{lead.visitDate}</span></div><div className="grid justify-items-end gap-1 max-[640px]:col-start-2 max-[640px]:justify-items-start"><span className="text-[13px] text-[var(--muted)]">{lead.broker?.name}</span><StatusChip status={lead.status}/></div></article>)}</div> : <EmptyState icon="calendar" title="No tenant visits scheduled" copy="Confirmed visit slots will appear here after clients coordinate with their assigned broker."/>}
    </section>
  </div>;
}

function BrokerView({ state, broker, propertiesById, onVisited, onClose }) {
  const assigned = (state.leads || []).filter((lead) => !lead.broker?.name || lead.broker.name === broker.name);
  const scheduled = assigned.filter((lead) => lead.visitDate && lead.visitDate !== "Not booked" && !["Closed", "Cancelled"].includes(lead.status));
  const earned = assigned.filter((lead) => lead.status === "Closed").reduce((sum, lead) => sum + Number(lead.brokerShare || 0), 0);
  const pendingPayout = assigned.filter((lead) => lead.status === "Token paid").reduce((sum, lead) => {
    const property = propertiesById.get(lead.propertyId);
    return sum + Math.round((property?.rent || 0) * 0.8 * 0.6);
  }, 0);

  return <div className={VIEW_STYLES}>
    <section data-motion-reveal className="flex items-center justify-between gap-7 rounded-[var(--radius)] bg-[var(--ink)] p-7 text-white max-[900px]:flex-col max-[900px]:items-start" aria-labelledby="broker-profile-title"><div className="flex items-center gap-4"><span className="grid h-[58px] w-[58px] place-items-center rounded-[16px_16px_16px_5px] bg-[var(--orange)] font-extrabold text-white" aria-hidden="true">AS</span><div><span className="text-[13px] text-[oklch(0.74_0_0)]">Assigned marketplace broker</span><h2 className="my-[3px] text-[27px]" id="broker-profile-title">{broker.name}</h2><p className="m-0 text-[oklch(0.74_0_0)]">{broker.zone} · {broker.rating} verified rating</p></div></div><div className="flex gap-9 max-[900px]:w-full max-[640px]:flex-col max-[640px]:gap-3.5"><div><span className="block text-xs text-[oklch(0.72_0_0)]">Closed payouts</span><strong className={`${MONEY_STYLES} mt-1 block text-[22px]`}>{money(earned)}</strong></div><div><span className="block text-xs text-[oklch(0.72_0_0)]">Projected 60% share</span><strong className={`${MONEY_STYLES} mt-1 block text-[22px]`}>{money(pendingPayout)}</strong></div></div></section>

    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="broker-leads-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="broker-leads-title">Assigned leads</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Move each client through a documented visit and closure workflow.</p></div><span className="inline-flex min-h-8 items-center whitespace-nowrap rounded-full bg-[var(--soft)] px-2.5 text-xs font-bold text-[var(--ink-2)]">{assigned.length} active records</span></div>
      {assigned.length ? <div className="grid">{assigned.map((lead) => {
        const property = propertiesById.get(lead.propertyId);
        const projectedBrokerage = Math.round((property?.rent || 0) * 0.8);
        return <article className="border-t border-[var(--line)] py-[22px] first:border-t-0 first:pt-0 last:pb-0" key={lead.id}><div className="flex items-start justify-between gap-5 max-[640px]:flex-col"><PropertySummary property={property}/><StatusChip status={lead.status}/></div><dl className="my-[18px] grid grid-cols-3 gap-3.5 max-[640px]:grid-cols-1"><div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Client journey</dt><dd className="mt-1 mb-0 font-semibold">{lead.status}</dd></div><div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Visit</dt><dd className="mt-1 mb-0 font-semibold">{lead.visitDate || "Not booked"}</dd></div><div className="rounded-[10px] bg-[var(--soft)] p-[13px]"><dt className="text-xs text-[var(--muted)]">Your payout</dt><dd className="mt-1 mb-0 font-semibold">{lead.brokerShare ? money(lead.brokerShare) : `${money(Math.round(projectedBrokerage * 0.6))} projected`}</dd></div></dl><div className="flex flex-wrap items-center justify-end gap-2 max-[640px]:justify-start">{lead.status === "Scheduled" && <button className={`${BUTTON_PRIMARY} ${BUTTON_SMALL}`} type="button" onClick={() => onVisited(lead.propertyId)}><Icon name="check" size={16}/> Mark as visited</button>}{lead.status === "Token paid" && <button className={`${BUTTON_PRIMARY} ${BUTTON_SMALL}`} type="button" onClick={() => onClose(property)}><Icon name="wallet" size={16}/> Close deal</button>}{lead.status === "Closed" && <p className="m-0 inline-flex items-center gap-2 text-sm text-[oklch(0.4_0.13_155)]"><Icon name="check" size={16}/> Paid {money(lead.brokerShare)}. Your share is 60% of collected brokerage.</p>}</div></article>;
      })}</div> : <EmptyState icon="user" title="No assigned leads" copy="New client unlocks in your Pune zone will be routed here."/>}
    </section>

    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="visit-calendar-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="visit-calendar-title">Visit calendar</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Broker-attended visits with the property and current handoff status.</p></div></div>
      {scheduled.length ? <div className="grid">{scheduled.map((lead) => <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-[var(--line)] py-4 first:border-t-0 max-[640px]:grid-cols-[auto_1fr]" key={lead.id}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[var(--orange-soft)] text-[var(--orange)]"><Icon name="calendar"/></span><div className="grid gap-1"><strong>{lead.visitDate}</strong><span className="text-[13px] text-[var(--muted)]">{propertiesById.get(lead.propertyId)?.title}</span></div><div className="grid justify-items-end gap-1 max-[640px]:col-start-2 max-[640px]:justify-items-start"><span className="text-[13px] text-[var(--muted)]">{propertiesById.get(lead.propertyId)?.locality}</span><StatusChip status={lead.status}/></div></article>)}</div> : <EmptyState icon="calendar" title="Calendar is clear" copy="Scheduled client visits will appear here with the property and handoff status."/>}
    </section>
  </div>;
}

function AdminView({ state, approveProperty }) {
  const properties = state.properties || [];
  const pending = properties.filter((property) => !property.approved);
  const ledger = state.ledger || [];
  const totalVolume = ledger.reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0);
  const refunds = ledger.filter((item) => typeKey(item.type) === "refund").reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0);
  const platformRevenue = ledger.reduce((sum, item) => sum + Number(item.platformShare || 0), 0);
  const brokerageMargin = ledger.filter((item) => typeKey(item.type) === "brokerage").reduce((sum, item) => sum + Number(item.platformShare || Math.round(Number(item.amount || 0) * 0.4)), 0);
  const chartData = [
    { key: "listing", label: "Listings" },
    { key: "unlock", label: "Unlocks" },
    { key: "token", label: "Tokens" },
    { key: "brokerage", label: "Brokerage" },
    { key: "refund", label: "Refunds" },
  ].map((category) => ({ ...category, value: ledger.filter((item) => typeKey(item.type) === category.key).reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0) }));
  const chartMax = Math.max(...chartData.map((item) => item.value), 1);

  return <div className={VIEW_STYLES}>
    <section data-motion-reveal className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1" aria-label="Transaction key performance indicators">
      {[
        ["Marketplace volume", totalVolume, `${ledger.length} ledger entries`],
        ["Platform revenue", platformRevenue, "Listing, unlock and margin"],
        ["40% brokerage margin", brokerageMargin, "After 60% broker payouts"],
        ["Token refunds", refunds, "75% returned on cancellation"],
      ].map(([label, value, copy], index) => <article className={`flex min-h-[134px] flex-col justify-between rounded-[14px] p-5 ${index === 1 ? "bg-[var(--ink)] text-white [&>small]:text-[oklch(0.75_0_0)] [&>span]:text-[oklch(0.75_0_0)]" : "bg-[var(--soft)] [&>small]:text-[var(--muted)] [&>span]:text-[var(--muted)]"}`} key={label}><span>{label}</span><strong className={`${MONEY_STYLES} text-[27px]`}>{money(value)}</strong><small>{copy}</small></article>)}
    </section>

    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="approval-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="approval-title">Pending ownership approvals</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Publish only after all ownership and identity evidence is checked.</p></div><span className="inline-flex min-h-8 items-center whitespace-nowrap rounded-full bg-[var(--soft)] px-2.5 text-xs font-bold text-[var(--ink-2)]">{pending.length} pending</span></div>
      {pending.length ? <div className="grid gap-3.5">{pending.map((property) => <article className="rounded-[14px] bg-[var(--soft)] p-5" key={property.id}><div className="flex items-start justify-between gap-5 max-[640px]:flex-col"><div><StatusChip status={property.status}/><h3 className="mt-2.5 mb-1 text-[21px]">{property.title}</h3><p className="m-0 text-[var(--muted)]">{property.ownerName || property.owner} · {property.locality} · {property.bhk}</p></div><strong className={`${MONEY_STYLES} whitespace-nowrap text-xl`}>{money(property.rent)}<small className="text-[var(--muted)]">/month</small></strong></div><fieldset className="my-[18px] grid grid-cols-2 gap-2 border-0 p-0 max-[640px]:grid-cols-1"><legend className="mb-[9px] font-bold">Ownership-document checklist</legend>{["Registered ownership proof received", "Owner identity matches the legal record", "Rent, area and address reviewed", "₹100 listing payment confirmed"].map((label) => <label className="flex items-start gap-[11px] rounded-[10px] bg-white p-[13px] text-[13px]" key={label}><input className="mt-[3px] h-[18px] w-[18px] shrink-0 accent-[var(--orange)]" type="checkbox" checked readOnly/><span>{label}</span></label>)}</fieldset><button className={BUTTON_PRIMARY} type="button" onClick={() => approveProperty(property.id)}><Icon name="shield" size={17}/> Approve and publish</button></article>)}</div> : <EmptyState icon="check" title="Approval queue is clear" copy="New owner submissions will appear here for document verification."/>}
    </section>

    <section data-motion-reveal className={SECTION_STYLES} aria-labelledby="transactions-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="transactions-title">Transaction performance</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">Gross movement by transaction type, paired with the auditable ledger below.</p></div></div>
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(250px,.6fr)] gap-[18px] max-[900px]:grid-cols-1"><figure className="m-0 min-w-0 rounded-[14px] bg-[var(--soft)] p-5 max-[640px]:overflow-x-auto" aria-labelledby="chart-caption"><figcaption className="font-bold" id="chart-caption">Transaction volume by type</figcaption><div className="mt-[18px] flex h-[260px] items-stretch gap-2.5 max-[640px]:min-w-[500px]">{chartData.map((item) => <div className="group grid min-w-0 flex-1 grid-rows-[28px_1fr_34px] items-end text-center" key={item.key} aria-label={`${item.label}: ${money(item.value)}`}><strong className="overflow-hidden text-ellipsis text-[11px]">{money(item.value)}</strong><div className="flex h-full items-end border-b border-[var(--line)] bg-[repeating-linear-gradient(to_top,transparent_0_45px,var(--line)_46px_47px)]"><span className={`mx-auto min-h-1 w-[min(54px,70%)] origin-bottom rounded-t-lg transition-[transform,background-color] duration-200 group-hover:scale-y-[1.025] h-[var(--bar-height)] ${CHART_BAR_UTILITIES[item.key]}`} style={{ "--bar-height": `${Math.max(item.value ? 8 : 2, Math.round((item.value / chartMax) * 100))}%` }}/></div><span className="pt-2 text-[11px] text-[var(--muted)]">{item.label}</span></div>)}</div></figure><aside className="rounded-[14px] bg-[var(--ink)] p-[22px] text-white [&>svg]:text-[var(--orange)]"><Icon name="chart" size={28}/><h3 className="mt-[22px] mb-2 text-[23px]">60/40 brokerage split</h3><p className="text-[oklch(0.75_0_0)]">Every closed rental sends 60% of collected brokerage to the assigned broker. RentkaroPune retains a transparent 40% platform margin.</p><dl className="mt-5 mb-0 grid"><div className="flex justify-between border-t border-white/14 py-2.5"><dt>Broker payout</dt><dd className="font-extrabold text-[var(--orange)]">60%</dd></div><div className="flex justify-between border-t border-white/14 py-2.5"><dt>Platform margin</dt><dd className="font-extrabold text-[var(--orange)]">40%</dd></div></dl></aside></div>
      <div className="mt-5 overflow-x-auto"><table className="w-full border-collapse text-sm"><caption className="pb-2.5 text-left font-bold">Marketplace transaction ledger</caption><thead><tr>{["Date", "Type", "Reference", "Gross amount", "Broker payout", "Platform share"].map((heading, index) => <th className={`whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px] text-left text-xs text-[var(--muted)] ${index >= 3 ? "text-right tabular-nums" : ""}`} scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{ledger.length ? ledger.map((item) => {
        const ledgerKey = typeKey(item.type);
        return <tr className="hover:bg-[var(--soft)]" key={item.id}><td className="whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px]">{item.date}</td><td className="whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px]"><span className={`inline-flex min-h-[26px] items-center rounded-[7px] px-2 text-xs font-bold ${LEDGER_TYPE_UTILITIES[ledgerKey]}`}>{item.type}</span></td><td className="whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px]">{item.reference}</td><td className={`${MONEY_STYLES} whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px] text-right`}>{ledgerKey === "refund" ? "-" : ""}{money(Math.abs(item.amount))}</td><td className={`${MONEY_STYLES} whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px] text-right`}>{item.brokerShare ? money(item.brokerShare) : "Not applicable"}</td><td className={`${MONEY_STYLES} whitespace-nowrap border-b border-[var(--line)] px-[11px] py-[13px] text-right`}>{item.platformShare ? money(item.platformShare) : ledgerKey === "token" || ledgerKey === "refund" ? "Held funds" : money(0)}</td></tr>;
      }) : <tr><td className="border-b border-[var(--line)] px-[11px] py-[13px]" colSpan="6">No transactions have been recorded.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}

export default function Dashboard() {
  const { state, ready, broker, addProperty, approveProperty, markVisited, payToken, cancelToken, closeDeal, resetDemo, tierFor } = useMarketplace();
  const [role, setRole] = useState("client");
  const [roleReady, setRoleReady] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formStep, setFormStep] = useState(0);
  const [formError, setFormError] = useState("");
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const requestedRole = new URLSearchParams(window.location.search).get("role")?.toLowerCase();
    if (ROLES.some((item) => item.id === requestedRole)) setRole(requestedRole);
    setRoleReady(true);
  }, []);

  useEffect(() => {
    if (!roleReady) return;
    const url = new URL(window.location.href);
    url.searchParams.set("role", role);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [role, roleReady]);

  const propertiesById = useMemo(() => new Map((state.properties || []).map((property) => [property.id, property])), [state.properties]);
  const activeRole = ROLES.find((item) => item.id === role) || ROLES[0];

  if (!ready) return <DashboardSkeleton/>;

  const openListingPayment = () => {
    setPayment({
      kind: "listing",
      amount: 100,
      title: "Submit listing for verification",
      note: "This one-time fee covers listing intake and ownership-document review.",
      details: { ...form, amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean) },
    });
  };
  const openTokenPayment = (property) => {
    if (!property) return;
    setPayment({ kind: "token", propertyId: property.id, amount: Math.round(property.rent * 0.15), title: `Reserve ${property.title}`, note: "Pay a 15% token hold after your completed visit. Cancelling before closure returns 75%." });
  };
  const openClosePayment = (property) => {
    if (!property) return;
    const discount = tierFor((state.closedDeals || 0) + 1);
    const brokerage = Math.round(property.rent * (1 - discount / 100));
    const brokerShare = Math.round(brokerage * 0.6);
    setPayment({ kind: "closure", propertyId: property.id, amount: brokerage, title: "Confirm brokerage and close deal", note: `${discount}% loyalty discount applied. ${money(brokerShare)} is the broker's 60% payout and ${money(brokerage - brokerShare)} is the 40% platform margin.` });
  };
  const completePayment = () => {
    if (!payment) return;
    if (payment.kind === "listing") {
      addProperty(payment.details);
      setForm(EMPTY_FORM);
      setFormStep(0);
      setFormError("");
    }
    if (payment.kind === "token") payToken(payment.propertyId);
    if (payment.kind === "closure") closeDeal(payment.propertyId);
  };

  return <main className="bg-[linear-gradient(180deg,var(--soft)_0_250px,var(--canvas)_250px)]">
    <div className="mx-auto min-h-[75dvh] max-w-[var(--container)] px-6 pt-10 pb-24 max-[640px]:px-4 max-[390px]:pb-16">
      <header data-motion-reveal className="flex items-end justify-between gap-7 pt-[34px] pb-7 max-[640px]:flex-col max-[640px]:items-start">
        <div><span className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--orange-dark)]"><Icon name={activeRole.icon} size={17}/> Live marketplace workspace</span><h1 className="max-w-[720px] text-[52px] max-[640px]:text-[40px]">{activeRole.label} dashboard</h1><p className="mt-3 mb-0 max-w-[620px] text-[var(--muted)]">One transparent view of verified homes, Pune visits, secure payments and marketplace settlements.</p></div>
        <button className={`${BUTTON_SECONDARY} ${BUTTON_SMALL} shrink-0`} type="button" onClick={() => { if (window.confirm("Restore the original RentkaroPune demo data? Your local changes will be removed.")) resetDemo(); }}><Icon name="reset" size={16}/> Reset demo</button>
      </header>

      <nav data-motion-reveal className="mb-8 flex gap-1 overflow-x-auto rounded-[14px] bg-[var(--soft)] p-1.5 max-[640px]:-mx-4 max-[640px]:rounded-none max-[640px]:px-4" aria-label="Dashboard role">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Switch marketplace role">{ROLES.map((item) => <button key={item.id} id={`role-tab-${item.id}`} className={`inline-flex min-h-11 items-center gap-2 rounded-[9px] border-0 px-4 font-bold transition-[color,background-color,transform] duration-200 hover:bg-white hover:text-[var(--ink)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] ${role === item.id ? "bg-[var(--ink)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--ink)] hover:text-white" : "bg-transparent text-[var(--muted)]"}`} type="button" role="tab" aria-selected={role === item.id} aria-controls={`role-panel-${item.id}`} tabIndex={role === item.id ? 0 : -1} onClick={() => setRole(item.id)}><Icon name={item.icon} size={18}/><span>{item.label}</span></button>)}</div>
      </nav>

      <div id={`role-panel-${role}`} role="tabpanel" aria-labelledby={`role-tab-${role}`} tabIndex="0">
        {role === "client" && <ClientView state={state} propertiesById={propertiesById} tierFor={tierFor} onToken={openTokenPayment} cancelToken={cancelToken}/>} 
        {role === "owner" && <OwnerView state={state} propertiesById={propertiesById} formProps={{ form, setForm, step: formStep, setStep: setFormStep, error: formError, setError: setFormError, onPay: openListingPayment }}/>} 
        {role === "broker" && <BrokerView state={state} broker={broker} propertiesById={propertiesById} onVisited={markVisited} onClose={openClosePayment}/>} 
        {role === "admin" && <AdminView state={state} approveProperty={approveProperty}/>} 
      </div>
    </div>

    <PaymentModal open={Boolean(payment)} onClose={() => setPayment(null)} amount={payment?.amount || 0} title={payment?.title || "Secure payment"} note={payment?.note || "Review and confirm this marketplace payment."} onSuccess={completePayment}/>
  </main>;
}
