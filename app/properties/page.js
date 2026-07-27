import Link from "next/link";
import ListingGrid from "@/components/ListingGrid";
import Icon from "@/components/Icon";

export const metadata = {
  title: "Approved Pune Properties | RentKaroPune",
  description: "Browse real-time, admin-approved rental properties across Pune.",
};

export default function PropertiesPage() {
  return <main className="min-h-screen bg-[#F7F7F7] px-4 pb-16 pt-7 sm:px-6 sm:pt-10 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-7 flex flex-col gap-5 border-b border-[#DEDEDE] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-[#FF5B00]">Live Firestore feed</p><h1 className="mb-0 mt-2 max-w-3xl text-[clamp(2rem,6vw,4rem)] font-black leading-[1.02] tracking-[-0.05em] text-[#0A0A0A]">Approved homes across Pune.</h1><p className="mb-0 mt-3 max-w-2xl text-base leading-7 text-[#5F5F5F]">Every property below has passed admin review. New approvals appear here in real time.</p></div>
        <Link href="/broker/add-property" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF5B00] px-5 text-sm font-extrabold text-white transition-[background-color,transform] hover:bg-[#D94D00] active:scale-95 motion-reduce:transform-none">List property <Icon name="arrow" size={17}/></Link>
      </header>
      <ListingGrid/>
    </div>
  </main>;
}
