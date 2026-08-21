import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/admin/auth";
import { getSiteConfig, saveSiteConfig, publishDraftConfig } from "@/lib/admin/config";
import { recordAudit } from "@/lib/admin/audit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const draft = searchParams.get("draft") === "true";
  const config = await getSiteConfig(draft);
  return NextResponse.json({ config });
}

export async function POST(request: Request) {
  try {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
    const username = (await verifySessionToken(sessionCookie)) || "admin";

    const body = await request.json();
    const { action, config, asDraft, changesSummary } = body;

    if (action === "publish_draft") {
      const published = await publishDraftConfig(username);
      await recordAudit(
        username,
        "Published Draft Configuration",
        "Site Configuration",
        "success",
        changesSummary || "Published all pending draft configuration changes to public site."
      );
      return NextResponse.json({ success: true, config: published });
    }

    if (config) {
      const saved = await saveSiteConfig(config, username, asDraft ?? false);
      await recordAudit(
        username,
        asDraft ? "Saved Draft Configuration" : "Saved & Published Configuration",
        "Site Configuration",
        "success",
        changesSummary || (asDraft ? "Updated draft site configuration." : "Updated published site configuration.")
      );
      return NextResponse.json({ success: true, config: saved });
    }

    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  } catch (err: any) {
    console.error("[api/admin/config] Error saving configuration:", err);
    return NextResponse.json(
      { error: "Failed to save configuration." },
      { status: 500 }
    );
  }
}
