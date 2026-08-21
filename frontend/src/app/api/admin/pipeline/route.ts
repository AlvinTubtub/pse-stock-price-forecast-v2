import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getLatest, getDashboard, getCompanies } from "@/lib/data";

interface PipelineRun {
  id: string;
  action: string;
  status: "queued" | "running" | "success" | "failed";
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  message?: string;
}

let inMemoryPipelineRuns: PipelineRun[] = [
  {
    id: "run-init-1",
    action: "Fast Pipeline (Data Ingestion & Inference)",
    status: "success",
    triggeredBy: "cron-job.org",
    startedAt: "2026-08-19T08:00:00.000Z",
    completedAt: "2026-08-19T08:04:12.000Z",
    message: "15 PSE equities updated with zero errors.",
  },
  {
    id: "run-init-2",
    action: "Weekly Model Retraining",
    status: "success",
    triggeredBy: "github-actions[bot]",
    startedAt: "2026-08-17T00:00:00.000Z",
    completedAt: "2026-08-17T00:48:30.000Z",
    message: "Retrained ARIMA, Lag-Reg, and LSTM models across 15 tickers.",
  },
];

export async function GET() {
  const [latest, dashboard, companies] = await Promise.all([
    getLatest(),
    getDashboard(),
    getCompanies(),
  ]);

  return NextResponse.json({
    runs: inMemoryPipelineRuns,
    latestPipelineInfo: {
      dataAsOf: "2026-08-19",
      forecastDate: latest?.forecastDate || "2026-08-20",
      lastRunPHT: latest?.generatedAt || latest?.lastRunAt || new Date().toISOString(),
      activeTickers: dashboard?.totalCompanies || companies.length || 15,
      pipelineStatus: latest?.status || dashboard?.status || "ok",
    },
  });
}

export async function POST(request: Request) {
  try {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
    const username = (await verifySessionToken(sessionCookie)) || "admin";

    const body = await request.json();
    const { action, targetWorkflow } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required." }, { status: 400 });
    }

    const actionLabels: Record<string, string> = {
      data_update: "Fast Pipeline (Data Ingestion & Inference)",
      inference: "Daily Model Inference",
      training: "Weekly Model Retraining",
      export: "Export Frontend Artifacts",
      validate: "Validate Exported Forecasts",
    };

    const actionName = actionLabels[action] || action;
    const runId = `run-${Date.now()}`;
    const startedAt = new Date().toISOString();

    const githubToken = process.env.GITHUB_ACTION_TOKEN || process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "AlvinTubtub";
    const repoName = process.env.GITHUB_REPOSITORY_NAME || "pse-stock-price-forecast";

    let dispatchSuccess = false;
    let dispatchMessage = "";

    if (githubToken) {
      try {
        const workflowFile =
          action === "training" ? "train_models.yml" : "update_pipeline.yml";

        const ghRes = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`,
          {
            method: "POST",
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${githubToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ref: "main" }),
          }
        );

        if (ghRes.ok || ghRes.status === 204) {
          dispatchSuccess = true;
          dispatchMessage = `Dispatched GitHub Actions workflow (${workflowFile}) successfully.`;
        } else {
          const errText = await ghRes.text();
          dispatchMessage = `GitHub API returned status ${ghRes.status}: ${errText}`;
        }
      } catch (err: any) {
        dispatchMessage = `Error contacting GitHub API: ${err?.message}`;
      }
    } else {
      // Local development or simulated dispatch
      dispatchSuccess = true;
      dispatchMessage = `Simulated ${actionName} dispatch (GITHUB_ACTION_TOKEN not set in local environment).`;
    }

    const newRun: PipelineRun = {
      id: runId,
      action: actionName,
      status: dispatchSuccess ? "running" : "failed",
      triggeredBy: username,
      startedAt,
      message: dispatchMessage,
    };

    inMemoryPipelineRuns = [newRun, ...inMemoryPipelineRuns].slice(0, 50);

    await recordAudit(
      username,
      `Triggered ${actionName}`,
      "Data Pipeline",
      dispatchSuccess ? "success" : "failed",
      dispatchMessage
    );

    return NextResponse.json({
      success: dispatchSuccess,
      run: newRun,
      message: dispatchMessage,
    });
  } catch (err: any) {
    console.error("[api/admin/pipeline] Error triggering pipeline:", err);
    return NextResponse.json(
      { error: "Failed to trigger pipeline action." },
      { status: 500 }
    );
  }
}
