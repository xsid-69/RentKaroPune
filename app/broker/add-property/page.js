"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrokerPropertyForm from "@/components/BrokerPropertyForm";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const canList = Boolean(user && (user.admin === 1 || ["consultant", "broker", "owner"].includes(user.role)));

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/broker/add-property");
  }, [loading, user, router]);

  if (loading || !user) return <main className="min-h-[70dvh] bg-[#F7F7F7] px-4 py-7" aria-busy="true"><div className="mx-auto max-w-3xl"><div className="h-10 w-2/3 animate-pulse rounded-xl bg-[#E5E5E5]"/><div className="mt-5 h-96 animate-pulse rounded-2xl bg-white"/></div></main>;

  if (!canList) return <main className="grid min-h-[70dvh] place-items-center bg-[#F7F7F7] px-4 py-10"><section className="w-full max-w-lg rounded-2xl border border-[#E5E5E5] bg-white p-6 text-center shadow-[0_18px_60px_rgb(10_10_10/8%)]"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#FFF0E7] text-[#FF5B00]"><Icon name="shield"/></span><h1 className="mb-0 mt-4 text-2xl font-extrabold tracking-[-0.03em]">Broker access required</h1><p className="mb-0 mt-2 leading-6 text-[#666]">Only approved brokers, owners, and admins can publish property listings. Apply from your profile to get verified.</p><Link href="/profile" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#FF5B00] px-6 text-sm font-extrabold text-white transition-transform active:scale-95">Open profile <Icon name="arrow" size={17}/></Link></section></main>;

  return <main className="min-h-screen bg-[#F7F7F7] pb-16 pt-8 sm:pt-12">
    <div className="site-container max-w-[832px]">
      <header className="mb-6 mt-3"><p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-[#FF5B00]">Broker workspace</p><h1 className="mb-0 mt-2 text-[clamp(2rem,7vw,3.5rem)] font-black leading-[1.02] tracking-[-0.05em] text-[#0A0A0A]">Add a Pune property.</h1><p className="mb-0 mt-3 max-w-2xl text-base leading-7 text-[#5F5F5F]">Create a verified listing in three short steps. Photos upload securely and the property remains private until admin approval.</p></header>
      <BrokerPropertyForm user={user}/>
    </div>
  </main>;
}
