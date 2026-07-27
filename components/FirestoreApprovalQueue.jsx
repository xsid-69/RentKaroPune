"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useAuth } from "@/lib/auth-context";
import { syncFirebaseSession } from "@/lib/firebase-session";
import { subscribePendingProperties } from "@/lib/properties";

const money = (value) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));

export default function FirestoreApprovalQueue() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState("");

  useEffect(() => {
    if (!user?.id || user.admin !== 1) return;
    let active = true;
    let unsubscribe;
    syncFirebaseSession(user.id)
      .then(() => {
        if (!active) return;
        unsubscribe = subscribePendingProperties(
          (items) => { setProperties(items); setLoading(false); },
          () => { setError("The Firestore approval queue could not be loaded."); setLoading(false); }
        );
      })
      .catch((sessionError) => { if (active) { setError(sessionError.message); setLoading(false); } });
    return () => { active = false; unsubscribe?.(); };
  }, [user?.id, user?.admin]);

  const approve = async (propertyId) => {
    setApproving(propertyId);
    setError("");
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(propertyId)}/approve`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Approval failed.");
    } catch (approvalError) {
      setError(approvalError.message || "This property could not be approved.");
    } finally {
      setApproving("");
    }
  };

  return <section className="rounded-[14px] border border-[#E5E5E5] bg-white p-5 sm:p-6" aria-labelledby="firestore-approval-title">
    <div className="flex items-start justify-between gap-4"><div><p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-[#FF5B00]">Cloud Firestore</p><h2 id="firestore-approval-title" className="mb-0 mt-1 text-[26px] font-extrabold tracking-[-0.03em]">Live property approvals</h2><p className="mb-0 mt-2 text-sm leading-6 text-[#666]">Approving a listing publishes it instantly to the real-time property feed.</p></div><span className="rounded-full bg-[#F2F2F2] px-3 py-1.5 text-xs font-bold text-[#444]">{properties.length} pending</span></div>
    {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">{error}</p>}
    {loading ? <div className="mt-5 h-28 animate-pulse rounded-xl bg-[#F2F2F2]"/> : properties.length ? <div className="mt-5 grid gap-3">{properties.map((property) => <article key={property.id} className="grid gap-4 rounded-xl bg-[#F7F7F7] p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
      <img src={property.images[0]} alt={`${property.title} preview`} className="aspect-square w-full rounded-lg object-cover sm:w-24"/>
      <div className="min-w-0"><span className="text-xs font-bold uppercase tracking-[0.08em] text-[#B63F00]">Pending review</span><h3 className="mb-0 mt-1 text-lg font-extrabold text-[#161616]">{property.title}</h3><p className="mb-0 mt-1 text-sm text-[#666]">{property.location} · {property.bhk} · ₹{money(property.rent)}/month</p><p className="mb-0 mt-2 text-xs text-[#777]">Broker: {property.brokerId}</p></div>
      <button type="button" disabled={Boolean(approving)} onClick={() => approve(property.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5B00] px-4 text-sm font-extrabold text-white transition-[background-color,transform] hover:bg-[#D94D00] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"><Icon name="shield" size={17}/>{approving === property.id ? "Publishing…" : "Approve"}</button>
    </article>)}</div> : <div className="mt-5 rounded-xl bg-[#F7F7F7] px-5 py-8 text-center"><Icon name="check" className="mx-auto text-[#FF5B00]"/><h3 className="mb-0 mt-2 font-bold">Firestore queue is clear</h3><p className="mb-0 mt-1 text-sm text-[#666]">New broker uploads will appear here automatically.</p></div>}
  </section>;
}
