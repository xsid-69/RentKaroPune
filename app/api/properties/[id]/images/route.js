import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/server/admin";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { getSessionUser } from "@/lib/server/session";
import { destroyOwnedAssets, isTrustedMutationRequest, MAX_PROPERTY_IMAGES, validateOwnedAssets, verifyCloudinaryAssets } from "@/lib/server/cloudinary";

export const runtime = "nodejs";
const canEditPhotos = (user) => Boolean(user && (user.admin === 1 || user.role === "consultant"));

export async function POST(request, { params }) {
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!canEditPhotos(user)) return NextResponse.json({ error: "Admin or consultant access is required." }, { status: 403 });
  const { id } = await params;
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing property id." }, { status: 400 });
  const throttle = rateLimit({ key: `property-images:${user.id}:${id}:${clientIp(request)}`, limit: 10, windowMs: 60 * 60_000 });
  if (!throttle.ok) return NextResponse.json({ error: "Too many photo updates. Please try again later." }, { status: 429 });
  let payload;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const checked = validateOwnedAssets(user.id, payload?.batchId, payload?.assets);
  if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });
  const ref = getDb().collection("properties").doc(id);
  let attachedPublicIds = new Set();
  try {
    await verifyCloudinaryAssets(checked.assets);
    let updatedImages = [];
    await getDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      const data = snapshot.data();
      const currentImages = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
      const currentAssets = Array.isArray(data.imageAssets) ? data.imageAssets : [];
      attachedPublicIds = new Set(currentAssets.map((item) => item?.publicId).filter(Boolean));
      const additions = checked.assets.filter((asset) => !currentImages.includes(asset.secureUrl) && !attachedPublicIds.has(asset.publicId));
      updatedImages = currentImages;
      if (!additions.length) return;
      if (currentImages.length + additions.length > MAX_PROPERTY_IMAGES) throw new Error("LIMIT");
      updatedImages = [...currentImages, ...additions.map((asset) => asset.secureUrl)];
      transaction.update(ref, { images: updatedImages, imageAssets: [...currentAssets, ...additions], imagesUpdatedAt: FieldValue.serverTimestamp(), imagesUpdatedBy: user.id });
    });
    return NextResponse.json({ id, images: updatedImages });
  } catch (error) {
    const unattachedIds = checked.assets.map((asset) => asset.publicId).filter((publicId) => !attachedPublicIds.has(publicId));
    await destroyOwnedAssets(user.id, payload.batchId, unattachedIds).catch(() => {});
    if (error.message === "NOT_FOUND") return NextResponse.json({ error: "Property not found." }, { status: 404 });
    if (error.message === "LIMIT") return NextResponse.json({ error: `A property can have up to ${MAX_PROPERTY_IMAGES} photos.` }, { status: 409 });
    console.error("Property photo append failed", error);
    return NextResponse.json({ error: "Property photos could not be updated." }, { status: 500 });
  }
}