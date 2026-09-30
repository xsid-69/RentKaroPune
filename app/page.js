"use client";

import { useEffect, useState } from "react";
import HomeDiscovery from "@/components/HomeDiscovery";
import { useMarketplace } from "@/lib/marketplace-context";
import { db, firebaseConfigured } from "@/lib/firebase";
import { normalizeFirestoreProperty, toMarketplaceProperty } from "@/lib/properties";
import { seedProperties } from "@/lib/seed";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function HomePage() {
  const { syncLiveProperties } = useMarketplace();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!firebaseConfigured || !db) {
      syncLiveProperties(seedProperties.map(toMarketplaceProperty));
      return undefined;
    }
    setError("");
    const approvedProperties = query(collection(db, "properties"), where("status", "==", "approved"));
    return onSnapshot(approvedProperties, (snapshot) => {
      if (snapshot.empty) {
        syncLiveProperties(seedProperties.map(toMarketplaceProperty));
      } else {
        const properties = snapshot.docs
          .map((item) => toMarketplaceProperty(normalizeFirestoreProperty(item.data(), item.id)))
          .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || a.title.localeCompare(b.title));
        syncLiveProperties(properties);
      }
    }, (subscriptionError) => {
      console.error("Homepage property subscription failed:", subscriptionError);
      syncLiveProperties(seedProperties.map(toMarketplaceProperty));
    });
  }, [retry, syncLiveProperties]);

  return <>
    {error && <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950" role="status">{error} <button type="button" className="ml-2 min-h-11 px-2 font-extrabold underline underline-offset-4" onClick={() => setRetry((value) => value + 1)}>Retry</button></div>}
    <HomeDiscovery />
  </>;
}

