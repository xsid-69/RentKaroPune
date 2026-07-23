// Standalone Firestore connectivity check.
// Usage: node scripts/test-firestore.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// --- Minimal .env.local parser (handles single-quoted multiline-ish values) ---
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envRaw = readFileSync(join(root, ".env.local"), "utf8");
const env = {};
const re = /^([A-Z0-9_]+)\s*=\s*(?:'([\s\S]*?)'|"([\s\S]*?)"|(.*))$/gm;
let m;
while ((m = re.exec(envRaw)) !== null) {
  env[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
}

const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
const databaseId = env.FIRESTORE_DATABASE_ID || undefined;

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

async function tryDb(id) {
  const label = id ?? "(default)";
  const db = id ? getFirestore(id) : getFirestore();
  const ref = db.collection("_connectivity_test").doc("ping");
  await ref.set({ at: new Date().toISOString() });
  const snap = await ref.get();
  await ref.delete();
  console.log(`OK  database="${label}" write+read+delete succeeded ->`, snap.data());
}

const candidates = [databaseId, databaseId === "(default)" ? undefined : "(default)"];
for (const id of candidates) {
  try {
    await tryDb(id);
    console.log(`\n>>> USE FIRESTORE_DATABASE_ID=${id === undefined ? "(leave unset / (default))" : id}`);
    process.exit(0);
  } catch (err) {
    console.log(`FAIL database="${id ?? "(default)"}" -> ${err.code || ""} ${err.message}`);
  }
}
console.error("\nCould not connect to any database id. See errors above.");
process.exit(1);
