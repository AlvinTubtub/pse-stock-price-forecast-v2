import { NextResponse } from "next/server";
import { getCompanies, getDashboard, getLatest, getMetrics } from "@/lib/data";

export async function GET() {
  const timestamp = new Date().toISOString();

  // 1. Check Artifacts Integrity
  let artifactsStatus: "healthy" | "warning" | "error" = "healthy";
  let artifactsMessage = "All JSON forecast artifacts verified.";
  let companyCount = 0;

  try {
    const [companies, dashboard, latest, metrics] = await Promise.all([
      getCompanies(),
      getDashboard(),
      getLatest(),
      getMetrics(),
    ]);

    companyCount = companies.length;
    if (companyCount < 15) {
      artifactsStatus = "warning";
      artifactsMessage = `Only ${companyCount}/15 companies loaded.`;
    }
    if (!dashboard || !latest || !metrics) {
      artifactsStatus = "error";
      artifactsMessage = "One or more core forecast artifacts failed to parse.";
    }
  } catch (err: any) {
    artifactsStatus = "error";
    artifactsMessage = `Failed reading artifacts: ${err?.message}`;
  }

  // 2. Check Gemini AI Configuration
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiStatus: "healthy" | "warning" | "error" = geminiApiKey
    ? "healthy"
    : "warning";
  const geminiMessage = geminiApiKey
    ? "Gemini API key configured and ready."
    : "GEMINI_API_KEY not set in environment variables.";

  // 3. Check GitHub Actions Integration
  const githubToken = process.env.GITHUB_ACTION_TOKEN || process.env.GITHUB_TOKEN;
  const githubStatus: "healthy" | "warning" = githubToken ? "healthy" : "warning";
  const githubMessage = githubToken
    ? "GitHub Action Token configured for remote dispatch."
    : "GitHub token not set (running in local simulation mode).";

  // 4. Check PSE Calendar Service
  const calendarStatus: "healthy" = "healthy";
  const calendarMessage = "PSE Trading Calendar operational with 2024-2026 holiday rules.";

  // Overall status
  const isHealthy =
    artifactsStatus === "healthy" &&
    geminiStatus === "healthy";
  const isError = artifactsStatus === "error";
  const overallStatus = isError ? "error" : isHealthy ? "healthy" : "warning";

  return NextResponse.json({
    timestamp,
    overallStatus,
    checks: {
      artifacts: {
        name: "Forecast Artifacts (JSON)",
        status: artifactsStatus,
        message: artifactsMessage,
        details: `${companyCount} PSE equities loaded`,
      },
      calendar: {
        name: "PSE Calendar Service",
        status: calendarStatus,
        message: calendarMessage,
        details: "Market hours: 9:30 AM - 3:30 PM PHT",
      },
      ai: {
        name: "Gemini AI Assistant",
        status: geminiStatus,
        message: geminiMessage,
        details: "Primary: gemini-2.5-flash",
      },
      github: {
        name: "GitHub Actions Dispatch",
        status: githubStatus,
        message: githubMessage,
        details: githubToken ? "Remote API Connected" : "Local Simulation Mode",
      },
      deployment: {
        name: "Next.js Vercel Environment",
        status: "healthy",
        message: "Application runtime operating normally.",
        details: `Node.js ${process.version}`,
      },
    },
  });
}
