import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Safe config check — reports ONLY booleans, never secret values.
// Visit /api/health on the deployed site to confirm env vars are set.
export async function GET() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "";
  let serviceAccountParses = false;
  let serviceAccountProjectId = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      serviceAccountParses = true;
      serviceAccountProjectId = parsed.project_id || null;
    } catch {
      serviceAccountParses = false;
    }
  }

  // Try a trivial Firestore read to confirm the Admin SDK connects.
  let firestoreOk = false;
  let firestoreError = null;
  try {
    const { getDb } = await import("@/lib/server/admin");
    await getDb().collection("_health").limit(1).get();
    firestoreOk = true;
  } catch (error) {
    firestoreError = error?.message || String(error);
  }

  return NextResponse.json({
    env: {
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      hasServiceAccountKey: Boolean(raw),
      serviceAccountParses,
      serviceAccountProjectId,
      firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || "(unset → (default))",
      publicFirebase: {
        apiKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || null,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
      },
    },
    firestore: { ok: firestoreOk, error: firestoreError },
  });
}
