import { NextResponse } from "next/server";
import { getStorageBucket } from "@/lib/server/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bucket = getStorageBucket();
    const [exists] = await bucket.exists();
    if (!exists) {
      return NextResponse.json({
        ready: false,
        error: "Firebase Storage is not enabled. Create the default bucket in Firebase Console → Storage, using asia-south1, then deploy storage.rules.",
      }, { status: 503 });
    }
    return NextResponse.json({ ready: true });
  } catch (error) {
    const missing = error?.code === 404 || Number(error?.code) === 404;
    return NextResponse.json({
      ready: false,
      error: missing
        ? "Firebase Storage is not enabled. Create the default bucket in Firebase Console → Storage, using asia-south1, then deploy storage.rules."
        : "Firebase Storage readiness could not be verified.",
    }, { status: 503 });
  }
}
