import "server-only";
import { cookies } from "next/headers";
import { TOKEN_COOKIE, verifyToken } from "./jwt";
import { findUser, publicUser } from "./users";

// Resolves the current user from the signed JWT cookie, then re-reads the record
// from the database so role changes (e.g. revoking admin) take effect immediately.
export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.sub) return null;

  const found = await findUser(payload.sub);
  if (!found) return null;
  return publicUser(found.id, found.data);
}

// Returns the user only if they are an admin, otherwise null. Use this to guard
// any admin-only API route — never trust an `admin` flag sent by the client.
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.admin !== 1) return null;
  return user;
}
