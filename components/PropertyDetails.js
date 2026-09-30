"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CallRequestModal from "./CallRequestModal";
import BrokerWarningModal from "./BrokerWarningModal";
import UnlockContactModal from "./UnlockContactModal";
import PlanCheckoutModal from "./PlanCheckoutModal";
import Icon from "./Icon";
import PropertyPhotoManager from "./PropertyPhotoManager";
import SwipeToWhatsApp from "./SwipeToWhatsApp";
import { useMarketplace } from "@/lib/marketplace-context";
import { useAuth } from "@/lib/auth-context";
import { subscribeProperty, toMarketplaceProperty } from "@/lib/properties";
import { whatsappUrl } from "@/lib/whatsapp";

const buttonBase = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--orange-soft)] active:scale-[.98]";
const primaryButton = `${buttonBase} border-[var(--orange)] bg-[var(--orange)] text-white hover:bg-[var(--orange-dark)]`;
const secondaryButton = `${buttonBase} border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink)]`;

export default function PropertyDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { state } = useMarketplace();
  const [liveProperty, setLiveProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [brokerWarningOpen, setBrokerWarningOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [unlockedDetails, setUnlockedDetails] = useState(null);
  const [saved, setSaved] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    let unsubscribe;
    try {
      unsubscribe = subscribeProperty(id, (record) => { setLiveProperty(record); setLoading(false); }, () => { setLoadError("Live property details could not be loaded."); setLoading(false); });
    } catch (error) {
      setLoadError(error?.message || "Property details could not be loaded.");
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, [id]);

  // Check if user already unlocked this property
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("rentkaropune_unlocked_properties") || "{}");
      if (stored[id]) {
        setUnlockedDetails(stored[id]);
      }
    } catch {}
  }, [id]);

  const localProperty = state.properties.find((item) => item.id === id);
  const property = liveProperty ? toMarketplaceProperty(liveProperty) : localProperty;
  const canManagePhotos = Boolean(user && (user.admin === 1 || user.id === property?.brokerId));

  if (loading && !property) return <main className="site-container min-h-[70dvh] animate-pulse py-12" aria-label="Loading property"><div className="h-10 w-2/3 rounded bg-[var(--soft)]"/><div className="mt-6 h-[420px] rounded-2xl bg-[var(--soft)]"/></main>;
  if (!property) return <section className="grid min-h-[70dvh] place-content-center justify-items-center gap-4 px-5 text-center"><strong className="text-6xl text-[var(--orange)]">404</strong><h1 className="text-3xl font-bold">This property has moved.</h1><p className="text-[var(--muted)]">{loadError || "It may have been rented or removed from verification."}</p><Link className={primaryButton} href="/">Browse available homes</Link></section>;

  const isOwner = property.isOwner ?? (property.listedBy === "owner" || !property.contact?.agent?.toLowerCase().includes("broker"));
  const unlockFee = isOwner ? 49 : 99; // Low-friction pricing so users convert easily!
  const isUnlocked = Boolean(unlockedDetails || (user && (user.admin === 1 || user.id === property.brokerId)));
  const contactPhone = unlockedDetails?.phone || property.contactPhone || property.contact?.phone || "7045308514";
  const contactName = unlockedDetails?.name || property.contactName || property.owner || (isOwner ? "Direct Owner" : "Listing Broker");

  const images = (property.images || []).filter(Boolean).slice(0, 8);
  const mosaic = images.slice(0, 5);
  const amenities = property.amenities || [];
  const whatsappHref = whatsappUrl(`Hi RentKaro Pune, I am interested in ${property.title} (${property.id}). Please share more details.`);
  
  const directWhatsAppHref = `https://wa.me/91${contactPhone}?text=${encodeURIComponent(`Hi ${contactName}, I saw your property "${property.title}" on RentKaro Pune and would like to arrange a site visit.`)}`;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: property.title, text: `${property.title} in ${property.locality}, Pune`, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setShareStatus(navigator.share ? "Shared" : "Link copied");
      window.setTimeout(() => setShareStatus(""), 2500);
    } catch (error) { if (error?.name !== "AbortError") setShareStatus("Could not share"); }
  };

  const handleContactAction = (action) => {
    if (!isOwner && !isUnlocked) {
      // Show broker warning notice first for complete transparency!
      setBrokerWarningOpen(true);
    } else if (!isUnlocked) {
      setUnlockModalOpen(true);
    } else {
      action();
    }
  };

  const openExtendPlan = () => {
    setSelectedPlan({
      id: "ad_extension_30",
      name: "30-Day Listing Extension",
      price: 149,
      period: "30 days",
      badge: "Listing Renewal",
      features: [
        "Keep this listing active for 30 more days",
        "Direct tenant enquiries & notifications",
        "Instant renewal without re-verification",
      ],
    });
    setPlanModalOpen(true);
  };

  const openVerifiedBadgePlan = () => {
    setSelectedPlan({
      id: "verified_badge",
      name: "Trust-Verified Property Badge",
      price: 299,
      period: "one-time",
      badge: "Top Search Priority",
      features: [
        "Permanent 'Verified' badge on property card",
        "Pins property to TOP priority in Pune search results",
        "3x higher tenant enquiry & contact unlock rate",
        "Document & ownership verification stamp",
      ],
    });
    setPlanModalOpen(true);
  };

  return <>
    <main className="site-container pb-36 pt-4 text-[var(--ink)] lg:pb-20">
      {loadError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">{loadError} Showing the last available copy.</p>}
      
      {/* 7-day Ad Lifecycle notice for owners/brokers */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-semibold text-stone-700">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${property.isAdActive ? "bg-emerald-500" : "bg-amber-500"}`}/>
          <span>{property.isAdActive ? `Active Listing · 7-Day Free Period (${property.daysRemaining || 6} days remaining)` : "Free 7-Day Ad has ended. Listing is in archive."}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!property.verifiedBadge && (
            <button type="button" onClick={openVerifiedBadgePlan} className="font-extrabold text-emerald-700 hover:underline">
              ⚡ Get Verified Badge (₹299)
            </button>
          )}
          <button type="button" onClick={openExtendPlan} className="font-extrabold text-[#d9470e] hover:underline">
            {property.isAdActive ? "Extend listing (₹149)" : "Renew ad to keep active"}
          </button>
          <Link href="/plans" className="text-stone-500 hover:text-stone-800">
            View Owner Plans →
          </Link>
        </div>
      </div>

      <header className="mt-4 flex items-start justify-between gap-5 max-[760px]:flex-col">
        <div>
          <div className="mb-2 flex items-center gap-2">
            {isOwner ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                <Icon name="shield" size={14}/> Direct Owner · Zero Brokerage
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                <Icon name="info" size={14}/> Listed by Broker · Brokerage Charges Disclosed
              </span>
            )}
            {property.verifiedBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-2.5 py-1 text-xs font-bold text-white">
                <span className="size-1.5 rounded-full bg-emerald-400"/> Verified
              </span>
            )}
          </div>
          <h1 className="max-w-[850px] text-balance text-[clamp(2rem,4.5vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-.04em]">{property.title}</h1>
          <p className="mt-3 flex items-center gap-2 font-semibold text-[var(--muted)]"><Icon name="map" size={18}/>{property.location || `${property.locality}, Pune`}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 max-[760px]:justify-start">
          {canManagePhotos && <PropertyPhotoManager propertyId={id} currentCount={images.length} onUpdated={(nextImages) => setLiveProperty((current) => current ? { ...current, images: nextImages } : current)}/>}
          <button type="button" onClick={share} className={secondaryButton}><Icon name="share" size={17}/>{shareStatus || "Share"}</button>
          <button type="button" aria-pressed={saved} onClick={() => setSaved((value) => !value)} className={secondaryButton}><Icon name="heart" size={17}/>{saved ? "Saved" : "Save"}</button>
        </div>
      </header>

      <section className={`relative mt-6 grid overflow-hidden rounded-2xl bg-[var(--soft)] ${mosaic.length === 1 ? "h-[320px] sm:h-[520px]" : mosaic.length === 2 ? "h-[340px] grid-cols-2 gap-1.5 sm:h-[520px]" : "h-[390px] grid-cols-2 grid-rows-[2fr_1fr] gap-1.5 sm:h-[520px] sm:grid-cols-4 sm:grid-rows-2"}`} aria-label="Property photos">
        {mosaic.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${property.title} view ${index + 1}`} className={`${mosaic.length > 2 && index === 0 ? "col-span-2 h-full w-full object-cover sm:row-span-2" : "h-full w-full object-cover"} ${mosaic.length > 3 && index > 2 ? "hidden sm:block" : ""}`}/>)}
        {images.length > 1 && <button type="button" onClick={() => setGalleryOpen(true)} className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#222] bg-white px-4 text-sm font-extrabold shadow-sm hover:bg-[#f7f7f7]"><Icon name="grid" size={17}/> Show all {images.length} photos</button>}
      </section>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-14">
        <div>
          {/* Transparency Callout Banner */}
          {isOwner ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-950">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-emerald-200 text-emerald-800">
                  <Icon name="shield" size={18}/>
                </span>
                <div>
                  <h3 className="m-0 text-base font-black text-emerald-900">Zero Brokerage Guarantee</h3>
                  <p className="m-0 text-xs font-semibold text-emerald-700">100% Direct Owner Listing · No Broker Middlemen</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-emerald-800">
                You are connecting directly with the property owner. Save up to ₹40,000 in brokerage fees. Low-friction unlock gives you immediate direct phone and WhatsApp contact.
              </p>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/80 p-5 text-amber-950">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-amber-200 text-amber-900">
                  <Icon name="info" size={18}/>
                </span>
                <div>
                  <h3 className="m-0 text-base font-black text-amber-900">Brokerage Advisory Notice</h3>
                  <p className="m-0 text-xs font-semibold text-amber-800">Independent Real Estate Broker Listing</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-amber-900">
                This home is listed by an independent broker. Standard broker commission (15 to 30 days rent) will be charged by the agent upon agreement finalization. RentKaro Pune maintains full transparency on all charges.
              </p>
            </div>
          )}

          <section className="border-b border-[var(--line)] pb-7">
            <h2 className="text-2xl font-extrabold">{property.bhk} {property.propertyType || "home"} hosted by {contactName}</h2>
            <p className="mt-2 text-[var(--muted)]">{property.area > 0 ? `${property.area.toLocaleString("en-IN")} sq ft · ` : ""}{property.furnishing} · Available {property.available}</p>
          </section>
          
          <section className="border-b border-[var(--line)] py-8">
            <h2 className="text-2xl font-extrabold">About this home</h2>
            <p className="mt-4 max-w-[70ch] leading-7 text-[var(--ink-2)]">{property.description}</p>
          </section>
          
          <section className="border-b border-[var(--line)] py-8">
            <h2 className="text-2xl font-extrabold">What this place offers</h2>
            <ul className="mt-5 grid list-none gap-4 p-0 sm:grid-cols-2">
              {amenities.map((amenity) => (
                <li className="flex items-center gap-3 font-semibold" key={amenity}>
                  <Icon className="text-[var(--orange-dark)]" name="check" size={18}/>{amenity}
                </li>
              ))}
            </ul>
          </section>

          {/* Business & Commercial transparency model section */}
          <section className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-6">
            <span className="text-xs font-black uppercase tracking-wider text-[#d9470e]">India's Transparent Property Marketplace</span>
            <h3 className="mt-1 text-lg font-black text-stone-900">Pay for access, not expensive brokerage</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              RentKaro Pune bridges renters and properties directly. Owners list for free with zero brokerage. Brokers list with full disclosure. Everyone knows exactly what they are paying for without surprises.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <Link href="/plans" className="text-xs font-bold text-[#ff5a1f] hover:underline">
                Explore Owner Monthly Lead Plans & Verified Badges →
              </Link>
            </div>
          </section>
        </div>

        {/* Aside Contact & Unlock Card */}
        <aside className="h-fit rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_18px_55px_rgb(0_0_0/10%)] lg:sticky lg:top-24" aria-label="Property enquiry">
          <div className="flex items-baseline justify-between">
            <div>
              <strong className="text-3xl tabular-nums">₹{property.rent.toLocaleString("en-IN")}</strong>
              <span className="font-semibold text-[var(--muted)]"> / month</span>
            </div>
            <span className={`rounded-md px-2.5 py-1 text-xs font-black ${isOwner ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              {isOwner ? "0% Brokerage" : "Broker Listing"}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">Deposit ₹{property.deposit.toLocaleString("en-IN")} · {property.status}</p>

          {/* Contact Details (Masked vs Unlocked) */}
          <div className="my-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {isOwner ? "Owner Contact" : "Broker Contact"}
              </span>
              {isUnlocked ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
                  <Icon name="check" size={12}/> Unlocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                  <Icon name="lock" size={12}/> Locked
                </span>
              )}
            </div>

            {isUnlocked ? (
              <div className="mt-3">
                <p className="font-black text-stone-900 text-base">{contactName}</p>
                <p className="font-black text-lg text-[#ff5a1f] tracking-wide mt-0.5">+91 {contactPhone}</p>
                <p className="mt-1 text-xs text-stone-500">
                  <strong>Full Address:</strong> {unlockedDetails?.address || property.address || property.location}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a href={`tel:+91${contactPhone}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-3 text-xs font-bold text-white hover:bg-black">
                    <Icon name="phone" size={14}/> Call
                  </a>
                  <a href={directWhatsAppHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#168a45] px-3 text-xs font-bold text-white hover:bg-[#10763a]">
                    <Icon name="phone" size={14}/> WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <p className="font-bold text-stone-800 text-sm">{contactName}</p>
                <p className="font-mono font-bold text-base text-stone-500 tracking-wider">+91 98••••••{contactPhone.slice(-2)}</p>
                <p className="mt-1 text-[11px] text-stone-400">Exact address & direct number masked for privacy.</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!isOwner) setBrokerWarningOpen(true);
                    else setUnlockModalOpen(true);
                  }}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-4 text-xs font-black text-white hover:bg-[#d9470e] active:scale-98 shadow-md"
                >
                  <Icon name="lock" size={14}/> Unlock Contact (₹{unlockFee})
                </button>
              </div>
            )}
          </div>

          <div className="my-5 border-y border-[var(--line)] py-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--orange-dark)]">Concierge Option</span>
            <h3 className="mt-1 text-base font-extrabold">Need Help from RentKaro Desk?</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Our Pune team can answer general society questions or book a visit for you.</p>
          </div>

          <div className="grid gap-2.5">
            <a className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#168a45] px-5 font-bold text-white transition-all hover:bg-[#10763a] active:scale-[.98]" href={whatsappHref} target="_blank" rel="noreferrer">
              <Icon name="phone" size={18}/> Chat with RentKaro Desk
            </a>
            <button className={`${secondaryButton} w-full`} type="button" onClick={() => setCallbackOpen(true)}>
              <Icon name="phone" size={18}/> Request a Callback
            </button>
          </div>
          <p className="mb-0 mt-3 text-center text-xs text-[var(--muted)]">Desk Support: +91 70453 08514</p>
        </aside>
      </div>
    </main>

    {galleryOpen && (
      <div className="fixed inset-0 z-[var(--z-modal)] overflow-y-auto bg-white p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="All property photos">
        <div className="mx-auto max-w-[1180px]">
          <div className="sticky top-0 z-10 mb-5 flex items-center justify-between bg-white/95 py-3 backdrop-blur">
            <h2 className="text-2xl font-extrabold">{property.title} · {images.length} photos</h2>
            <button type="button" onClick={() => setGalleryOpen(false)} className="grid size-12 place-items-center rounded-full border border-[var(--line)] bg-white" aria-label="Close gallery">
              <Icon name="close"/>
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((image, index) => (
              <img className="w-full rounded-xl object-cover" src={image} alt={`${property.title} photo ${index + 1}`} key={`${image}-gallery`}/>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Mobile sticky action bar */}
    <div className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-[var(--line)] bg-white px-4 py-2.5 shadow-[0_-10px_30px_rgb(0_0_0/10%)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-stone-500">Rent</span>
          <p className="m-0 font-black text-lg tabular-nums">₹{property.rent.toLocaleString("en-IN")}<span className="text-xs font-normal text-stone-400">/mo</span></p>
        </div>
        <div className="flex items-center gap-2">
          {!isUnlocked ? (
            <button
              type="button"
              onClick={() => {
                if (!isOwner) setBrokerWarningOpen(true);
                else setUnlockModalOpen(true);
              }}
              className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-[#ff5a1f] px-4 text-xs font-black text-white active:scale-95"
            >
              <Icon name="lock" size={14}/> Unlock (₹{unlockFee})
            </button>
          ) : (
            <a
              href={`tel:+91${contactPhone}`}
              className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 text-xs font-bold text-white active:scale-95"
            >
              <Icon name="phone" size={14}/> Call Contact
            </a>
          )}
          <button className={`${secondaryButton} min-h-12 px-3 text-xs`} type="button" onClick={() => setCallbackOpen(true)}>
            Callback
          </button>
        </div>
      </div>
    </div>

    {/* Modals */}
    <CallRequestModal open={callbackOpen} onClose={() => setCallbackOpen(false)} property={property}/>
    
    <BrokerWarningModal
      open={brokerWarningOpen}
      onClose={() => setBrokerWarningOpen(false)}
      property={property}
      onProceed={() => setUnlockModalOpen(true)}
    />

    <UnlockContactModal
      open={unlockModalOpen}
      onClose={() => setUnlockModalOpen(false)}
      property={property}
      onUnlocked={(details) => setUnlockedDetails(details)}
    />

    <PlanCheckoutModal
      open={planModalOpen}
      onClose={() => setPlanModalOpen(false)}
      plan={selectedPlan}
      propertyId={id}
      onPurchased={(purchased) => {
        setLiveProperty((curr) => {
          if (!curr) return curr;
          const next = { ...curr };
          if (purchased?.id === "verified_badge") {
            next.verifiedBadge = true;
          }
          if (purchased?.id === "ad_extension_30") {
            next.isAdActive = true;
            next.daysRemaining = 30;
          }
          return next;
        });
      }}
    />
  </>;
}