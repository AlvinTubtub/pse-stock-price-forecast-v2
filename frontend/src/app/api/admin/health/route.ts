import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isDatabaseConfigured, ensureDatabaseInitialized, query } from "@/lib/db";
import { getCompanies, getDashboard, getLatest, getMetrics } from "@/lib/data";

interface HealthCheckResult {
  name: string;
  status: "healthy" | "warning" | "error";
  message: string;
  details?: string;
  latencyMs?: number;
  lastChecked?: string;
}

// In-memory cache for Gemini API health probe to prevent excessive rate usage
let lastGeminiCheckTime = 0;
let lastGeminiStatus: { status: "healthy" | "warning" | "error"; message: string; latencyMs: number } = {
  status: "warning",
  message: "Not checked yet",
  latencyMs: 0,
};

export async function GET() {
  const timestamp = new Date().toISOString();
  const checks: Record<string, HealthCheckResult> = {};

  // 1. REAL DATABASE HEALTH CHECK
  const dbStart = performance.now();
  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      const res = await query("SELECT 1 AS ping, NOW() AS server_time");
      const dbLatency = Math.round(performance.now() - dbStart);

      if (res && res.length > 0) {
        checks.database = {
          name: "PostgreSQL Database (Neon)",
          status: "healthy",
          message: "Persistent PostgreSQL connection operational.",
          details: `Latency: ${dbLatency}ms | Connection: Pooled Neon Serverless`,
          latencyMs: dbLatency,
          lastChecked: timestamp,
        };
      } else {
        checks.database = {
          name: "PostgreSQL Database (Neon)",
          status: "error",
          message: "Database returned empty ping response.",
          latencyMs: dbLatency,
          lastChecked: timestamp,
        };
      }
    } catch (err: any) {
      const dbLatency = Math.round(performance.now() - dbStart);
      checks.database = {
        name: "PostgreSQL Database (Neon)",
        status: "error",
        message: `Database query failed: ${err?.message || "Connection error"}`,
        details: "Check DATABASE_URL environment variable and Neon project state.",
        latencyMs: dbLatency,
        lastChecked: timestamp,
      };
    }
  } else {
    checks.database = {
      name: "PostgreSQL Database (Neon)",
      status: "warning",
      message: "DATABASE_URL not set. Running in local filesystem/memory fallback mode.",
      details: "Set DATABASE_URL in Vercel project settings to enable durable cloud persistence.",
      latencyMs: 0,
      lastChecked: timestamp,
    };
  }

  // 2. REAL FORECAST ARTIFACTS VERIFICATION
  const artifactsStart = performance.now();
  let artifactsStatus: "healthy" | "warning" | "error" = "healthy";
  let artifactsMessage = "All JSON forecast artifacts verified.";
  let artifactsDetails = "";

  try {
    const [companies, dashboard, latest, metrics] = await Promise.all([
      getCompanies(),
      getDashboard(),
      getLatest(),
      getMetrics(),
    ]);

    const companyCount = companies.length;
    const hasCoreData = Boolean(dashboard && latest && metrics);

    if (!hasCoreData) {
      artifactsStatus = "error";
      artifactsMessage = "One or more core forecast JSON artifacts failed to load.";
      artifactsDetails = "Missing dashboard.json, latest.json, or metrics.json.";
    } else if (companyCount < 15) {
      artifactsStatus = "warning";
      artifactsMessage = `Loaded ${companyCount}/15 expected PSE company records.`;
      artifactsDetails = `Missing ${15 - companyCount} company forecast JSON files.`;
    } else {
      artifactsStatus = "healthy";
      artifactsMessage = `Verified all 15 PSE equities across ${dashboard?.sectors?.length || 5} sectors.`;
      artifactsDetails = `Forecast Horizon: ${dashboard?.forecastDate || "1 Trading Day"} | Status: ${dashboard?.status || "operational"}`;
    }
  } catch (err: any) {
    artifactsStatus = "error";
    artifactsMessage = `Artifact validation failed: ${err?.message}`;
    artifactsDetails = "Check public/forecasts directory permissions and structure.";
  }

  const artifactsLatency = Math.round(performance.now() - artifactsStart);
  checks.artifacts = {
    name: "Forecast Artifacts (JSON)",
    status: artifactsStatus,
    message: artifactsMessage,
    details: artifactsDetails,
    latencyMs: artifactsLatency,
    lastChecked: timestamp,
  };

  // 3. REAL GITHUB ACTIONS INTEGRATION CHECK
  const ghStart = performance.now();
  const githubToken = process.env.GITHUB_ACTION_TOKEN || process.env.GITHUB_TOKEN;
  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "AlvinTubtub";
  const repoName = process.env.GITHUB_REPOSITORY_NAME || "pse-stock-price-forecast-v2";

  if (githubToken) {
    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?per_page=1`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${githubToken}`,
            "User-Agent": "ForecastPH-Admin-HealthCheck",
          },
          cache: "no-store",
        }
      );

      const ghLatency = Math.round(performance.now() - ghStart);

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        const latestRun = (ghData.workflow_runs || [])[0];

        if (latestRun) {
          const runStatus = latestRun.status;
          const conclusion = latestRun.conclusion || runStatus;
          const isOk = conclusion === "success" || runStatus === "in_progress" || runStatus === "queued";

          checks.github = {
            name: "GitHub Actions Dispatch",
            status: isOk ? "healthy" : "warning",
            message: `Latest Workflow Run #${latestRun.run_number}: ${conclusion}`,
            details: `Target: ${repoOwner}/${repoName} | Event: ${latestRun.event} | Status: ${runStatus}`,
            latencyMs: ghLatency,
            lastChecked: timestamp,
          };
        } else {
          checks.github = {
            name: "GitHub Actions Dispatch",
            status: "healthy",
            message: "Connected to GitHub Actions API (No previous workflow runs found).",
            details: `Target: ${repoOwner}/${repoName}`,
            latencyMs: ghLatency,
            lastChecked: timestamp,
          };
        }
      } else if (ghRes.status === 401 || ghRes.status === 403) {
        checks.github = {
          name: "GitHub Actions Dispatch",
          status: "error",
          message: `GitHub token invalid or unauthorized (HTTP ${ghRes.status}).`,
          details: "Verify GITHUB_ACTION_TOKEN has 'repo' / 'actions:write' permissions.",
          latencyMs: ghLatency,
          lastChecked: timestamp,
        };
      } else {
        checks.github = {
          name: "GitHub Actions Dispatch",
          status: "warning",
          message: `GitHub API returned HTTP ${ghRes.status}.`,
          details: `Target: ${repoOwner}/${repoName}`,
          latencyMs: ghLatency,
          lastChecked: timestamp,
        };
      }
    } catch (err: any) {
      const ghLatency = Math.round(performance.now() - ghStart);
      checks.github = {
        name: "GitHub Actions Dispatch",
        status: "warning",
        message: "Failed to connect to GitHub Actions API.",
        details: err?.message || "Network unreachable",
        latencyMs: ghLatency,
        lastChecked: timestamp,
      };
    }
  } else {
    checks.github = {
      name: "GitHub Actions Dispatch",
      status: "warning",
      message: "GITHUB_ACTION_TOKEN not configured in environment.",
      details: "Running in simulated local dispatch mode.",
      latencyMs: 0,
      lastChecked: timestamp,
    };
  }

  // 4. REAL GEMINI AI PROBE (WITH IN-MEMORY CACHING)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const now = Date.now();

  if (!geminiApiKey) {
    checks.ai = {
      name: "Gemini AI Assistant",
      status: "warning",
      message: "GEMINI_API_KEY not set in environment variables.",
      details: "Floating AI assistant is disabled until API key is provided.",
      latencyMs: 0,
      lastChecked: timestamp,
    };
  } else if (now - lastGeminiCheckTime < 180000 && lastGeminiStatus.status === "healthy") {
    // Return cached probe if within 3 minutes
    checks.ai = {
      name: "Gemini AI Assistant",
      status: lastGeminiStatus.status,
      message: lastGeminiStatus.message,
      details: "Primary: gemini-2.5-flash | Fallback: gemini-2.5-flash-lite (Cached Probe)",
      latencyMs: lastGeminiStatus.latencyMs,
      lastChecked: new Date(lastGeminiCheckTime).toISOString(),
    };
  } else {
    const aiStart = performance.now();
    try {
      // Lightweight verification of Gemini API accessibility
      const probeRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${geminiApiKey}`,
        { method: "GET", cache: "no-store" }
      );
      const aiLatency = Math.round(performance.now() - aiStart);

      if (probeRes.ok) {
        lastGeminiCheckTime = now;
        lastGeminiStatus = {
          status: "healthy",
          message: "Gemini 2.5 Flash model verified and operational.",
          latencyMs: aiLatency,
        };
        checks.ai = {
          name: "Gemini AI Assistant",
          status: "healthy",
          message: lastGeminiStatus.message,
          details: `Primary: gemini-2.5-flash | Latency: ${aiLatency}ms`,
          latencyMs: aiLatency,
          lastChecked: timestamp,
        };
      } else {
        lastGeminiStatus = {
          status: "warning",
          message: `Gemini API returned status ${probeRes.status}.`,
          latencyMs: aiLatency,
        };
        checks.ai = {
          name: "Gemini AI Assistant",
          status: "warning",
          message: lastGeminiStatus.message,
          details: "Check GEMINI_API_KEY validity and quota.",
          latencyMs: aiLatency,
          lastChecked: timestamp,
        };
      }
    } catch (err: any) {
      const aiLatency = Math.round(performance.now() - aiStart);
      checks.ai = {
        name: "Gemini AI Assistant",
        status: "warning",
        message: "Network error checking Gemini API endpoint.",
        details: err?.message || "Probe failed",
        latencyMs: aiLatency,
        lastChecked: timestamp,
      };
    }
  }

  // 5. APPLICATION RUNTIME STATUS
  const memUsageMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
  const uptimeSeconds = Math.round(process.uptime());

  checks.deployment = {
    name: "Next.js Vercel Environment",
    status: "healthy",
    message: `Application runtime active (Uptime: ${uptimeSeconds}s).`,
    details: `Node.js ${process.version} | RSS Memory: ${memUsageMb} MB`,
    latencyMs: 1,
    lastChecked: timestamp,
  };

  // OVERALL SYSTEM HEALTH COMPUTATION
  const hasErrors = Object.values(checks).some((c) => c.status === "error");
  const hasWarnings = Object.values(checks).some((c) => c.status === "warning");
  const overallStatus: "healthy" | "warning" | "error" = hasErrors
    ? "error"
    : hasWarnings
    ? "warning"
    : "healthy";

  return NextResponse.json({
    timestamp,
    overallStatus,
    checks,
  });
}
