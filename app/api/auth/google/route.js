import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/server/admin";
import { findOrCreateGoogleUser, publicUser } from "@/lib/server/users";
import { signToken, TOKEN_COOKIE, tokenCookieOptions } from "@/lib/server/jwt";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

// Exchanges a Firebase Google ID token for the app's own JWT session, linking
// the Google identity to the shared Firestore user record (by email) so admin
// status is resolved from one place regardless of how the user signed in.
export async function POST(request) {
  const limit = rateLimit({ key: `google:${clientIp(request)}`, limit: 10, windowMs: 60_000 });
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

  const idToken = body?.idToken;
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing Google credential." }, { status: 400 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    if (!decoded.email || decoded.email_verified === false) {
      return NextResponse.json({ error: "Your Google email is not verified." }, { status: 403 });
    }

    const result = await findOrCreateGoogleUser({
      email: decoded.email,
      name: decoded.name,
      photoURL: decoded.picture,
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

    const user = publicUser(result.id, result.data);
    const token = signToken({ sub: user.id, name: user.name, type: "google", admin: user.admin });

    const store = await cookies();
    store.set(TOKEN_COOKIE, token, tokenCookieOptions());

    return NextResponse.json({ user });
  } catch (error) {
    console.error("google login failed", error);
    return NextResponse.json({ error: "Could not verify your Google sign-in." }, { status: 401 });
  }
}
