import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { getSessionUser } from "@/lib/server/session";
import { canManageListings, destroyOwnedAssets, isTrustedMutationRequest } from "@/lib/server/cloudinary";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!canManageListings(user)) return NextResponse.json({ error: "Listing access required." }, { status: 403 });
  const throttle = rateLimit({ key: `cloudinary-cleanup:${user.id}:${clientIp(request)}`, limit: 20, windowMs: 60_000 });
  if (!throttle.ok) return NextResponse.json({ error: "Too many cleanup requests." }, { status: 429 });
  try {
    const { batchId, publicIds } = await request.json();
    const result = await destroyOwnedAssets(user.id, batchId, publicIds);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cloudinary cleanup failed", error);
    return NextResponse.json({ error: "Uploaded photos could not be cleaned up." }, { status: 500 });
  }
}