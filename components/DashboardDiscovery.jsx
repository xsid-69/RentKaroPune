"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import Icon from "./Icon";

const money = (value) => Number(value || 0).toLocaleString("en-IN");
function RailCard({ property }) {
  return <Link href={`/properties/${property.id}`} className="property-rail-card group block snap-start text-[#222] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff5a1f]/25">
    <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[#eee]"><img src={property.images?.[0]} alt={`${property.title} in ${property.location || property.locality}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none" loading="lazy"/><span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold shadow-sm">Verified</span><span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-black/40 text-white"><Icon name="heart" size={18}/></span></span>
    <span className="mt-3 block truncate text-base font-extrabold">{property.title}</span><span className="mt-1 block truncate text-sm text-[#5f5f5f]">{property.location || property.locality} · {property.bhk}</span><span className="mt-1 block text-sm font-bold tabular-nums">₹{money(property.rent)} <span className="font-medium text-[#666]">/ month</span></span>
  </Link>;
}
function Rail({ title, properties }) {
  const rail = useRef(null); const move = (direction) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * 0.85, behavior: "smooth" });
  return <section className="min-w-0"><div className="mb-5 flex items-center justify-between gap-4"><h3 className="m-0 text-2xl font-black tracking-[-.03em]">{title}</h3><div className="hidden gap-2 sm:flex"><button type="button" onClick={() => move(-1)} className="grid size-10 place-items-center rounded-full border border-[#dedede] bg-white text-[#555] hover:border-[#222]" aria-label={`Previous ${title}`}><span aria-hidden="true">‹</span></button><button type="button" onClick={() => move(1)} className="grid size-10 place-items-center rounded-full border border-[#dedede] bg-white text-[#222] hover:border-[#222]" aria-label={`Next ${title}`}><span aria-hidden="true">›</span></button></div></div><div ref={rail} className="flex min-w-0 snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{properties.map((property) => <RailCard property={property} key={property.id}/>)}</div></section>;
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
