"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import Logo from "./Logo";
import { useMarketplace } from "@/lib/marketplace-context";

const localities = ["All Pune", "Koregaon Park", "Kothrud", "Baner", "Viman Nagar"];
const types = ["All types", "Flat", "Villa", "Bungalow"];
const budgets = [
  { label: "Any budget", value: 999999 },
  { label: "Up to ₹35k", value: 35000 },
  { label: "Up to ₹50k", value: 50000 },
  { label: "Up to ₹80k", value: 80000 },
];
const zones = ["Koregaon Park", "Baner", "Kothrud", "Viman Nagar", "Aundh", "Kharadi", "Wakad", "Hadapsar"];

function PropertyCard({ property, index }) {
  const cardLayout = index === 0
    ? "col-span-7"
    : index === 1
      ? "col-span-5 mt-[92px]"
      : index === 2
        ? "col-span-5"
        : index === 3
          ? "col-span-7 -mt-[38px]"
          : "col-span-6";
  const mediaLayout = index === 0 || index === 3 ? "h-[500px]" : "h-[400px]";

  return (
    <article className={`group overflow-hidden rounded-[22px_22px_22px_7px] bg-white shadow-[0_1px_0_rgba(17,17,15,.08),0_20px_55px_rgba(30,25,18,.06)] [transform-style:preserve-3d] will-change-transform max-[1100px]:col-span-6 max-[1100px]:mt-0 max-[820px]:col-auto ${cardLayout}`} data-tilt>
      <Link className={`relative block overflow-hidden bg-[#ddd] max-[820px]:h-[420px] max-[520px]:h-[330px] ${mediaLayout}`} data-parallax-media href={`/properties/${property.id}`} aria-label={`View ${property.title}`}>
        <img className="h-[116%] w-full object-cover transition-[filter] duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)] will-change-transform group-hover:[filter:saturate(1.08)_contrast(1.03)]" src={property.images[0]} alt={`${property.title} in ${property.locality}`} loading={index < 2 ? "eager" : "lazy"} />
      </Link>
      <div className="px-[26px] pb-[26px] pt-6 max-[520px]:p-5">
        <div className="flex flex-wrap gap-x-[18px] gap-y-2 text-xs [font-weight:750] text-[#d94210]">
          <span>{property.locality}</span>
          <span className="relative text-[#6b6b65] before:absolute before:left-[-10px] before:top-1/2 before:h-[3px] before:w-[3px] before:rounded-full before:bg-current before:content-['']">{property.bhk}</span>
          <span className="relative text-[#6b6b65] before:absolute before:left-[-10px] before:top-1/2 before:h-[3px] before:w-[3px] before:rounded-full before:bg-current before:content-['']">{property.area.toLocaleString("en-IN")} sq ft</span>
        </div>
        <h3 className="my-3 mb-6 max-w-[560px] text-[clamp(22px,2.3vw,34px)] leading-[1.08]"><Link href={`/properties/${property.id}`}>{property.title}</Link></h3>
        <div className="flex items-end justify-between gap-[18px] border-t border-[rgba(17,17,15,.13)] pt-5">
          <div><strong className="text-[27px] tabular-nums tracking-[-.025em]">₹{property.rent.toLocaleString("en-IN")}</strong><small className="text-[#6b6b65]"> monthly</small></div>
          <Link className="grid h-12 w-12 place-items-center rounded-[13px] bg-[#11110f] text-white transition-colors group-hover:bg-[#ff5a1f]" data-magnetic href={`/properties/${property.id}`} aria-label={`Open ${property.title}`}><Icon name="arrow" /></Link>
        </div>
      </div>
    </article>
  );
}

