"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import FirestoreApprovalQueue from "./FirestoreApprovalQueue";
import Loader from "./Loader";
import Reveal from "./Reveal";
import { useMarketplace } from "@/lib/marketplace-context";
import { useAuth } from "@/lib/auth-context";

const BUTTON_BASE = "min-h-11 inline-flex items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-[background-color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] focus-visible:ring-offset-2 active:scale-[.98] disabled:cursor-wait disabled:opacity-60";
const BUTTON_PRIMARY = `${BUTTON_BASE} border-[var(--orange)] bg-[var(--orange)] text-white hover:bg-[var(--orange-dark)]`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink-2)]`;
const SECTION_STYLES = "rounded-[var(--radius)] border border-[var(--line)] bg-white p-6 max-[640px]:p-4";
const SECTION_HEAD_STYLES = "mb-5 flex items-end justify-between gap-4 max-[640px]:items-start max-[430px]:flex-col";
const TIME_LABELS = { anytime: "Anytime", morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
const LANGUAGE_LABELS = { "no-preference": "No preference", english: "English", hindi: "Hindi", marathi: "Marathi" };

function EmptyState({ icon, title, copy }) {
  return <div className="grid min-h-[180px] place-items-center rounded-[14px] border border-dashed border-[var(--line)] p-8 text-center"><Icon name={icon} size={30} className="text-[var(--orange)]"/><div><h3 className="mb-1 mt-3">{title}</h3><p className="m-0 max-w-[46ch] text-[var(--muted)]">{copy}</p></div></div>;
}

function StatusChip({ status }) {
  const tone = status === "contacted" ? "bg-[var(--green-soft)] text-[oklch(0.4_0.13_155)]" : "bg-[var(--orange-soft)] text-[var(--orange-dark)]";
  return <span className={`inline-flex min-h-7 w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize ${tone}`}>{status}</span>;
}

function DashboardSkeleton() {
  return <main className="site-container min-h-[75dvh] py-12" aria-busy="true"><Loader label="Loading dashboard"/></main>;
}

function ConsultantApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/consultant/applications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load applications.");
      setApplications(data.applications || []);
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const approve = async (id) => {
    setBusyId(id); setError("");
    try {
      const response = await fetch("/api/consultant/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not approve this applicant.");
      setApplications((current) => current.filter((item) => item.id !== id));
    } catch (requestError) { setError(requestError.message); }
    finally { setBusyId(""); }
  };
  return <section className={SECTION_STYLES} aria-labelledby="consultant-applications-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="m-0 text-[26px] font-extrabold tracking-[-0.03em]" id="consultant-applications-title">Consultant access requests</h2><p className="mb-0 mt-2 text-[var(--muted)]">Approve members who requested consultant access.</p></div><span className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-bold">{applications.length} pending</span></div>{error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error}</p>}{loading ? <p className="text-[var(--muted)]">Loading applications…</p> : applications.length ? <div className="grid gap-3">{applications.map((applicant) => <article className="flex items-center justify-between gap-4 rounded-xl bg-[var(--soft)] p-4 transition-shadow hover:shadow-[var(--shadow-sm)] max-[520px]:flex-col max-[520px]:items-start" key={applicant.id}><div className="min-w-0"><strong className="block truncate">{applicant.name || applicant.email || applicant.id}</strong><span className="block truncate text-sm text-[var(--muted)]">{applicant.email || applicant.phone || applicant.id}</span></div><button className={`${BUTTON_PRIMARY} max-[520px]:w-full`} type="button" disabled={busyId === applicant.id} onClick={() => approve(applicant.id)}>{busyId === applicant.id ? "Approving…" : "Approve consultant"}</button></article>)}</div> : <EmptyState icon="user" title="No pending applications" copy="New consultant applications will appear here."/>}</section>;
}

function CallbackRequests() {
  const [requests, setRequests] = useState([]);
  const [uniqueVisitors, setUniqueVisitors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("new");
  const [copiedId, setCopiedId] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [callsResponse, visitorsResponse] = await Promise.all([fetch("/api/call-requests", { cache: "no-store" }), fetch("/api/visitors", { cache: "no-store" })]);
      const [callsData, visitorsData] = await Promise.all([callsResponse.json(), visitorsResponse.json()]);
      if (!callsResponse.ok) throw new Error(callsData.error || "Call requests could not be loaded.");
      if (!visitorsResponse.ok) throw new Error(visitorsData.error || "Visitor count could not be loaded.");
      setRequests(callsData.requests || []);
      setUniqueVisitors(Number(visitorsData.uniqueVisitors || 0));
      setError("");
    } catch (requestError) { if (!silent) setError(requestError.message || "Admin data could not be loaded."); }
    finally { if (!silent) setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  // Poll quietly so new enquiries surface within seconds without a manual refresh.
  useEffect(() => {
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") load(true); }, 15000);
    const onVisible = () => { if (document.visibilityState === "visible") load(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  // One-way transition with optimistic UI: the row jumps to "contacted" instantly
  // and only reverts if the server rejects the change.
  const markContacted = async (id) => {
    setBusyId(id); setError("");
    const previous = requests;
    setRequests((current) => current.map((item) => item.id === id ? { ...item, status: "contacted" } : item));
    try {
      const response = await fetch("/api/call-requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "contacted" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request could not be updated.");
    } catch (requestError) { setRequests(previous); setError(requestError.message); }
    finally { setBusyId(""); }
  };

  const copyPhone = async (id, phone) => {
    try { await navigator.clipboard.writeText(`+91${phone}`); setCopiedId(id); window.setTimeout(() => setCopiedId((current) => current === id ? "" : current), 1800); }
    catch { setError("Could not copy the number. Copy it manually."); }
  };

  const newRequests = requests.filter((item) => item.status === "new").length;
  const contactedRequests = requests.filter((item) => item.status === "contacted").length;
  const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Recently";
  const visible = filter === "all" ? requests : requests.filter((item) => item.status === filter);

  const kpis = [
    ["Unique visitors", loading ? "…" : (uniqueVisitors ?? 0).toLocaleString("en-IN"), "One count per browser", "chart"],
    ["Total requests", loading ? "…" : requests.length.toLocaleString("en-IN"), "Latest 100 enquiries", "phone"],
    ["Waiting for call", loading ? "…" : newRequests.toLocaleString("en-IN"), "New, not yet contacted", "info"],
    ["Contacted", loading ? "…" : contactedRequests.toLocaleString("en-IN"), "Already followed up", "check"],
  ];

  return <div className="grid gap-5 max-[640px]:gap-4">
    <section className="grid grid-cols-2 gap-3 max-[400px]:grid-cols-1 lg:grid-cols-4" aria-label="Website analytics">
      {kpis.map(([label, value, copy, icon], index) => <Reveal key={label} delay={index * 70}><article className={`flex min-h-[124px] flex-col justify-between rounded-2xl p-4 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 motion-reduce:transform-none ${index === 0 ? "bg-[var(--ink)] text-white" : "border border-[var(--line)] bg-white"}`}><span className={`grid size-9 place-items-center rounded-xl ${index === 0 ? "bg-white/10 text-[#ff9a72]" : "bg-[var(--orange-soft)] text-[var(--orange-dark)]"}`}><Icon name={icon} size={18}/></span><div><strong className="block text-[clamp(1.6rem,6vw,1.9rem)] leading-none tabular-nums">{value}</strong><span className={`mt-2 block text-sm font-semibold ${index === 0 ? "text-white/85" : "text-[var(--ink)]"}`}>{label}</span><small className={index === 0 ? "text-white/55" : "text-[var(--muted)]"}>{copy}</small></div></article></Reveal>)}
    </section>
    {error && <p className="m-0 rounded-xl bg-red-50 p-3 font-bold text-red-800" role="alert">{error} <button className="ml-2 underline" type="button" onClick={() => load()}>Retry</button></p>}
    <section className={SECTION_STYLES} aria-labelledby="call-requests-title">
      <div className={SECTION_HEAD_STYLES}><div><h2 className="m-0 text-[26px] font-extrabold tracking-[-0.03em]" id="call-requests-title">Callback requests</h2><p className="mb-0 mt-2 text-[var(--muted)]">Live enquiries stored from the public site. New ones auto-refresh; mark each as contacted once you have called.</p></div><button className={BUTTON_SECONDARY} type="button" onClick={() => load()} disabled={loading}>{loading ? <Loader variant="inline" label="Refreshing"/> : <><Icon name="reset" size={16}/> Refresh</>}</button></div>
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filter callback requests">{[["new", "New"], ["contacted", "Contacted"], ["all", "All"]].map(([value, text]) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`min-h-9 shrink-0 rounded-full px-3.5 text-sm font-bold transition-[background-color,color] ${filter === value ? "bg-[var(--ink)] text-white" : "bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--ink)]"}`}>{text}{value !== "all" && <span className="ml-1.5 tabular-nums opacity-70">{requests.filter((item) => item.status === value).length}</span>}</button>)}</div>
      {loading ? <Loader label="Loading requests" className="min-h-[180px]"/> : visible.length ? <div className="grid gap-3">{visible.map((request, index) => <Reveal key={request.id} delay={Math.min(index, 6) * 45}><article className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4 transition-shadow duration-200 hover:shadow-[var(--shadow-sm)]"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 text-lg">{request.name}</h3><StatusChip status={request.status}/><span className="ml-auto text-xs font-semibold text-[var(--muted)]">{formatDate(request.createdAt)}</span></div><p className="mb-0 mt-1 text-sm text-[var(--muted)]">{request.propertyTitle || "General rental enquiry"}</p><div className="mt-4 grid gap-2.5 border-y border-[var(--line)] py-4 text-sm sm:grid-cols-2"><div className="flex items-center gap-2"><a className="font-bold text-[var(--orange-dark)] hover:underline" href={`tel:+91${request.phone}`}>+91 {request.phone}</a><button type="button" onClick={() => copyPhone(request.id, request.phone)} className={`inline-flex min-h-8 items-center gap-1 rounded-lg border px-2 text-xs font-bold transition-colors ${copiedId === request.id ? "border-[var(--green)] bg-[var(--green-soft)] text-[oklch(0.4_0.13_155)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--ink-2)] hover:text-[var(--ink)]"}`} aria-label={copiedId === request.id ? "Phone number copied" : `Copy ${request.name}'s phone number`}><Icon name={copiedId === request.id ? "check" : "copy"} size={14}/>{copiedId === request.id ? "Copied" : "Copy"}</button></div>{request.email ? <a className="truncate hover:underline" href={`mailto:${request.email}`}>{request.email}</a> : <span className="text-[var(--muted)]">No email provided</span>}<span><strong>Preferred time:</strong> {TIME_LABELS[request.preferredTime] || TIME_LABELS.anytime}</span><span><strong>Language:</strong> {LANGUAGE_LABELS[request.preferredLanguage] || LANGUAGE_LABELS["no-preference"]}</span>{request.message && <p className="m-0 sm:col-span-2"><strong>Message:</strong> {request.message}</p>}</div><div className="mt-4">{request.status === "new" ? <button type="button" disabled={busyId === request.id} onClick={() => markContacted(request.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1f9d55] px-4 text-sm font-bold text-white transition-[background-color,transform] duration-200 hover:bg-[#168a45] active:scale-[.98] disabled:cursor-wait disabled:opacity-60">{busyId === request.id ? <Loader variant="inline" label="Saving"/> : <><Icon name="check" size={16}/> Mark as contacted</>}</button> : <p className="m-0 inline-flex items-center gap-1.5 rounded-xl bg-[var(--green-soft)] px-3 py-2 text-sm font-bold text-[oklch(0.4_0.13_155)]"><Icon name="check" size={16}/> Contacted{request.updatedAt ? ` · ${formatDate(request.updatedAt)}` : ""}</p>}</div></article></Reveal>)}</div> : <EmptyState icon="phone" title={filter === "contacted" ? "No contacted requests yet" : filter === "new" ? "No new requests" : "No callback requests yet"} copy="Public callback form submissions are stored here in real time."/>}
    </section>
  </div>;
}

export default function Dashboard() {
  const { ready } = useMarketplace();
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.admin === 1;

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login?next=/dashboard"); return; }
    if (!isAdmin) router.replace("/profile");
  }, [loading, user, isAdmin, router]);

  if (!ready || loading || !isAdmin) return <DashboardSkeleton/>;

  return <main className="bg-transparent text-[var(--ink)]">
    <div className="site-container min-h-[75dvh] pb-24 pt-8 max-[640px]:pt-5">
      <Reveal as="header" className="border-b border-[var(--line)] py-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--orange-soft)] px-3 py-1 text-xs font-bold text-[var(--orange-dark)]"><Icon name="shield" size={15}/> Admin only</span>
        <h1 className="m-0 mt-3 text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.035em]">Admin control center</h1>
        <p className="mb-0 mt-2 max-w-[650px] text-[var(--muted)]">Review site analytics, approve callback and access requests, and publish verified property submissions.</p>
      </Reveal>
      <div className="mt-6 grid gap-5 max-[640px]:gap-4">
        <CallbackRequests/>
        <Reveal><FirestoreApprovalQueue/></Reveal>
        <Reveal><ConsultantApplications/></Reveal>
      </div>
    </div>
  </main>;
}
