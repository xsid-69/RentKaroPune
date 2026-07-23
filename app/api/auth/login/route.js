import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findUser, parseIdentifier, publicUser, verifyPassword } from "@/lib/server/users";
import { signToken, TOKEN_COOKIE, tokenCookieOptions } from "@/lib/server/jwt";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request) {
  const limit = rateLimit({ key: `login:${clientIp(request)}`, limit: 10, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { identifier, password } = body || {};
  const parsed = parseIdentifier(identifier);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!password) return NextResponse.json({ error: "Enter your password." }, { status: 400 });

  try {
    const found = await findUser(parsed.key);
    // Same message whether the account is missing or the password is wrong.
    const invalid = NextResponse.json({ error: "Incorrect email/phone or password." }, { status: 401 });
    if (!found?.data?.passwordHash) return invalid;

    const ok = await verifyPassword(password, found.data.passwordHash);
    if (!ok) return invalid;

    const user = publicUser(found.id, found.data);
    const token = signToken({ sub: user.id, name: user.name, type: "password", admin: user.admin });

    const store = await cookies();
    store.set(TOKEN_COOKIE, token, tokenCookieOptions());

    return NextResponse.json({ user });
  } catch (error) {
    console.error("login failed", error);
    return NextResponse.json({ error: "Could not sign you in right now." }, { status: 500 });
  }
}
