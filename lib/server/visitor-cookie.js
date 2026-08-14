import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const VISITOR_COOKIE = "rk_visitor";
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

function secret() {
  const value = process.env.VISITOR_COOKIE_SECRET || process.env.JWT_SECRET;
  if (!value) throw new Error("VISITOR_COOKIE_SECRET or JWT_SECRET must be configured.");
  return value;
}

const signature = (id) => createHmac("sha256", secret()).update(id).digest("base64url");
export const createVisitorCookie = () => {
  const id = randomBytes(24).toString("base64url");
  return { id, value: `${id}.${signature(id)}` };
};
export const readVisitorCookie = (value = "") => {
  const [id, supplied, extra] = value.split(".");
  if (!id || !supplied || extra || !/^[A-Za-z0-9_-]{32}$/.test(id)) return null;
  const expected = signature(id);
  const left = Buffer.from(supplied); const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right) ? id : null;
};
export const visitorDocumentId = (id) => createHash("sha256").update(`rentkaropune:${id}`).digest("hex");
export const visitorCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: VISITOR_MAX_AGE };
