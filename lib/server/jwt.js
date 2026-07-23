import "server-only";
import jwt from "jsonwebtoken";

export const TOKEN_COOKIE = "rk_token";
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds.

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set. Add it to .env.local.");
  return secret;
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_MAX_AGE });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

// Consistent cookie options for setting/clearing the session cookie.
export function tokenCookieOptions(maxAge = TOKEN_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}
