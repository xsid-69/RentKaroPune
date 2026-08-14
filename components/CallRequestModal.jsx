"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Loader from "./Loader";

const EMPTY_FORM = { name: "", phone: "", email: "", preferredTime: "anytime", preferredLanguage: "no-preference", message: "", website: "", consent: false };
const inputClasses = "min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 text-[var(--ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--orange)] focus:ring-4 focus:ring-[var(--orange-soft)]";
const labelClasses = "grid gap-2 text-sm font-bold text-[var(--ink)]";
const focusableSelector = "button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

export default function CallRequestModal({ open, onClose, property }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const statusRef = useRef(status);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => {
    if (!open) { setStatus("idle"); setError(""); }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === "Escape" && statusRef.current !== "submitting") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const controls = Array.from(dialogRef.current?.querySelectorAll(focusableSelector) || []).filter((element) => element.getClientRects().length > 0);
      if (!controls.length) return;
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/call-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId: property?.id || "", propertyTitle: property?.title || "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your callback request could not be saved.");
      setStatus("success");
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setStatus("idle");
      setError(requestError.message || "Network error. Please try again.");
    }
  };

  return <div className="fixed inset-0 z-[var(--z-backdrop)] flex items-center justify-center overflow-y-auto bg-[rgb(10_10_10/68%)] p-4 motion-safe:animate-backdrop sm:p-6" onPointerDown={(event) => event.target === event.currentTarget && status !== "submitting" && onClose()}>
    <section ref={dialogRef} className="relative z-[var(--z-modal)] my-auto max-h-[88dvh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white p-5 shadow-[var(--shadow-lg)] motion-safe:animate-modal sm:p-8" role="dialog" aria-modal="true" aria-labelledby="callback-title">
      <button ref={closeButtonRef} type="button" className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl border border-[var(--line)] bg-white hover:border-[var(--ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--orange-soft)]" onClick={onClose} disabled={status === "submitting"} aria-label="Close callback form"><Icon name="close"/></button>
      {status === "success" ? <div className="grid min-h-[320px] place-items-center text-center" role="status"><div><span className="mx-auto grid size-16 place-items-center rounded-xl bg-[var(--ink)] text-white"><Icon name="check" size={30}/></span><h2 id="callback-title" className="mt-5 text-2xl font-extrabold">Callback requested</h2><p className="mx-auto mt-2 max-w-[38ch] text-[var(--muted)]">Our Pune team received your details and will contact you at your preferred time and language.</p><button type="button" className="mt-6 min-h-12 rounded-xl bg-[var(--orange)] px-6 font-bold text-white hover:bg-[var(--orange-dark)]" onClick={onClose}>Done</button></div></div> : <>
        <header className="pr-12"><span className="text-sm font-bold text-[var(--orange-dark)]">No login required</span><h2 className="mt-2 text-2xl font-extrabold" id="callback-title">Request a call</h2><p className="mt-2 max-w-[48ch] text-[var(--muted)]">{property ? `Ask about ${property.title}.` : "Tell us what kind of Pune rental you need."} We only use these details to respond to this enquiry.</p></header>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2"><label className={labelClasses}>Name<input className={inputClasses} name="name" value={form.name} onChange={update} autoComplete="name" minLength={2} maxLength={80} required/></label><label className={labelClasses}>Mobile number<input className={inputClasses} name="phone" value={form.phone} onChange={update} autoComplete="tel" inputMode="tel" placeholder="10-digit Indian number" required/></label></div>
          <label className={labelClasses}>Email <span className="font-normal text-[var(--muted)]">(optional)</span><input className={inputClasses} name="email" value={form.email} onChange={update} autoComplete="email" type="email"/></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className={labelClasses}>Preferred time<select className={inputClasses} name="preferredTime" value={form.preferredTime} onChange={update}><option value="anytime">Anytime</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label><label className={labelClasses}>Preferred language<select className={inputClasses} name="preferredLanguage" value={form.preferredLanguage} onChange={update}><option value="no-preference">No preference</option><option value="english">English</option><option value="hindi">Hindi</option><option value="marathi">Marathi</option></select></label></div>
          <label className={labelClasses}>Message <span className="font-normal text-[var(--muted)]">(optional)</span><textarea className={`${inputClasses} min-h-24 resize-y`} name="message" value={form.message} onChange={update} maxLength={500} placeholder="Optional — add anything specific you want us to know."/></label>
          <label className="hidden" aria-hidden="true">Website<input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off"/></label>
          <label className="flex items-start gap-3 rounded-xl bg-[var(--soft)] p-3 text-sm leading-6"><input className="mt-1 size-4 shrink-0 accent-[var(--orange)]" type="checkbox" name="consent" checked={form.consent} onChange={update} required/><span>I agree to receive a call about this rental enquiry.</span></label>
          {error && <p className="m-0 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error}</p>}
          <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--orange)] px-5 font-bold text-white transition-[background-color,transform] duration-200 hover:bg-[var(--orange-dark)] active:scale-[.99] disabled:cursor-wait disabled:opacity-60" disabled={status === "submitting"}>{status === "submitting" ? <><Loader variant="inline" label="Sending"/> Sending request…</> : <><Icon name="phone" size={18}/> Request callback</>}</button>
        </form>
      </>}
    </section>
  </div>;
}