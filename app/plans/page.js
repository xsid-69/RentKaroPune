"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import PlanCheckoutModal from "@/components/PlanCheckoutModal";

const PAY_PER_LISTING = [
  {
    id: "free_7_day",
    name: "Free 7-Day Listing",
    price: 0,
    period: "7 days",
    badge: "100% Free",
    description: "Ideal for individual flat owners testing tenant demand in Pune.",
    features: [
      "1 Pune rental property",
      "7 Days live on search results",
      "WhatsApp & callback enquiry enabled",
      "Standard search placement",
      "Instant activation after review",
    ],
    cta: "List for Free",
    href: "/broker/add-property",
  },
  {
    id: "ad_extension_30",
    name: "30-Day Listing Extension",
    price: 149,
    period: "30 days",
    badge: "Popular Renewal",
    description: "Continue running your property ad after the 7-day free trial ends.",
    features: [
      "Keep listing live for 30 more days",
      "Direct tenant phone calls & WhatsApp",
      "Direct owner / Zero brokerage tag",
      "Extend anytime in 1 tap",
    ],
    cta: "Extend Listing",
  },
  {
    id: "verified_badge",
    name: "Verified Badge & Top Rank",
    price: 299,
    period: "30 days",
    badge: "3x More Leads",
    description: "Rank on the TOP tier of Pune search results with verified trust.",
    features: [
      "Verified Owner / Broker shield badge",
      "Priority top ranking on search & homepage",
      "3x more tenant views and unlocks",
      "Enhanced credibility & direct inquiries",
    ],
    cta: "Get Verified Badge",
  },
];

const MONTHLY_PLANS = [
  {
    id: "starter_owner",
    name: "Starter Owner",
    price: 499,
    period: "month",
    badge: "Individual Landlords",
    leads: 15,
    description: "For owners with 1–2 residential rental flats looking for genuine tenants quickly.",
    features: [
      "15 Direct Tenant Leads & Contact Unlocks",
      "2 Featured Verified Badges (Top Rank)",
      "Up to 3 Active Property Listings",
      "30-day listing validity per property",
      "0% Brokerage badge & certificate",
      "WhatsApp Lead alerts to mobile",
    ],
    cta: "Select Starter Plan",
  },
  {
    id: "pro_landlord",
    name: "Pro Landlord & Commercial",
    price: 999,
    period: "month",
    badge: "Most Popular",
    leads: 40,
    popular: true,
    description: "For regular property owners, commercial shops, and multi-flat landlords.",
    features: [
      "40 Direct Tenant Leads & Contact Unlocks",
      "5 Featured Verified Badges (Top Rank)",
      "Up to 10 Active Property Listings",
      "60-day listing validity per property",
      "Commercial & Residential spaces supported",
      "Priority search placement across Pune",
      "Dedicated Landlord WhatsApp Concierge",
    ],
    cta: "Select Pro Plan",
  },
  {
    id: "enterprise_developer",
    name: "Commercial & Enterprise",
    price: 1999,
    period: "month",
    badge: "Maximum Reach",
    leads: 100,
    description: "For property developers, commercial buildings, row houses, and portfolio managers.",
    features: [
      "Unlimited Direct Tenant Leads",
      "Verified Badges on ALL listings (Rank 1 Priority)",
      "Unlimited Property Listings",
      "90-day listing validity",
      "Commercial, Office & Retail spotlight",
      "Dedicated Relationship & Account Manager",
      "Custom Lease Agreement Templates",
    ],
    cta: "Select Enterprise Plan",
  },
];

