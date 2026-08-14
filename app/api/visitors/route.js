import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/server/admin";
import { requireAdmin } from "@/lib/server/session";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { createVisitorCookie, readVisitorCookie, VISITOR_COOKIE, visitorCookieOptions, visitorDocumentId } from "@/lib/server/visitor-cookie";

export const runtime = "nodejs";
const trusted = (request) => request.headers.get("sec-fetch-site") !== "cross-site" && (!request.headers.get("origin") || request.headers.get("origin") === new URL(request.url).origin);
const isBot = (agent = "") => /bot|crawler|spider|preview|headless|lighthouse|monitor/i.test(agent);

export async function POST(request) {
  if (!trusted(request)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  if (isBot(request.headers.get("user-agent") || "")) return NextResponse.json({ tracked: false });
  const throttle = rateLimit({ key: `visitor:${clientIp(request)}`, limit: 30, windowMs: 60 * 60_000 });
  if (!throttle.ok) return NextResponse.json({ tracked: false }, { status: 429 });
  try {
    let id = readVisitorCookie(request.cookies.get(VISITOR_COOKIE)?.value);
    let issued = null;
    if (!id) { issued = createVisitorCookie(); id = issued.id; }
    const ref = getDb().collection("uniqueVisitors").doc(visitorDocumentId(id));
    try { await ref.create({ firstSeenAt: FieldValue.serverTimestamp() }); }
    catch (error) { if (Number(error?.code) !== 6 && error?.code !== "already-exists") throw error; }
    const response = NextResponse.json({ tracked: true });
    if (issued) response.cookies.set(VISITOR_COOKIE, issued.value, visitorCookieOptions);
    return response;
  } catch (error) {
    console.error("Visitor tracking failed", error);
    return NextResponse.json({ error: "Visitor could not be recorded." }, { status: 500 });
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try { const snapshot = await getDb().collection("uniqueVisitors").count().get(); return NextResponse.json({ uniqueVisitors: snapshot.data().count || 0 }); }
  catch (error) { console.error("Visitor count failed", error); return NextResponse.json({ error: "Visitor count could not be loaded." }, { status: 500 }); }
}
