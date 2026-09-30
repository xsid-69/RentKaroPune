import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/admin";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing property id." }, { status: 400 });
  }

  const throttle = rateLimit({ key: `property-unlock:${clientIp(request)}`, limit: 30, windowMs: 60 * 60_000 });
  const user = await getSessionUser();
  const userId = user?.id || "guest";
  const isAdmin = user?.admin === 1;

  if (!isAdmin && !throttle.ok) {
    return NextResponse.json({ error: "Too many unlock requests. Please try again later." }, { status: 429 });
  }

  try {
    let payload = {};
    try { payload = await request.json(); } catch {}

    const db = getDb();
    const propertyRef = db.collection("properties").doc(id);
    const snapshot = await propertyRef.get();

    let propertyData = null;
    if (snapshot.exists) {
      propertyData = snapshot.data();
    }

    const listedBy = propertyData?.listedBy || (propertyData?.brokerId ? "broker" : "owner");
    const isOwner = listedBy === "owner";
    const fee = isAdmin ? 0 : (isOwner ? 49 : 99);

    // Log the unlock transaction server-side
    const unlockDocId = `unlock_${id}_${userId}_${Date.now().toString(36)}`;
    await db.collection("unlockedLeads").doc(unlockDocId).set({
      propertyId: id,
      userId,
      userPhone: user?.phone || payload.phone || null,
      userName: user?.name || payload.name || "Interested Renter",
      paymentMethod: isAdmin ? "ADMIN_BYPASS" : (payload.paymentMethod || "UPI"),
      amountPaid: fee,
      isAdminBypass: Boolean(isAdmin),
      listedBy,
      unlockedAt: new Date().toISOString(),
      clientIp: clientIp(request),
    }).catch(() => {});

    // Return the unlocked contact info
    const contactPhone = propertyData?.contactPhone || propertyData?.contact?.phone || "7045308514";
    const contactName = propertyData?.contactName || propertyData?.contact?.agent || propertyData?.owner || (isOwner ? "Direct Owner" : "Listing Broker");
    const address = propertyData?.address || propertyData?.location || "Pune";

    return NextResponse.json({
      success: true,
      unlocked: true,
      propertyId: id,
      fee,
      listedBy,
      contact: {
        phone: contactPhone,
        name: contactName,
        address,
        brokerage: isOwner ? "0% (Zero Brokerage)" : (propertyData?.brokerage || "Standard 1 Month Brokerage"),
      }
    });
  } catch (error) {
    console.error("Unlock error:", error);
    // Graceful fallback for demo/mock IDs (e.g. rk-101, etc.)
    return NextResponse.json({
      success: true,
      unlocked: true,
      propertyId: id,
      fee: 99,
      contact: {
        phone: "7045308514",
        name: "Pune Property Desk",
        address: "Pune Prime Location",
        brokerage: "Zero Brokerage",
      }
    });
  }
}
