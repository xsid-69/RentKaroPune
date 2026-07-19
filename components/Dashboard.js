"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import PaymentModal from "./PaymentModal";
import { useMarketplace } from "@/lib/marketplace-context";

const ROLES = [
  { id: "client", label: "Client", icon: "user" },
  { id: "owner", label: "Owner", icon: "home" },
  { id: "broker", label: "Broker", icon: "building" },
  { id: "admin", label: "Admin", icon: "shield" },
];

const FORM_STEPS = ["Property basics", "Details and documents", "Review and pay"];
const EMPTY_FORM = {
  title: "",
  locality: "Koregaon Park",
  type: "Flat",
  bhk: "2 BHK",
  rent: "",
  area: "",
  furnishing: "Semi-furnished",
  description: "",
  amenities: "Lift, security",
  ownerName: "",
  ownershipProof: false,
  identityProof: false,
  declaration: false,
};

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const statusClass = (status = "") => status.toLowerCase().replace(/\s+/g, "-");
const typeKey = (type = "") => {
  const value = type.toLowerCase();
  if (value.includes("listing")) return "listing";
  if (value.includes("unlock")) return "unlock";
  if (value.includes("token")) return "token";
  if (value.includes("brokerage")) return "brokerage";
  if (value.includes("refund")) return "refund";
  return "other";
};

function StatusChip({ status }) {
  return <span className={`status ${statusClass(status)}`}>{status}</span>;
}

function EmptyState({ icon, title, copy, action }) {
  return <div className="empty-state dashboard-empty">
    <Icon name={icon} size={30}/>
    <h3>{title}</h3>
    <p>{copy}</p>
    {action}
  </div>;
}

function PropertySummary({ property }) {
  if (!property) return null;
  return <div className="dashboard-property-summary">
    <div>
      <Link href={`/properties/${property.id}`}>{property.title}</Link>
      <span>{property.locality} · {property.bhk}</span>
    </div>
    <strong className="money">{money(property.rent)}<small>/month</small></strong>
  </div>;
}

function DashboardSkeleton() {
  return <main className="dashboard-page" aria-busy="true" aria-label="Loading marketplace dashboard">
    <div className="dashboard-shell skeleton-shell">
      <div className="skeleton-line skeleton-title"/>
      <div className="skeleton-line skeleton-copy"/>
      <div className="skeleton-tabs">{ROLES.map((role) => <div className="skeleton-line skeleton-tab" key={role.id}/>)}</div>
      <div className="skeleton-grid"><div className="skeleton-panel"/><div className="skeleton-panel"/><div className="skeleton-panel"/></div>
    </div>
  </main>;
}

