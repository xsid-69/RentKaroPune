"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CallRequestModal from "./CallRequestModal";
import DashboardDiscovery from "./DashboardDiscovery";
import Icon from "./Icon";
import LocationAutocomplete from "./LocationAutocomplete";
import Reveal from "./Reveal";
import SelectField from "./SelectField";
import { useMarketplace } from "@/lib/marketplace-context";
import { PUNE_LOCATIONS } from "@/lib/pune-locations";
import { whatsappUrl } from "@/lib/whatsapp";

const GENERAL_WHATSAPP_URL = whatsappUrl("Hi RentKaro Pune, I need help finding a rental home.");

const BUDGETS = [{ label: "₹10,000+", value: "any" }, { label: "₹10,000–₹25,000", value: "25000" }, { label: "₹10,000–₹35,000", value: "35000" }, { label: "₹10,000–₹50,000", value: "50000" }, { label: "₹10,000–₹75,000", value: "75000" }];
const BHK_OPTIONS = ["All", "1 BHK", "2 BHK", "Airbnb", "Furnished", "Family", "3 BHK", "4 BHK"];
const POLICY_ITEMS = [{ icon: "shield", title: "Approved homes", copy: "Only live, verified inventory" }, { icon: "phone", title: "WhatsApp directly", copy: "Chat with our Pune team" }, { icon: "check", title: "Public enquiries", copy: "Browse and contact us freely" }];
const money = (value) => Number(value).toLocaleString("en-IN");

