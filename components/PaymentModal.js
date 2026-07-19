"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const focusableSelector = "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";
const buttonBaseClasses = "inline-flex min-h-12 items-center justify-center gap-[9px] rounded-xl border px-5 font-bold text-white transition-[transform,box-shadow,background] duration-200 ease-[var(--ease)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClasses = `${buttonBaseClasses} border-[var(--orange)] bg-[var(--orange)] hover:bg-[var(--orange-dark)]`;
const labelClasses = "grid gap-[7px]";
const labelTextClasses = "text-[13px] font-bold text-[var(--ink-2)]";
const inputClasses = "min-h-12 w-full rounded-[10px] border border-[var(--line)] bg-white px-[13px] py-[11px] text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-[180ms] ease-[var(--ease)] focus:border-[var(--orange)] focus:shadow-[0_0_0_3px_var(--orange-soft)]";
const methodButtonClasses = "min-h-[68px] rounded-xl border border-[var(--line)] bg-white p-3 text-left";
const selectedMethodClasses = "border-[var(--orange)] bg-[var(--orange-soft)] shadow-[inset_0_0_0_1px_var(--orange)]";

export default function PaymentModal({ open, onClose, amount, title, note, onSuccess }) {
  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [value, setValue] = useState("demo@rentkaro");
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!open) { setProcessing(false); setComplete(false); setError(""); return; }
    previousFocus.current = document.activeElement;
    window.requestAnimationFrame(() => dialogRef.current?.querySelector(focusableSelector)?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !processing) onClose();
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll(focusableSelector) || [])];
      if (!controls.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); previousFocus.current?.focus?.(); };
  }, [open, processing, onClose]);

  if (!open) return null;
  const chooseMethod = (nextMethod) => { setMethod(nextMethod); setValue(nextMethod === "upi" ? "demo@rentkaro" : "4242 4242 4242 4242"); setError(""); };
  const pay = () => {
    const valid = method === "upi" ? /^[\w.-]+@[\w.-]+$/.test(value.trim()) : value.replace(/\s/g, "").length === 16;
    if (!valid) { setError(method === "upi" ? "Enter a valid UPI ID, such as name@bank." : "Enter a 16-digit card number."); return; }
    setError(""); setProcessing(true);
    window.setTimeout(() => { setProcessing(false); setComplete(true); window.setTimeout(() => { onSuccess(); onClose(); }, 800); }, 1050);
  };

  return <div className="fixed inset-0 z-[var(--z-backdrop)] grid animate-backdrop place-items-center bg-[rgb(10_10_10/60%)] p-5 backdrop-blur-[8px]" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !processing && onClose()}><section className="relative z-[var(--z-modal)] max-h-[calc(100dvh-40px)] w-[min(100%,520px)] animate-modal overflow-y-auto rounded-[var(--radius-lg)] bg-white p-8 shadow-[var(--shadow-lg)] max-[720px]:px-5 max-[720px]:py-[26px]" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="payment-title" aria-describedby="payment-note"><button className="absolute right-[18px] top-[18px] grid size-11 place-items-center rounded-[11px] border border-[var(--line)] bg-white p-0 text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50" onClick={onClose} disabled={processing} aria-label="Close payment"><Icon name="close"/></button>{complete ? <div className="grid min-h-[330px] place-items-center text-center" role="status"><span className="grid size-[76px] place-items-center rounded-full bg-[var(--green)] text-white"><Icon name="check" size={34}/></span><h2 className="mb-2 mt-5 text-[30px]">Payment confirmed</h2><p className="m-0 text-[var(--muted)]">Your marketplace workspace is updating now.</p></div> : <><div className="pr-11"><span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[oklch(0.4_0.13_155)]"><Icon name="shield" size={16}/> Secure simulation</span><h2 className="mb-[9px] mt-3.5 text-[30px]" id="payment-title">{title}</h2><p className="m-0 text-[var(--muted)]" id="payment-note">{note}</p></div><div className="my-6 flex items-center justify-between border-y border-[var(--line)] py-5"><span>Total payable</span><strong className="text-[30px] tabular-nums tracking-[-0.025em]">₹{Number(amount).toLocaleString("en-IN")}</strong></div><div className="mb-[18px] grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Payment method"><button type="button" className={`${methodButtonClasses} ${method === "upi" ? selectedMethodClasses : ""}`} onClick={() => chooseMethod("upi")} role="radio" aria-checked={method === "upi"}><span className="block font-bold">UPI</span><small className="block text-[var(--muted)]">Instant confirmation</small></button><button type="button" className={`${methodButtonClasses} ${method === "card" ? selectedMethodClasses : ""}`} onClick={() => chooseMethod("card")} role="radio" aria-checked={method === "card"}><span className="block font-bold">Card</span><small className="block text-[var(--muted)]">Visa · Mastercard</small></button></div><label className={labelClasses} htmlFor="payment-credential"><span className={labelTextClasses}>{method === "upi" ? "UPI ID" : "Card number"}</span><input className={inputClasses} id="payment-credential" value={value} onChange={(event) => setValue(event.target.value)} inputMode={method === "upi" ? "email" : "numeric"} autoComplete={method === "upi" ? "off" : "cc-number"} aria-invalid={Boolean(error)} aria-describedby={error ? "payment-error" : undefined}/></label>{method === "card" && <div className="mt-2.5 grid grid-cols-2 gap-2.5 max-[720px]:[&>label:first-child]:col-[1/-1]"><label className={labelClasses}><span className={labelTextClasses}>Expiry</span><input className={inputClasses} defaultValue="12/29" inputMode="numeric" autoComplete="cc-exp"/></label><label className={labelClasses}><span className={labelTextClasses}>CVV</span><input className={inputClasses} defaultValue="123" inputMode="numeric" autoComplete="cc-csc" maxLength={4}/></label></div>}{error && <p className="my-[9px] text-sm font-semibold text-[var(--red)]" id="payment-error" role="alert">{error}</p>}<button className={`${primaryButtonClasses} mt-[18px] w-full`} onClick={pay} disabled={processing}>{processing ? <><span className="size-[18px] animate-spin rounded-full border-2 border-[rgb(255_255_255/45%)] border-t-white"/>Processing securely…</> : <>Pay ₹{Number(amount).toLocaleString("en-IN")} <Icon name="arrow"/></>}</button><p className="mb-0 mt-3.5 flex items-center justify-center gap-1.5 text-xs text-[var(--muted)]"><Icon name="lock" size={14}/> Prototype payment—no real money will be charged.</p></>}</section></div>;
}