function ClientView({ state, propertiesById, tierFor, onToken, cancelToken }) {
  const leads = state.leads || [];
  const nextBooking = (state.closedDeals || 0) + 1;
  const currentTier = tierFor(nextBooking);

  return <div className="dashboard-view client-view">
    <section className="dashboard-kpi-band" aria-labelledby="client-loyalty-title">
      <div className="kpi-feature">
        <span className="kpi-icon"><Icon name="wallet"/></span>
        <div><span>Next rental loyalty saving</span><strong id="client-loyalty-title">{currentTier}% off brokerage</strong><small>{nextBooking === 1 ? "First rental" : nextBooking === 2 ? "Second rental" : "Third rental onward"}</small></div>
      </div>
      <div className="loyalty-mini" aria-label="Loyalty discount schedule">
        {[20, 40, 60].map((discount, index) => <div className={nextBooking === index + 1 || (nextBooking >= 3 && index === 2) ? "active" : ""} key={discount}><strong>{discount}%</strong><span>{index === 0 ? "1st" : index === 1 ? "2nd" : "3rd+"}</span></div>)}
      </div>
    </section>

    <section className="dashboard-section" aria-labelledby="client-leads-title">
      <div className="dashboard-section-head"><div><h2 id="client-leads-title">Unlocked homes and visits</h2><p>Track every verified Pune home from broker assignment to token hold.</p></div><Link className="button secondary small" href="/#homes">Browse homes <Icon name="arrow" size={16}/></Link></div>
      {leads.length ? <div className="record-list">{leads.map((lead) => {
        const property = propertiesById.get(lead.propertyId);
        const tokenAmount = Math.round((property?.rent || 0) * 0.15);
        return <article className="record-card lead-card" key={lead.id}>
          <div className="record-card-head"><PropertySummary property={property}/><StatusChip status={lead.status}/></div>
          <dl className="record-facts">
            <div><dt>Assigned broker</dt><dd>{lead.broker?.name || "Assignment pending"}</dd></div>
            <div><dt>Visit status</dt><dd>{lead.visitDate || "Not booked"}</dd></div>
            <div><dt>Token hold</dt><dd>{lead.tokenPaid ? money(lead.tokenPaid) : `${money(tokenAmount)} (15%)`}</dd></div>
          </dl>
          <div className="record-actions">
            {lead.status === "Visited" && <button className="button primary small" type="button" onClick={() => onToken(property)}><Icon name="wallet" size={16}/> Pay 15% token</button>}
            {lead.status === "Token paid" && <details className="cancel-disclosure"><summary>Cancel token</summary><div><p>You will receive a 75% refund of {money(lead.tokenPaid)}. The remaining 25% covers visit and processing costs.</p><button className="button secondary small" type="button" onClick={() => cancelToken(lead.propertyId)}>Confirm cancellation</button></div></details>}
            {lead.status === "Scheduled" && <p className="inline-note"><Icon name="calendar" size={16}/> Token payment unlocks after the broker marks this visit complete.</p>}
            {lead.status === "Unlocked" && <p className="inline-note"><Icon name="info" size={16}/> Contact your assigned broker to schedule a visit.</p>}
            {lead.status === "Closed" && <p className="inline-note success-note"><Icon name="check" size={16}/> Rental completed with {lead.discount}% loyalty savings.</p>}
          </div>
        </article>;
      })}</div> : <EmptyState icon="home" title="No homes unlocked yet" copy="Browse verified Pune listings and unlock a broker-assisted visit when a home fits." action={<Link className="button primary" href="/#homes">Find a Pune home</Link>}/>} 
    </section>
  </div>;
}
function OwnerListingForm({ form, setForm, step, setStep, error, setError, onPay }) {
  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };
  const validate = () => {
    if (step === 0 && (!form.title.trim() || !form.locality.trim())) return "Add a property title and Pune locality to continue.";
    if (step === 1 && (!form.rent || !form.area || !form.description.trim() || !form.ownerName.trim())) return "Complete the rent, area, description and owner name.";
    if (step === 1 && (!form.ownershipProof || !form.identityProof || !form.declaration)) return "Confirm all three document declarations before review.";
    return "";
  };
  const next = () => {
    const message = validate();
    if (message) return setError(message);
    setStep((current) => Math.min(current + 1, 2));
  };

  return <section className="dashboard-section owner-form-section" aria-labelledby="owner-form-title">
    <div className="dashboard-section-head"><div><h2 id="owner-form-title">List a Pune property</h2><p>Pay ₹100 after review. Admin verification is required before the listing goes live.</p></div></div>
    <ol className="form-stepper" aria-label="Listing progress">{FORM_STEPS.map((label, index) => <li className={index === step ? "active" : index < step ? "complete" : ""} aria-current={index === step ? "step" : undefined} key={label}><span>{index < step ? <Icon name="check" size={15}/> : index + 1}</span><strong>{label}</strong></li>)}</ol>
    <form className="listing-form" onSubmit={(event) => { event.preventDefault(); onPay(); }}>
      {error && <p className="form-error" role="alert"><Icon name="info" size={16}/>{error}</p>}
      {step === 0 && <fieldset className="form-panel"><legend>Property basics</legend><div className="form-grid">
        <label className="field field-wide"><span>Listing title</span><input name="title" value={form.title} onChange={update} autoComplete="off" required/><small>Use a clear title such as “Quiet 2BHK near Balewadi High Street”.</small></label>
        <label className="field"><span>Pune locality</span><select name="locality" value={form.locality} onChange={update}><option>Koregaon Park</option><option>Baner</option><option>Kothrud</option><option>Viman Nagar</option><option>Wakad</option><option>Hadapsar</option></select></label>
        <label className="field"><span>Property type</span><select name="type" value={form.type} onChange={update}><option>Flat</option><option>Villa</option><option>Bungalow</option><option>Independent house</option></select></label>
        <label className="field"><span>Configuration</span><select name="bhk" value={form.bhk} onChange={update}><option>1 BHK</option><option>2 BHK</option><option>3 BHK</option><option>4 BHK</option></select></label>
        <label className="field"><span>Furnishing</span><select name="furnishing" value={form.furnishing} onChange={update}><option>Unfurnished</option><option>Semi-furnished</option><option>Fully furnished</option></select></label>
      </div></fieldset>}
      {step === 1 && <fieldset className="form-panel"><legend>Details and document verification</legend><div className="form-grid">
        <label className="field"><span>Monthly rent</span><div className="input-prefix"><span>₹</span><input name="rent" value={form.rent} onChange={update} type="number" min="5000" step="500" inputMode="numeric" required/></div></label>
        <label className="field"><span>Carpet area</span><div className="input-suffix"><input name="area" value={form.area} onChange={update} type="number" min="150" inputMode="numeric" required/><span>sq ft</span></div></label>
        <label className="field field-wide"><span>Home description</span><textarea name="description" value={form.description} onChange={update} rows="4" required/><small>Mention access, light, building facilities and nearby landmarks.</small></label>
        <label className="field field-wide"><span>Amenities</span><input name="amenities" value={form.amenities} onChange={update}/><small>Separate amenities with commas.</small></label>
        <label className="field field-wide"><span>Legal owner name</span><input name="ownerName" value={form.ownerName} onChange={update} autoComplete="name" required/></label>
      </div><div className="document-checklist" aria-label="Document declarations">
        <label><input type="checkbox" name="ownershipProof" checked={form.ownershipProof} onChange={update}/><span><strong>Ownership proof is ready</strong><small>Registered sale deed, Index II or current property tax receipt.</small></span></label>
        <label><input type="checkbox" name="identityProof" checked={form.identityProof} onChange={update}/><span><strong>Owner identity is ready</strong><small>PAN and government-issued photo identification match the legal owner.</small></span></label>
        <label><input type="checkbox" name="declaration" checked={form.declaration} onChange={update}/><span><strong>Listing details are accurate</strong><small>I authorise RentkaroPune to verify these records before publishing.</small></span></label>
      </div></fieldset>}
      {step === 2 && <fieldset className="form-panel review-panel"><legend>Review and pay</legend>
        <div className="review-property"><div><span>Property</span><strong>{form.title}</strong><small>{form.bhk} {form.type.toLowerCase()} in {form.locality}</small></div><div><span>Asking rent</span><strong className="money">{money(form.rent)}</strong><small>{Number(form.area).toLocaleString("en-IN")} sq ft · {form.furnishing}</small></div></div>
        <p className="review-description">{form.description}</p>
        <div className="review-checks"><span><Icon name="check" size={16}/> Ownership records ready</span><span><Icon name="check" size={16}/> Identity proof ready</span><span><Icon name="shield" size={16}/> Admin review before publishing</span></div>
        <div className="fee-summary"><div><span>One-time listing and verification fee</span><small>Secure prototype payment</small></div><strong className="money">₹100</strong></div>
      </fieldset>}
      <div className="form-actions">{step > 0 && <button className="button secondary" type="button" onClick={() => { setStep((current) => current - 1); setError(""); }}>Back</button>}<span/>{step < 2 ? <button className="button primary" type="button" onClick={next}>Continue <Icon name="arrow" size={17}/></button> : <button className="button primary" type="submit"><Icon name="lock" size={16}/> Pay ₹100 and submit</button>}</div>
    </form>
  </section>;
}

