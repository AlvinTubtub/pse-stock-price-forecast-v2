import { NextResponse } from "next/server";
import { getAuditLogs, recordAudit } from "@/lib/admin/audit";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/admin/auth";

export async function GET() {
  const logs = await getAuditLogs();
  return NextResponse.json({ logs });
}

export async function POST(request: Request) {
  try {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
    const username = (await verifySessionToken(sessionCookie)) || "admin";

    const body = await request.json();
    const { action, target, result, details } = body;

    if (!action || !target) {
      return NextResponse.json({ error: "Action and target are required." }, { status: 400 });
    }

    const entry = await recordAudit(username, action, target, result || "success", details);
    return NextResponse.json({ success: true, entry });
  } catch (err: any) {
    console.error("[api/admin/audit] Error creating audit log:", err);
    return NextResponse.json({ error: "Failed to record audit log." }, { status: 500 });
  }
}
