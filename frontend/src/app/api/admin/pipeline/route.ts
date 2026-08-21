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
  url?: string;
}

// In-memory cache for recent dispatches and local fallback
let inMemoryPipelineRuns: PipelineRun[] = [
  {
    id: "run-init-1",
    action: "Fast Pipeline (data_update)",
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

const ACTION_LABELS: Record<string, string> = {
  data_update: "Run Data Update",
  inference: "Run Daily Inference",
  training: "Weekly Model Retraining",
  export: "Export Frontend Artifacts",
  validate: "Validate Export Artifacts",
};

export async function GET() {
  const [latest, dashboard, companies] = await Promise.all([
    getLatest(),
    getDashboard(),
    getCompanies(),
  ]);

  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "AlvinTubtub";
  const repoName = process.env.GITHUB_REPOSITORY_NAME || "pse-stock-price-forecast-v2";
  const githubToken = process.env.GITHUB_ACTION_TOKEN || process.env.GITHUB_TOKEN;

  let liveRuns: PipelineRun[] = [];

  if (githubToken) {
    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?per_page=15`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${githubToken}`,
            "User-Agent": "ForecastPH-Admin-Console",
          },
          cache: "no-store",
        }
      );

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        const runsFromGh = (ghData.workflow_runs || []).map((r: any): PipelineRun => {
          let status: PipelineRun["status"] = "queued";
          if (r.status === "queued" || r.status === "waiting" || r.status === "requested") {
            status = "queued";
          } else if (r.status === "in_progress") {
            status = "running";
          } else if (r.status === "completed") {
            status = r.conclusion === "success" ? "success" : "failed";
          }

          let actionName = r.name || "Pipeline Execution";
          if (r.path?.includes("train_models.yml") || r.name?.toLowerCase().includes("training")) {
            actionName = "Weekly Model Retraining";
          } else if (r.path?.includes("update_pipeline.yml") || r.name?.toLowerCase().includes("fast pipeline")) {
            actionName = "Fast Pipeline";
          }

          return {
            id: String(r.id),
            action: actionName,
            status,
            triggeredBy: r.triggering_actor?.login || r.actor?.login || "github-actions",
            startedAt: r.run_started_at || r.created_at,
            completedAt: r.status === "completed" ? r.updated_at : undefined,
            message: r.display_title || r.name,
            url: r.html_url,
          };
        });

        // Merge any very recent in-memory optimistic dispatches that haven't appeared in GH yet (< 30s old)
        const recentOptimistic = inMemoryPipelineRuns.filter((m) => {
          const ageMs = Date.now() - new Date(m.startedAt).getTime();
          return ageMs < 30000 && !runsFromGh.some((gh: PipelineRun) => gh.startedAt === m.startedAt);
        });

        liveRuns = [...recentOptimistic, ...runsFromGh];
      } else {
        liveRuns = inMemoryPipelineRuns;
      }
    } catch (err) {
      console.warn("[api/admin/pipeline] Failed to fetch GitHub Actions runs:", err);
      liveRuns = inMemoryPipelineRuns;
    }
  } else {
    liveRuns = inMemoryPipelineRuns;
  }

  return NextResponse.json({
    runs: liveRuns,
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
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Action parameter is required." }, { status: 400 });
    }

    const validActions = ["data_update", "inference", "training", "export", "validate"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action '${action}'. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    const actionName = ACTION_LABELS[action] || action;
    const runId = `dispatch-${Date.now()}`;
    const startedAt = new Date().toISOString();

    const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "AlvinTubtub";
    const repoName = process.env.GITHUB_REPOSITORY_NAME || "pse-stock-price-forecast-v2";
    const githubToken = process.env.GITHUB_ACTION_TOKEN || process.env.GITHUB_TOKEN;

    let dispatchSuccess = false;
    let dispatchMessage = "";

    if (githubToken) {
      const isTraining = action === "training";
      const workflowFile = isTraining ? "train_models.yml" : "update_pipeline.yml";

      // Training has no action input; all other actions pass inputs.action
      const dispatchPayload = isTraining
        ? { ref: "main" }
        : {
            ref: "main",
            inputs: {
              action: action, // "data_update" | "inference" | "export" | "validate"
            },
          };

      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`,
          {
            method: "POST",
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${githubToken}`,
              "Content-Type": "application/json",
              "User-Agent": "ForecastPH-Admin-Console",
            },
            body: JSON.stringify(dispatchPayload),
          }
        );

        if (ghRes.ok || ghRes.status === 204) {
          dispatchSuccess = true;
          dispatchMessage = `Triggered '${workflowFile}' for action '${action}' in ${repoOwner}/${repoName}.`;
        } else {
          // Administrator-safe error mapping without leaking secrets or tokens
          switch (ghRes.status) {
            case 401:
              dispatchMessage = "GitHub authentication failed: GITHUB_ACTION_TOKEN is invalid or expired.";
              break;
            case 403:
              dispatchMessage = `Permission denied: GITHUB_ACTION_TOKEN lacks required 'repo' or 'actions:write' permission for ${repoOwner}/${repoName}.`;
              break;
            case 404:
              dispatchMessage = `Workflow (${workflowFile}) or repository (${repoOwner}/${repoName}) not found. Verify repository permissions.`;
              break;
            case 422:
              dispatchMessage = `Validation failed: GitHub rejected the workflow dispatch parameters for ${workflowFile}.`;
              break;
            default:
              dispatchMessage = `GitHub Actions API returned error status ${ghRes.status}.`;
          }
        }
      } catch (err: any) {
        dispatchMessage = "Network error communicating with GitHub Actions API.";
      }
    } else {
      // Local development simulation fallback
      dispatchSuccess = true;
      dispatchMessage = `Simulated ${actionName} dispatch (GITHUB_ACTION_TOKEN not configured in local environment). Target: ${repoOwner}/${repoName}`;
    }

    const newRun: PipelineRun = {
      id: runId,
      action: actionName,
      status: dispatchSuccess ? "queued" : "failed",
      triggeredBy: username,
      startedAt,
      message: dispatchMessage,
    };

    inMemoryPipelineRuns = [newRun, ...inMemoryPipelineRuns].slice(0, 50);

    await recordAudit(
      username,
      `Triggered ${actionName} (${action})`,
      "Data Pipeline",
      dispatchSuccess ? "success" : "failed",
      dispatchMessage
    );

    if (!dispatchSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: dispatchMessage,
          run: newRun,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      run: newRun,
      message: dispatchMessage,
    });
  } catch (err: any) {
    console.error("[api/admin/pipeline] Unexpected error triggering pipeline:", err);
    return NextResponse.json(
      { error: "Internal server error triggering pipeline action." },
      { status: 500 }
    );
  }
}