function PropertyCard({ property, priority = false }) {
  const href = `/properties/${property.id}`;
  const isOwner = property.isOwner ?? (property.listedBy === "owner" || !property.contact?.agent?.toLowerCase().includes("broker"));
  return <article className="group min-w-0 overflow-hidden rounded-2xl border border-[#e5e1da] bg-white shadow-[0_8px_28px_rgb(40_38_34/7%)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#ff5a1f] hover:shadow-[0_14px_36px_rgb(40_38_34/11%)] motion-reduce:transform-none">
    <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-[#eeeae4]" aria-label={`View ${property.title}`}>
      <img src={property.images?.[0]} alt={`${property.title} in ${property.locality}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading={priority ? "eager" : "lazy"} />
      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        {property.verifiedBadge ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-black text-[#282622] shadow-sm">
            <span className="size-1.5 rounded-full bg-emerald-500"/> Verified
          </span>
        ) : (
          <span className="rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#666] shadow-sm">
            Free Ad
          </span>
        )}
      </div>
      <span className={`absolute right-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-black shadow-sm ${isOwner ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}>
        {isOwner ? "0% Brokerage" : "Broker Listed"}
      </span>
    </Link>
    <div className="p-4 sm:p-5">
      <div className="mb-2">
        {isOwner ? (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-800">
            <Icon name="shield" size={12}/> Direct Owner · Zero Brokerage
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-black text-amber-800">
            <Icon name="info" size={12}/> Listed by Broker · Fee Charged
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3"><p className="m-0 text-[1.45rem] font-black leading-none tracking-[-0.04em] text-[#282622] tabular-nums">₹{money(property.rent)}<span className="ml-1 text-xs font-medium tracking-normal text-[#747068]">/mo</span></p><span className="rounded-md bg-[#fff0e8] px-2 py-1 text-xs font-extrabold text-[#d9470e]">{property.bhk}</span></div>
      <p className="mb-0 mt-1.5 flex min-h-10 flex-wrap content-start items-center gap-x-2 text-sm leading-5 text-[#6e6961]"><span>{property.locality}</span>{property.area > 0 && <><span aria-hidden="true">·</span><span>{money(property.area)} sq ft</span></>}</p>
      {isOwner && (property.owner || property.contactName) && (
        <p className="mb-0 mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
          <span className="size-1.5 rounded-full bg-emerald-600" />
          <span>Owner: {property.owner || property.contactName}</span>
        </p>
      )}
      {!isOwner && (property.owner || property.contactName) && (
        <p className="mb-0 mt-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <span>Agency: {property.owner || property.contactName}</span>
        </p>
      )}
      <Link href={href} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#282622] px-4 text-sm font-extrabold text-white transition-[background-color,transform] duration-200 hover:bg-[#ff5a1f] active:scale-[0.98] active:bg-[#d9470e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5a1f] motion-reduce:transform-none">View home <Icon name="arrow" size={17} /></Link>
      <p className="mb-0 mt-2.5 text-center text-xs font-medium text-[#747068]">{isOwner ? "Direct owner · Zero brokerage unlock" : "Verified broker · Warning advised"}</p>
    </div>
  </article>;
}

export default function HomeDiscovery() {
  const { state } = useMarketplace();
  const [locality, setLocality] = useState(""); const [budget, setBudget] = useState("any"); const [bhk, setBhk] = useState("Airbnb");
  const [listedByFilter, setListedByFilter] = useState("all");
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({ locality: "", budget: "any", bhk: "Airbnb", listedBy: "all" });
  const inventory = useMemo(() => (Array.isArray(state?.properties) ? state.properties : []).filter((property) => property?.approved === true && property.status === "Available" && Number(property.rent) >= 10000), [state?.properties]);
  
  const localities = useMemo(() => Array.from(new Set([
    ...PUNE_LOCATIONS,
    ...inventory.map((property) => {
      const propertyLocality = String(property.locality ?? "").trim();
      if (!propertyLocality) return "";
      return propertyLocality.includes(",") ? propertyLocality : `${propertyLocality}, Pune`;
    }).filter(Boolean)
  ])).sort((a, b) => a.localeCompare(b)), [inventory]);

  const filtered = useMemo(() => {
    const normalizedQuery = appliedFilters.locality.trim().toLocaleLowerCase("en-IN");
    const queryParts = normalizedQuery.split(",").map((part) => part.trim()).filter(Boolean);
    const items = inventory.filter((property) => {
      const searchableLocation = [property.address, property.locality, property.location]
        .map((value) => String(value ?? "").toLocaleLowerCase("en-IN"))
        .filter(Boolean)
        .join(" ");
      const matchesLocation = !normalizedQuery || searchableLocation.includes(normalizedQuery) || queryParts.every((part) => searchableLocation.includes(part));
      const matchesBudget = appliedFilters.budget === "any" || Number(property.rent) <= Number(appliedFilters.budget);
      const isOwner = property.isOwner ?? (property.listedBy === "owner" || !property.contact?.agent?.toLowerCase().includes("broker"));
      const matchesListedBy = appliedFilters.listedBy === "all" || (appliedFilters.listedBy === "owner" ? isOwner : !isOwner);
      const selection = appliedFilters.bhk;
      const furnishing = String(property.furnishing || "").toLowerCase();
      const matchesCollection = ["All", "Airbnb"].includes(selection)
        || (selection === "Furnished" && furnishing.includes("furnished") && !furnishing.startsWith("unfurnished"))
        || (selection === "Family" && (/family/i.test(property.tenantPreference || "") || /^[234]/.test(String(property.bhk))))
        || property.bhk === selection;
      return matchesLocation && matchesBudget && matchesCollection && matchesListedBy;
    });

    // Requirement: Verified properties rank on TOP, regular free properties below
    return items.sort((a, b) => {
      const aVerified = Boolean(a.verifiedBadge);
      const bVerified = Boolean(b.verifiedBadge);
      if (aVerified !== bVerified) {
        return bVerified ? 1 : -1;
      }
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }, [inventory, appliedFilters]);

  const isAirbnbView = appliedFilters.bhk === "Airbnb";
  const hasFilters = Boolean(appliedFilters.locality) || appliedFilters.budget !== "any" || appliedFilters.listedBy !== "all" || !["All", "Airbnb"].includes(appliedFilters.bhk);
  
  const submitSearch = (event) => {
    event.preventDefault();
    setAppliedFilters({ locality: locality.trim(), budget, bhk, listedBy: listedByFilter });
    window.requestAnimationFrame(() => document.querySelector("#homes")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const resetFilters = () => {
    setLocality("");
    setBudget("any");
    setBhk("Airbnb");
    setListedByFilter("all");
    setAppliedFilters({ locality: "", budget: "any", bhk: "Airbnb", listedBy: "all" });
  };

  return <main className="min-h-screen bg-white text-[#282622]">
    <section className="marketplace-hero border-b border-[#e5e1da] py-[clamp(3rem,7vw,6rem)]"><div className="site-container relative z-10">
      <header className="mx-auto max-w-3xl text-center"><p className="m-0 motion-safe:animate-rise text-sm font-bold text-[#e84c12]" style={{ animationDelay: "60ms" }}>Verified rentals across Pune</p><h1 className="gilroy-basic mb-0 mt-2 motion-safe:animate-rise text-[clamp(2.6rem,6vw,5rem)] leading-[1.01] tracking-[-0.04em] text-balance" style={{ animationDelay: "120ms" }}>A better rental feed for Pune.</h1><p className="mx-auto mb-0 mt-4 max-w-[60ch] motion-safe:animate-rise text-base leading-7 text-[#5f5a53]" style={{ animationDelay: "200ms" }}>Browse approved homes from ₹10,000. Verified properties rank on top. Contact our Pune team on WhatsApp or request a callback—no login required.</p></header>
      <form className="mx-auto mt-9 max-w-5xl motion-safe:animate-rise rounded-[28px] border border-[#d9d6d1] bg-white shadow-[0_18px_55px_rgb(40_38_34/11%)]" style={{ animationDelay: "280ms" }} aria-label="Search rental homes" onSubmit={submitSearch}>
        <div className="grid items-stretch lg:grid-cols-[minmax(0,1.5fr)_minmax(210px,0.7fr)_auto]">
          <div className="px-5 py-3.5 lg:px-6"><LocationAutocomplete value={locality} onValueChange={setLocality} options={localities} label="Where" placeholder="Search Pune locality or area" variant="airbnb" /></div>
          <div className="min-w-0 border-t border-[#e5e1da] px-5 py-3.5 lg:border-l lg:border-t-0"><SelectField label="Monthly rent" ariaLabel="Monthly rent" value={budget} onChange={setBudget} options={BUDGETS} buttonClassName="min-h-10 text-sm font-semibold text-[#282622]" /></div>
          <div className="flex items-center p-3 lg:pl-2"><button type="submit" className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff5a1f] px-6 text-sm font-extrabold text-white transition-[background-color,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#d9470e] active:scale-[.98] lg:w-auto"><Icon name="search" size={18}/> Search</button></div>
        </div>
        <div className="border-t border-[#e5e1da] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-[#fcfbf9] rounded-b-[28px]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#666]">
            <span>Listed by:</span>
            <button
              type="button"
              onClick={() => { setListedByFilter("all"); setAppliedFilters((curr) => ({ ...curr, listedBy: "all" })); }}
              className={`rounded-full px-3 py-1 transition-all ${appliedFilters.listedBy === "all" ? "bg-[#282622] text-white" : "bg-white border border-[#ded8cf] text-[#444]"}`}
            >
              All Homes
            </button>
            <button
              type="button"
              onClick={() => { setListedByFilter("owner"); setAppliedFilters((curr) => ({ ...curr, listedBy: "owner" })); }}
              className={`rounded-full px-3 py-1 transition-all ${appliedFilters.listedBy === "owner" ? "bg-emerald-700 text-white" : "bg-white border border-[#ded8cf] text-emerald-800"}`}
            >
              🛡️ Direct Owner (0% Brokerage)
            </button>
            <button
              type="button"
              onClick={() => { setListedByFilter("broker"); setAppliedFilters((curr) => ({ ...curr, listedBy: "broker" })); }}
              className={`rounded-full px-3 py-1 transition-all ${appliedFilters.listedBy === "broker" ? "bg-amber-700 text-white" : "bg-white border border-[#ded8cf] text-amber-800"}`}
            >
              🏢 Broker Listed
            </button>
          </div>
          <div className="-mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BHK_OPTIONS.slice(0, 5).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={bhk === item}
                onClick={() => setBhk(item)}
                className={`min-h-8 rounded-full px-3 text-xs font-bold transition-all ${bhk === item ? "bg-[#282622] text-white" : "bg-white border border-[#d9d4cc] text-[#57534d]"}`}
              >
                {item === "All" ? "Any BHK" : item.replace(" ", "")}
              </button>
            ))}
          </div>
        </div>
      </form>
      <p className="mb-0 mt-3 motion-safe:animate-rise text-center text-xs font-medium text-[#716c65]" style={{ animationDelay: "360ms" }}>Choose your filters, then press Search to update the homes below.</p>
    </div></section>
    <section id="homes" className="scroll-mt-24 bg-white py-[var(--section-space)]" aria-labelledby="homes-heading"><div className="site-container"><Reveal className="relative mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><div><p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#d9470e]">{isAirbnbView ? "Curated like a stay feed" : "Filtered for you"}</p><h2 id="homes-heading" className="m-0 mt-3 text-[clamp(2rem,4vw,3.25rem)] font-black leading-none tracking-[-0.04em]">{isAirbnbView ? "Explore Pune homes" : "Available homes"}</h2><p className="mb-0 mt-3 text-base text-[#67625b]" aria-live="polite">{filtered.length} verified {filtered.length === 1 ? "home" : "homes"} · Top verified rank</p></div>{hasFilters && <button type="button" onClick={resetFilters} className="min-h-11 rounded-full bg-white px-4 text-sm font-extrabold text-[#d9470e] ring-1 ring-[#ded8cf] transition-[background-color,transform] hover:bg-[#fff0e8] active:scale-[.98]">Clear filters</button>}</Reveal>
      {filtered.length > 0 ? isAirbnbView ? <DashboardDiscovery properties={filtered}/> : <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">{filtered.map((property, index) => <Reveal key={property.id} delay={Math.min(index, 5) * 70}><PropertyCard property={property} priority={index < 2} /></Reveal>)}</div> : <div className="rounded-2xl border border-[#e5e1da] bg-[#f7f5f1] px-5 py-10 text-center sm:py-14"><h3 className="m-0 text-xl font-black tracking-[-0.025em]">No homes match these filters</h3><p className="mx-auto mb-0 mt-2 max-w-md text-sm leading-6 text-[#6e6961]">Try another locality, BHK, or budget to see more approved homes.</p>{hasFilters && <button type="button" onClick={resetFilters} className="mt-5 min-h-12 rounded-xl bg-[#ff5a1f] px-5 text-sm font-extrabold text-white transition-[background-color,transform] hover:bg-[#d9470e] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#282622] motion-reduce:transform-none">Reset all filters</button>}</div>}
    </div></section>
    <section className="relative overflow-hidden bg-[#171614] py-[clamp(4rem,8vw,7rem)] text-white" aria-labelledby="contact-team-title"><div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full border border-white/10 shadow-[0_0_0_70px_rgb(255_255_255/2%),0_0_0_140px_rgb(255_255_255/1%)]" aria-hidden="true"/><div className="site-container relative grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,390px)]"><Reveal><p className="m-0 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ff8a5d]">A local team, one message away</p><h2 className="mb-0 mt-4 max-w-[14ch] text-[clamp(2.3rem,5vw,4.5rem)] font-black leading-[0.98] tracking-[-0.045em]" id="contact-team-title">Still deciding where to live?</h2><p className="mb-0 mt-4 max-w-[54ch] text-white/65">Tell us your locality, budget, and move-in date. We’ll help narrow the list without requiring an account.</p></Reveal><Reveal delay={120} className="rounded-[26px] bg-white/7 p-2 ring-1 ring-white/12"><div className="grid gap-3 rounded-[20px] bg-white p-4"><a className="group inline-flex min-h-14 items-center justify-between gap-3 rounded-full bg-[#168a45] pl-5 pr-3 font-extrabold text-white transition-[background-color,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#10763a] active:scale-[.98]" href={GENERAL_WHATSAPP_URL} target="_blank" rel="noreferrer"><span className="inline-flex items-center gap-2"><Icon name="phone" size={18}/> WhatsApp our team</span><span className="grid size-9 place-items-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-0.5"><Icon name="arrow" size={17}/></span></a><button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#f3eee7] px-5 font-extrabold text-[#282622] transition-[background-color,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#ffe4d6] active:scale-[.98]" type="button" onClick={() => setCallbackOpen(true)}><Icon name="phone" size={18}/> Request a callback</button><p className="m-0 text-center text-xs font-semibold text-[#716c65]">Free enquiry · English, Hindi or Marathi</p></div></Reveal></div></section>
    <section className="border-b border-[#e5e1da] bg-[#faf9f7] py-7" aria-label="Rental policies"><div className="site-container grid gap-5 sm:grid-cols-3 sm:gap-8">{POLICY_ITEMS.map((item, index) => <Reveal key={item.title} delay={index * 90} className="flex items-start gap-3"><Icon name={item.icon} size={20} className="mt-0.5 shrink-0 text-[#e84c12]" /><div><h2 className="m-0 text-sm font-extrabold text-[#282622]">{item.title}</h2><p className="mb-0 mt-1 text-sm leading-5 text-[#6e6961]">{item.copy}</p></div></Reveal>)}</div></section>
    <CallRequestModal open={callbackOpen} onClose={() => setCallbackOpen(false)}/>
  </main>;
}
