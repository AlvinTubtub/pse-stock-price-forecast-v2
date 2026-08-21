import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const isValid = verifyCredentials(username, password);

    if (!isValid) {
      await recordAudit(
        username || "unknown",
        "Failed Login Attempt",
        "Admin Portal",
        "failed",
        "Invalid username or password supplied."
      );

      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const token = await createSessionToken(cleanUsername);

    // Set secure HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production";
    cookies().set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    await recordAudit(
      cleanUsername,
      "Administrator Login",
      "Admin Portal",
      "success",
      "Successfully authenticated into admin session."
    );

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      message: "Authenticated successfully.",
    });
  } catch (err: any) {
    console.error("[api/admin/login] Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
