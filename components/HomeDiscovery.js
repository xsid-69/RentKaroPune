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
  const featured = index === 0 || index === 3;
  return (
    <article className={`rk-property-card ${featured ? "is-featured" : ""}`} data-tilt>
      <Link className="rk-property-media" data-parallax-media href={`/properties/${property.id}`} aria-label={`View ${property.title}`}>
        <img src={property.images[0]} alt={`${property.title} in ${property.locality}`} loading={index < 2 ? "eager" : "lazy"} />
      </Link>
      <div className="rk-property-copy">
        <div className="rk-property-meta"><span>{property.locality}</span><span>{property.bhk}</span><span>{property.area.toLocaleString("en-IN")} sq ft</span></div>
        <h3><Link href={`/properties/${property.id}`}>{property.title}</Link></h3>
        <div className="rk-property-footer">
          <div><strong className="money">₹{property.rent.toLocaleString("en-IN")}</strong><small> monthly</small></div>
          <Link className="rk-arrow-link" data-magnetic href={`/properties/${property.id}`} aria-label={`Open ${property.title}`}><Icon name="arrow" /></Link>
        </div>
      </div>
    </article>
  );
}

function SearchDock({ locality, setLocality, budget, setBudget, type, setType }) {
  return (
    <form className="rk-search-dock" data-search-dock onSubmit={(event) => { event.preventDefault(); document.getElementById("homes")?.scrollIntoView({ behavior: "smooth" }); }}>
      <label><span>Where in Pune?</span><select value={locality} onChange={(event) => setLocality(event.target.value)}>{localities.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Monthly budget</span><select value={budget} onChange={(event) => setBudget(Number(event.target.value))}>{budgets.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}</select></label>
      <label><span>Home type</span><select value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
      <button className="rk-search-button" data-magnetic type="submit"><Icon name="search" /> Find homes</button>
    </form>
  );
}

export default function HomeDiscovery() {
  const { state } = useMarketplace();
  const [locality, setLocality] = useState("All Pune");
  const [type, setType] = useState("All types");
  const [budget, setBudget] = useState(999999);
  const [activeType, setActiveType] = useState("All types");

  const approved = state.properties.filter((property) => property.approved && property.status !== "Rented");
  const filtered = useMemo(() => approved.filter((property) =>
    (locality === "All Pune" || property.locality === locality) &&
    (type === "All types" || property.type === type) &&
    (activeType === "All types" || property.type === activeType) &&
    property.rent <= budget
  ), [approved, locality, type, activeType, budget]);
  const heroHome = approved[0];
  const secondHome = approved[2] || approved[1] || heroHome;

  return (
    <div className="rk-home" data-motion-root>
      <section className="rk-hero-god">
        <div className="rk-hero-aurora" aria-hidden="true" />
        <div className="rk-hero-ghost" data-hero-ghost aria-hidden="true">PUNE</div>
        <div className="rk-god-frame">
          <div className="rk-god-copy">
            <p className="rk-god-intro" data-hero-copy>Pune's verified rental marketplace</p>
            <h1 aria-label="Unlock Pune. Keep more.">
              <span className="rk-line-mask"><span data-hero-line>Unlock Pune.</span></span>
              <span className="rk-line-mask"><span data-hero-line>Keep <em>more.</em></span></span>
            </h1>
            <p className="rk-god-summary" data-hero-copy>Browse verified homes freely. Unlock one accountable broker for ₹99 and pay less brokerage every time you return.</p>
            <div className="rk-god-actions" data-hero-copy>
              <a className="rk-button rk-button-primary" data-magnetic href="#homes">Find your home <Icon name="arrow" /></a>
              <Link className="rk-god-owner-link" href="/dashboard?role=owner">I own a property <Icon name="arrow" size={17} /></Link>
            </div>
          </div>

          <div className="rk-keyhole-world" data-hero-media>
            <div className="rk-orbit-ring orbit-one" data-hero-orbit aria-hidden="true" />
            <div className="rk-orbit-ring orbit-two" aria-hidden="true" />
            <div className="rk-keyhole-photo" data-parallax-media>
              {heroHome && <img src={heroHome.images[0]} alt={`Living room at ${heroHome.title}`} />}
            </div>
            <div className="rk-keyhole-tail" aria-hidden="true" />
            <div className="rk-god-logo" data-float><Logo withWordmark={false} size={72} /></div>
            <div className="rk-god-listing" data-float>
              <span>Now available</span>
              <strong>{heroHome?.locality || "Koregaon Park"}</strong>
              <small>{heroHome ? `₹${heroHome.rent.toLocaleString("en-IN")} monthly` : "Verified and ready"}</small>
            </div>
            <div className="rk-god-satellite" data-float data-parallax-media>
              {secondHome && <img src={secondHome.images[1] || secondHome.images[0]} alt={`Interior at ${secondHome.title}`} />}
            </div>
            <svg className="rk-orbit-path" viewBox="0 0 560 560" aria-hidden="true"><circle cx="280" cy="280" r="248" /></svg>
          </div>
        </div>
        <SearchDock locality={locality} setLocality={setLocality} budget={budget} setBudget={setBudget} type={type} setType={setType} />
      </section>

      <section className="rk-proof-rail" data-stagger aria-label="Marketplace promises">
        <div><Icon name="shield" /><strong>Verified before live</strong><span>Ownership proof reviewed</span></div>
        <div><Icon name="user" /><strong>One assigned broker</strong><span>Clear accountability</span></div>
        <div><Icon name="wallet" /><strong>75% token refund</strong><span>Policy shown before payment</span></div>
        <div><Icon name="chart" /><strong>Up to 60% off</strong><span>Loyalty that compounds</span></div>
      </section>

      <div className="rk-zone-marquee" aria-hidden="true">
        <div className="rk-zone-track">{[...zones, ...zones].map((zone, index) => <span key={`${zone}-${index}`}>{zone}<i /></span>)}</div>
      </div>

      <section className="rk-discovery" id="homes">
        <header className="rk-section-heading" data-reveal>
          <h2>Homes with nothing to hide.</h2>
          <p>Browse every photo, amenity, and rent detail free. Pay only when you are ready to meet the home.</p>
        </header>
        <div className="rk-discovery-toolbar" data-reveal>
          <p><strong>{filtered.length}</strong> verified matches</p>
          <div className="rk-filter-row" aria-label="Filter by property type">
            {types.map((item) => <button key={item} className={activeType === item ? "active" : ""} onClick={() => setActiveType(item)}>{item === "All types" ? "All homes" : `${item}s`}</button>)}
          </div>
        </div>

        {filtered.length ? (
          <div className="rk-property-grid" data-stagger>
            {filtered.map((property, index) => <PropertyCard key={property.id} property={property} index={index} />)}
          </div>
        ) : (
          <div className="rk-empty" data-reveal><Icon name="search" size={32} /><h3>No exact match yet</h3><p>Try a wider budget or another Pune locality.</p><button className="rk-button rk-button-dark" onClick={() => { setLocality("All Pune"); setType("All types"); setActiveType("All types"); setBudget(999999); }}>Clear filters</button></div>
        )}
      </section>

      <section className="rk-journey">
        <div className="rk-journey-shell">
          <aside className="rk-journey-intro" data-reveal>
            <p>From shortlist to signed lease</p>
            <h2>Every step visible. Every fee explained.</h2>
            <span>Traditional renting hides the process. RentKaro turns it into a trackable workspace.</span>
            <Link className="rk-text-link" href="/dashboard">See the live dashboard <Icon name="arrow" size={17} /></Link>
          </aside>
          <div className="rk-journey-stack">
            <article className="rk-journey-card journey-light" data-journey-card>
              <span className="rk-journey-icon"><Icon name="search" /></span>
              <div><h3>Browse freely</h3><p>See photos, rent, deposits, furnishing, and amenities without creating an account.</p></div>
              <strong>₹0</strong>
            </article>
            <article className="rk-journey-card journey-orange" data-journey-card>
              <span className="rk-journey-icon"><Icon name="lock" /></span>
              <div><h3>Unlock once</h3><p>Pay one transparent fee to reveal your verified broker and include the first visit.</p></div>
              <strong>₹99</strong>
            </article>
            <article className="rk-journey-card journey-photo" data-journey-card>
              {heroHome && <img src={heroHome.images[2] || heroHome.images[0]} alt="Verified Pune rental interior" />}
              <div className="rk-journey-photo-copy"><span className="rk-journey-icon"><Icon name="calendar" /></span><h3>Visit with context</h3><p>Your broker, owner, schedule, and next action stay in one place.</p></div>
            </article>
            <article className="rk-journey-card journey-dark" data-journey-card>
              <span className="rk-journey-icon"><Icon name="chart" /></span>
              <div><h3>Close for less</h3><p>Your first rental saves 20%. Return twice and standard brokerage falls by 60%.</p></div>
              <strong>60%</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="rk-manifesto" data-scrub-text>
        <p>{"Renting a home should feel clear, accountable, and fair from the first search to the final signature.".split(" ").map((word, index) => <span data-scrub-word key={`${word}-${index}`}>{word} </span>)}</p>
        <div className="rk-manifesto-proof" data-stagger>
          <div><strong>100%</strong><span>owner documents reviewed</span></div>
          <div><strong>60 / 40</strong><span>broker and platform split</span></div>
          <div><strong>15%</strong><span>transparent token hold</span></div>
        </div>
      </section>

      <section className="rk-loyalty">
        <header className="rk-section-heading" data-reveal><h2>The longer you stay, the less you pay.</h2><p>Every completed rental automatically unlocks your next brokerage discount.</p></header>
        <div className="rk-loyalty-accordion" data-reveal>
          <article className="rk-loyalty-panel loyalty-first"><div><span>First rental</span><strong>20%</strong><p>off the standard one-month brokerage.</p></div></article>
          <article className="rk-loyalty-panel loyalty-second"><div><span>Second rental</span><strong>40%</strong><p>off, applied automatically at closure.</p></div></article>
          <article className="rk-loyalty-panel loyalty-third"><div><span>Third rental onward</span><strong>60%</strong><p>off every future RentKaro home.</p></div></article>
        </div>
      </section>

      <section className="rk-final-cta" data-reveal>
        <div className="rk-final-image" data-parallax-media>{secondHome && <img src={secondHome.images[0]} alt="Premium Pune rental home" />}</div>
        <div className="rk-final-scrim" />
        <div className="rk-final-copy"><Logo withWordmark={false} size={64} /><h2>Your next Pune home is already here.</h2><p>Search verified listings, meet one accountable broker, and keep more of your money.</p><Link className="rk-button rk-button-light" data-magnetic href="/dashboard">Open your workspace <Icon name="arrow" /></Link></div>
      </section>
    </div>
  );
}
