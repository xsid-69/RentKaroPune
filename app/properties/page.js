import { Suspense } from "react";
import ListingGrid from "@/components/ListingGrid";

export const metadata = {
  title: "Search Pune rental properties | RentKaroPune",
  description: "Filter and compare real-time, admin-approved rental properties across Pune.",
};

function ResultsSkeleton() {
  return <div className="grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)]" aria-label="Loading property search results"><aside className="hidden h-[520px] animate-pulse rounded-2xl bg-[#ececec] lg:block"/><div><div className="mb-5 h-12 animate-pulse rounded-xl bg-[#ececec]"/><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0,1,2,3,4,5].map((item) => <div key={item} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#ececec]"/>)}</div></div></div>;
}

export default function PropertiesPage() {
  return <main className="min-h-screen bg-[#f7f7f7] py-8 sm:py-10"><div className="site-container"><Suspense fallback={<ResultsSkeleton/>}><ListingGrid/></Suspense></div></main>;
}
