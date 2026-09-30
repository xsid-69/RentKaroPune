"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BrokerPropertyForm from "@/components/BrokerPropertyForm";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";

function AddPropertyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/broker/add-property");
  }, [loading, user, router]);

  useEffect(() => {
    try {
      const planParam = searchParams.get("plan");
      const stored = localStorage.getItem("rentkaropune_active_plan");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) setActivePlan(parsed);
      } else if (planParam) {
        const planNames = {
          starter_owner: "Starter Owner (15 Leads)",
          pro_landlord: "Pro Landlord & Commercial (40 Leads)",
          enterprise_developer: "Commercial & Enterprise",
          verified_badge: "Trust-Verified Badge Plan",
          ad_extension_30: "30-Day Listing Extension",
        };
        setActivePlan({
          id: planParam,
          name: planNames[planParam] || "Subscribed Landlord Plan",
        });
      }
    } catch {}
  }, [searchParams]);

  if (loading || !user) {
    return (
      <main className="min-h-[70dvh] bg-[#F7F7F7] px-4 py-7" aria-busy="true">
        <div className="mx-auto max-w-3xl">
          <div className="h-10 w-2/3 animate-pulse rounded-xl bg-[#E5E5E5]" />
          <div className="mt-5 h-96 animate-pulse rounded-2xl bg-white" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F7] pb-16 pt-8 sm:pt-12">
      <div className="site-container max-w-[832px]">
        <header className="mb-6 mt-3">
          <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-[#FF5B00]">
            Owner & Broker Listing Hub
          </p>
          <h1 className="mb-0 mt-2 text-[clamp(2rem,7vw,3.5rem)] font-black leading-[1.02] tracking-[-0.05em] text-[#0A0A0A]">
            List a Pune property.
          </h1>
          <p className="mb-0 mt-3 max-w-2xl text-base leading-7 text-[#5F5F5F]">
            Direct owner listings are 100% Zero Brokerage. Brokers can list with transparent fee disclosure. All listings enjoy free 7-day active visibility across Pune.
          </p>
        </header>

        {/* ACTIVE PLAN BANNER */}
        {activePlan && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 text-emerald-950 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-200 text-emerald-900 font-bold text-sm">
                ✓
              </span>
              <div>
                <p className="text-sm font-extrabold text-emerald-900">
                  Active Subscription: {activePlan.name}
                </p>
                <p className="text-xs font-semibold text-emerald-800">
                  {activePlan.leads ? `${activePlan.leads} Direct Leads · ` : ""}
                  Priority Pune Search Ranking · Ready to List
                </p>
              </div>
            </div>
            <Link
              href="/plans"
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-800"
            >
              View Plan Details
            </Link>
          </div>
        )}

        <BrokerPropertyForm user={user} activePlan={activePlan} />
      </div>
    </main>
  );
}

export default function AddPropertyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70dvh] bg-[#F7F7F7] px-4 py-7" aria-busy="true">
          <div className="mx-auto max-w-3xl">
            <div className="h-10 w-2/3 animate-pulse rounded-xl bg-[#E5E5E5]" />
            <div className="mt-5 h-96 animate-pulse rounded-2xl bg-white" />
          </div>
        </main>
      }
    >
      <AddPropertyContent />
    </Suspense>
  );
}
