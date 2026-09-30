import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/server/admin";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { getSessionUser } from "@/lib/server/session";
import { canManageListings, destroyOwnedAssets, isTrustedMutationRequest, validateOwnedAssets, verifyCloudinaryAssets } from "@/lib/server/cloudinary";

export const runtime = "nodejs";
const BHK = ["1BHK", "2BHK", "3BHK", "4BHK+"];
const TYPES = ["Flat", "Villa", "Bungalow"];
const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";

function validateForm(form) {
  if (!form || typeof form !== "object") return "Property details are required.";
  if (clean(form.title, 120).length < 8) return "Use a clear title with at least 8 characters.";
  if (!BHK.includes(form.bhk) || !TYPES.includes(form.propertyType)) return "Select a valid property configuration.";
  if (clean(form.location, 120).length < 2 || clean(form.address, 300).length < 10) return "Provide a valid Pune location and full address.";
  if (!Number.isFinite(Number(form.rent)) || Number(form.rent) < 1000) return "Enter a valid monthly rent.";
  if (!Number.isFinite(Number(form.deposit)) || Number(form.deposit) < 0) return "Enter a valid refundable deposit.";
  if (!Array.isArray(form.amenities) || form.amenities.length < 1 || form.amenities.length > 20 || form.amenities.some((item) => clean(item, 60) !== item)) return "Select valid amenities.";
  return "";
}

export async function POST(request) {
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in before submitting a property." }, { status: 401 });
  if (!canManageListings(user)) return NextResponse.json({ error: "Verified broker or owner access is required." }, { status: 403 });
  const throttle = rateLimit({ key: `property-create:${user.id}:${clientIp(request)}`, limit: 6, windowMs: 60 * 60_000 });
  if (!throttle.ok) return NextResponse.json({ error: "Too many property submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(throttle.retryAfter) } });
  let payload;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const formError = validateForm(payload?.form);
  if (formError) return NextResponse.json({ error: formError }, { status: 400 });
  const assetCheck = validateOwnedAssets(user.id, payload?.batchId, payload?.assets);
  if (assetCheck.error) return NextResponse.json({ error: assetCheck.error }, { status: 400 });
  try {
    await verifyCloudinaryAssets(assetCheck.assets);
    const ref = getDb().collection("properties").doc(`cloudinary-${payload.batchId}`);
    const form = payload.form;
    const isBroker = form.listedBy === "broker";
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const property = {
      id: ref.id,
      title: clean(form.title, 120),
      bhk: form.bhk,
      propertyType: form.propertyType,
      location: clean(form.location, 120),
      address: clean(form.address, 300),
      rent: Number(form.rent),
      deposit: Number(form.deposit),
      amenities: form.amenities,
      images: assetCheck.assets.map((asset) => asset.secureUrl),
      imageAssets: assetCheck.assets,
      cloudinaryBatchId: payload.batchId,
      brokerId: user.id,
      listedBy: isBroker ? "broker" : "owner",
      brokerage: isBroker ? clean(form.brokerage || "Standard 1 Month Brokerage", 80) : "0% (Zero Brokerage)",
      verifiedBadge: Boolean(form.verifiedBadge),
      adPlan: "free",
      adStatus: "active",
      freeAdExpiresAt: sevenDaysLater,
      contactPhone: clean(form.contactPhone || user.phone || "7045308514", 15),
      contactName: clean(form.contactName || user.name || (isBroker ? "Broker" : "Owner"), 80),
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    };
    try { await ref.create(property); }
    catch (error) {
      if (Number(error?.code) !== 6 && error?.code !== "already-exists") throw error;
      const existing = await ref.get();
      if (!existing.exists || existing.data()?.brokerId !== user.id) throw error;
      return NextResponse.json({ id: ref.id, status: existing.data().status, existing: true });
    }
    return NextResponse.json({ id: ref.id, status: "pending" }, { status: 201 });
  } catch (error) {
    console.error("Property creation failed", error);
    await destroyOwnedAssets(user.id, payload.batchId, assetCheck.assets.map((asset) => asset.publicId)).catch(() => {});
    return NextResponse.json({ error: "The property could not be saved. Uploaded photos were cleaned up." }, { status: 500 });
  }
}