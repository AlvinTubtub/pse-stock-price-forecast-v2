import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";

export async function POST() {
  try {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
    const username = await verifySessionToken(sessionCookie);

    if (username) {
      await recordAudit(
        username,
        "Administrator Logout",
        "Admin Portal",
        "success",
        "Terminated admin session."
      );
    }

    cookies().delete(SESSION_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err: any) {
    console.error("[api/admin/logout] Logout error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during logout." },
      { status: 500 }
    );
  }
}
