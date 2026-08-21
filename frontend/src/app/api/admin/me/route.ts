import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/admin/auth";

export async function GET() {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  const username = await verifySessionToken(sessionCookie);

  if (!username) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    username,
  });
}
