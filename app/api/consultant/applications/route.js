import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/session";
import { listConsultantApplications } from "@/lib/server/users";

export const runtime = "nodejs";

// Admin-only: list pending consultant applications.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    const applications = await listConsultantApplications();
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("list consultant applications failed", error);
    return NextResponse.json({ error: "Could not load applications." }, { status: 500 });
  }
}
