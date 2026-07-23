"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import LocationAutocomplete from "./LocationAutocomplete";
import { useMarketplace } from "@/lib/marketplace-context";
import { PUNE_LOCATIONS } from "@/lib/pune-locations";

const BUDGETS = [{ label: "Any budget", value: "any" }, { label: "Up to ₹25,000", value: "25000" }, { label: "Up to ₹35,000", value: "35000" }, { label: "Up to ₹50,000", value: "50000" }, { label: "Up to ₹75,000", value: "75000" }];
const BHK_OPTIONS = ["All", "1 BHK", "2 BHK", "3 BHK", "4 BHK"];
const POLICY_ITEMS = [{ icon: "shield", title: "Approved homes", copy: "Only live, verified inventory" }, { icon: "lock", title: "₹100 unlock", copy: "Get contact and consultant details" }, { icon: "check", title: "Browse first", copy: "Pay only when a home fits" }];
const money = (value) => Number(value).toLocaleString("en-IN");

function PropertyCard({ property, priority = false }) {
  const href = `/properties/${property.id}`;
  return <article className="group min-w-0 overflow-hidden rounded-2xl border border-[#e5e1da] bg-white shadow-[0_8px_28px_rgb(40_38_34/7%)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#ff5a1f] hover:shadow-[0_14px_36px_rgb(40_38_34/11%)] motion-reduce:transform-none">
    <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-[#eeeae4]" aria-label={`View ${property.title}`}>
      <img src={property.images?.[0]} alt={`${property.title} in ${property.locality}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading={priority ? "eager" : "lazy"} />
      <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold text-[#282622] shadow-sm">Approved</span>
    </Link>
    <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3"><p className="m-0 text-[1.45rem] font-black leading-none tracking-[-0.04em] text-[#282622] tabular-nums">₹{money(property.rent)}<span className="ml-1 text-xs font-medium tracking-normal text-[#747068]">/mo</span></p><span className="rounded-md bg-[#fff0e8] px-2 py-1 text-xs font-extrabold text-[#d9470e]">{property.bhk}</span></div>
      <h2 className="mb-0 mt-3 line-clamp-2 min-h-12 text-base font-bold leading-6 tracking-[-0.015em] text-[#282622]">{property.title}</h2>
      <p className="mb-0 mt-1.5 flex min-h-10 flex-wrap content-start items-center gap-x-2 text-sm leading-5 text-[#6e6961]"><span>{property.locality}</span><span aria-hidden="true">·</span><span>{money(property.area)} sq ft</span></p>
      <Link href={href} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#282622] px-4 text-sm font-extrabold text-white transition-[background-color,transform] duration-200 hover:bg-[#ff5a1f] active:scale-[0.98] active:bg-[#d9470e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5a1f] motion-reduce:transform-none">View home <Icon name="arrow" size={17} /></Link>
      <p className="mb-0 mt-2.5 text-center text-xs font-medium text-[#747068]">Unlock verified contact for ₹100</p>
    </div>
  </article>;
}

export default function HomeDiscovery() {
  const { state } = useMarketplace();
  const [locality, setLocality] = useState(""); const [budget, setBudget] = useState("any"); const [bhk, setBhk] = useState("All");
  const inventory = useMemo(() => (Array.isArray(state?.properties) ? state.properties : []).filter((property) => property?.approved === true && property.status === "Available"), [state?.properties]);
  const localities = useMemo(() => Array.from(new Set([
    ...PUNE_LOCATIONS,
    ...inventory.map((property) => String(property.locality ?? "").trim()).filter(Boolean).map((item) => item.includes(",") ? item : `${item}, Pune`)
  ])).sort((a, b) => a.localeCompare(b)), [inventory]);
  const filtered = useMemo(() => {
    const queryParts = locality.trim().toLocaleLowerCase("en-IN").split(",").map((part) => part.trim()).filter(Boolean);
    return inventory.filter((property) => {
      const propertyLocality = String(property.locality ?? "").toLocaleLowerCase("en-IN");
      const matchesLocality = !queryParts.length || (Boolean(propertyLocality) && queryParts.some((part) => propertyLocality.includes(part) || part.includes(propertyLocality)));
      return matchesLocality && (budget === "any" || Number(property.rent) <= Number(budget)) && (bhk === "All" || property.bhk === bhk);
    });
  }, [inventory, locality, budget, bhk]);
  const hasFilters = Boolean(locality.trim()) || budget !== "any" || bhk !== "All";
  const resetFilters = () => { setLocality(""); setBudget("any"); setBhk("All"); };
  return <main className="min-h-screen bg-transparent text-[#282622]">
    <section className="border-b border-[#e5e1da] bg-[#f7f5f1] px-4 py-5 sm:px-6 sm:py-7 lg:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-10">
      <header><p className="m-0 text-sm font-bold text-[#e84c12]">Verified rentals across Pune</p><h1 className="mb-0 mt-1.5 max-w-xl text-[2rem] font-black leading-[1.04] tracking-[-0.05em] text-balance sm:text-[2.65rem]">A better rental feed for Pune.</h1><p className="mb-0 mt-2 max-w-xl text-sm leading-5 text-[#67625b] sm:text-base sm:leading-6">Browse approved homes, then unlock the verified contact and consultant support for ₹100.</p></header>
      <form className="rounded-2xl border border-[#ded9d1] bg-white p-3.5 shadow-[0_10px_32px_rgb(40_38_34/7%)] sm:p-4" aria-label="Filter rental homes" onSubmit={(event) => event.preventDefault()}><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LocationAutocomplete value={locality} onValueChange={setLocality} options={localities} />
        <label className="min-w-0"><span className="mb-1.5 block text-xs font-bold text-[#67625b]">Monthly budget</span><select className="min-h-12 w-full rounded-xl border border-[#d9d4cc] bg-white px-3 text-base font-bold text-[#282622] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20 sm:text-sm" value={budget} onChange={(event) => setBudget(event.target.value)}>{BUDGETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div><fieldset className="mt-4"><legend className="mb-2 text-xs font-bold text-[#67625b]">Bedrooms</legend><div className="grid grid-cols-3 gap-2 sm:flex sm:overflow-x-auto sm:pb-1">{BHK_OPTIONS.map((item) => <button key={item} type="button" aria-pressed={bhk === item} onClick={() => setBhk(item)} className={bhk === item ? "min-h-11 rounded-lg bg-[#ff5a1f] px-2.5 text-sm font-extrabold text-white shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#282622] sm:shrink-0 sm:px-3.5 motion-reduce:transform-none" : "min-h-11 rounded-lg border border-[#d9d4cc] bg-white px-2.5 text-sm font-bold text-[#57534d] transition-[border-color,color,background-color,transform] hover:border-[#ff5a1f] hover:text-[#d9470e] active:scale-[0.98] active:bg-[#fff0e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5a1f] sm:shrink-0 sm:px-3.5 motion-reduce:transform-none"}>{item === "All" ? "Any BHK" : item.replace(" ", "")}</button>)}</div></fieldset></form>
    </div></div></section>
    <section id="homes" className="scroll-mt-24 px-4 pb-10 pt-5 sm:px-6 sm:pb-12 sm:pt-7 lg:px-8" aria-labelledby="homes-heading"><div className="mx-auto max-w-7xl"><div className="mb-4 flex items-end justify-between gap-4 sm:mb-5"><div><h2 id="homes-heading" className="m-0 text-xl font-black tracking-[-0.025em] sm:text-2xl">Available homes</h2><p className="mb-0 mt-1 text-sm text-[#67625b]" aria-live="polite">{filtered.length} {filtered.length === 1 ? "home" : "homes"} found</p></div>{hasFilters && <button type="button" onClick={resetFilters} className="min-h-11 shrink-0 px-1 text-sm font-extrabold text-[#d9470e] underline decoration-[#ff5a1f]/40 underline-offset-4 hover:text-[#282622] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5a1f]">Clear filters</button>}</div>
      {filtered.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">{filtered.map((property, index) => <PropertyCard key={property.id} property={property} priority={index < 2} />)}</div> : <div className="rounded-2xl border border-[#e5e1da] bg-[#f7f5f1] px-5 py-10 text-center sm:py-14"><h3 className="m-0 text-xl font-black tracking-[-0.025em]">No homes match these filters</h3><p className="mx-auto mb-0 mt-2 max-w-md text-sm leading-6 text-[#6e6961]">Try another locality, BHK, or budget to see more approved homes.</p>{hasFilters && <button type="button" onClick={resetFilters} className="mt-5 min-h-12 rounded-xl bg-[#ff5a1f] px-5 text-sm font-extrabold text-white transition-[background-color,transform] hover:bg-[#d9470e] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#282622] motion-reduce:transform-none">Reset all filters</button>}</div>}
    </div></section>
    <section className="border-y border-[#e5e1da] bg-[#f7f5f1] px-4 py-5 sm:px-6 lg:px-8" aria-label="Rental policies"><div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3 sm:gap-6">{POLICY_ITEMS.map((item) => <div key={item.title} className="flex items-start gap-3"><Icon name={item.icon} size={20} className="mt-0.5 shrink-0 text-[#e84c12]" /><div><h2 className="m-0 text-sm font-extrabold text-[#282622]">{item.title}</h2><p className="mb-0 mt-0.5 text-xs leading-5 text-[#6e6961]">{item.copy}</p></div></div>)}</div></section>
  </main>;
}
