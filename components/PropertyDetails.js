"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "./Icon";
import PaymentModal from "./PaymentModal";
import { useMarketplace } from "@/lib/marketplace-context";

export default function PropertyDetails() {
  const { id } = useParams();
  const { state, broker, unlockProperty, bookVisit } = useMarketplace();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [visitDate, setVisitDate] = useState("2026-07-24T11:30");
  const property = state.properties.find((item) => item.id === id);
  const unlocked = state.unlocks.some((item) => item.propertyId === id);
  const lead = state.leads.find((item) => item.propertyId === id);

  if (!property) return <section className="not-found"><span>404</span><h1>This property has moved.</h1><p>It may have been rented or removed from verification.</p><Link className="button primary" href="/">Browse available homes</Link></section>;

  const token = Math.round(property.rent * 0.15);
  const formattedVisit = visitDate ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(visitDate)) : "";
  const canUnlock = property.approved && property.status === "Available";
  const statusClass = property.status.toLowerCase().replaceAll(" ", "-");

  return <>
    <section className="detail-wrap">
      <div className="breadcrumb"><Link href="/">Discover</Link><span>/</span><span>{property.locality}</span><span>/</span><strong>{property.id.toUpperCase()}</strong></div>
      <div className="detail-title">
        <div><span className={`status ${statusClass}`}>{property.status}</span><h1>{property.title}</h1><p><Icon name="map" size={17}/>{property.locality}, Pune · Owner verified</p></div>
        <div className="detail-price"><strong className="money">₹{property.rent.toLocaleString("en-IN")}</strong><span>monthly rent</span></div>
      </div>
      <div className="gallery">
        <div className="gallery-main"><img src={property.images[0]} alt={`${property.title} main living space`}/></div>
        {(property.images.slice(1).length ? property.images.slice(1) : [property.images[0], property.images[0]]).map((image, index) => <div className="gallery-side" key={`${image}-${index}`}><img src={image} alt={`${property.title} view ${index + 2}`}/>{index === 1 && <span>Free to browse · no login</span>}</div>)}
      </div>

      <div className="detail-layout">
        <div className="detail-content">
          <div className="spec-row"><div><strong>{property.bhk}</strong><span>Configuration</span></div><div><strong>{property.area.toLocaleString("en-IN")} sq ft</strong><span>Carpet area</span></div><div><strong>{property.furnishing}</strong><span>Furnishing</span></div><div><strong>₹{property.deposit.toLocaleString("en-IN")}</strong><span>Deposit</span></div></div>
          <section className="detail-section"><h2>Designed for an easier move.</h2><p>{property.description}</p><p>Available: <strong>{property.available}</strong>. The exact address is shared after contact unlock to protect owner privacy.</p></section>
          <section className="detail-section"><h2>Amenities</h2><div className="amenity-list">{property.amenities.map((amenity) => <span key={amenity}><Icon name="check" size={17}/>{amenity}</span>)}</div></section>
          <section className="policy-note"><Icon name="info"/><div><strong>Transparent hold policy</strong><p>The optional token is 15% of monthly rent (₹{token.toLocaleString("en-IN")}). If you cancel before closure, 75% is refundable. Full terms are shown before payment.</p></div></section>
        </div>

        <aside className="unlock-panel" aria-label="Contact and visit actions">
          {!unlocked ? <>
            <span className="unlock-kicker"><Icon name="lock" size={17}/> Private contact protection</span>
            <h2>Meet this home in person.</h2>
            <p>Unlock the verified broker’s number and book your first visit for one clear fee.</p>
            <div className="unlock-price"><strong className="money">₹99</strong><span>one-time · first visit included</span></div>
            <ul className="included-list"><li><Icon name="check" size={17}/> Verified broker contact</li><li><Icon name="check" size={17}/> First site visit included</li><li><Icon name="check" size={17}/> No brokerage until closure</li></ul>
            {canUnlock ? <button className="button primary full" onClick={() => setPaymentOpen(true)}>Unlock contact & visit <Icon name="arrow"/></button> : <div className="availability-message"><Icon name="info"/><span>This listing is not accepting new unlocks while its status is <strong>{property.status}</strong>.</span></div>}
            <small className="action-footnote">Additional visits to the same property cost ₹50 each.</small>
          </> : <>
            <span className="status success">Contact unlocked</span>
            <h2>{broker.name}</h2>
            <p className="broker-zone">Verified partner · {broker.zone} · {broker.rating}/5 rating</p>
            <a className="broker-phone" href={`tel:${broker.phone.replaceAll(" ", "")}`}><Icon name="phone"/><span><small>Broker contact</small><strong>{broker.phone}</strong></span></a>
            {lead?.status === "Unlocked" ? <div className="visit-booking">
              <label className="field" htmlFor="visit-date"><span>Choose visit date and time</span><input id="visit-date" type="datetime-local" min="2026-07-20T09:00" value={visitDate} onChange={(event) => setVisitDate(event.target.value)}/></label>
              <button className="button primary full" disabled={!visitDate} onClick={() => bookVisit(id, formattedVisit)}>Confirm included visit <Icon name="calendar"/></button>
            </div> : <div className="visit-confirmation"><Icon name="calendar"/><div><strong>{lead?.status || "Assigned"}</strong><span>{lead?.visitDate && lead.visitDate !== "Not booked" ? lead.visitDate : "Manage the next step in your dashboard."}</span></div></div>}
            <Link className="button secondary full" href="/dashboard?role=client">Open client workspace <Icon name="arrow"/></Link>
          </>}
        </aside>
      </div>
    </section>
    <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} amount={99} title="Unlock verified contact" note={`Includes ${broker.name}’s contact and your first visit to ${property.title}.`} onSuccess={() => unlockProperty(id)}/>
  </>;
}
