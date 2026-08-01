"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import LocationAutocomplete from "./LocationAutocomplete";
import DashboardDiscovery from "./DashboardDiscovery";
import { useMarketplace } from "@/lib/marketplace-context";
import { PUNE_LOCATIONS } from "@/lib/pune-locations";

const BUDGETS = [{ label: "₹10,000+", value: "any" }, { label: "₹10,000–₹25,000", value: "25000" }, { label: "₹10,000–₹35,000", value: "35000" }, { label: "₹10,000–₹50,000", value: "50000" }, { label: "₹10,000–₹75,000", value: "75000" }];
const BHK_OPTIONS = ["All", "1 BHK", "2 BHK", "Airbnb", "Furnished", "Family", "3 BHK", "4 BHK"];
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
      <p className="mb-0 mt-1.5 flex min-h-10 flex-wrap content-start items-center gap-x-2 text-sm leading-5 text-[#6e6961]"><span>{property.locality}</span>{property.area > 0 && <><span aria-hidden="true">·</span><span>{money(property.area)} sq ft</span></>}</p>
      <Link href={href} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#282622] px-4 text-sm font-extrabold text-white transition-[background-color,transform] duration-200 hover:bg-[#ff5a1f] active:scale-[0.98] active:bg-[#d9470e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5a1f] motion-reduce:transform-none">View home <Icon name="arrow" size={17} /></Link>
      <p className="mb-0 mt-2.5 text-center text-xs font-medium text-[#747068]">Unlock verified contact for ₹100</p>
    </div>
  </article>;
}