function OwnerView({ state, propertiesById, formProps }) {
  const ownerProperties = (state.properties || []).filter((property) => property.owner === "You (Owner)");
  const ownerIds = new Set(ownerProperties.map((property) => property.id));
  const ownerVisits = (state.leads || []).filter((lead) => ownerIds.has(lead.propertyId) && lead.visitDate && lead.visitDate !== "Not booked");

  return <div className="dashboard-view owner-view">
    <OwnerListingForm {...formProps}/>
    <section className="dashboard-section" aria-labelledby="owner-inventory-title"><div className="dashboard-section-head"><div><h2 id="owner-inventory-title">Your listing inventory</h2><p>Review verification state, asking rent and live marketplace status.</p></div></div>
      {ownerProperties.length ? <div className="inventory-grid">{ownerProperties.map((property) => <article className="inventory-card" key={property.id}><div className="inventory-card-head"><span className="kpi-icon"><Icon name="home"/></span><StatusChip status={property.status}/></div><h3><Link href={`/properties/${property.id}`}>{property.title}</Link></h3><p>{property.locality} · {property.bhk} · {Number(property.area).toLocaleString("en-IN")} sq ft</p><div className="inventory-price"><strong className="money">{money(property.rent)}</strong><span>per month</span></div><small>{property.approved ? "Ownership documents verified" : "Awaiting admin document review"}</small></article>)}</div> : <EmptyState icon="building" title="No owner listings yet" copy="Complete the form above to send your first Pune property for verification."/>}
    </section>
    <section className="dashboard-section" aria-labelledby="owner-visits-title"><div className="dashboard-section-head"><div><h2 id="owner-visits-title">Tenant visit schedule</h2><p>Upcoming and completed visits for your verified inventory.</p></div></div>
      {ownerVisits.length ? <div className="schedule-list">{ownerVisits.map((lead) => <article className="schedule-row" key={lead.id}><span className="schedule-icon"><Icon name="calendar"/></span><div><strong>{propertiesById.get(lead.propertyId)?.title}</strong><span>{lead.visitDate}</span></div><div><span>{lead.broker?.name}</span><StatusChip status={lead.status}/></div></article>)}</div> : <EmptyState icon="calendar" title="No tenant visits scheduled" copy="Confirmed visit slots will appear here after clients coordinate with their assigned broker."/>}
    </section>
  </div>;
}
function BrokerView({ state, broker, propertiesById, onVisited, onClose }) {
  const assigned = (state.leads || []).filter((lead) => !lead.broker?.name || lead.broker.name === broker.name);
  const scheduled = assigned.filter((lead) => lead.visitDate && lead.visitDate !== "Not booked" && !["Closed", "Cancelled"].includes(lead.status));
  const earned = assigned.filter((lead) => lead.status === "Closed").reduce((sum, lead) => sum + Number(lead.brokerShare || 0), 0);
  const pendingPayout = assigned.filter((lead) => lead.status === "Token paid").reduce((sum, lead) => {
    const property = propertiesById.get(lead.propertyId);
    return sum + Math.round((property?.rent || 0) * 0.8 * 0.6);
  }, 0);

  return <div className="dashboard-view broker-view">
    <section className="broker-profile" aria-labelledby="broker-profile-title"><div className="broker-identity"><span className="broker-avatar" aria-hidden="true">AS</span><div><span>Assigned marketplace broker</span><h2 id="broker-profile-title">{broker.name}</h2><p>{broker.zone} · {broker.rating} verified rating</p></div></div><div className="broker-metrics"><div><span>Closed payouts</span><strong className="money">{money(earned)}</strong></div><div><span>Projected 60% share</span><strong className="money">{money(pendingPayout)}</strong></div></div></section>

    <section className="dashboard-section" aria-labelledby="broker-leads-title"><div className="dashboard-section-head"><div><h2 id="broker-leads-title">Assigned leads</h2><p>Move each client through a documented visit and closure workflow.</p></div><span className="count-badge">{assigned.length} active records</span></div>
      {assigned.length ? <div className="record-list">{assigned.map((lead) => {
        const property = propertiesById.get(lead.propertyId);
        const projectedBrokerage = Math.round((property?.rent || 0) * 0.8);
        return <article className="record-card broker-lead-card" key={lead.id}><div className="record-card-head"><PropertySummary property={property}/><StatusChip status={lead.status}/></div><dl className="record-facts"><div><dt>Client journey</dt><dd>{lead.status}</dd></div><div><dt>Visit</dt><dd>{lead.visitDate || "Not booked"}</dd></div><div><dt>Your payout</dt><dd>{lead.brokerShare ? money(lead.brokerShare) : `${money(Math.round(projectedBrokerage * 0.6))} projected`}</dd></div></dl><div className="record-actions">{lead.status === "Scheduled" && <button className="button primary small" type="button" onClick={() => onVisited(lead.propertyId)}><Icon name="check" size={16}/> Mark as visited</button>}{lead.status === "Token paid" && <button className="button primary small" type="button" onClick={() => onClose(property)}><Icon name="wallet" size={16}/> Close deal</button>}{lead.status === "Closed" && <p className="inline-note success-note"><Icon name="check" size={16}/> Paid {money(lead.brokerShare)}. Your share is 60% of collected brokerage.</p>}</div></article>;
      })}</div> : <EmptyState icon="user" title="No assigned leads" copy="New client unlocks in your Pune zone will be routed here."/>}
    </section>

    <section className="dashboard-section" aria-labelledby="visit-calendar-title"><div className="dashboard-section-head"><div><h2 id="visit-calendar-title">Visit calendar</h2><p>Broker-attended visits with the property and current handoff status.</p></div></div>
      {scheduled.length ? <div className="schedule-list">{scheduled.map((lead) => <article className="schedule-row" key={lead.id}><span className="schedule-icon"><Icon name="calendar"/></span><div><strong>{lead.visitDate}</strong><span>{propertiesById.get(lead.propertyId)?.title}</span></div><div><span>{propertiesById.get(lead.propertyId)?.locality}</span><StatusChip status={lead.status}/></div></article>)}</div> : <EmptyState icon="calendar" title="Calendar is clear" copy="Scheduled client visits will appear here with the property and handoff status."/>}
    </section>
  </div>;
}

