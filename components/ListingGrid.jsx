"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { firebaseConfigured } from "@/lib/firebase";
import { subscribeApprovedProperties } from "@/lib/properties";

const money = (value) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));

export default function ListingGrid() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!firebaseConfigured) {
      setError("Firebase is not configured for this deployment.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    let unsubscribe;
    try {
      unsubscribe = subscribeApprovedProperties(
        (items) => { setProperties(items); setLoading(false); },
        () => { setError("Approved properties could not be loaded. Check your connection and retry."); setLoading(false); }
      );
    } catch (subscriptionError) {
      setError(subscriptionError?.message || "Properties could not be loaded.");
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, [retry]);

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading approved properties">{[0, 1, 2].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white"><div className="aspect-[4/3] animate-pulse bg-[#ECECEC]"/><div className="grid gap-3 p-5"><span className="h-5 w-2/3 animate-pulse rounded bg-[#ECECEC]"/><span className="h-4 w-full animate-pulse rounded bg-[#ECECEC]"/></div></div>)}</div>;

  if (error) return <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-9 text-center" role="alert"><Icon name="info" className="mx-auto text-red-700"/><h2 className="mb-0 mt-3 text-lg font-bold text-red-900">We could not load the live feed</h2><p className="mx-auto mb-0 mt-2 max-w-md text-sm leading-6 text-red-800">{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-5 min-h-11 rounded-xl bg-[#161616] px-5 text-sm font-bold text-white transition-transform active:scale-95">Retry</button></section>;
  if (!properties.length) return <section className="rounded-2xl border border-[#E5E5E5] bg-white px-5 py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#FFF0E7] text-[#FF5B00]"><Icon name="building"/></span><h2 className="mb-0 mt-4 text-xl font-extrabold tracking-[-0.025em]">No approved properties yet</h2><p className="mx-auto mb-0 mt-2 max-w-md text-sm leading-6 text-[#666]">Broker submissions appear here automatically as soon as an admin approves them.</p><Link href="/broker/add-property" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#FF5B00] px-5 text-sm font-extrabold text-white transition-transform active:scale-95">Add a property <Icon name="arrow" size={17}/></Link></section>;

  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
    {properties.map((property) => <article key={property.id} className="group overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_10px_32px_rgb(10_10_10/7%)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#FF5B00] hover:shadow-[0_18px_44px_rgb(10_10_10/11%)] motion-reduce:transform-none">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F0F0F0]">
        <img src={property.images[0]} alt={`${property.title} in ${property.location}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none" loading="lazy"/>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-[#161616] shadow-sm"><Icon name="check" size={14} className="text-[#FF5B00]"/> Approved</span>
        {property.images.length > 1 && <span className="absolute bottom-3 right-3 rounded-lg bg-[#0A0A0A]/85 px-2.5 py-1.5 text-xs font-bold text-white">{property.images.length} photos</span>}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3"><p className="m-0 text-2xl font-black tracking-[-0.04em] text-[#0A0A0A] tabular-nums">₹{money(property.rent)}<span className="ml-1 text-xs font-semibold tracking-normal text-[#666]">/mo</span></p><span className="rounded-lg bg-[#FFF0E7] px-2.5 py-1 text-xs font-extrabold text-[#C64600]">{property.bhk}</span></div>
        <h2 className="mb-0 mt-3 line-clamp-2 min-h-12 text-base font-extrabold leading-6 text-[#161616]">{property.title}</h2>
        <p className="mb-0 mt-2 flex items-start gap-2 text-sm leading-5 text-[#666]"><Icon name="map" size={16} className="mt-0.5 shrink-0 text-[#FF5B00]"/><span>{property.location}</span></p>
        <div className="mt-4 flex flex-wrap gap-2">{property.amenities.slice(0, 3).map((amenity) => <span key={amenity} className="rounded-lg border border-[#E5E5E5] px-2.5 py-1 text-xs font-semibold text-[#555]">{amenity}</span>)}</div>
        <p className="mb-0 mt-4 border-t border-[#EAEAEA] pt-4 text-sm text-[#666]">Deposit <strong className="text-[#161616] tabular-nums">₹{money(property.deposit)}</strong> · {property.propertyType}</p>
      </div>
    </article>)}
  </div>;
}