const ACCESS_COMPARISON = [
  {
    feature: "Brokerage on Owner Homes",
    traditional: "1 to 2 months rent (₹25,000–₹60,000)",
    rentkaro: "₹0 — 100% Zero Brokerage",
    highlight: true,
  },
  {
    feature: "Broker Transparency",
    traditional: "Hidden middlemen & surprise fees",
    rentkaro: "Disclosed upfront with Broker Warning",
    highlight: false,
  },
  {
    feature: "Contact Access Fee",
    traditional: "Forced full brokerage",
    rentkaro: "Low-friction unlock (₹49 for Owner / ₹99 for Broker)",
    highlight: false,
  },
  {
    feature: "Search Placement",
    traditional: "Biased broker deals",
    rentkaro: "Fair 3-Tier: Verified Top → Active Paid → Free",
    highlight: false,
  },
  {
    feature: "Listing Cost",
    traditional: "Broker commission cut",
    rentkaro: "Free 7-Day Ad for Everyone",
    highlight: true,
  },
];

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 pb-20 pt-8 sm:pt-12">
      <div className="site-container max-w-6xl">
        {/* Hero Section */}
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0e8] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#d9470e]">
            India&apos;s Transparent Property Marketplace
          </span>
          <h1 className="mt-3 text-[clamp(2.2rem,5vw,3.8rem)] font-black leading-[1.05] tracking-[-0.04em] text-stone-900">
            Pay for access, <br className="hidden sm:block" />not expensive brokerage.
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-600">
            Owners list free. Brokers can list too. You always know who you are dealing with. Direct owners enjoy zero brokerage, brokers disclose fees upfront, and RentKaro delivers transparent access.
          </p>
        </header>

        {/* 3 Pillars of Transparency */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Icon name="shield" size={20} />
            </span>
            <h2 className="mt-3 text-base font-extrabold text-stone-900">Owner Listed</h2>
            <p className="mt-1 text-xs font-bold text-emerald-700">0% Zero Brokerage</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">
              Connect directly with verified owners. No broker fees or surprise commissions. Save up to ₹50,000 per lease.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Icon name="info" size={20} />
            </span>
            <h2 className="mt-3 text-base font-extrabold text-stone-900">Broker Listed</h2>
            <p className="mt-1 text-xs font-bold text-amber-700">Brokerage Clearly Disclosed</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">
              Brokers can list transparently. A clear advisory notice warns renters about agent charges before contact.
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-orange-100 text-[#ff5a1f]">
              <Icon name="check" size={20} />
            </span>
            <h2 className="mt-3 text-base font-extrabold text-stone-900">RentKaro Pune</h2>
            <p className="mt-1 text-xs font-bold text-[#d9470e]">Transparent Service Platform</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">
              We earn from low-friction access and verified badges—never from hidden cuts inside the rental transaction.
            </p>
          </div>
        </div>

        {/* Section 1: Pay-Per-Listing Options */}
        <section className="mt-16">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider text-[#d9470e]">Pay-Per-Listing Options</span>
            <h2 className="mt-1 text-2xl font-black text-stone-900 sm:text-3xl">List Free & Boost Anytime</h2>
            <p className="mt-2 text-sm text-stone-600">Free 7-day ad included for every property. Extend or rank on top when you need.</p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {PAY_PER_LISTING.map((plan) => (
              <div key={plan.id} className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <div>
                  <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">
                    {plan.badge}
                  </span>
                  <h3 className="mt-3 text-xl font-black text-stone-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-stone-900">₹{plan.price}</span>
                    <span className="text-xs font-semibold text-stone-500">/{plan.period}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-stone-600">{plan.description}</p>
                  <ul className="mt-4 grid gap-2 border-t border-stone-100 pt-4 text-xs font-semibold text-stone-700">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-emerald-600">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100">
                  {plan.href ? (
                    <Link
                      href={plan.href}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-stone-900 text-xs font-bold text-white hover:bg-black"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#ff5a1f] text-xs font-black text-white hover:bg-[#d9470e] active:scale-95"
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Monthly Lead Plans for Landlords & Commercials */}
        <section className="mt-20">
          <div className="text-center">
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
              Commercial & Landlord Packages
            </span>
            <h2 className="mt-2 text-2xl font-black text-stone-900 sm:text-3xl">Monthly Lead & Verification Plans</h2>
            <p className="mt-2 max-w-2xl mx-auto text-sm text-stone-600">
              Ideal for regular landlords, builders, and commercial spaces. Monetize leads and top visibility instead of paying per listing.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {MONTHLY_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm transition-all ${plan.popular ? "border-2 border-[#ff5a1f] shadow-xl sm:-translate-y-2" : "border border-stone-200"}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ff5a1f] px-3 py-0.5 text-[11px] font-black text-white shadow-md">
                    MOST POPULAR
                  </span>
                )}
                <div>
                  <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">
                    {plan.badge}
                  </span>
                  <h3 className="mt-3 text-xl font-black text-stone-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-stone-900">₹{plan.price}</span>
                    <span className="text-xs font-semibold text-stone-500">/{plan.period}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800">
                    ⚡ {plan.leads} Direct Tenant Leads / mo
                  </div>
                  <p className="mt-3 text-xs leading-5 text-stone-600">{plan.description}</p>
                  <ul className="mt-4 grid gap-2 border-t border-stone-100 pt-4 text-xs font-semibold text-stone-700">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl text-xs font-black transition-all ${plan.popular ? "bg-[#ff5a1f] text-white hover:bg-[#d9470e] shadow-lg active:scale-95" : "bg-stone-900 text-white hover:bg-black active:scale-95"}`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Breaking the Brokerage Chain Comparison Table */}
        <section className="mt-20 rounded-3xl border border-stone-200 bg-white p-6 sm:p-10 shadow-sm">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider text-[#d9470e]">Transparent Marketplace</span>
            <h2 className="mt-1 text-2xl font-black text-stone-900">Breaking the Brokerage Chain</h2>
            <p className="mt-2 text-sm text-stone-600">See how RentKaro Pune replaces heavy brokerage with transparent, low-friction access.</p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="pb-3 font-bold text-stone-500">Feature</th>
                  <th className="pb-3 font-bold text-stone-500">Traditional Brokerage</th>
                  <th className="pb-3 font-black text-emerald-700">RentKaro Pune Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ACCESS_COMPARISON.map((row) => (
                  <tr key={row.feature} className={row.highlight ? "bg-emerald-50/40" : ""}>
                    <td className="py-3.5 font-bold text-stone-900">{row.feature}</td>
                    <td className="py-3.5 text-stone-500">{row.traditional}</td>
                    <td className="py-3.5 font-black text-emerald-800">{row.rentkaro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 rounded-2xl bg-stone-900 p-6 text-center text-white sm:p-8">
            <h3 className="text-xl font-black">Ready to list your Pune property?</h3>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-stone-300">
              Join hundreds of Pune owners and verified consultants. Post your property in under 3 minutes with a free 7-day listing.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/broker/add-property"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-6 text-xs font-black text-white hover:bg-[#d9470e]"
              >
                List Property for Free (7 Days) <Icon name="arrow" size={16} />
              </Link>
              <Link
                href="/properties"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/10 px-5 text-xs font-bold text-white hover:bg-white/20"
              >
                Browse Available Homes
              </Link>
            </div>
          </div>
        </section>
      </div>

      <PlanCheckoutModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        plan={selectedPlan}
      />
    </main>
  );
}
