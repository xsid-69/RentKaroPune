import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { TOKEN_COOKIE, tokenCookieOptions } from "@/lib/server/jwt";

export const runtime = "nodejs";

export async function POST() {
  const store = await cookies();
  store.set(TOKEN_COOKIE, "", tokenCookieOptions(0));
  return NextResponse.json({ ok: true });
}
