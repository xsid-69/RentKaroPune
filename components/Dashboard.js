"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
const SECTION_HEAD_STYLES = "mb-5 flex items-start justify-between gap-4 max-[640px]:flex-col";
const TIME_LABELS = { anytime: "Anytime", morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
const LANGUAGE_LABELS = { "no-preference": "No preference", english: "English", hindi: "Hindi", marathi: "Marathi" };
const LAST_SEEN_KEY = "rk_admin_callbacks_seen";
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Recently";

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
  return <section className={SECTION_STYLES} aria-labelledby="consultant-applications-title"><div className={SECTION_HEAD_STYLES}><div><h2 className="m-0 text-[26px] font-extrabold tracking-[-0.03em]" id="consultant-applications-title">Consultant access requests</h2><p className="mb-0 mt-2 text-[var(--muted)]">Approve members who requested consultant access.</p></div><span className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-bold">{applications.length} pending</span></div>{error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error}</p>}{loading ? <Loader label="Loading applications" className="min-h-[160px]"/> : applications.length ? <div className="grid gap-3">{applications.map((applicant) => <article className="flex items-center justify-between gap-4 rounded-xl bg-[var(--soft)] p-4 transition-shadow hover:shadow-[var(--shadow-sm)] max-[520px]:flex-col max-[520px]:items-start" key={applicant.id}><div className="min-w-0"><strong className="block truncate">{applicant.name || applicant.email || applicant.id}</strong><span className="block truncate text-sm text-[var(--muted)]">{applicant.email || applicant.phone || applicant.id}</span></div><button className={`${BUTTON_PRIMARY} max-[520px]:w-full`} type="button" disabled={busyId === applicant.id} onClick={() => approve(applicant.id)}>{busyId === applicant.id ? "Approving…" : "Approve consultant"}</button></article>)}</div> : <EmptyState icon="user" title="No pending applications" copy="New consultant applications will appear here."/>}</section>;
}

