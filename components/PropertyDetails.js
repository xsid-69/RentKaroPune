"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CallRequestModal from "./CallRequestModal";
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

  const localProperty = state.properties.find((item) => item.id === id);
  const property = liveProperty ? toMarketplaceProperty(liveProperty) : localProperty;
  const canManagePhotos = user?.admin === 1 || user?.role === "consultant";

  if (loading && !property) return <main className="site-container min-h-[70dvh] animate-pulse py-12" aria-label="Loading property"><div className="h-10 w-2/3 rounded bg-[var(--soft)]"/><div className="mt-6 h-[420px] rounded-2xl bg-[var(--soft)]"/></main>;
  if (!property) return <section className="grid min-h-[70dvh] place-content-center justify-items-center gap-4 px-5 text-center"><strong className="text-6xl text-[var(--orange)]">404</strong><h1 className="text-3xl font-bold">This property has moved.</h1><p className="text-[var(--muted)]">{loadError || "It may have been rented or removed from verification."}</p><Link className={primaryButton} href="/">Browse available homes</Link></section>;

  const images = (property.images || []).filter(Boolean).slice(0, 8);
  const mosaic = images.slice(0, 5);
  const amenities = property.amenities || [];
  const whatsappHref = whatsappUrl(`Hi RentKaro Pune, I am interested in ${property.title} (${property.id}). Please share more details.`);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: property.title, text: `${property.title} in ${property.locality}, Pune`, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setShareStatus(navigator.share ? "Shared" : "Link copied");
      window.setTimeout(() => setShareStatus(""), 2500);
    } catch (error) { if (error?.name !== "AbortError") setShareStatus("Could not share"); }
  };

  return <>
    <main className="site-container pb-36 pt-4 text-[var(--ink)] lg:pb-20">
      {loadError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">{loadError} Showing the last available copy.</p>}
      <header className="mt-4 flex items-start justify-between gap-5 max-[760px]:flex-col">
        <div><h1 className="max-w-[850px] text-balance text-[clamp(2rem,4.5vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-.04em]">{property.title}</h1><p className="mt-3 flex items-center gap-2 font-semibold text-[var(--muted)]"><Icon name="map" size={18}/>{property.location || `${property.locality}, Pune`}</p></div>
        <div className="flex flex-wrap items-center justify-end gap-2 max-[760px]:justify-start">{canManagePhotos && <PropertyPhotoManager propertyId={id} currentCount={images.length} onUpdated={(nextImages) => setLiveProperty((current) => current ? { ...current, images: nextImages } : current)}/>}<button type="button" onClick={share} className={secondaryButton}><Icon name="share" size={17}/>{shareStatus || "Share"}</button><button type="button" aria-pressed={saved} onClick={() => setSaved((value) => !value)} className={secondaryButton}><Icon name="heart" size={17}/>{saved ? "Saved" : "Save"}</button></div>
      </header>
      <section className={`relative mt-6 grid overflow-hidden rounded-2xl bg-[var(--soft)] ${mosaic.length === 1 ? "h-[320px] sm:h-[520px]" : mosaic.length === 2 ? "h-[340px] grid-cols-2 gap-1.5 sm:h-[520px]" : "h-[390px] grid-cols-2 grid-rows-[2fr_1fr] gap-1.5 sm:h-[520px] sm:grid-cols-4 sm:grid-rows-2"}`} aria-label="Property photos">
        {mosaic.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${property.title} view ${index + 1}`} className={`${mosaic.length > 2 && index === 0 ? "col-span-2 h-full w-full object-cover sm:row-span-2" : "h-full w-full object-cover"} ${mosaic.length > 3 && index > 2 ? "hidden sm:block" : ""}`}/>)}
        {images.length > 1 && <button type="button" onClick={() => setGalleryOpen(true)} className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#222] bg-white px-4 text-sm font-extrabold shadow-sm hover:bg-[#f7f7f7]"><Icon name="grid" size={17}/> Show all {images.length} photos</button>}
      </section>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-16">
        <div>
          <section className="border-b border-[var(--line)] pb-7"><h2 className="text-2xl font-extrabold">{property.bhk} home hosted by a verified owner</h2><p className="mt-2 text-[var(--muted)]">{property.area > 0 ? `${property.area.toLocaleString("en-IN")} sq ft · ` : ""}{property.furnishing} · Available {property.available}</p></section>
          <section className="border-b border-[var(--line)] py-8"><h2 className="text-2xl font-extrabold">About this home</h2><p className="mt-4 max-w-[70ch] leading-7 text-[var(--ink-2)]">{property.description}</p></section>
          <section className="border-b border-[var(--line)] py-8"><h2 className="text-2xl font-extrabold">What this place offers</h2><ul className="mt-5 grid list-none gap-4 p-0 sm:grid-cols-2">{amenities.map((amenity) => <li className="flex items-center gap-3 font-semibold" key={amenity}><Icon className="text-[var(--orange-dark)]" name="check" size={18}/>{amenity}</li>)}</ul></section>
          <section className="mt-8 border-l-4 border-[var(--orange)] bg-[var(--orange-soft)] p-5"><h2 className="text-lg font-extrabold">Talk directly to our Pune team</h2><p className="mt-2 leading-6 text-[var(--ink-2)]">Browsing and enquiries are free. Open WhatsApp for a quick response or request a callback at a convenient time. Signing in is optional.</p></section>
        </div>
        <aside className="h-fit rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_18px_55px_rgb(0_0_0/10%)] lg:sticky lg:top-24" aria-label="Property enquiry">
          <strong className="text-3xl tabular-nums">₹{property.rent.toLocaleString("en-IN")}</strong><span className="font-semibold text-[var(--muted)]"> / month</span><p className="mt-2 text-sm text-[var(--muted)]">Deposit ₹{property.deposit.toLocaleString("en-IN")} · {property.status}</p>
          <div className="my-5 border-y border-[var(--line)] py-5"><span className="text-sm font-bold text-[var(--orange-dark)]">Free enquiry</span><h2 className="mt-2 text-xl font-extrabold">Interested in this home?</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Contact us directly without creating an account.</p></div>
          <div className="grid gap-3"><a className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#168a45] px-5 font-bold text-white transition-[background-color,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#10763a] active:scale-[.98]" href={whatsappHref} target="_blank" rel="noreferrer"><Icon name="phone" size={18}/> WhatsApp this property</a><button className={`${secondaryButton} w-full`} type="button" onClick={() => setCallbackOpen(true)}><Icon name="phone" size={18}/> Request a call</button></div>
          <p className="mb-0 mt-3 text-center text-xs text-[var(--muted)]">WhatsApp: +91 70453 08514</p>
        </aside>
      </div>
    </main>
    {galleryOpen && <div className="fixed inset-0 z-[var(--z-modal)] overflow-y-auto bg-white p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="All property photos"><div className="mx-auto max-w-[1180px]"><div className="sticky top-0 z-10 mb-5 flex items-center justify-between bg-white/95 py-3 backdrop-blur"><h2 className="text-2xl font-extrabold">{property.title} · {images.length} photos</h2><button type="button" onClick={() => setGalleryOpen(false)} className="grid size-12 place-items-center rounded-full border border-[var(--line)] bg-white" aria-label="Close gallery"><Icon name="close"/></button></div><div className="grid gap-3 sm:grid-cols-2">{images.map((image, index) => <img className="w-full rounded-xl object-cover" src={image} alt={`${property.title} photo ${index + 1}`} key={`${image}-gallery`}/>)}</div></div></div>}
    <div className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-[var(--line)] bg-white px-[calc(env(safe-area-inset-left)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pr-[calc(env(safe-area-inset-right)+0.75rem)] pt-2 shadow-[0_-10px_30px_rgb(0_0_0/10%)] lg:hidden"><div className="mx-auto grid max-w-lg grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><SwipeToWhatsApp compact message={`Hi RentKaro Pune, I am interested in ${property.title} (${property.id}). Please share more details.`} label="Swipe WhatsApp" className="[&>div+div]:hidden"/><button className={`${secondaryButton} min-h-14 whitespace-nowrap px-3.5 text-sm`} type="button" onClick={() => setCallbackOpen(true)}>Request a call</button></div></div>
    <CallRequestModal open={callbackOpen} onClose={() => setCallbackOpen(false)} property={property}/>
  </>;
}