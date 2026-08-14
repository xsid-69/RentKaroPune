"use client";

import { useState } from "react";
import Icon from "./Icon";
import { useMarketplace } from "@/lib/marketplace-context";

const FORM_STEPS = ["Property basics", "Details and documents", "Review and submit"];
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

const BUTTON_BASE = "min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border px-5 font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] focus-visible:ring-offset-2";
const BUTTON_PRIMARY = `${BUTTON_BASE} border-[var(--orange)] bg-[var(--orange)] text-white hover:bg-[var(--orange-dark)]`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink-2)]`;
const SECTION_STYLES = "rounded-[var(--radius)] border border-[var(--line)] bg-white p-6 max-[640px]:p-4";
const SECTION_HEAD_STYLES = "mb-5 flex items-end justify-between gap-4 max-[640px]:mb-4 max-[640px]:items-start max-[430px]:flex-col";
const FIELD_STYLES = "grid gap-[7px]";
const FIELD_LABEL_STYLES = "text-[13px] font-bold text-[var(--ink-2)]";
const INPUT_STYLES = "min-h-12 w-full rounded-[10px] border border-[var(--line)] bg-white px-[13px] py-[11px] text-base text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--orange)] focus:shadow-[0_0_0_3px_var(--orange-soft)] sm:text-[15px]";
const MONEY_STYLES = "tabular-nums tracking-[-0.025em]";
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// Self-contained multi-step listing flow: collects property details, confirms
// document declarations, and submits the listing for admin verification.
// Reused by owners (profile) and approved consultants (dashboard).
export default function PropertyListingForm({
  heading = "List a Pune property",
  subheading = "Submit the property for admin verification before it goes live.",
  listedByRole = "owner",
}) {
  const { addProperty } = useMarketplace();
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  const submitListing = () => {
    addProperty({
      ...form,
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
      listedByRole,
    });
    setForm(EMPTY_FORM);
    setStep(0);
    setError("");
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 5000);
  };

  const stepState = (index) => index === step
    ? "bg-[var(--ink)] text-white [&>span]:bg-[var(--orange)] [&>span]:text-white"
    : index < step ? "bg-[var(--soft)] text-[oklch(0.4_0.13_155)]" : "bg-[var(--soft)] text-[var(--muted)]";

  return <>
    <section className={SECTION_STYLES} aria-labelledby="listing-form-title">
      <div className={SECTION_HEAD_STYLES}><div><h2 className="text-[28px]" id="listing-form-title">{heading}</h2><p className="mt-[7px] mb-0 max-w-[680px] text-[var(--muted)]">{subheading}</p></div></div>
      <p className="mb-2 hidden text-sm font-bold text-[var(--orange-dark)] max-[640px]:block">Step {step + 1} of {FORM_STEPS.length} · {FORM_STEPS[step]}</p>
      <ol className="mb-7 grid list-none grid-cols-3 gap-2 p-0 max-[640px]:gap-1" aria-label="Listing progress">{FORM_STEPS.map((label, index) => <li className={`flex items-center gap-[9px] rounded-[10px] p-3 text-[13px] max-[640px]:p-2 ${stepState(index)}`} aria-current={index === step ? "step" : undefined} key={label}><span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-white max-[640px]:m-auto">{index < step ? <Icon name="check" size={15}/> : index + 1}</span><strong className="max-[640px]:sr-only">{label}</strong></li>)}</ol>
      {submitted && <p className="mb-4 rounded-xl bg-[var(--green-soft)] p-4 font-bold text-[oklch(0.4_0.13_155)]" role="status">Property submitted for admin verification.</p>}
      <form className="grid gap-[18px]" onSubmit={(event) => { event.preventDefault(); submitListing(); }}>
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
        {step === 2 && <fieldset className="min-w-0 border-0 p-0"><legend className="mb-5 text-[22px] font-bold tracking-[-0.02em]">Review and submit</legend>
          <div className="grid grid-cols-[1fr_auto] gap-6 max-[640px]:grid-cols-1"><div><span className="block text-[var(--muted)]">Property</span><strong className="my-1 block text-xl">{form.title}</strong><small className="block text-[var(--muted)]">{form.bhk} {form.type.toLowerCase()} in {form.locality}</small></div><div className="text-right max-[640px]:text-left"><span className="block text-[var(--muted)]">Asking rent</span><strong className={`${MONEY_STYLES} my-1 block text-xl`}>{money(form.rent)}</strong><small className="block text-[var(--muted)]">{Number(form.area).toLocaleString("en-IN")} sq ft · {form.furnishing}</small></div></div>
          <p className="my-0 max-w-[72ch] border-y border-[var(--line)] py-4 text-[var(--muted)]">{form.description}</p>
          <div className="flex flex-wrap gap-[9px]">{[["check", "Ownership records ready"], ["check", "Identity proof ready"], ["shield", "Admin review before publishing"]].map(([icon, label]) => <span className="flex items-center gap-[7px] rounded-[9px] bg-[var(--green-soft)] px-2.5 py-2 text-[13px] font-semibold text-[oklch(0.4_0.13_155)]" key={label}><Icon name={icon} size={16}/>{label}</span>)}</div>
          <div className="mt-5 rounded-xl bg-[var(--orange-soft)] p-[18px]"><strong className="block">Ready for review</strong><small className="mt-1 block text-[var(--muted)]">Submit now and the admin team will verify the property before publication.</small></div>
        </fieldset>}
        <div className="flex justify-between gap-3 pt-2 max-[430px]:flex-col-reverse">{step > 0 && <button className={`${BUTTON_SECONDARY} max-[430px]:w-full`} type="button" onClick={() => { setStep((current) => current - 1); setError(""); }}>Back</button>}<span className="max-[430px]:hidden"/>{step < 2 ? <button className={`${BUTTON_PRIMARY} max-[430px]:w-full`} type="button" onClick={next}>Continue <Icon name="arrow" size={17}/></button> : <button className={`${BUTTON_PRIMARY} max-[430px]:w-full`} type="submit"><Icon name="check" size={16}/> Submit for verification</button>}</div>
      </form>
    </section>
  </>;
}