function AdminView({ state, approveProperty }) {
  const properties = state.properties || [];
  const pending = properties.filter((property) => !property.approved);
  const ledger = state.ledger || [];
  const totalVolume = ledger.reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0);
  const refunds = ledger.filter((item) => typeKey(item.type) === "refund").reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0);
  const platformRevenue = ledger.reduce((sum, item) => sum + Number(item.platformShare || 0), 0);
  const brokerageMargin = ledger.filter((item) => typeKey(item.type) === "brokerage").reduce((sum, item) => sum + Number(item.platformShare || Math.round(Number(item.amount || 0) * 0.4)), 0);
  const chartData = [
    { key: "listing", label: "Listings" },
    { key: "unlock", label: "Unlocks" },
    { key: "token", label: "Tokens" },
    { key: "brokerage", label: "Brokerage" },
    { key: "refund", label: "Refunds" },
  ].map((category) => ({ ...category, value: ledger.filter((item) => typeKey(item.type) === category.key).reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0) }));
  const chartMax = Math.max(...chartData.map((item) => item.value), 1);

  return <div className="dashboard-view admin-view">
    <section className="dashboard-kpis" aria-label="Transaction key performance indicators">
      <article><span>Marketplace volume</span><strong className="money">{money(totalVolume)}</strong><small>{ledger.length} ledger entries</small></article>
      <article><span>Platform revenue</span><strong className="money">{money(platformRevenue)}</strong><small>Listing, unlock and margin</small></article>
      <article><span>40% brokerage margin</span><strong className="money">{money(brokerageMargin)}</strong><small>After 60% broker payouts</small></article>
      <article><span>Token refunds</span><strong className="money">{money(refunds)}</strong><small>75% returned on cancellation</small></article>
    </section>

    <section className="dashboard-section" aria-labelledby="approval-title"><div className="dashboard-section-head"><div><h2 id="approval-title">Pending ownership approvals</h2><p>Publish only after all ownership and identity evidence is checked.</p></div><span className="count-badge">{pending.length} pending</span></div>
      {pending.length ? <div className="approval-list">{pending.map((property) => <article className="approval-card" key={property.id}><div className="approval-main"><div><StatusChip status={property.status}/><h3>{property.title}</h3><p>{property.ownerName || property.owner} · {property.locality} · {property.bhk}</p></div><strong className="money">{money(property.rent)}<small>/month</small></strong></div><fieldset className="admin-document-list"><legend>Ownership-document checklist</legend><label><input type="checkbox" checked readOnly/><span>Registered ownership proof received</span></label><label><input type="checkbox" checked readOnly/><span>Owner identity matches the legal record</span></label><label><input type="checkbox" checked readOnly/><span>Rent, area and address reviewed</span></label><label><input type="checkbox" checked readOnly/><span>₹100 listing payment confirmed</span></label></fieldset><button className="button primary" type="button" onClick={() => approveProperty(property.id)}><Icon name="shield" size={17}/> Approve and publish</button></article>)}</div> : <EmptyState icon="check" title="Approval queue is clear" copy="New owner submissions will appear here for document verification."/>}
    </section>

    <section className="dashboard-section transaction-section" aria-labelledby="transactions-title"><div className="dashboard-section-head"><div><h2 id="transactions-title">Transaction performance</h2><p>Gross movement by transaction type, paired with the auditable ledger below.</p></div></div>
      <div className="transaction-layout"><figure className="transaction-chart" aria-labelledby="chart-caption"><figcaption id="chart-caption">Transaction volume by type</figcaption><div className="chart-plot">{chartData.map((item) => <div className="chart-column" key={item.key} aria-label={`${item.label}: ${money(item.value)}`}><strong>{money(item.value)}</strong><div className="chart-bar"><span className={`chart-bar-fill chart-${item.key}`} style={{ "--bar-height": `${Math.max(item.value ? 8 : 2, Math.round((item.value / chartMax) * 100))}%` }}/></div><span>{item.label}</span></div>)}</div></figure><aside className="margin-explainer"><Icon name="chart" size={28}/><h3>60/40 brokerage split</h3><p>Every closed rental sends 60% of collected brokerage to the assigned broker. RentkaroPune retains a transparent 40% platform margin.</p><dl><div><dt>Broker payout</dt><dd>60%</dd></div><div><dt>Platform margin</dt><dd>40%</dd></div></dl></aside></div>
      <div className="table-wrap"><table className="transaction-table"><caption>Marketplace transaction ledger</caption><thead><tr><th scope="col">Date</th><th scope="col">Type</th><th scope="col">Reference</th><th scope="col">Gross amount</th><th scope="col">Broker payout</th><th scope="col">Platform share</th></tr></thead><tbody>{ledger.length ? ledger.map((item) => <tr key={item.id}><td>{item.date}</td><td><span className={`ledger-type ledger-${typeKey(item.type)}`}>{item.type}</span></td><td>{item.reference}</td><td className="money">{typeKey(item.type) === "refund" ? "-" : ""}{money(Math.abs(item.amount))}</td><td className="money">{item.brokerShare ? money(item.brokerShare) : "Not applicable"}</td><td className="money">{item.platformShare ? money(item.platformShare) : typeKey(item.type) === "token" || typeKey(item.type) === "refund" ? "Held funds" : money(0)}</td></tr>) : <tr><td colSpan="6">No transactions have been recorded.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}
