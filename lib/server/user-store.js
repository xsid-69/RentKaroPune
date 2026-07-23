import "server-only";
import { getDb } from "./admin";

// Cloud Firestore-backed user store. Users live in the "users" collection,
// keyed by their normalized identifier (email or "phone:<digits>").
const COLLECTION = "users";

export async function getUser(key) {
  const snapshot = await getDb().collection(COLLECTION).doc(key).get();
  return snapshot.exists ? snapshot.data() : null;
}

// Create only if the key is free. Runs in a transaction so two concurrent
// registrations can't both create the same account.
export async function putUserIfAbsent(key, record) {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(key);
  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (snapshot.exists) return { exists: true };
    tx.set(ref, record);
    return { created: record };
  });
}

// Merge a partial update into an existing user document.
export async function updateUser(key, partial) {
  await getDb().collection(COLLECTION).doc(key).set(partial, { merge: true });
}

// Return all users whose consultantStatus matches the given value.
export async function listUsersByConsultantStatus(status) {
  const snapshot = await getDb().collection(COLLECTION).where("consultantStatus", "==", status).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}
