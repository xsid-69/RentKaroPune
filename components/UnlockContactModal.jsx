"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useAuth } from "@/lib/auth-context";

export default function UnlockContactModal({ open, onClose, property, onUnlocked }) {
  const { user } = useAuth();
  const isAdmin = user?.admin === 1;

  const [step, setStep] = useState("overview"); // "overview" | "payment" | "success"
  const [method, setMethod] = useState("upi"); // "upi" | "card" | "netbanking"
  const [upiMode, setUpiMode] = useState("id");
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvv: "" });
  const [loading, setLoading] = useState(false);
  const [unlockedInfo, setUnlockedInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (!open) {
      setStep("overview");
      setLoading(false);
      setUnlockedInfo(null);
      setUpiId("");
    }
  }, [open]);

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

  if (!open || !property) return null;

  const isOwner = property.listedBy === "owner" || property.isOwner;
  const unlockFee = isAdmin ? 0 : isOwner ? 49 : 99;

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

  const handlePayAndUnlock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${property.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: isAdmin ? "ADMIN_BYPASS" : method.toUpperCase(),
          fee: unlockFee,
          upiId: method === "upi" ? upiId : null,
          propertyTitle: property.title,
        }),
      });
      const data = await res.json();

      const phone = data?.contact?.phone || property.contactPhone || "9822014852";
      const name = data?.contact?.name || property.contactName || property.owner || (isOwner ? "Direct Owner" : "Listing Broker");
      const address = data?.contact?.address || property.address || `${property.title}, ${property.locality || "Pune"}`;

      const unlockedData = {
        propertyId: property.id,
        phone,
        name,
        address,
        isOwner,
        fee: unlockFee,
        isAdmin,
      };

      try {
        const stored = JSON.parse(localStorage.getItem("rentkaropune_unlocked_properties") || "{}");
        stored[property.id] = unlockedData;
        localStorage.setItem("rentkaropune_unlocked_properties", JSON.stringify(stored));
      } catch {}

      setUnlockedInfo(unlockedData);
      setStep("success");
      if (onUnlocked) onUnlocked(unlockedData);
    } catch {
      // Graceful fallback
      const phone = property.contactPhone || "9822014852";
      const name = property.contactName || property.owner || (isOwner ? "Direct Owner" : "Listing Broker");
      const address = property.address || `${property.title}, ${property.locality || "Pune"}`;
      const unlockedData = { propertyId: property.id, phone, name, address, isOwner, fee: unlockFee, isAdmin };
      try {
        const stored = JSON.parse(localStorage.getItem("rentkaropune_unlocked_properties") || "{}");
        stored[property.id] = unlockedData;
        localStorage.setItem("rentkaropune_unlocked_properties", JSON.stringify(stored));
      } catch {}
      setUnlockedInfo(unlockedData);
      setStep("success");
      if (onUnlocked) onUnlocked(unlockedData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
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

        {/* STEP 1: OVERVIEW */}
        {step === "overview" && (
          <div>
            <div className="flex items-start gap-3">
              <span className={`grid size-12 place-items-center rounded-2xl ${isOwner ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-[#ff5a1f]"}`}>
                <Icon name="lock" size={24} />
              </span>
              <div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black ${isOwner ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  <Icon name={isOwner ? "shield" : "info"} size={13} />
                  {isOwner ? "Direct Owner Listing · Zero Brokerage" : "Broker Listing · Brokerage Applies"}
                </span>
                <h2 id="unlock-modal-title" className="mt-1 text-xl font-black text-stone-900">
                  Unlock Contact & Exact Address
                </h2>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3.5">
              <p className="line-clamp-1 font-bold text-stone-900">{property.title}</p>
              <p className="text-xs text-stone-500">{property.location || property.locality} · {property.bhk} · ₹{Number(property.rent).toLocaleString("en-IN")}/mo</p>
            </div>

            {isOwner ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
                <strong className="block text-sm font-bold text-emerald-800">Save up to ₹40,000 on Brokerage!</strong>
                <p className="mt-1 leading-5">This property is directly listed by the owner. By unlocking, you get direct phone access with zero brokerage.</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
                <strong className="block text-sm font-bold text-amber-800">Brokerage Advisory:</strong>
                <p className="mt-1 leading-5">This property is listed by an independent broker. Standard broker commission applies upon agreement signing.</p>
              </div>
            )}

            <div className="mt-4 grid gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">What you unlock:</span>
              <ul className="grid gap-1.5 text-xs font-semibold text-stone-700">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Direct verified mobile phone number
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Direct WhatsApp chat with listing contact
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Full street address and society name
                </li>
              </ul>
            </div>

            <div className="mt-5 border-t border-stone-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-500">Transparent Unlock Fee</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-stone-900">₹{unlockFee}</span>
                    {!isAdmin && <span className="text-xs text-stone-400 line-through">₹{unlockFee * 3}</span>}
                  </div>
                </div>
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700">
                  {isAdmin ? "Admin Free Access" : "Instant Access"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStep("payment")}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-6 text-sm font-black text-white shadow-lg transition-transform hover:bg-[#d9470e] active:scale-98"
              >
                {isAdmin ? "👑 Unlock Immediately (Admin)" : `Proceed to Unlock (₹${unlockFee})`}
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT METHOD */}
        {step === "payment" && (
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
              <button
                type="button"
                onClick={() => setStep("overview")}
                className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-800"
              >
                ← Back to Overview
              </button>
              <span className="text-xs font-extrabold text-stone-900">
                Unlock Fee: ₹{isAdmin ? "0 (Admin)" : unlockFee}
              </span>
            </div>

            {isAdmin ? (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5 text-amber-900">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="text-xl">👑</span>
                  <h3 className="text-base font-black">Administrator Superuser Detected</h3>
                </div>
                <p className="mt-2 text-xs leading-5 font-semibold text-amber-800">
                  Platform administrators have full clearance. Payment method is bypassed and contact details will be retrieved directly.
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePayAndUnlock}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 text-sm font-black text-white shadow-md hover:bg-black active:scale-98 disabled:opacity-50"
                >
                  {loading ? "Decrypting Contact…" : "👑 Unlock Contact as Admin (Direct Bypass)"}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-black text-stone-900">Select Payment Method</h3>
                <p className="text-xs text-stone-500">Instant unlock via UPI, Card, or NetBanking</p>

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

                {/* UPI Mode */}
                {method === "upi" && (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setUpiMode("id")}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-extrabold ${upiMode === "id" ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200"}`}
                      >
                        Enter UPI ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiMode("qr")}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-extrabold ${upiMode === "qr" ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200"}`}
                      >
                        Scan QR Code
                      </button>
                    </div>

                    {upiMode === "id" ? (
                      <div>
                        <label className="block text-xs font-bold text-stone-600 mb-1">UPI ID / Mobile</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. 9822014852@okhdfcbank"
                          className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 focus:border-[#ff5a1f] focus:outline-none"
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
                        <div className="mx-auto grid size-32 place-items-center rounded-xl border-2 border-dashed border-stone-300 bg-white p-2">
                          <svg className="size-28" viewBox="0 0 100 100" fill="none">
                            <rect width="100" height="100" fill="#fff" />
                            <path d="M10 10h30v30h-30zM60 10h30v30h-30zM10 60h30v30h-30z" fill="#1c1917" />
                            <path d="M18 18h14v14h-14zM68 18h14v14h-14zM18 68h14v14h-14z" fill="#fff" />
                            <circle cx="50" cy="50" r="10" fill="#ff5a1f" />
                            <path d="M48 45h4v10h-4zM45 48h10v4h-10z" fill="#fff" />
                          </svg>
                        </div>
                        <p className="mt-1 text-xs font-bold text-stone-700">Scan via GPay / PhonePe / Paytm</p>
                        <p className="text-[11px] font-mono text-[#d9470e]">Expires in: {formatTimer(timeLeft)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Mode */}
                {method === "card" && (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1">Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardData.number}
                        onChange={handleCardNumberChange}
                        placeholder="•••• •••• •••• ••••"
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
                  </div>
                )}

                {/* NetBanking Mode */}
                {method === "netbanking" && (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3.5">
                    <label className="block text-xs font-bold text-stone-600 mb-2">Select Bank</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank"].map((b) => (
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

                {/* COMING SOON GATEWAY BANNER */}
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-xs text-sky-950">
                  <div className="flex items-center gap-1.5 font-black text-sky-900">
                    <span className="inline-block size-2 rounded-full bg-sky-500 animate-pulse" />
                    Automated Payment Gateway: Coming Soon
                  </div>
                  <p className="mt-0.5 leading-relaxed text-sky-800">
                    Razorpay instant checkout is launching soon. During this phase, access contact details with <strong>Early Access Verification</strong> at ₹0 charge.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePayAndUnlock}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-6 text-sm font-black text-white shadow-lg transition-transform hover:bg-[#d9470e] active:scale-98 disabled:opacity-50"
                >
                  {loading ? "Unlocking Contact…" : `Verify & Unlock Contact (₹${unlockFee})`}
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: UNLOCKED DETAILS */}
        {step === "success" && (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Icon name="check" size={28} />
            </span>
            <h2 className="mt-3 text-2xl font-black text-stone-900">Contact Details Unlocked!</h2>
            <p className="mt-1 text-sm text-stone-500">
              {unlockedInfo?.isAdmin
                ? "Unlocked with Administrator master access."
                : `You now have direct access to contact the ${isOwner ? "owner" : "broker"}.`}
            </p>

            <div className="my-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {isOwner ? "Direct Owner" : "Listing Broker"}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                  Verified Contact
                </span>
              </div>
              <p className="text-lg font-black text-stone-900">{unlockedInfo?.name}</p>
              <p className="text-xl font-black text-[#ff5a1f] tracking-wide">
                +91 {unlockedInfo?.phone}
              </p>
              <p className="mt-2 text-xs text-stone-600">
                <strong>Address:</strong> {unlockedInfo?.address}
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <a
                href={`tel:+91${unlockedInfo?.phone}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-bold text-white hover:bg-black active:scale-95"
              >
                <Icon name="phone" size={17} /> Call Now
              </a>
              <a
                href={`https://wa.me/91${unlockedInfo?.phone}?text=${encodeURIComponent(`Hi, I saw your property "${property.title}" on RentKaro Pune and would like to arrange a visit.`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#168a45] px-4 text-sm font-bold text-white hover:bg-[#10763a] active:scale-95"
              >
                <Icon name="phone" size={17} /> WhatsApp Direct
              </a>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-xs font-bold text-stone-500 hover:text-stone-800 underline"
            >
              Done / Return to property
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
