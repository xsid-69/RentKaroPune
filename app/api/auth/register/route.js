import { NextResponse } from "next/server";
import { createUser, parseIdentifier, publicUser, validatePassword } from "@/lib/server/users";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request) {
  const limit = rateLimit({ key: `register:${clientIp(request)}`, limit: 5, windowMs: 60_000 });
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

  const { identifier, password, name } = body || {};
  const parsed = parseIdentifier(identifier);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const passwordError = validatePassword(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  try {
    const result = await createUser({ ...parsed, name, password });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });

    // Account is created but NOT signed in. The user must log in explicitly.
    const user = publicUser(result.id, result.data);
    return NextResponse.json({ user, registered: true }, { status: 201 });
  } catch (error) {
    console.error("register failed", error);
    return NextResponse.json({ error: "Could not create the account right now." }, { status: 500 });
  }
}
