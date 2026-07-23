import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user: user || null });
  } catch (error) {
    console.error("session lookup failed", error);
    return NextResponse.json({ user: null });
  }
}