function SearchDock({ locality, setLocality, budget, setBudget, type, setType }) {
  const labelClass = "flex min-w-0 flex-col justify-center border-r border-[rgba(17,17,15,.13)] px-5 py-[7px] max-[1100px]:border-0 max-[1100px]:bg-white max-[820px]:min-h-[66px]";
  const captionClass = "text-[11px] font-bold text-[#6b6b65]";
  const selectClass = "w-full border-0 bg-transparent py-1 pl-0 pr-6 text-[#11110f] outline-0 [font-weight:750]";

  return (
    <form className="relative z-[4] mx-auto -mt-[18px] grid max-w-[1240px] grid-cols-[1.15fr_.85fr_.85fr_auto] gap-0 rounded-[20px] border border-[rgba(17,17,15,.09)] bg-[rgba(255,255,255,.9)] p-[9px] shadow-[0_24px_75px_rgba(24,20,15,.13)] backdrop-blur-[18px] max-[1100px]:grid-cols-2 max-[1100px]:gap-px max-[1100px]:bg-[rgba(17,17,15,.13)] max-[820px]:mt-[10px] max-[820px]:grid-cols-1 max-[820px]:overflow-hidden max-[820px]:rounded-2xl" data-search-dock onSubmit={(event) => { event.preventDefault(); document.getElementById("homes")?.scrollIntoView({ behavior: "smooth" }); }}>
      <label className={labelClass}><span className={captionClass}>Where in Pune?</span><select className={selectClass} value={locality} onChange={(event) => setLocality(event.target.value)}>{localities.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className={labelClass}><span className={captionClass}>Monthly budget</span><select className={selectClass} value={budget} onChange={(event) => setBudget(Number(event.target.value))}>{budgets.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}</select></label>
      <label className={labelClass}><span className={captionClass}>Home type</span><select className={selectClass} value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
      <button className="inline-flex min-h-[58px] min-w-40 items-center justify-center gap-[9px] rounded-[14px] border-0 bg-[#11110f] px-[22px] text-white [font-weight:750] hover:bg-[#ff5a1f] max-[1100px]:border-0 max-[1100px]:bg-[#11110f] max-[820px]:min-h-[60px]" data-magnetic type="submit"><Icon name="search" /> Find homes</button>
    </form>
  );
}

export default function HomeDiscovery() {
  const { state } = useMarketplace();
  const [locality, setLocality] = useState("All Pune");
  const [type, setType] = useState("All types");
  const [budget, setBudget] = useState(999999);
  const [activeType, setActiveType] = useState("All types");

  const { approved, filtered } = useMemo(() => {
    const properties = Array.isArray(state?.properties) ? state.properties : [];
    const approvedHomes = properties.filter((property) => property?.approved && property.status !== "Rented");
    const matches = approvedHomes.filter((property) =>
      (locality === "All Pune" || property.locality === locality) &&
      (type === "All types" || property.type === type) &&
      (activeType === "All types" || property.type === activeType) &&
      Number(property.rent) <= budget
    );
    return { approved: approvedHomes, filtered: matches };
  }, [state?.properties, locality, type, activeType, budget]);
  const heroHome = approved[0];
  const secondHome = approved[2] || approved[1] || heroHome;

  return (
    <div className="relative bg-[#f7f7f4] text-[#11110f]" data-motion-root>
      <section className="relative isolate min-h-dvh overflow-hidden bg-[#0d0d0c] px-6 pb-[42px] pt-28 text-white before:absolute before:inset-0 before:-z-10 before:bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] before:bg-[length:72px_72px] before:opacity-[.22] before:[mask-image:linear-gradient(to_bottom,black,transparent_78%)] before:content-[''] max-[820px]:min-h-0 max-[820px]:px-4 max-[820px]:pb-7 max-[820px]:pt-[100px]" data-hero-root>
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_73%_38%,rgba(255,90,31,.22),transparent_28%),radial-gradient(circle_at_9%_85%,rgba(255,90,31,.08),transparent_30%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-[2vw] -bottom-[8vw] -z-10 whitespace-nowrap text-[clamp(230px,34vw,620px)] font-black leading-[.7] tracking-[-.09em] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,.075)] will-change-transform" data-hero-ghost aria-hidden="true">PUNE</div>
        <div className="mx-auto grid min-h-[660px] max-w-[1380px] grid-cols-12 items-center gap-6 max-[820px]:flex max-[820px]:min-h-0 max-[820px]:flex-col max-[820px]:items-stretch">
          <div className="relative z-[3] col-span-7 pb-[72px] max-[820px]:px-0 max-[820px]:pb-6 max-[820px]:pt-[34px]">
            <p className="mb-6 mt-0 text-sm text-[#ff5a1f] [font-weight:750] max-[520px]:mb-4" data-hero-copy>Pune&apos;s verified rental marketplace</p>
            <h1 className="m-0 max-w-[900px] text-[clamp(62px,7.1vw,108px)] font-extrabold leading-[.9] tracking-[-.065em] text-white max-[820px]:text-[clamp(54px,14.7vw,78px)] max-[520px]:text-[52px] max-[520px]:leading-[.93]" aria-label="Unlock Pune. Keep more.">
              <span className="block overflow-hidden pb-[.08em] pr-[.08em]"><span className="block origin-bottom-left" data-hero-line>Unlock Pune.</span></span>
              <span className="block overflow-hidden pb-[.08em] pr-[.08em]"><span className="block origin-bottom-left" data-hero-line>Keep <em className="not-italic text-[#ff5a1f]">more.</em></span></span>
            </h1>
            <p className="mb-0 mt-[30px] max-w-[570px] text-[clamp(17px,1.35vw,20px)] leading-[1.55] text-[rgba(255,255,255,.66)] max-[820px]:mt-[22px]" data-hero-copy>Browse verified homes freely. Unlock one accountable broker for ₹99 and pay less brokerage every time you return.</p>
            <div className="mt-[34px] flex items-center gap-7 max-[520px]:flex-col max-[520px]:items-start max-[520px]:gap-[10px]" data-hero-copy>
              <a className="inline-flex min-h-14 items-center justify-center gap-3 whitespace-nowrap rounded-[14px] border-0 bg-[#ff5a1f] px-6 text-white shadow-[0_18px_35px_rgba(255,90,31,.22)] transition-[color,background,box-shadow] duration-250 [font-weight:750] [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:bg-[#d94210] hover:shadow-[0_22px_45px_rgba(255,90,31,.3)] max-[520px]:w-full" data-magnetic href="#homes">Find your home <Icon name="arrow" /></a>
              <Link className="inline-flex min-h-12 items-center gap-[9px] font-bold text-white [&_svg]:text-[#ff5a1f] [&_svg]:transition-transform [&_svg]:duration-[350ms] hover:[&_svg]:translate-x-[5px]" href="/dashboard?role=owner">I own a property <Icon name="arrow" size={17} /></Link>
            </div>
          </div>

          <div className="relative col-span-5 min-h-[650px] [perspective:1200px] max-[1100px]:min-h-[570px] max-[820px]:min-h-[610px] max-[520px]:min-h-[480px]" data-hero-media data-hero-world>
            <div className="absolute left-1/2 top-[45%] h-[530px] w-[530px] rounded-full border border-[rgba(255,255,255,.16)] [transform:translate(-50%,-50%)] before:absolute before:left-[11%] before:top-[18%] before:h-[10px] before:w-[10px] before:rounded-full before:bg-[#ff5a1f] before:shadow-[0_0_24px_rgba(255,90,31,.75)] before:content-[''] after:absolute after:bottom-[23%] after:right-[7%] after:h-[6px] after:w-[6px] after:rounded-full after:bg-white after:content-[''] max-[1100px]:h-[440px] max-[1100px]:w-[440px] max-[820px]:h-[min(520px,88vw)] max-[820px]:w-[min(520px,88vw)] max-[520px]:top-[43%]" data-hero-orbit aria-hidden="true" />
            <div className="absolute left-1/2 top-[45%] h-[610px] w-[610px] rounded-full border border-[rgba(255,255,255,.07)] [transform:translate(-50%,-50%)] max-[1100px]:h-[510px] max-[1100px]:w-[510px] max-[820px]:h-[min(590px,102vw)] max-[820px]:w-[min(590px,102vw)] max-[520px]:top-[43%]" aria-hidden="true" />
            <div className="absolute left-1/2 top-[45%] z-[2] aspect-square w-[min(420px,72%)] overflow-hidden rounded-full border-8 border-[#ff5a1f] bg-[#222] shadow-[0_0_0_16px_rgba(255,90,31,.09),0_42px_100px_rgba(0,0,0,.46)] [transform:translate(-50%,-50%)] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(160deg,transparent_50%,rgba(8,8,7,.35))] after:content-[''] max-[1100px]:w-[min(350px,76%)] max-[820px]:w-[min(420px,70vw)] max-[520px]:top-[43%] max-[520px]:w-[76vw]" data-parallax-media data-hero-photo>
              {heroHome && <img className="h-[116%] w-full object-cover will-change-transform" src={heroHome.images[0]} alt={`Living room at ${heroHome.title}`} />}
            </div>
            <div className="absolute left-1/2 top-[59%] z-[1] h-[275px] w-[168px] -translate-x-1/2 rounded-b-[38px] bg-[#ff5a1f] [clip-path:polygon(35%_0,65%_0,100%_100%,0_100%)] shadow-[0_40px_90px_rgba(255,90,31,.22)] after:absolute after:left-1/2 after:top-[52%] after:h-[40%] after:w-[35%] after:-translate-x-1/2 after:rounded-[18px_18px_7px_7px] after:bg-[#0d0d0c] after:content-[''] max-[520px]:top-[56%] max-[520px]:h-[220px] max-[520px]:w-[132px]" aria-hidden="true" />
            <div className="absolute left-0 top-[10%] z-[5] grid h-[108px] w-[108px] place-items-center rounded-[28px_28px_28px_8px] bg-white text-[#11110f] shadow-[0_28px_70px_rgba(0,0,0,.34)] max-[1100px]:-left-[2%] max-[1100px]:h-[92px] max-[1100px]:w-[92px] max-[820px]:left-[7%] max-[520px]:left-[1%] max-[520px]:top-[4%] max-[520px]:h-[78px] max-[520px]:w-[78px] max-[520px]:rounded-[20px_20px_20px_6px] max-[520px]:[&_svg]:h-[54px] max-[520px]:[&_svg]:w-[54px]" data-float><Logo withWordmark={false} size={72} /></div>
            <div className="absolute -right-3 top-[19%] z-[5] min-w-[180px] rounded-[18px_18px_18px_6px] border border-[rgba(255,255,255,.14)] bg-[rgba(18,18,16,.76)] px-5 py-[18px] shadow-[0_24px_65px_rgba(0,0,0,.3)] backdrop-blur-2xl [&>*]:block max-[1100px]:-right-[5px] max-[820px]:right-[5%] max-[520px]:right-0 max-[520px]:top-[12%] max-[520px]:min-w-[150px] max-[520px]:p-[14px]" data-float>
              <span className="text-[11px] text-[#ff5a1f] [font-weight:750]">Now available</span>
              <strong className="mb-0.5 mt-[5px] text-lg">{heroHome?.locality || "Koregaon Park"}</strong>
              <small className="text-[rgba(255,255,255,.58)]">{heroHome ? `₹${heroHome.rent.toLocaleString("en-IN")} monthly` : "Verified and ready"}</small>
            </div>
            <div className="absolute -left-[6%] bottom-[5%] z-[4] h-[220px] w-[170px] overflow-hidden rounded-[22px_22px_22px_7px] border-[6px] border-[#0d0d0c] shadow-[0_28px_70px_rgba(0,0,0,.38)] max-[820px]:left-[4%] max-[520px]:bottom-0 max-[520px]:left-0 max-[520px]:h-[165px] max-[520px]:w-[130px]" data-float data-parallax-media>
              {secondHome && <img className="h-[116%] w-full object-cover" src={secondHome.images[1] || secondHome.images[0]} alt={`Interior at ${secondHome.title}`} />}
            </div>
            <svg className="absolute left-1/2 top-[45%] z-0 h-[620px] w-[620px] overflow-visible [transform:translate(-50%,-50%)_rotate(-20deg)] [&_circle]:fill-none [&_circle]:stroke-[rgba(255,255,255,.05)] [&_circle]:[stroke-dasharray:5_16] [&_circle]:[stroke-width:1] max-[1100px]:h-[510px] max-[1100px]:w-[510px] max-[820px]:h-[min(590px,102vw)] max-[820px]:w-[min(590px,102vw)] max-[520px]:top-[43%]" data-hero-orbit-path viewBox="0 0 560 560" aria-hidden="true"><circle cx="280" cy="280" r="248" /></svg>
          </div>
        </div>
        <SearchDock locality={locality} setLocality={setLocality} budget={budget} setBudget={setBudget} type={type} setType={setType} />
      </section>

      <section className="mx-auto grid max-w-[1380px] grid-cols-4 gap-px px-6 pb-[94px] pt-[68px] max-[820px]:grid-cols-2 max-[820px]:gap-y-7 max-[820px]:px-4 max-[820px]:pb-[70px] max-[820px]:pt-[54px] max-[520px]:grid-cols-1 max-[520px]:gap-[22px]" data-stagger aria-label="Marketplace promises">
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-r border-[rgba(17,17,15,.13)] px-[26px] py-[10px] [&_svg]:row-span-2 [&_svg]:mt-0.5 [&_svg]:text-[#ff5a1f] max-[520px]:border-0 max-[520px]:p-0"><Icon name="shield" /><strong className="block text-[15px]">Verified before live</strong><span className="block text-xs text-[#6b6b65]">Ownership proof reviewed</span></div>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-r border-[rgba(17,17,15,.13)] px-[26px] py-[10px] [&_svg]:row-span-2 [&_svg]:mt-0.5 [&_svg]:text-[#ff5a1f] max-[820px]:border-0 max-[520px]:p-0"><Icon name="user" /><strong className="block text-[15px]">One assigned broker</strong><span className="block text-xs text-[#6b6b65]">Clear accountability</span></div>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-r border-[rgba(17,17,15,.13)] px-[26px] py-[10px] [&_svg]:row-span-2 [&_svg]:mt-0.5 [&_svg]:text-[#ff5a1f] max-[520px]:border-0 max-[520px]:p-0"><Icon name="wallet" /><strong className="block text-[15px]">75% token refund</strong><span className="block text-xs text-[#6b6b65]">Policy shown before payment</span></div>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 px-[26px] py-[10px] [&_svg]:row-span-2 [&_svg]:mt-0.5 [&_svg]:text-[#ff5a1f] max-[520px]:p-0"><Icon name="chart" /><strong className="block text-[15px]">Up to 60% off</strong><span className="block text-xs text-[#6b6b65]">Loyalty that compounds</span></div>
      </section>

      <div className="scale-[1.015] -rotate-[1.2deg] overflow-hidden bg-[#11110f] py-5 text-white" aria-hidden="true">
        <div className="animate-marquee flex w-max items-center gap-8">{[...zones, ...zones].map((zone, index) => <span className="inline-flex items-center gap-[30px] whitespace-nowrap text-lg font-bold" key={`${zone}-${index}`}>{zone}<i className="h-2 w-2 rounded-full bg-[#ff5a1f]" /></span>)}</div>
      </div>

      <section className="mx-auto max-w-[1380px] px-6 py-[154px] max-[820px]:px-4 max-[820px]:py-[105px]" id="homes">
        <header className="max-w-[860px]" data-reveal data-motion-reveal>
          <h2 className="max-w-[820px] text-[clamp(46px,5.8vw,82px)] leading-[.98] tracking-[-.055em] max-[520px]:text-[45px]">Homes with nothing to hide.</h2>
          <p className="mb-0 mt-6 max-w-[620px] text-lg text-[#6b6b65]">Browse every photo, amenity, and rent detail free. Pay only when you are ready to meet the home.</p>
        </header>
        <div className="mb-[26px] mt-[54px] flex items-center justify-between gap-6 max-[520px]:flex-col max-[520px]:items-start" data-reveal data-motion-reveal>
          <p className="m-0 text-[#6b6b65]"><strong className="text-2xl text-[#11110f]">{filtered.length}</strong> verified matches</p>
          <div className="flex flex-wrap gap-[7px] max-[520px]:w-full max-[520px]:flex-nowrap max-[520px]:overflow-x-auto max-[520px]:pb-[5px]" aria-label="Filter by property type">
            {types.map((item) => (
              <button
                key={item}
                className={activeType === item
                  ? "min-h-[42px] flex-none rounded-[11px] border border-[#11110f] bg-[#11110f] px-[15px] text-white transition-[color,background,transform] duration-250 [font-weight:650] [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
                  : "min-h-[42px] flex-none rounded-[11px] border border-[rgba(17,17,15,.13)] bg-transparent px-[15px] text-[#6b6b65] transition-[color,background,transform] duration-250 [font-weight:650] [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:-translate-y-0.5 hover:text-[#11110f]"}
                onClick={() => setActiveType(item)}
              >{item === "All types" ? "All homes" : `${item}s`}</button>
            ))}
          </div>
        </div>

        {filtered.length ? (
          <div className="grid auto-rows-auto grid-cols-12 gap-[22px] [grid-auto-flow:dense] [perspective:1400px] max-[820px]:grid-cols-1" data-stagger>
            {filtered.map((property, index) => <PropertyCard key={property.id} property={property} index={index} />)}
          </div>
        ) : (
          <div className="grid min-h-[360px] place-items-center rounded-[22px] border border-dashed border-[rgba(17,17,15,.13)] p-10 text-center [&>svg]:text-[#ff5a1f]" data-reveal data-motion-reveal><Icon name="search" size={32} /><h3 className="mb-[7px] mt-4 text-[28px]">No exact match yet</h3><p className="mb-5 mt-0 text-[#6b6b65]">Try a wider budget or another Pune locality.</p><button className="inline-flex min-h-14 items-center justify-center gap-3 whitespace-nowrap rounded-[14px] border-0 bg-[#11110f] px-6 text-white [font-weight:750] max-[520px]:w-full" onClick={() => { setLocality("All Pune"); setType("All types"); setActiveType("All types"); setBudget(999999); }}>Clear filters</button></div>
        )}
      </section>

      <section className="bg-[#edede8] px-6 pb-[120px] pt-[150px] max-[820px]:px-4 max-[820px]:py-[100px]">
        <div className="mx-auto grid max-w-[1380px] grid-cols-[4fr_7fr] items-start gap-[clamp(60px,9vw,150px)] max-[1100px]:grid-cols-[1fr_1.45fr] max-[1100px]:gap-[54px] max-[820px]:block">
          <aside className="sticky top-[132px] pt-[30px] max-[820px]:static max-[820px]:mb-[54px]" data-reveal data-motion-reveal>
            <p className="mb-[18px] mt-0 text-[#d94210] [font-weight:750]">From shortlist to signed lease</p>
            <h2 className="text-[clamp(43px,4.6vw,70px)] leading-[.98]">Every step visible. Every fee explained.</h2>
            <span className="my-6 block max-w-[470px] text-[17px] text-[#6b6b65]">Traditional renting hides the process. RentKaro turns it into a trackable workspace.</span>
            <Link className="inline-flex min-h-11 items-center gap-2 [font-weight:750] [&_svg]:transition-transform [&_svg]:duration-[350ms] [&_svg]:[transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:[&_svg]:translate-x-[5px]" href="/dashboard">See the live dashboard <Icon name="arrow" size={17} /></Link>
          </aside>
          <div className="min-w-0">
            <article className="sticky top-[118px] mb-[15vh] grid min-h-[410px] origin-top grid-cols-[auto_1fr_auto] items-end gap-6 overflow-hidden rounded-[26px_26px_26px_8px] bg-white p-[38px] text-[#11110f] shadow-[0_28px_75px_rgba(26,22,17,.14)] max-[820px]:top-[90px] max-[820px]:mb-[10vh] max-[820px]:min-h-[360px] max-[820px]:p-7 max-[520px]:min-h-[370px] max-[520px]:grid-cols-1 max-[520px]:content-end" data-journey-card>
              <span className="grid h-14 w-14 place-items-center self-end rounded-2xl bg-white text-[#ff5a1f]"><Icon name="search" /></span>
              <div><h3 className="mb-[10px] text-[clamp(30px,3vw,44px)]">Browse freely</h3><p className="m-0 max-w-[520px] text-base text-inherit opacity-[.72]">See photos, rent, deposits, furnishing, and amenities without creating an account.</p></div>
              <strong className="text-[clamp(44px,6vw,82px)] leading-[.85] tracking-[-.06em] max-[520px]:absolute max-[520px]:right-7 max-[520px]:top-7">₹0</strong>
            </article>
            <article className="sticky top-[132px] mb-[15vh] grid min-h-[410px] origin-top grid-cols-[auto_1fr_auto] items-end gap-6 overflow-hidden rounded-[26px_26px_26px_8px] bg-[#ff5a1f] p-[38px] text-white shadow-[0_28px_75px_rgba(26,22,17,.14)] max-[820px]:top-[90px] max-[820px]:mb-[10vh] max-[820px]:min-h-[360px] max-[820px]:p-7 max-[520px]:min-h-[370px] max-[520px]:grid-cols-1 max-[520px]:content-end" data-journey-card>
              <span className="grid h-14 w-14 place-items-center self-end rounded-2xl bg-[rgba(255,255,255,.16)] text-white"><Icon name="lock" /></span>
              <div><h3 className="mb-[10px] text-[clamp(30px,3vw,44px)]">Unlock once</h3><p className="m-0 max-w-[520px] text-base text-inherit opacity-[.72]">Pay one transparent fee to reveal your verified broker and include the first visit.</p></div>
              <strong className="text-[clamp(44px,6vw,82px)] leading-[.85] tracking-[-.06em] max-[520px]:absolute max-[520px]:right-7 max-[520px]:top-7">₹99</strong>
            </article>
            <article className="sticky top-[146px] mb-[15vh] block min-h-[500px] origin-top overflow-hidden rounded-[26px_26px_26px_8px] bg-[#11110f] text-white shadow-[0_28px_75px_rgba(26,22,17,.14)] max-[820px]:top-[90px] max-[820px]:mb-[10vh] max-[820px]:min-h-[360px] max-[520px]:min-h-[370px]" data-journey-card>
              {heroHome && <img className="absolute inset-0 h-full w-full object-cover brightness-[.65]" src={heroHome.images[2] || heroHome.images[0]} alt="Verified Pune rental interior" />}
              <div className="absolute bottom-[38px] left-[38px] right-[38px] z-[1] max-[520px]:bottom-[26px] max-[520px]:left-[26px] max-[520px]:right-[26px]"><span className="mb-[22px] grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#ff5a1f]"><Icon name="calendar" /></span><h3 className="mb-[10px] text-[clamp(30px,3vw,44px)]">Visit with context</h3><p className="m-0 max-w-[520px] text-base text-inherit opacity-[.72]">Your broker, owner, schedule, and next action stay in one place.</p></div>
            </article>
            <article className="sticky top-40 mb-0 grid min-h-[410px] origin-top grid-cols-[auto_1fr_auto] items-end gap-6 overflow-hidden rounded-[26px_26px_26px_8px] bg-[#11110f] p-[38px] text-white shadow-[0_28px_75px_rgba(26,22,17,.14)] max-[820px]:top-[90px] max-[820px]:min-h-[360px] max-[820px]:p-7 max-[520px]:min-h-[370px] max-[520px]:grid-cols-1 max-[520px]:content-end" data-journey-card>
              <span className="grid h-14 w-14 place-items-center self-end rounded-2xl bg-[rgba(255,255,255,.09)] text-[#ff5a1f]"><Icon name="chart" /></span>
              <div><h3 className="mb-[10px] text-[clamp(30px,3vw,44px)]">Close for less</h3><p className="m-0 max-w-[520px] text-base text-inherit opacity-[.72]">Your first rental saves 20%. Return twice and standard brokerage falls by 60%.</p></div>
              <strong className="text-[clamp(44px,6vw,82px)] leading-[.85] tracking-[-.06em] max-[520px]:absolute max-[520px]:right-7 max-[520px]:top-7">60%</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#11110f] px-[max(24px,calc((100vw-1260px)/2))] py-[170px] text-white max-[820px]:px-5 max-[820px]:py-[110px]" data-scrub-text>
        <p className="m-0 max-w-[1200px] text-[clamp(42px,6.2vw,92px)] font-bold leading-[1.03] tracking-[-.055em] max-[520px]:text-[40px]">{"Renting a home should feel clear, accountable, and fair from the first search to the final signature.".split(" ").map((word, index) => <span className="will-change-[opacity]" data-scrub-word key={`${word}-${index}`}>{word} </span>)}</p>
        <div className="mt-[100px] grid grid-cols-3 gap-px bg-[rgba(255,255,255,.16)] max-[820px]:mt-[66px] max-[820px]:grid-cols-1" data-stagger>
          <div className="bg-[#11110f] p-7"><strong className="block text-[42px] tracking-[-.04em] text-[#ff5a1f]">100%</strong><span className="mt-1.5 block text-[rgba(255,255,255,.62)]">owner documents reviewed</span></div>
          <div className="bg-[#11110f] p-7"><strong className="block text-[42px] tracking-[-.04em] text-[#ff5a1f]">60 / 40</strong><span className="mt-1.5 block text-[rgba(255,255,255,.62)]">broker and platform split</span></div>
          <div className="bg-[#11110f] p-7"><strong className="block text-[42px] tracking-[-.04em] text-[#ff5a1f]">15%</strong><span className="mt-1.5 block text-[rgba(255,255,255,.62)]">transparent token hold</span></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-6 py-40 max-[820px]:px-4 max-[820px]:py-[105px]">
        <header className="max-w-[860px]" data-reveal data-motion-reveal><h2 className="max-w-[820px] text-[clamp(46px,5.8vw,82px)] leading-[.98] tracking-[-.055em] max-[520px]:text-[45px]">The longer you stay, the less you pay.</h2><p className="mb-0 mt-6 max-w-[620px] text-lg text-[#6b6b65]">Every completed rental automatically unlocks your next brokerage discount.</p></header>
        <div className="mt-16 flex min-h-[590px] gap-[10px] max-[820px]:min-h-0 max-[820px]:flex-col" data-reveal data-motion-reveal>
          <article className="relative flex flex-1 items-end overflow-hidden rounded-[24px_24px_24px_8px] bg-[#e7e7e1] p-[34px] text-[#11110f] transition-[flex,filter] duration-[800ms] [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:flex-[1.55] max-[820px]:min-h-[320px] max-[820px]:flex-none max-[820px]:hover:flex-none"><div className="w-full"><span className="block [font-weight:750]">First rental</span><strong className="my-[18px] mb-3 block text-[clamp(74px,9vw,136px)] leading-[.75] tracking-[-.075em]">20%</strong><p className="m-0 block max-w-[250px] opacity-[.72]">off the standard one-month brokerage.</p></div></article>
          <article className="relative flex flex-1 items-end overflow-hidden rounded-[24px_24px_24px_8px] bg-[#ff5a1f] p-[34px] text-white transition-[flex,filter] duration-[800ms] [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:flex-[1.55] max-[820px]:min-h-[320px] max-[820px]:flex-none max-[820px]:hover:flex-none"><div className="w-full"><span className="block [font-weight:750]">Second rental</span><strong className="my-[18px] mb-3 block text-[clamp(74px,9vw,136px)] leading-[.75] tracking-[-.075em]">40%</strong><p className="m-0 block max-w-[250px] opacity-[.72]">off, applied automatically at closure.</p></div></article>
          <article className="relative flex flex-1 items-end overflow-hidden rounded-[24px_24px_24px_8px] bg-[#11110f] p-[34px] text-white transition-[flex,filter] duration-[800ms] [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:flex-[1.55] max-[820px]:min-h-[320px] max-[820px]:flex-none max-[820px]:hover:flex-none"><div className="w-full"><span className="block [font-weight:750]">Third rental onward</span><strong className="my-[18px] mb-3 block text-[clamp(74px,9vw,136px)] leading-[.75] tracking-[-.075em]">60%</strong><p className="m-0 block max-w-[250px] opacity-[.72]">off every future RentKaro home.</p></div></article>
        </div>
      </section>

      <section className="relative grid min-h-[760px] place-items-center overflow-hidden text-center text-white max-[820px]:min-h-[650px]" data-reveal data-motion-reveal>
        <div className="absolute inset-0" data-parallax-media>{secondHome && <img className="h-[116%] w-full object-cover will-change-transform" src={secondHome.images[0]} alt="Premium Pune rental home" />}</div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,7,.3),rgba(8,8,7,.8))]" />
        <div className="relative z-[1] max-w-[860px] px-6 py-20"><Logo withWordmark={false} size={64} className="[&_svg]:text-white" /><h2 className="mb-5 mt-7 text-[clamp(52px,7vw,96px)] leading-[.95] tracking-[-.06em] max-[520px]:text-[50px]">Your next Pune home is already here.</h2><p className="mx-auto mb-8 mt-0 max-w-[560px] text-lg text-[rgba(255,255,255,.74)]">Search verified listings, meet one accountable broker, and keep more of your money.</p><Link className="inline-flex min-h-14 items-center justify-center gap-3 whitespace-nowrap rounded-[14px] border-0 bg-white px-6 text-[#11110f] [font-weight:750] max-[520px]:w-full" data-magnetic href="/dashboard">Open your workspace <Icon name="arrow" /></Link></div>
      </section>
    </div>
  );
}
