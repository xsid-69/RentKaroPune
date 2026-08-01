import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { getSessionUser } from "@/lib/server/session";
import { canManageListings, isTrustedMutationRequest, signUploadBatch, validateImageDescriptors } from "@/lib/server/cloudinary";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in before uploading photos." }, { status: 401 });
  if (!canManageListings(user)) return NextResponse.json({ error: "Verified broker or owner access is required." }, { status: 403 });
  const throttle = rateLimit({ key: `cloudinary-sign:${user.id}:${clientIp(request)}`, limit: 12, windowMs: 60_000 });
  if (!throttle.ok) return NextResponse.json({ error: "Too many upload attempts. Please wait and retry." }, { status: 429, headers: { "Retry-After": String(throttle.retryAfter) } });
  try {
    const body = await request.json();
    const error = validateImageDescriptors(body?.files);
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(signUploadBatch(user.id, body.files.length), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Cloudinary upload authorization failed", error);
    return NextResponse.json({ error: "Photo upload could not be authorized." }, { status: 500 });
  }
}