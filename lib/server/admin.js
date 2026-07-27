import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let cachedDb = null;

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Paste your Admin SDK service account JSON into .env.local."
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Ensure the whole file is on one line.");
  }
}

function getAdminApp() {
  if (getApps().length) return getApp();
  return initializeApp({ credential: cert(loadServiceAccount()) });
}

// Firestore handle, initialized lazily so the build and unrelated routes never
// require the service account to be present.
export function getDb() {
  if (!cachedDb) {
    const databaseId = process.env.FIRESTORE_DATABASE_ID;
    const app = getAdminApp();
    // Use a named database if provided, otherwise the project's "(default)".
    cachedDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
  return cachedDb;
}

// Firebase Auth admin handle, used to verify Google ID tokens server-side.
export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getStorageBucket() {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) throw new Error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set.");
  return getStorage(getAdminApp()).bucket(bucketName);
}
