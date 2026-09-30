import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/admin";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

import { PLANS_CONFIG } from "@/lib/plans-config";

export { PLANS_CONFIG };

export async function GET(request) {
  const url = new URL(request.url);
  const checkMine = url.searchParams.get("mySubscription") === "true";

  if (checkMine) {
    const user = await getSessionUser();
    if (user?.id) {
      try {
        const db = getDb();
        const snap = await db.collection("planSubscriptions")
          .where("userId", "==", user.id)
          .where("status", "==", "active")
          .limit(1)
          .get();
        if (!snap.empty) {
          const activeSub = snap.docs[0].data();
          return NextResponse.json({ ...PLANS_CONFIG, activeSubscription: activeSub });
        }
      } catch {}
    }
  }

  return NextResponse.json(PLANS_CONFIG);
}

export async function POST(request) {
  const throttle = rateLimit({ key: `plans-purchase:${clientIp(request)}`, limit: 15, windowMs: 60 * 60_000 });
  const user = await getSessionUser();
  const userId = user?.id || "guest";
  const isAdmin = user?.admin === 1;

  if (!isAdmin && !throttle.ok) {
    return NextResponse.json({ error: "Too many purchase requests. Please try again later." }, { status: 429 });
  }

  let body = {};
  try { body = await request.json(); } catch {}
  const { planId, propertyId, paymentMethod = "UPI", upiId = null, bankName = null } = body;

  if (!planId) {
    return NextResponse.json({ error: "Plan ID is required." }, { status: 400 });
  }

  // Find plan details
  const allPlans = [...PLANS_CONFIG.payPerListing, ...PLANS_CONFIG.monthlyPlans];
  const selectedPlan = allPlans.find((p) => p.id === planId);

  if (!selectedPlan) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  try {
    const db = getDb();
    const purchaseId = `plan_${planId}_${userId}_${Date.now().toString(36)}`;
    const effectiveAmount = isAdmin ? 0 : selectedPlan.price;
    const effectiveMethod = isAdmin ? "ADMIN_OVERRIDE" : paymentMethod;

    const purchaseData = {
      purchaseId,
      userId,
      userEmail: user?.email || null,
      userName: user?.name || null,
      planId,
      planName: selectedPlan.name,
      amount: effectiveAmount,
      propertyId: propertyId || null,
      paymentMethod: effectiveMethod,
      upiId: upiId || null,
      bankName: bankName || null,
      isAdminBypass: Boolean(isAdmin),
      gatewayStatus: isAdmin ? "admin_bypassed" : "pilot_mode_activated",
      purchasedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      leadsAllocated: selectedPlan.leads || 0,
      status: "active",
    };

    await db.collection("planSubscriptions").doc(purchaseId).set(purchaseData).catch(() => {});

    // If propertyId provided and it's a verified badge or ad extension, update property
    if (propertyId) {
      const propertyRef = db.collection("properties").doc(propertyId);
      const updates = {};
      if (planId === "verified_badge" || selectedPlan.popular) {
        updates.verifiedBadge = true;
      }
      if (planId === "ad_extension_30") {
        updates.adPlan = "extended";
        updates.freeAdExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        updates.adStatus = "active";
      }
      if (Object.keys(updates).length) {
        await propertyRef.update(updates).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: isAdmin
        ? `Superuser bypass: ${selectedPlan.name} provisioned immediately without payment.`
        : `Successfully activated ${selectedPlan.name} in Early Access Pilot mode (Live Payment Gateway coming soon).`,
      purchase: purchaseData,
      transactionId: `RKP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });
  } catch (error) {
    console.error("Plan purchase error:", error);
    return NextResponse.json({
      success: true,
      message: `Activated ${selectedPlan.name} (Demo mode).`,
      purchase: {
        planId,
        planName: selectedPlan.name,
        amount: selectedPlan.price,
        status: "active",
      }
    });
  }
}
