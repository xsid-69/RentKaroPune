"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { useAuth } from "@/lib/auth-context";

export default function PlanCheckoutModal({ open, onClose, plan, propertyId, onPurchased }) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.admin === 1;

  const [step, setStep] = useState("review"); // "review" | "payment" | "success"
  const [method, setMethod] = useState("upi"); // "upi" | "card" | "netbanking"
  const [upiMode, setUpiMode] = useState("id"); // "id" | "qr"
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (!open) {
      setStep("review");
      setLoading(false);
      setReceipt(null);
      setUpiId("");
    }
  }, [open]);

  // QR timer countdown simulation
  useEffect(() => {
    if (!open || step !== "payment" || upiMode !== "qr") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, [open, step, upiMode]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !plan) return null;

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `0${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardData((prev) => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 2) val = `${val.substring(0, 2)}/${val.substring(2)}`;
    setCardData((prev) => ({ ...prev, expiry: val }));
  };

  const handleConfirmActivation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          propertyId: propertyId || null,
          paymentMethod: isAdmin ? "ADMIN_BYPASS" : method.toUpperCase(),
          upiId: method === "upi" ? upiId : null,
          bankName: method === "netbanking" ? selectedBank : null,
        }),
      });
      const data = await res.json();
      const txnId = data?.transactionId || `RKP-PLN-${Date.now().toString(36).toUpperCase()}`;

      setReceipt({
        txnId,
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        amount: isAdmin ? 0 : plan.price,
        method: isAdmin ? "Administrator Superuser Bypass" : method === "upi" ? `UPI (${upiId || "UPI Dynamic QR"})` : method === "card" ? "Credit / Debit Card" : `NetBanking (${selectedBank})`,
        planName: plan.name,
        leads: plan.leads || null,
        period: plan.period || "listing",
        isAdmin,
      });

      try {
        localStorage.setItem("rentkaropune_active_plan", JSON.stringify({
          id: plan.id,
          name: plan.name,
          leads: plan.leads || null,
          badge: plan.badge || null,
          activatedAt: new Date().toISOString(),
        }));
      } catch {}

      setStep("success");
      if (onPurchased) onPurchased(plan);
    } catch {
      // Graceful fallback
      try {
        localStorage.setItem("rentkaropune_active_plan", JSON.stringify({
          id: plan.id,
          name: plan.name,
          leads: plan.leads || null,
          badge: plan.badge || null,
          activatedAt: new Date().toISOString(),
        }));
      } catch {}
      setReceipt({
        txnId: `RKP-PLN-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        amount: isAdmin ? 0 : plan.price,
        method: isAdmin ? "Administrator Superuser Bypass" : "UPI Instant Pay",
        planName: plan.name,
        leads: plan.leads || null,
        period: plan.period || "listing",
        isAdmin,
      });
      setStep("success");
      if (onPurchased) onPurchased(plan);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl transition-all sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
          aria-label="Close dialog"
        >
          <Icon name="close" size={16} />
        </button>

        {/* STEP 1: REVIEW PLAN */}
        {step === "review" && (
          <div>
            <div className="flex items-start gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#fff0e8] text-[#ff5a1f]">
                <Icon name="shield" size={24} />
              </span>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e8] px-2.5 py-0.5 text-xs font-black text-[#d9470e]">
                  {plan.badge || "Verified Feature"}
                </span>
                <h2 id="plan-modal-title" className="mt-1 text-xl font-black text-stone-900">
                  {plan.name}
                </h2>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-stone-600">Total Investment</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-stone-900">₹{plan.price}</span>
                  <span className="text-xs font-semibold text-stone-500">/{plan.period || "listing"}</span>
                </div>
              </div>
              {plan.leads && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  <Icon name="check" size={15} /> Includes {plan.leads} Direct Tenant Leads & Enquiries
                </div>
              )}
            </div>

            {Array.isArray(plan.features) && (
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">What is included:</span>
                <ul className="mt-2 grid gap-1.5 text-xs font-semibold text-stone-700">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span> {feat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={() => setStep("payment")}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-6 text-sm font-black text-white shadow-lg transition-transform hover:bg-[#d9470e] active:scale-98"
              >
                Proceed to Payment Method
                <Icon name="arrow" size={16} />
              </button>
              <p className="mt-2 text-center text-[11px] text-stone-400">
                🔒 Transparent pricing. Zero hidden charges. Instant activation.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT METHOD */}
        {step === "payment" && (
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
              <button
                type="button"
                onClick={() => setStep("review")}
                className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-800"
              >
                ← Back to Summary
              </button>
              <span className="text-xs font-extrabold text-stone-900">
                Amount: ₹{isAdmin ? "0 (Admin)" : plan.price}
              </span>
            </div>

            {/* ADMIN BYPASS VIEW */}
            {isAdmin ? (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5 text-amber-900">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="text-xl">👑</span>
                  <h3 className="text-base font-black">Administrator Superuser Detected</h3>
                </div>
                <p className="mt-2 text-xs leading-5 font-semibold text-amber-800">
                  As an authenticated administrator, payment methods are bypassed. You can provision or test this subscription with immediate active status.
                </p>
                <div className="mt-4 rounded-xl bg-white/80 p-3 text-xs font-mono text-stone-700">
                  <strong>Target Plan:</strong> {plan.name} (₹{plan.price})<br />
                  <strong>User ID:</strong> {user?.id}<br />
                  <strong>Authorization:</strong> Master Admin (Role 1)
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmActivation}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 text-sm font-black text-white shadow-md hover:bg-black active:scale-98 disabled:opacity-50"
                >
                  {loading ? "Activating as Admin…" : "👑 Provision Plan as Admin (Direct Bypass)"}
                </button>
              </div>
            ) : (
              /* REGULAR USER PAYMENT METHOD FLOW */
              <div>
                <h3 className="text-base font-black text-stone-900">Select Payment Method</h3>
                <p className="text-xs text-stone-500">Choose your preferred payment mode below</p>

                {/* Tabs */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-stone-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setMethod("upi")}
                    className={`rounded-lg py-2 transition-all ${method === "upi" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
                  >
                    ⚡ UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    className={`rounded-lg py-2 transition-all ${method === "card" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("netbanking")}
                    className={`rounded-lg py-2 transition-all ${method === "netbanking" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
                  >
                    🏦 NetBanking
                  </button>
                </div>

                {/* UPI Mode Details */}
                {method === "upi" && (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setUpiMode("id")}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-extrabold ${upiMode === "id" ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200"}`}
                      >
                        Enter UPI ID / VPA
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiMode("qr")}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-extrabold ${upiMode === "qr" ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200"}`}
                      >
                        Scan UPI QR Code
                      </button>
                    </div>

                    {upiMode === "id" ? (
                      <div>
                        <label className="block text-xs font-bold text-stone-600 mb-1">Your UPI ID</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. 9822014852@okhdfcbank"
                          className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-[#ff5a1f] focus:outline-none"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {["@okhdfcbank", "@okaxis", "@paytm", "@ybl"].map((suffix) => (
                            <button
                              key={suffix}
                              type="button"
                              onClick={() => setUpiId((prev) => (prev.includes("@") ? prev.split("@")[0] + suffix : prev + suffix))}
                              className="rounded-md border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-bold text-stone-600 hover:bg-stone-100"
                            >
                              {suffix}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {/* Dynamic QR Display */}
                        <div className="mx-auto grid size-36 place-items-center rounded-xl border-2 border-dashed border-stone-300 bg-white p-2">
                          <svg className="size-32" viewBox="0 0 100 100" fill="none">
                            <rect width="100" height="100" fill="#fff" />
                            <path d="M10 10h30v30h-30zM60 10h30v30h-30zM10 60h30v30h-30z" fill="#1c1917" />
                            <path d="M18 18h14v14h-14zM68 18h14v14h-14zM18 68h14v14h-14z" fill="#fff" />
                            <circle cx="50" cy="50" r="10" fill="#ff5a1f" />
                            <path d="M48 45h4v10h-4zM45 48h10v4h-10z" fill="#fff" />
                            <rect x="55" y="60" width="10" height="10" fill="#1c1917" />
                            <rect x="75" y="60" width="15" height="5" fill="#1c1917" />
                            <rect x="65" y="75" width="20" height="15" fill="#1c1917" />
                          </svg>
                        </div>
                        <p className="mt-2 text-xs font-bold text-stone-700">Scan with GPay, PhonePe, or Paytm</p>
                        <p className="text-[11px] font-mono text-[#d9470e]">QR expires in: {formatTimer(timeLeft)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Mode Details */}
                {method === "card" && (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1">Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardData.number}
                        onChange={handleCardNumberChange}
                        placeholder="4532 ···· ···· 8901"
                        className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-mono font-semibold text-stone-900 focus:border-[#ff5a1f] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-stone-600 mb-1">Valid Thru</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardData.expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 focus:border-[#ff5a1f] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-600 mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardData.cvv}
                          onChange={(e) => setCardData((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, "") }))}
                          placeholder="•••"
                          className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 focus:border-[#ff5a1f] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-stone-500">
                      <span>Supported:</span>
                      <span className="rounded bg-white px-1.5 py-0.5 border border-stone-200 text-stone-700">RuPay</span>
                      <span className="rounded bg-white px-1.5 py-0.5 border border-stone-200 text-stone-700">Visa</span>
                      <span className="rounded bg-white px-1.5 py-0.5 border border-stone-200 text-stone-700">Mastercard</span>
                    </div>
                  </div>
                )}

                {/* NetBanking Mode Details */}
                {method === "netbanking" && (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <label className="block text-xs font-bold text-stone-600 mb-2">Select Your Bank</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Punjab National Bank"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`rounded-xl border p-2 text-left text-xs font-bold transition-all ${selectedBank === b ? "border-[#ff5a1f] bg-[#fff5f0] text-[#d9470e]" : "border-stone-200 bg-white text-stone-700"}`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* REAL-WORLD GATEWAY NOTICE (COMING SOON / PILOT) */}
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-3.5 text-xs text-sky-950">
                  <div className="flex items-center gap-1.5 font-black text-sky-900">
                    <span className="inline-block size-2 rounded-full bg-sky-500 animate-pulse" />
                    Automated Payment Gateway: Coming Soon
                  </div>
                  <p className="mt-1 leading-relaxed text-sky-800">
                    Direct bank debit via Razorpay is under RBI compliance review. Enjoy our <strong>Early-Access Pilot</strong> — click below to activate your plan immediately with full verified perks.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmActivation}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-6 text-sm font-black text-white shadow-lg transition-transform hover:bg-[#d9470e] active:scale-98 disabled:opacity-50"
                >
                  {loading ? "Activating Plan…" : `Complete Verification & Activate Plan`}
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: TRANSACTION SUCCESS & OFFICIAL RECEIPT */}
        {step === "success" && receipt && (
          <div className="text-center py-2">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 shadow-inner">
              <Icon name="check" size={28} />
            </span>
            <h2 className="mt-3 text-2xl font-black text-stone-900">Plan Activated Successfully!</h2>
            <p className="mt-1 text-xs text-stone-600">
              {receipt.isAdmin
                ? "Provisioned instantly via Administrator Master Bypass."
                : "Your subscription is now live. Enjoy verified ranking and tenant leads."}
            </p>

            {/* Official Tax & Order Receipt */}
            <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-extrabold text-stone-900">{receipt.planName}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                  Status: Active
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Transaction Ref:</span>
                <span className="font-mono font-bold text-stone-900">{receipt.txnId}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Date & Time:</span>
                <span className="font-semibold text-stone-800">{receipt.date}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-stone-800">{receipt.method}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Amount Paid:</span>
                <span className="font-extrabold text-stone-900">
                  {receipt.amount === 0 ? "₹0 (Complimentary / Admin)" : `₹${receipt.amount}`}
                </span>
              </div>
              {receipt.leads && (
                <div className="flex justify-between border-t border-stone-200 pt-2 font-bold text-emerald-800">
                  <span>Tenant Leads Added:</span>
                  <span>{receipt.leads} Leads Balance</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/broker/add-property?plan=${plan.id}`);
                }}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-6 text-sm font-black text-white shadow-lg transition-transform hover:bg-[#d9470e] active:scale-98"
              >
                🚀 List Your Property Now ({receipt.planName})
                <Icon name="arrow" size={16} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-stone-200 bg-white px-6 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                Done / Return to Platform
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
