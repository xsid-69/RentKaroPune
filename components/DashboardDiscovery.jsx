"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import Icon from "./Icon";

const money = (value) => Number(value || 0).toLocaleString("en-IN");
function RailCard({ property }) {
  const isOwner = property.isOwner ?? (property.listedBy === "owner" || !property.contact?.agent?.toLowerCase().includes("broker"));
  return <Link href={`/properties/${property.id}`} className="property-rail-card group block snap-start rounded-[26px] bg-white/70 p-1.5 text-[#222] ring-1 ring-[#e5dfd6] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:shadow-[0_22px_55px_rgb(56_48_40/13%)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff5a1f]/25 motion-reduce:transform-none">
    <span className="relative block aspect-[4/3] overflow-hidden rounded-[21px] bg-[#eae5de]">
      <img src={property.images?.[0]} alt={`${property.title} in ${property.location || property.locality}`} className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] motion-reduce:transform-none" loading="lazy"/>
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold shadow-[0_6px_20px_rgb(0_0_0/10%)]">
        <span className="size-1.5 rounded-full bg-[#2ba866]"/> Verified
      </span>
      <span className={`absolute left-3 bottom-3 rounded-md px-2 py-0.5 text-[10px] font-black shadow-sm ${isOwner ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}>
        {isOwner ? "0% Brokerage" : "Broker"}
      </span>
      <span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-[#282622]/75 text-white transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105">
        <Icon name="arrow" size={17}/>
      </span>
    </span>
    <span className="block px-3 pb-3 pt-3">
      <span className="block truncate text-base font-extrabold">{property.title}</span>
      <span className="mt-1 block truncate text-sm text-[#6a645c]">{property.location || property.locality} · {property.bhk}</span>
      <span className="mt-3 flex items-end justify-between gap-3 border-t border-[#ebe5dc] pt-3">
        <span className="text-lg font-black tabular-nums">₹{money(property.rent)} <span className="text-xs font-medium text-[#777067]">/ month</span></span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#d9470e]">View home</span>
      </span>
    </span>
  </Link>;
}
function Rail({ title, properties }) {
  const rail = useRef(null); const move = (direction) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * 0.85, behavior: "smooth" });
  return <section className="min-w-0"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#d9470e]">Curated collection</p><h3 className="m-0 mt-2 text-[clamp(1.65rem,3vw,2.25rem)] font-black tracking-[-.04em]">{title}</h3></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => move(-1)} className="grid size-11 place-items-center rounded-full bg-white text-[#555] ring-1 ring-[#d8d1c8] transition-[background-color,color,transform] hover:bg-[#282622] hover:text-white active:scale-[.95]" aria-label={`Previous ${title}`}><span className="text-xl" aria-hidden="true">‹</span></button><button type="button" onClick={() => move(1)} className="grid size-11 place-items-center rounded-full bg-[#282622] text-white transition-[background-color,transform] hover:bg-[#ff5a1f] active:scale-[.95]" aria-label={`Next ${title}`}><span className="text-xl" aria-hidden="true">›</span></button></div></div><div ref={rail} className="flex min-w-0 snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth pb-7 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{properties.map((property) => <RailCard property={property} key={property.id}/>)}</div></section>;
}
export default function DashboardDiscovery({ properties = [] }) {
  const collections = useMemo(() => {
    const eligible = properties.filter((item) => Number(item.rent) >= 10000);
    const popular = [...eligible].sort((a, b) => (b.images?.length || 0) - (a.images?.length || 0));
    const affordable = eligible.filter((item) => Number(item.rent) <= 40000);
    const airbnb = eligible.filter((item) => /fully/i.test(item.furnishing || "") || ["Villa", "Bungalow"].includes(item.propertyType || item.type));
    const recent = [...eligible].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const family = eligible.filter((item) => /family/i.test(item.tenantPreference || "") || /^[234]/.test(String(item.bhk)));
    return { popular, affordable: affordable.length ? affordable : popular, airbnb: airbnb.length ? airbnb : popular, recent, family: family.length ? family : popular };
  }, [properties]);
  return <div className="grid min-w-0 gap-14" aria-label="Airbnb-style property collections">
    <Rail title="Popular homes in Pune" properties={collections.popular.slice(0, 10)}/>
    <Rail title="Homes under ₹40,000" properties={collections.affordable.slice(0, 10)}/>
    <Rail title="Airbnb-style homes" properties={collections.airbnb.slice(0, 10)}/>
    <Rail title="Recently added in Pune" properties={collections.recent.slice(0, 10)}/>
    <Rail title="Family homes with more space" properties={collections.family.slice(0, 10)}/>
  </div>;
}
