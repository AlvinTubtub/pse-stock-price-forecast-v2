import { NextResponse } from "next/server";
import { verifyAuditIntegrity } from "@/lib/admin/audit";

export async function GET() {
  try {
    const result = await verifyAuditIntegrity();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/admin/audit/verify] Verification failed:", err);
    return NextResponse.json(
      { valid: false, message: err?.message || "Audit integrity check failed." },
      { status: 500 }
    );
  }
}
