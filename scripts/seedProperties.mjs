import { initializeApp } from "firebase/app";
import { collection, doc, getFirestore, serverTimestamp, writeBatch } from "firebase/firestore";
import { cert, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { FieldValue, getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][\w]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const hasAdminCredentials = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const missing = ["apiKey", "authDomain", "projectId", "appId"].filter((key) => !firebaseConfig[key]);
if (!hasAdminCredentials && missing.length) throw new Error(`Missing Firebase config: ${missing.join(", ")}. Add it to .env.local.`);

const properties = JSON.parse(readFileSync(resolve(root, "data", "properties.json"), "utf8"));
if (!Array.isArray(properties) || !properties.length) throw new Error("data/properties.json must contain a non-empty array.");
for (const [index, item] of properties.entries()) {
  if (!item?.title || !item?.location || !Number.isFinite(item?.rent) || !Array.isArray(item?.images) || !item.images.length) {
    throw new Error(`Invalid property at index ${index}: title, location, numeric rent, and images are required.`);
  }
}

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
const idFor = (item) => `${slug(item.title)}-${createHash("sha256").update(`${item.title}|${item.address}`).digest("hex").slice(0, 8)}`;
const recordFor = (property, timestamp) => ({
  ...property,
  id: idFor(property),
  amenities: Array.isArray(property.amenities) ? property.amenities : [property.parking].filter(Boolean),
  createdAt: timestamp,
});

async function seedDatabase() {
  console.log(`Starting upload of ${properties.length} Pune rental properties...`);
  if (hasAdminCredentials) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const adminApp = initializeAdminApp({ credential: cert(serviceAccount) }, "rentkaropune-property-seeder-admin");
    const adminDb = process.env.FIRESTORE_DATABASE_ID
      ? getAdminFirestore(adminApp, process.env.FIRESTORE_DATABASE_ID)
      : getAdminFirestore(adminApp);
    const batch = adminDb.batch();
    properties.forEach((property) => batch.set(adminDb.collection("properties").doc(idFor(property)), recordFor(property, FieldValue.serverTimestamp()), { merge: true }));
    await batch.commit();
  } else {
    const app = initializeApp(firebaseConfig, "rentkaropune-property-seeder");
    const clientDb = getFirestore(app);
    const propertiesCollection = collection(clientDb, "properties");
    const batch = writeBatch(clientDb);
    properties.forEach((property) => batch.set(doc(propertiesCollection, idFor(property)), recordFor(property, serverTimestamp()), { merge: true }));
    await batch.commit();
  }
  console.log(`Success! Seeded ${properties.length} rental properties into Cloud Firestore.`);
}

seedDatabase().catch((error) => {
  console.error("Property seed failed:", error?.message || error);
  if (error?.code === "permission-denied") console.error("The current Firestore rules reject unauthenticated client writes; run with rules that explicitly permit this one-time seed or use an Admin SDK seeder.");
  process.exitCode = 1;
});