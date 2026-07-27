import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/server/admin";
import { requireAdmin } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(_request, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing property id." }, { status: 400 });

  try {
    const propertyRef = getDb().collection("properties").doc(id);
    await getDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(propertyRef);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      if (snapshot.data().status !== "pending") throw new Error("NOT_PENDING");
      transaction.update(propertyRef, {
        status: "approved",
        approvedAt: FieldValue.serverTimestamp(),
        approvedBy: admin.id,
      });
    });
    return NextResponse.json({ approved: true, id });
  } catch (error) {
    if (error.message === "NOT_FOUND") return NextResponse.json({ error: "Property not found." }, { status: 404 });
    if (error.message === "NOT_PENDING") return NextResponse.json({ error: "Property is no longer pending." }, { status: 409 });
    console.error("approve property failed", error);
    return NextResponse.json({ error: "Could not approve this property." }, { status: 500 });
  }
}
