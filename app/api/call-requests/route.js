import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/server/admin";
import { requireAdmin } from "@/lib/server/session";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
// Same-origin guard: reject cross-site POST/PATCH to blunt CSRF.
const trusted = (request) => request.headers.get("sec-fetch-site") !== "cross-site" && (!request.headers.get("origin") || request.headers.get("origin") === new URL(request.url).origin);
const isJson = (request) => (request.headers.get("content-type") || "").toLowerCase().includes("application/json");
const phoneNumber = (value) => { let digits = String(value || "").replace(/\D/g, ""); if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2); if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1); return /^[6-9]\d{9}$/.test(digits) ? digits : ""; };
const emailAddress = (value) => { const email = clean(value, 120).toLowerCase(); return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null; };
const serialize = (doc) => {
  const data = doc.data();
  return { id: doc.id, name: data.name, phone: data.phone, email: data.email || "", propertyId: data.propertyId || "", propertyTitle: data.propertyTitle || "", message: data.message || "", preferredTime: data.preferredTime || "anytime", preferredLanguage: data.preferredLanguage || "no-preference", status: data.status || "new", createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null, updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null };
};

export async function POST(request) {
  if (!isJson(request)) return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
  if (!trusted(request)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  const throttle = rateLimit({ key: `call-request:${clientIp(request)}`, limit: 6, windowMs: 60 * 60_000 });
  if (!throttle.ok) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(throttle.retryAfter) } });

  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  // Honeypot: silently accept obvious bots without persisting anything.
  if (clean(body?.website, 200)) return NextResponse.json({ submitted: true });

  const name = clean(body?.name, 80);
  const phone = phoneNumber(body?.phone);
  const email = emailAddress(body?.email);
  const propertyId = clean(body?.propertyId, 160);
  const propertyTitle = clean(body?.propertyTitle, 160);
  const message = clean(body?.message, 500); // optional
  const preferredTime = ["anytime", "morning", "afternoon", "evening"].includes(body?.preferredTime) ? body.preferredTime : "anytime";
  const preferredLanguage = ["no-preference", "english", "hindi", "marathi"].includes(body?.preferredLanguage) ? body.preferredLanguage : "no-preference";

  if (name.length < 2 || !phone || email === null || body?.consent !== true) {
    return NextResponse.json({ error: "Enter a valid name and Indian mobile number, then confirm consent." }, { status: 400 });
  }

  try {
    const db = getDb();
    if (propertyId) {
      const property = await db.collection("properties").doc(propertyId).get();
      if (!property.exists || property.data()?.status !== "approved") {
        return NextResponse.json({ error: "This property is no longer available for enquiries." }, { status: 409 });
      }
    }

    const payload = { name, phone, email, propertyId, propertyTitle, message, preferredTime, preferredLanguage };

    // Deduplicate: if this number already has an open (new) enquiry for the same
    // property, update that record instead of creating a duplicate row.
    const existing = await db.collection("callRequests").where("phone", "==", phone).limit(10).get();
    const openMatch = existing.docs.find((doc) => doc.data().status === "new" && (doc.data().propertyId || "") === propertyId);
    if (openMatch) {
      await openMatch.ref.update({ ...payload, updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ submitted: true, id: openMatch.id, deduped: true });
    }

    const ref = await db.collection("callRequests").add({ ...payload, status: "new", consentVersion: "2026-08", createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ submitted: true, id: ref.id }, { status: 201 });
  } catch (error) {
    console.error("Call request failed", error?.message || error);
    return NextResponse.json({ error: "Your callback request could not be saved." }, { status: 500 });
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try {
    const snapshot = await getDb().collection("callRequests").orderBy("createdAt", "desc").limit(100).get();
    return NextResponse.json({ requests: snapshot.docs.map(serialize) });
  } catch (error) {
    console.error("Call request list failed", error?.message || error);
    return NextResponse.json({ error: "Call requests could not be loaded." }, { status: 500 });
  }
}

// A callback request can only move forward: new -> contacted. It can never be
// reopened or reverted, enforced atomically inside a transaction.
export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  if (!isJson(request)) return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
  if (!trusted(request)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });

  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const id = clean(body?.id, 160);
  const status = body?.status === "contacted" ? "contacted" : "";
  if (!id || !status) return NextResponse.json({ error: "A valid request id and status are required." }, { status: 400 });

  try {
    const db = getDb();
    const ref = db.collection("callRequests").doc(id);
    const result = await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists) return { code: 404, error: "Request not found." };
      const current = snapshot.data()?.status || "new";
      if (current === "contacted") return { code: 409, error: "This request is already marked as contacted." };
      if (current !== "new") return { code: 409, error: "This request can no longer be updated." };
      tx.update(ref, { status: "contacted", updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.id });
      return { code: 200 };
    });
    if (result.code !== 200) return NextResponse.json({ error: result.error }, { status: result.code });
    return NextResponse.json({ updated: true, status: "contacted" });
  } catch (error) {
    console.error("Call request update failed", error?.message || error);
    return NextResponse.json({ error: "Call request could not be updated." }, { status: 500 });
  }
}
