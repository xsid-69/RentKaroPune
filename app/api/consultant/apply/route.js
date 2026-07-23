import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { applyForConsultant } from "@/lib/server/users";

export const runtime = "nodejs";

// A signed-in user requests consultant access. Admin approval is required
// before they can post properties.
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  try {
    const result = await applyForConsultant(user.id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ status: result.status });
  } catch (error) {
    console.error("consultant apply failed", error);
    return NextResponse.json({ error: "Could not submit your request right now." }, { status: 500 });
  }
}
