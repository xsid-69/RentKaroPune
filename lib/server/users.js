import "server-only";
import bcrypt from "bcryptjs";
import { getUser, listUsersByConsultantStatus, putUserIfAbsent, updateUser } from "./user-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Classify a raw identifier as an email or an Indian phone number, and return a
// normalized key used as the stored user id.
export function parseIdentifier(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return { error: "Enter your email or phone number." };

  if (EMAIL_RE.test(value)) {
    const email = value.toLowerCase();
    return { key: email, type: "email", email, phone: null };
  }

  const digits = value.replace(/[\s\-()]/g, "").replace(/^\+91/, "");
  if (/^[6-9]\d{9}$/.test(digits)) {
    return { key: `phone:${digits}`, type: "phone", email: null, phone: digits };
  }

  return { error: "Enter a valid email or a 10-digit Indian mobile number." };
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 128) return "Password is too long.";
  return null;
}

// Shape returned to the client. Never includes the password hash.
// `admin` is always derived from stored data — clients can never set it.
export function publicUser(id, data) {
  return {
    id,
    name: data.name || "",
    email: data.email || null,
    phone: data.phone || null,
    admin: data.admin === 1 ? 1 : 0,
    // "client" by default. "consultant" is granted only after admin approval.
    role: data.role === "consultant" ? "consultant" : "client",
    // "none" | "pending" | "approved" — drives the consultant onboarding UI.
    consultantStatus: ["pending", "approved"].includes(data.consultantStatus) ? data.consultantStatus : "none",
    photoURL: data.photoURL || null,
    provider: data.provider || "password",
  };
}

export async function findUser(key) {
  const data = await getUser(key);
  if (!data) return null;
  return { id: key, data };
}

export async function createUser({ key, type, email, phone, name, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const record = {
    name: name?.trim() || "",
    email,
    phone,
    identifierType: type,
    passwordHash,
    // New accounts are never admins. Grant admin by setting this to 1 in Firestore.
    admin: 0,
    role: "client",
    consultantStatus: "none",
    createdAt: new Date().toISOString(),
  };
  const result = await putUserIfAbsent(key, record);
  if (result.exists) return { error: "An account with this email or phone already exists." };
  return { id: key, data: record };
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

// --- Consultant onboarding (admin-approved) ---

// A signed-in user requests to become a consultant. Already-approved
// consultants and admins don't need to apply.
export async function applyForConsultant(key) {
  const data = await getUser(key);
  if (!data) return { error: "Account not found." };
  if (data.role === "consultant") return { status: "approved" };
  if (data.consultantStatus === "pending") return { status: "pending" };
  await updateUser(key, { consultantStatus: "pending", consultantAppliedAt: new Date().toISOString() });
  return { status: "pending" };
}

// Admin: list all pending consultant applications.
export async function listConsultantApplications() {
  const rows = await listUsersByConsultantStatus("pending");
  return rows.map(({ id, data }) => ({
    ...publicUser(id, data),
    appliedAt: data.consultantAppliedAt || null,
  }));
}

// Admin: approve a pending applicant, promoting them to consultant.
export async function approveConsultant(key) {
  const data = await getUser(key);
  if (!data) return { error: "Applicant not found." };
  await updateUser(key, { role: "consultant", consultantStatus: "approved" });
  return { id: key, approved: true };
}

// Resolve a Google sign-in to the shared Firestore user record, keyed by email.
// If the email already exists (e.g. a password account you made admin), that
// same record — including its admin flag — is reused. Otherwise a new
// non-admin Google record is created. Admin is NEVER granted here.
export async function findOrCreateGoogleUser({ email, name, photoURL }) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) return { error: "Google account did not provide a valid email." };

  const key = normalized;
  const existing = await getUser(key);
  if (existing) {
    // Keep the profile photo fresh but never touch admin or credentials here.
    return { id: key, data: existing };
  }

  const record = {
    name: name?.trim() || normalized,
    email: normalized,
    phone: null,
    identifierType: "email",
    provider: "google",
    photoURL: photoURL || null,
    admin: 0,
    role: "client",
    consultantStatus: "none",
    createdAt: new Date().toISOString(),
  };
  const result = await putUserIfAbsent(key, record);
  // If a race created it first, read the winner back.
  if (result.exists) {
    const winner = await getUser(key);
    return { id: key, data: winner || record };
  }
  return { id: key, data: record };
}
