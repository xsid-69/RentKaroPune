import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/server/admin";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

// Bridges the signed app session to Firebase Auth. Firestore and Storage rules
// can then authorize password users and Google users with the same stable uid.
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const token = await getAdminAuth().createCustomToken(user.id, {
      role: user.admin === 1 ? "admin" : user.role === "consultant" ? "broker" : user.role,
    });
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Firebase custom token failed", error);
    return NextResponse.json({ error: "Could not authorize Firebase access." }, { status: 500 });
  }
}
