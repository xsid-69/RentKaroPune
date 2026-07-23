import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/session";
import { approveConsultant } from "@/lib/server/users";

export const runtime = "nodejs";

// Admin-only: approve a pending applicant, promoting them to consultant.
export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userId = body?.userId;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing applicant id." }, { status: 400 });
  }

  try {
    const result = await approveConsultant(userId);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json({ approved: true, id: result.id });
  } catch (error) {
    console.error("approve consultant failed", error);
    return NextResponse.json({ error: "Could not approve this applicant." }, { status: 500 });
  }
}