export default function HomeDiscovery() {
  const router = useRouter();
  const { state } = useMarketplace();
  const [locality, setLocality] = useState(""); const [budget, setBudget] = useState("any"); const [bhk, setBhk] = useState("Airbnb");
  const [appliedFilters, setAppliedFilters] = useState({ locality: "", budget: "any", bhk: "Airbnb" });
  const inventory = useMemo(() => (Array.isArray(state?.properties) ? state.properties : []).filter((property) => property?.approved === true && property.status === "Available" && Number(property.rent) >= 10000), [state?.properties]);
  const localities = useMemo(() => Array.from(new Set([
    ...PUNE_LOCATIONS,
    ...inventory.flatMap((property) => {
      const address = String(property.address ?? "").trim();
      const propertyLocality = String(property.locality ?? "").trim();
      const localityLabel = propertyLocality && (propertyLocality.includes(",") ? propertyLocality : `${propertyLocality}, Pune`);
      return [address, localityLabel].filter(Boolean);
    })
  ])).sort((a, b) => a.localeCompare(b)), [inventory]);
  const filtered = useMemo(() => {
    const normalizedQuery = appliedFilters.locality.trim().toLocaleLowerCase("en-IN");
    const queryParts = normalizedQuery.split(",").map((part) => part.trim()).filter(Boolean);
    return inventory.filter((property) => {
      const searchableLocation = [property.title, property.address, property.locality, property.location]
        .map((value) => String(value ?? "").toLocaleLowerCase("en-IN"))
        .filter(Boolean)
        .join(" ");
      const matchesLocation = !normalizedQuery || searchableLocation.includes(normalizedQuery) || queryParts.every((part) => searchableLocation.includes(part));
      const matchesBudget = appliedFilters.budget === "any" || Number(property.rent) <= Number(appliedFilters.budget);
      const selection = appliedFilters.bhk;
      const furnishing = String(property.furnishing || "").toLowerCase();
      const matchesCollection = ["All", "Airbnb"].includes(selection)
        || (selection === "Furnished" && furnishing.includes("furnished") && !furnishing.startsWith("unfurnished"))
        || (selection === "Family" && (/family/i.test(property.tenantPreference || "") || /^[234]/.test(String(property.bhk))))
        || property.bhk === selection;
      return matchesLocation && matchesBudget && matchesCollection;
    });
  }, [inventory, appliedFilters]);
  const isAirbnbView = appliedFilters.bhk === "Airbnb";
  const hasFilters = Boolean(appliedFilters.locality) || appliedFilters.budget !== "any" || !["All", "Airbnb"].includes(appliedFilters.bhk);
  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams({ minRent: "10000", sort: "newest" });
    if (locality.trim()) params.set("location", locality.trim());
    if (budget !== "any") params.set("maxRent", budget);
    if (["1 BHK", "2 BHK", "3 BHK", "4 BHK"].includes(bhk)) params.set("bhk", bhk === "4 BHK" ? "4BHK+" : bhk.replace(" ", ""));
    if (bhk === "Airbnb" || bhk === "Family") params.set("collection", bhk.toLowerCase());
    if (bhk === "Furnished") params.set("furnishing", "furnished");
    router.push(`/properties?${params.toString()}`);
  };
  const resetFilters = () => { setLocality(""); setBudget("any"); setBhk("Airbnb"); setAppliedFilters({ locality: "", budget: "any", bhk: "Airbnb" }); };
  return <main className="min-h-screen bg-white text-[#282622]">
    <section className="marketplace-hero border-b border-[#e5e1da] py-[clamp(3rem,7vw,6rem)]"><div className="site-container relative z-10">
      <header className="mx-auto max-w-3xl text-center"><p className="m-0 text-sm font-bold text-[#e84c12]">Verified rentals across Pune</p><h1 className="gilroy-basic mb-0 mt-2 text-[clamp(2.6rem,6vw,5rem)] leading-[1.01] tracking-[-0.04em] text-balance">A better rental feed for Pune.</h1><p className="mx-auto mb-0 mt-4 max-w-[60ch] text-base leading-7 text-[#5f5a53]">Browse approved homes from ₹10,000, then unlock verified contact and consultant support for ₹100.</p></header>
      <form className="mx-auto mt-9 max-w-5xl rounded-[28px] border border-[#d9d6d1] bg-white shadow-[0_18px_55px_rgb(40_38_34/11%)]" aria-label="Search rental homes" onSubmit={submitSearch}>
        <div className="grid items-stretch lg:grid-cols-[minmax(0,1.5fr)_minmax(210px,0.7fr)_auto]">
          <div className="px-5 py-3.5 lg:px-6"><LocationAutocomplete value={locality} onValueChange={setLocality} options={localities} label="Where" placeholder="Search locality or full address" variant="airbnb" /></div>
          <label className="min-w-0 border-t border-[#e5e1da] px-5 py-3.5 lg:border-l lg:border-t-0"><span className="mb-1 block text-xs font-extrabold text-[#282622]">Monthly rent</span><select className="min-h-10 w-full border-0 bg-transparent text-sm font-semibold text-[#282622] outline-none" value={budget} onChange={(event) => setBudget(event.target.value)}>{BUDGETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <div className="flex items-center p-3 lg:pl-2"><button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff5a1f] px-6 text-sm font-extrabold text-white transition-[background-color,transform] hover:bg-[#d9470e] active:scale-[.98] lg:w-auto"><Icon name="search" size={18}/> Search</button></div>
        </div>
        <fieldset className="border-t border-[#e5e1da] px-4 py-4 sm:px-6"><legend className="sr-only">Bedrooms and collections</legend><div className="flex flex-wrap justify-center gap-2">{BHK_OPTIONS.map((item) => <button key={item} type="button" aria-pressed={bhk === item} onClick={() => setBhk(item)} className={bhk === item ? "min-h-10 rounded-full bg-[#282622] px-4 text-sm font-extrabold text-white transition-transform active:scale-[0.98]" : "min-h-10 rounded-full border border-[#d9d4cc] bg-white px-4 text-sm font-bold text-[#57534d] transition hover:border-[#282622] hover:text-[#282622] active:scale-[0.98]"}>{item === "All" ? "Any BHK" : item.replace(" ", "")}</button>)}</div></fieldset>
      </form>
      <p className="mb-0 mt-3 text-center text-xs font-medium text-[#716c65]">Choose your filters, then press Search to update the homes below.</p>
    </div></section>
    <section id="homes" className="scroll-mt-24 py-[var(--section-space)]" aria-labelledby="homes-heading"><div className="site-container"><div className="relative mb-10 flex flex-col items-center justify-center gap-2 text-center"><div><h2 id="homes-heading" className="m-0 text-[clamp(2rem,4vw,3.25rem)] font-black tracking-[-0.035em]">{isAirbnbView ? "Explore Pune homes" : "Available homes"}</h2><p className="mb-0 mt-2 text-base text-[#67625b]" aria-live="polite">{filtered.length} {filtered.length === 1 ? "home" : "homes"} found</p></div>{hasFilters && <button type="button" onClick={resetFilters} className="min-h-11 text-sm font-extrabold text-[#d9470e] underline decoration-[#ff5a1f]/40 underline-offset-4 hover:text-[#282622] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5a1f] sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2">Clear filters</button>}</div>
      {filtered.length > 0 ? isAirbnbView ? <DashboardDiscovery properties={filtered}/> : <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">{filtered.map((property, index) => <PropertyCard key={property.id} property={property} priority={index < 2} />)}</div> : <div className="rounded-2xl border border-[#e5e1da] bg-[#f7f5f1] px-5 py-10 text-center sm:py-14"><h3 className="m-0 text-xl font-black tracking-[-0.025em]">No homes match these filters</h3><p className="mx-auto mb-0 mt-2 max-w-md text-sm leading-6 text-[#6e6961]">Try another locality, BHK, or budget to see more approved homes.</p>{hasFilters && <button type="button" onClick={resetFilters} className="mt-5 min-h-12 rounded-xl bg-[#ff5a1f] px-5 text-sm font-extrabold text-white transition-[background-color,transform] hover:bg-[#d9470e] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#282622] motion-reduce:transform-none">Reset all filters</button>}</div>}
    </div></section>
    <section className="border-y border-[#e5e1da] bg-[#faf9f7] py-7" aria-label="Rental policies"><div className="site-container grid gap-5 sm:grid-cols-3 sm:gap-8">{POLICY_ITEMS.map((item) => <div key={item.title} className="flex items-start gap-3"><Icon name={item.icon} size={20} className="mt-0.5 shrink-0 text-[#e84c12]" /><div><h2 className="m-0 text-sm font-extrabold text-[#282622]">{item.title}</h2><p className="mb-0 mt-1 text-sm leading-5 text-[#6e6961]">{item.copy}</p></div></div>)}</div></section>
  </main>;
}
