"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const focusableSelector = "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

export default function PaymentModal({ open, onClose, amount, title, note, onSuccess }) {
  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [value, setValue] = useState("demo@rentkaro");
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!open) {
      setProcessing(false);
      setComplete(false);
      setError("");
      return;
    }
    previousFocus.current = document.activeElement;
    window.requestAnimationFrame(() => dialogRef.current?.querySelector(focusableSelector)?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !processing) onClose();
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll(focusableSelector) || [])];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus.current?.focus?.();
    };
  }, [open, processing, onClose]);

  if (!open) return null;

  const chooseMethod = (nextMethod) => {
    setMethod(nextMethod);
    setValue(nextMethod === "upi" ? "demo@rentkaro" : "4242 4242 4242 4242");
    setError("");
  };

  const pay = () => {
    const valid = method === "upi" ? /^[\w.-]+@[\w.-]+$/.test(value.trim()) : value.replace(/\s/g, "").length === 16;
    if (!valid) {
      setError(method === "upi" ? "Enter a valid UPI ID, such as name@bank." : "Enter a 16-digit card number.");
      return;
    }
    setError("");
    setProcessing(true);
    window.setTimeout(() => {
      setProcessing(false);
      setComplete(true);
      window.setTimeout(() => { onSuccess(); onClose(); }, 800);
    }, 1050);
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !processing && onClose()}>
    <section className="payment-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="payment-title" aria-describedby="payment-note">
      <button className="icon-button modal-close" onClick={onClose} disabled={processing} aria-label="Close payment"><Icon name="close"/></button>
      {complete ? <div className="payment-success" role="status">
        <span className="success-ring"><Icon name="check" size={34}/></span>
        <h2>Payment confirmed</h2>
        <p>Your marketplace workspace is updating now.</p>
      </div> : <>
        <div className="modal-heading">
          <span className="secure-chip"><Icon name="shield" size={16}/> Secure simulation</span>
          <h2 id="payment-title">{title}</h2>
          <p id="payment-note">{note}</p>
        </div>
        <div className="amount-row"><span>Total payable</span><strong className="money">₹{Number(amount).toLocaleString("en-IN")}</strong></div>
        <div className="payment-methods" role="radiogroup" aria-label="Payment method">
          <button type="button" className={method === "upi" ? "selected" : ""} onClick={() => chooseMethod("upi")} role="radio" aria-checked={method === "upi"}><span>UPI</span><small>Instant confirmation</small></button>
          <button type="button" className={method === "card" ? "selected" : ""} onClick={() => chooseMethod("card")} role="radio" aria-checked={method === "card"}><span>Card</span><small>Visa · Mastercard</small></button>
        </div>
        <label className="field" htmlFor="payment-credential">
          <span>{method === "upi" ? "UPI ID" : "Card number"}</span>
          <input id="payment-credential" value={value} onChange={(event) => setValue(event.target.value)} inputMode={method === "upi" ? "email" : "numeric"} autoComplete={method === "upi" ? "off" : "cc-number"} aria-invalid={Boolean(error)} aria-describedby={error ? "payment-error" : undefined}/>
        </label>
        {method === "card" && <div className="card-fields compact-card-fields">
          <label className="field"><span>Expiry</span><input defaultValue="12/29" inputMode="numeric" autoComplete="cc-exp"/></label>
          <label className="field"><span>CVV</span><input defaultValue="123" inputMode="numeric" autoComplete="cc-csc" maxLength={4}/></label>
        </div>}
        {error && <p className="field-error" id="payment-error" role="alert">{error}</p>}
        <button className="button primary full" onClick={pay} disabled={processing}>{processing ? <><span className="spinner"/>Processing securely…</> : <>Pay ₹{Number(amount).toLocaleString("en-IN")} <Icon name="arrow"/></>}</button>
        <p className="modal-footnote"><Icon name="lock" size={14}/> Prototype payment—no real money will be charged.</p>
      </>}
    </section>
  </div>;
}
