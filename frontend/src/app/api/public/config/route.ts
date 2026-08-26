import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/admin/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Read ONLY the published configuration from Neon PostgreSQL (or fallback)
    const config = await getSiteConfig(false);

    // Return strictly sanitized public fields (never secrets, credentials, or audit internals)
    const safePublicConfig = {
      version: config.version,
      lastUpdated: config.lastUpdated,
      layoutMode: config.layoutMode || "standard",
      content: {
        heroTitle: config.content?.heroTitle,
        heroDescription: config.content?.heroDescription,
        dataSourceText: config.content?.dataSourceText,
        disclaimerText: config.content?.disclaimerText,
        announcement: config.content?.announcement,
      },
      features: config.features,
      navigation: config.navigation,
      ai: {
        enabled: Boolean(config.ai?.enabled ?? true),
        starterQuestions: config.ai?.starterQuestions || {},
      },
      companies: config.companies,
      forecastPublication: config.forecastPublication,
    };

    return NextResponse.json(safePublicConfig, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    console.error("[public-config] Failed to retrieve published configuration:", err);
    return NextResponse.json(
      { error: "Unable to retrieve public configuration." },
      { status: 500 }
    );
  }
}