// All callback data + notification/toast/export behaviour lives here so it can be
// shared by the KPIs, the notification dot on the tab, and the callback list.
function useCallbacks() {
  const [requests, setRequests] = useState([]);
  const [uniqueVisitors, setUniqueVisitors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [notifyPermission, setNotifyPermission] = useState("unsupported");
  const [toast, setToast] = useState(null);
  const [newSinceLastVisit, setNewSinceLastVisit] = useState(0);
  const knownIdsRef = useRef(null);
  const toastTimerRef = useRef(null);
  const requestsRef = useRef([]);

  useEffect(() => { requestsRef.current = requests; }, [requests]);
  useEffect(() => { if (typeof window !== "undefined" && "Notification" in window) setNotifyPermission(Notification.permission); }, []);
  useEffect(() => () => { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current); }, []);

  const showToast = useCallback((message) => {
    setToast({ key: Date.now(), message });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 7000);
  }, []);

  const notifyFresh = useCallback((fresh) => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    const count = fresh.length;
    const first = fresh[0];
    const title = count === 1 ? "New callback request" : `${count} new callback requests`;
    const body = count === 1 ? `${first.name} · ${first.propertyTitle || "General rental enquiry"}` : "Open the dashboard to review them.";
    try {
      const notification = new Notification(title, { body, icon: "/icon.png", badge: "/icon.png", tag: "rk-callback", renotify: true });
      notification.onclick = () => { window.focus(); notification.close(); };
    } catch {}
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [callsResponse, visitorsResponse] = await Promise.all([fetch("/api/call-requests", { cache: "no-store" }), fetch("/api/visitors", { cache: "no-store" })]);
      const [callsData, visitorsData] = await Promise.all([callsResponse.json(), visitorsResponse.json()]);
      if (!callsResponse.ok) throw new Error(callsData.error || "Call requests could not be loaded.");
      if (!visitorsResponse.ok) throw new Error(visitorsData.error || "Visitor count could not be loaded.");
      const nextRequests = callsData.requests || [];

      if (knownIdsRef.current === null) {
        // First load: seed baseline and report how many arrived since the last visit.
        knownIdsRef.current = new Set(nextRequests.map((item) => item.id));
        try {
          const seen = window.localStorage.getItem(LAST_SEEN_KEY);
          const seenTime = seen ? Date.parse(seen) : NaN;
          if (!Number.isNaN(seenTime)) {
            const since = nextRequests.filter((item) => item.createdAt && Date.parse(item.createdAt) > seenTime).length;
            if (since > 0) { setNewSinceLastVisit(since); showToast(`${since} new callback ${since === 1 ? "request" : "requests"} since your last visit`); }
          }
          window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
        } catch {}
      } else {
        const known = knownIdsRef.current;
        const fresh = nextRequests.filter((item) => item.status === "new" && !known.has(item.id));
        nextRequests.forEach((item) => known.add(item.id));
        if (fresh.length) { notifyFresh(fresh); showToast(`${fresh.length} new callback ${fresh.length === 1 ? "request" : "requests"} just arrived`); }
        try { window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString()); } catch {}
      }

      setRequests(nextRequests);
      setUniqueVisitors(Number(visitorsData.uniqueVisitors || 0));
      setError("");
    } catch (requestError) { if (!silent) setError(requestError.message || "Admin data could not be loaded."); }
    finally { if (!silent) setLoading(false); }
  }, [notifyFresh, showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") load(true); }, 15000);
    const onVisible = () => { if (document.visibilityState === "visible") load(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  const markContacted = async (id) => {
    setBusyId(id); setError("");
    const previous = requestsRef.current;
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

  const enableAlerts = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try { const permission = await Notification.requestPermission(); setNotifyPermission(permission); } catch {}
  };

  const exportCsv = () => {
    if (!requests.length) return;
    const headers = ["Name", "Phone", "Email", "Property", "Status", "Requested at"];
    const escape = (value) => { const text = String(value ?? ""); return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
    const lines = requests.map((request) => [
      request.name,
      `+91 ${request.phone}`,
      request.email || "",
      request.propertyTitle || "General rental enquiry",
      request.status,
      request.createdAt ? formatDate(request.createdAt) : "",
    ].map(escape).join(","));
    const csv = "\uFEFF" + [headers.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rentkaro-callback-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const newCount = requests.filter((item) => item.status === "new").length;
  const contactedCount = requests.filter((item) => item.status === "contacted").length;

  return { requests, uniqueVisitors, loading, error, busyId, copiedId, notifyPermission, toast, newSinceLastVisit, newCount, contactedCount, load, markContacted, copyPhone, enableAlerts, exportCsv, dismissToast: () => setToast(null) };
}

const buildKpis = (loading, uniqueVisitors, total, newCount, contactedCount) => [
  { label: "Unique visitors", value: loading ? "…" : (uniqueVisitors ?? 0).toLocaleString("en-IN"), icon: "chart" },
  { label: "Total requests", value: loading ? "…" : total.toLocaleString("en-IN"), icon: "phone" },
  { label: "Waiting for call", value: loading ? "…" : newCount.toLocaleString("en-IN"), icon: "info" },
  { label: "Contacted", value: loading ? "…" : contactedCount.toLocaleString("en-IN"), icon: "check" },
];
const cardTone = (index) => index === 0 ? "bg-[var(--ink)] text-white" : "border border-[var(--line)] bg-white";
const iconTone = (index) => index === 0 ? "bg-white/10 text-[#ff9a72]" : "bg-[var(--orange-soft)] text-[var(--orange-dark)]";

// Full analytics grid — 2x2 on mobile, 4-up on desktop. Scrolls away normally.
function AnalyticsGrid(props) {
  const kpis = buildKpis(props.loading, props.uniqueVisitors, props.total, props.newCount, props.contactedCount);
  return <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Website analytics">
    {kpis.map((kpi, index) => <article key={kpi.label} className={`flex h-full min-h-[112px] flex-col gap-4 rounded-2xl p-4 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 motion-reduce:transform-none ${cardTone(index)}`}>
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${iconTone(index)}`}><Icon name={kpi.icon} size={18}/></span>
      <div className="mt-auto min-w-0"><strong className="block text-2xl leading-none tabular-nums sm:text-[28px]">{kpi.value}</strong><span className={`mt-1.5 block truncate text-sm font-semibold ${index === 0 ? "text-white/80" : "text-[var(--muted)]"}`}>{kpi.label}</span></div>
    </article>)}
  </section>;
}

// Compact 1x4 strip (mobile only) that expands into the pinned bar once the full
// grid has scrolled away and the callback heading meets the nav.
function AnalyticsStrip(props) {
  const kpis = buildKpis(props.loading, props.uniqueVisitors, props.total, props.newCount, props.contactedCount);
  return <section aria-hidden="true" className={`grid grid-cols-4 gap-2 overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:hidden ${props.condensed ? "mb-3 max-h-[110px] opacity-100" : "max-h-0 opacity-0"}`}>
    {kpis.map((kpi, index) => <article key={kpi.label} className={`flex h-full min-h-0 flex-col gap-0.5 rounded-xl p-2.5 ${cardTone(index)}`}>
      <strong className="block text-lg leading-none tabular-nums">{kpi.value}</strong>
      <span className={`mt-0.5 block truncate text-[10px] font-bold uppercase tracking-[0.02em] ${index === 0 ? "text-white/70" : "text-[var(--muted)]"}`}>{kpi.label}</span>
    </article>)}
  </section>;
}

function CallbackToolbar({ data, filter, setFilter, condensed }) {
  const { requests, loading, notifyPermission, newSinceLastVisit, load, enableAlerts, exportCsv } = data;
  return <div className="pt-3">
    <div className="flex items-start justify-between gap-4 max-[640px]:flex-col">
      <div><h2 className="m-0 text-[22px] font-extrabold tracking-[-0.03em] sm:text-[26px]" id="call-requests-title">Callback requests</h2><p className={`mb-0 mt-1.5 text-sm text-[var(--muted)] ${condensed ? "hidden sm:block" : "block"}`}>Live enquiries stored from the public site.{newSinceLastVisit > 0 ? ` ${newSinceLastVisit} new since your last visit.` : " Enable alerts to be notified the moment one arrives."}</p></div>
      <div className={`flex-wrap items-center gap-2 max-[640px]:w-full ${condensed ? "hidden sm:flex" : "flex"}`}>
        {notifyPermission === "granted" && <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--green-soft)] px-3 text-sm font-bold text-[oklch(0.4_0.13_155)]"><Icon name="bell" size={16}/> Alerts on</span>}
        {notifyPermission === "default" && <button className={BUTTON_SECONDARY} type="button" onClick={enableAlerts}><Icon name="bell" size={16}/> Enable alerts</button>}
        {notifyPermission === "denied" && <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--soft)] px-3 text-sm font-bold text-[var(--muted)]" title="Notifications are blocked in your browser settings for this site."><Icon name="bell" size={16}/> Alerts blocked</span>}
        <button className={BUTTON_SECONDARY} type="button" onClick={exportCsv} disabled={loading || !requests.length} title="Download requests as CSV (opens in Excel)"><Icon name="download" size={16}/> Export CSV</button>
        <button className={BUTTON_SECONDARY} type="button" onClick={() => load()} disabled={loading}>{loading ? <Loader variant="inline" label="Refreshing"/> : <><Icon name="reset" size={16}/> Refresh</>}</button>
      </div>
    </div>
    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filter callback requests">{[["new", "New"], ["contacted", "Contacted"], ["all", "All"]].map(([value, text]) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`min-h-9 shrink-0 rounded-full px-3.5 text-sm font-bold transition-[background-color,color] ${filter === value ? "bg-[var(--ink)] text-white" : "bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--ink)]"}`}>{text}<span className="ml-1.5 tabular-nums opacity-70">{value === "all" ? requests.length : requests.filter((item) => item.status === value).length}</span></button>)}</div>
  </div>;
}

function CallbackItems({ data, filter }) {
  const { requests, loading, error, busyId, copiedId, markContacted, copyPhone, load } = data;
  const visible = filter === "all" ? requests : requests.filter((item) => item.status === filter);
  return <div>
    {error && <p className="m-0 mb-4 rounded-xl bg-red-50 p-3 font-bold text-red-800" role="alert">{error} <button className="ml-2 underline" type="button" onClick={() => load()}>Retry</button></p>}
    {loading ? <Loader label="Loading requests" className="min-h-[180px]"/> : visible.length ? <div className="grid gap-3">{visible.map((request, index) => <Reveal key={request.id} delay={Math.min(index, 6) * 40}><article className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4 transition-shadow duration-200 hover:shadow-[var(--shadow-sm)]"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 text-lg">{request.name}</h3><StatusChip status={request.status}/><span className="ml-auto text-xs font-semibold text-[var(--muted)]">{formatDate(request.createdAt)}</span></div><p className="mb-0 mt-1 text-sm text-[var(--muted)]">{request.propertyTitle || "General rental enquiry"}</p><div className="mt-4 grid gap-2.5 border-y border-[var(--line)] py-4 text-sm sm:grid-cols-2"><div className="flex items-center gap-2"><a className="font-bold text-[var(--orange-dark)] hover:underline" href={`tel:+91${request.phone}`}>+91 {request.phone}</a><button type="button" onClick={() => copyPhone(request.id, request.phone)} className={`inline-flex min-h-8 items-center gap-1 rounded-lg border px-2 text-xs font-bold transition-colors ${copiedId === request.id ? "border-[var(--green)] bg-[var(--green-soft)] text-[oklch(0.4_0.13_155)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--ink-2)] hover:text-[var(--ink)]"}`} aria-label={copiedId === request.id ? "Phone number copied" : `Copy ${request.name}'s phone number`}><Icon name={copiedId === request.id ? "check" : "copy"} size={14}/>{copiedId === request.id ? "Copied" : "Copy"}</button></div>{request.email ? <a className="truncate hover:underline" href={`mailto:${request.email}`}>{request.email}</a> : <span className="text-[var(--muted)]">No email provided</span>}<span><strong>Preferred time:</strong> {TIME_LABELS[request.preferredTime] || TIME_LABELS.anytime}</span><span><strong>Language:</strong> {LANGUAGE_LABELS[request.preferredLanguage] || LANGUAGE_LABELS["no-preference"]}</span>{request.message && <p className="m-0 sm:col-span-2"><strong>Message:</strong> {request.message}</p>}</div><div className="mt-4">{request.status === "new" ? <button type="button" disabled={busyId === request.id} onClick={() => markContacted(request.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1f9d55] px-4 text-sm font-bold text-white transition-[background-color,transform] duration-200 hover:bg-[#168a45] active:scale-[.98] disabled:cursor-wait disabled:opacity-60">{busyId === request.id ? <Loader variant="inline" label="Saving"/> : <><Icon name="check" size={16}/> Mark as contacted</>}</button> : <p className="m-0 inline-flex items-center gap-1.5 rounded-xl bg-[var(--green-soft)] px-3 py-2 text-sm font-bold text-[oklch(0.4_0.13_155)]"><Icon name="check" size={16}/> Contacted{request.updatedAt ? ` · ${formatDate(request.updatedAt)}` : ""}</p>}</div></article></Reveal>)}</div> : <EmptyState icon="phone" title={filter === "contacted" ? "No contacted requests yet" : filter === "new" ? "No new requests" : "No callback requests yet"} copy="Public callback form submissions are stored here in real time."/>}
  </div>;
}

const TABS = [
  { id: "callbacks", label: "Callbacks", icon: "phone" },
  { id: "properties", label: "Property approvals", icon: "shield" },
  { id: "consultants", label: "Consultant access", icon: "user" },
];

function AdminConsole() {
  const data = useCallbacks();
  const router = useRouter();
  const [tab, setTab] = useState("callbacks");
  const [filter, setFilter] = useState("new");
  const [condensed, setCondensed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(72);
  const sentinelRef = useRef(null);
  const goBack = () => { if (typeof window !== "undefined" && window.history.length > 1) router.back(); else router.push("/"); };

  // Snap the sticky offset to the *visible* bottom of the floating nav card (not the
  // padded header box) so the pinned bar sits flush under the navbar with no gap.
  useEffect(() => {
    const measure = () => {
      const card = document.querySelector("header")?.firstElementChild;
      if (card) setHeaderHeight(Math.max(0, Math.round(card.getBoundingClientRect().bottom)));
    };
    measure();
    const raf = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => { window.cancelAnimationFrame(raf); window.removeEventListener("resize", measure); };
  }, []);

  // Condense only once the pinned bar (its sentinel sits just above the callback
  // heading) reaches the nav — i.e. when the heading touches the navbar.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setCondensed(!entry.isIntersecting), { threshold: 0, rootMargin: `-${headerHeight + 1}px 0px 0px 0px` });
    observer.observe(node);
    return () => observer.disconnect();
  }, [headerHeight]);

  return <main className="bg-transparent text-[var(--ink)]">
    {data.toast && <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+5rem)] z-[var(--z-toast)] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-[var(--ink)] py-2 pl-2 pr-2.5 text-sm font-bold text-white shadow-[var(--shadow-lg)] motion-safe:animate-modal" role="status" aria-live="polite">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--orange)]"><Icon name="bell" size={15}/></span>
      <span className="truncate">{data.toast.message}</span>
      <button type="button" onClick={() => { setTab("callbacks"); data.dismissToast(); }} className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold transition-colors hover:bg-white/25">View</button>
    </div>}
    <div className="site-container min-h-[75dvh] pb-24 pt-4 max-[640px]:pt-2">
      <Reveal as="header" className="border-b border-[var(--line)] pb-6 pt-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--orange-soft)] px-3 py-1 text-xs font-bold text-[var(--orange-dark)]"><Icon name="shield" size={15}/> Admin only</span>
        <h1 className="m-0 mt-3 text-[clamp(1.9rem,5vw,3rem)] font-extrabold tracking-[-0.035em]">Admin control center</h1>
        <p className="mb-0 mt-2 max-w-[650px] text-[var(--muted)]">Review site analytics, handle callback requests, and publish verified property submissions.</p>
      </Reveal>

      {/* Full analytics scrolls away normally on mobile; stays put on desktop. */}
      <div className="mt-6"><AnalyticsGrid loading={data.loading} uniqueVisitors={data.uniqueVisitors} total={data.requests.length} newCount={data.newCount} contactedCount={data.contactedCount} /></div>

      <div ref={sentinelRef} aria-hidden="true" className="mt-6 h-px w-full sm:mt-0" />

      <div
        className={`sticky z-[var(--z-sticky)] bg-white/92 pb-2 pt-1.5 backdrop-blur-md transition-shadow duration-300 sm:static sm:mt-6 sm:bg-transparent sm:pb-0 sm:pt-0 sm:backdrop-blur-none sm:!shadow-none ${condensed ? "shadow-[0_12px_24px_-12px_rgb(10_10_10/18%)]" : ""}`}
        style={{ top: headerHeight }}
      >
        {/* Compact pinned title + back, appears once the heading meets the nav (mobile). */}
        <div className={`flex items-center gap-2.5 overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-[cubic-bezier(.22,1,.36,1)] sm:hidden ${condensed ? "mb-2.5 max-h-14 opacity-100" : "max-h-0 opacity-0"}`}>
          <button type="button" onClick={goBack} aria-label="Go back to the previous page" className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--ink)] transition-transform active:scale-95"><Icon name="arrow" size={16} className="rotate-180"/></button>
          <span className="truncate text-base font-extrabold tracking-[-0.02em]">Admin Control Panel</span>
        </div>
        <AnalyticsStrip loading={data.loading} uniqueVisitors={data.uniqueVisitors} total={data.requests.length} newCount={data.newCount} contactedCount={data.contactedCount} condensed={condensed} />

        <nav className="flex gap-1.5 overflow-x-auto border-b border-[var(--line)] pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Dashboard sections">
          {TABS.map((item) => {
            const active = tab === item.id;
            const dot = item.id === "callbacks" && data.newCount > 0;
            return <button key={item.id} type="button" role="tab" aria-selected={active} onClick={() => setTab(item.id)} className={`relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-4 text-sm font-bold transition-colors ${active ? "border-[var(--orange)] text-[var(--ink)]" : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`}>
              <Icon name={item.icon} size={16}/><span className="max-[380px]:sr-only sm:not-sr-only">{item.label}</span>
              {item.id === "callbacks" && data.newCount > 0 && <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--orange)] px-1.5 text-[11px] font-extrabold text-white tabular-nums">{data.newCount}</span>}
              {dot && <span className="absolute right-1.5 top-1 size-2 rounded-full bg-[var(--orange)] ring-2 ring-white motion-safe:animate-ping" aria-hidden="true"/>}
              {dot && <span className="absolute right-1.5 top-1 size-2 rounded-full bg-[var(--orange)]" aria-hidden="true"/>}
            </button>;
          })}
        </nav>

        {tab === "callbacks" && <CallbackToolbar data={data} filter={filter} setFilter={setFilter} condensed={condensed} />}
      </div>

      <div className="mt-4" role="tabpanel">
        {tab === "callbacks" && <CallbackItems data={data} filter={filter} />}
        {tab === "properties" && <Reveal><FirestoreApprovalQueue/></Reveal>}
        {tab === "consultants" && <Reveal><ConsultantApplications/></Reveal>}
      </div>
    </div>
  </main>;
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
  return <AdminConsole/>;
}