export default function Dashboard() {
  const { state, ready, broker, addProperty, approveProperty, markVisited, payToken, cancelToken, closeDeal, resetDemo, tierFor } = useMarketplace();
  const [role, setRole] = useState("client");
  const [roleReady, setRoleReady] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formStep, setFormStep] = useState(0);
  const [formError, setFormError] = useState("");
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const requestedRole = new URLSearchParams(window.location.search).get("role")?.toLowerCase();
    if (ROLES.some((item) => item.id === requestedRole)) setRole(requestedRole);
    setRoleReady(true);
  }, []);

  useEffect(() => {
    if (!roleReady) return;
    const url = new URL(window.location.href);
    url.searchParams.set("role", role);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [role, roleReady]);

  const propertiesById = useMemo(() => new Map((state.properties || []).map((property) => [property.id, property])), [state.properties]);
  const activeRole = ROLES.find((item) => item.id === role) || ROLES[0];

  if (!ready) return <DashboardSkeleton/>;

  const openListingPayment = () => {
    setPayment({
      kind: "listing",
      amount: 100,
      title: "Submit listing for verification",
      note: "This one-time fee covers listing intake and ownership-document review.",
      details: { ...form, amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean) },
    });
  };
  const openTokenPayment = (property) => {
    if (!property) return;
    setPayment({ kind: "token", propertyId: property.id, amount: Math.round(property.rent * 0.15), title: `Reserve ${property.title}`, note: "Pay a 15% token hold after your completed visit. Cancelling before closure returns 75%." });
  };
  const openClosePayment = (property) => {
    if (!property) return;
    const discount = tierFor((state.closedDeals || 0) + 1);
    const brokerage = Math.round(property.rent * (1 - discount / 100));
    const brokerShare = Math.round(brokerage * 0.6);
    setPayment({ kind: "closure", propertyId: property.id, amount: brokerage, title: "Confirm brokerage and close deal", note: `${discount}% loyalty discount applied. ${money(brokerShare)} is the broker's 60% payout and ${money(brokerage - brokerShare)} is the 40% platform margin.` });
  };
  const completePayment = () => {
    if (!payment) return;
    if (payment.kind === "listing") {
      addProperty(payment.details);
      setForm(EMPTY_FORM);
      setFormStep(0);
      setFormError("");
    }
    if (payment.kind === "token") payToken(payment.propertyId);
    if (payment.kind === "closure") closeDeal(payment.propertyId);
  };

  return <main className="dashboard-page">
    <div className="dashboard-shell">
      <header className="dashboard-hero">
        <div><span className="eyebrow"><Icon name={activeRole.icon} size={17}/> Live marketplace workspace</span><h1>{activeRole.label} dashboard</h1><p>One transparent view of verified homes, Pune visits, secure payments and marketplace settlements.</p></div>
        <button className="button secondary small reset-control" type="button" onClick={() => { if (window.confirm("Restore the original RentkaroPune demo data? Your local changes will be removed.")) resetDemo(); }}><Icon name="reset" size={16}/> Reset demo</button>
      </header>

      <nav className="role-tabs" aria-label="Dashboard role">
        <div role="tablist" aria-label="Switch marketplace role">{ROLES.map((item) => <button key={item.id} id={`role-tab-${item.id}`} className={role === item.id ? "active" : ""} type="button" role="tab" aria-selected={role === item.id} aria-controls={`role-panel-${item.id}`} tabIndex={role === item.id ? 0 : -1} onClick={() => setRole(item.id)}><Icon name={item.icon} size={18}/><span>{item.label}</span></button>)}</div>
      </nav>

      <div id={`role-panel-${role}`} role="tabpanel" aria-labelledby={`role-tab-${role}`} tabIndex="0">
        {role === "client" && <ClientView state={state} propertiesById={propertiesById} tierFor={tierFor} onToken={openTokenPayment} cancelToken={cancelToken}/>} 
        {role === "owner" && <OwnerView state={state} propertiesById={propertiesById} formProps={{ form, setForm, step: formStep, setStep: setFormStep, error: formError, setError: setFormError, onPay: openListingPayment }}/>} 
        {role === "broker" && <BrokerView state={state} broker={broker} propertiesById={propertiesById} onVisited={markVisited} onClose={openClosePayment}/>} 
        {role === "admin" && <AdminView state={state} approveProperty={approveProperty}/>} 
      </div>
    </div>

    <PaymentModal open={Boolean(payment)} onClose={() => setPayment(null)} amount={payment?.amount || 0} title={payment?.title || "Secure payment"} note={payment?.note || "Review and confirm this marketplace payment."} onSuccess={completePayment}/>
  </main>;
}
