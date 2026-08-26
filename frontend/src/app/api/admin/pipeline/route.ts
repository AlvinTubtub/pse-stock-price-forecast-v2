import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getLatest, getDashboard, getCompanies } from "@/lib/data";
import {
  recordPipelineRun,
  updatePipelineRunStatus,
  getPipelineRuns,
  PipelineRun,
} from "@/lib/admin/pipeline";

const ACTION_LABELS: Record<string, string> = {
  data_update: "Run Data Update",
  inference: "Run Daily Inference",
  training: "Weekly Model Retraining",
  export: "Export Frontend Artifacts",
  validate: "Validate Export Artifacts",
};

const ACTION_AUDIT_KEYS: Record<string, string> = {
  data_update: "PIPELINE_DATA_UPDATE_TRIGGERED",
  inference: "PIPELINE_INFERENCE_TRIGGERED",
  training: "PIPELINE_TRAINING_TRIGGERED",
  export: "PIPELINE_EXPORT_TRIGGERED",
  validate: "PIPELINE_VALIDATION_TRIGGERED",
};

export async function GET() {
  const [latest, dashboard, companies, persistedRuns] = await Promise.all([
    getLatest(),
    getDashboard(),
    getCompanies(),
    getPipelineRuns(30),
  ]);

  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "AlvinTubtub";
  const repoName = process.env.GITHUB_REPOSITORY_NAME || "pse-stock-price-forecast-v2";
  const githubToken = process.env.GITHUB_ACTION_TOKEN || process.env.GITHUB_TOKEN;

  let finalRuns: PipelineRun[] = persistedRuns;

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

          let workflowType = "data_update";
          let actionName = r.name || "Pipeline Execution";
          if (r.path?.includes("train_models.yml") || r.name?.toLowerCase().includes("training")) {
            workflowType = "training";
            actionName = "Weekly Model Retraining";
          } else if (r.path?.includes("update_pipeline.yml") || r.name?.toLowerCase().includes("fast pipeline")) {
            workflowType = "data_update";
            actionName = "Fast Pipeline";
          }

          // Sync completion status back to database if matching run exists
          const matchingDbRun = persistedRuns.find(
            (p) => p.githubRunId === r.id || (p.status === "running" && Math.abs(new Date(p.startedAt).getTime() - new Date(r.created_at).getTime()) < 120000)
          );

          if (matchingDbRun && matchingDbRun.status !== status) {
            updatePipelineRunStatus(matchingDbRun.id, status, {
              completedAt: r.status === "completed" ? r.updated_at : undefined,
              githubRunId: r.id,
              errorMessage: status === "failed" ? `GitHub run #${r.run_number} failed with conclusion: ${r.conclusion}` : undefined,
            }).catch(() => {});
          }

          return {
            id: String(r.id),
            workflowType,
            githubRunId: r.id,
            status,
            triggeredBy: r.triggering_actor?.login || r.actor?.login || "github-actions",
            triggerType: r.event === "schedule" ? "cron" : r.event === "workflow_dispatch" ? "admin_manual" : r.event,
            startedAt: r.run_started_at || r.created_at,
            completedAt: r.status === "completed" ? r.updated_at : undefined,
            errorMessage: status === "failed" ? `Workflow run failed (${r.conclusion})` : undefined,
            metadata: { title: r.display_title || r.name, workflow: r.path },
            url: r.html_url,
          };
        });

        // Merge optimistic/queued DB runs that haven't appeared on GitHub yet
        const recentDbRuns = persistedRuns.filter(
          (dbRun) => !runsFromGh.some((ghRun: PipelineRun) => ghRun.githubRunId === dbRun.githubRunId || ghRun.id === dbRun.id)
        );

        finalRuns = [...recentDbRuns, ...runsFromGh];
      }
    } catch (err) {
      console.warn("[api/admin/pipeline] Failed to synchronize live GitHub runs:", err);
    }
  }

  return NextResponse.json({
    runs: finalRuns.slice(0, 30),
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
    const auditEvent = ACTION_AUDIT_KEYS[action] || `PIPELINE_${action.toUpperCase()}_TRIGGERED`;
    const runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const startedAt = new Date().toISOString();

    const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "AlvinTubtub";
    const repoName = process.env.GITHUB_REPOSITORY_NAME || "pse-stock-price-forecast-v2";
    const githubToken = process.env.GITHUB_ACTION_TOKEN || process.env.GITHUB_TOKEN;

    // 1. Create initial pipeline_runs record in PostgreSQL
    const initialRun = await recordPipelineRun({
      id: runId,
      workflowType: action,
      status: "queued",
      triggeredBy: username,
      triggerType: "admin_manual",
      startedAt,
      metadata: { actionLabel: actionName, repo: `${repoOwner}/${repoName}` },
    });

    let dispatchSuccess = false;
    let dispatchMessage = "";

    if (githubToken) {
      const isTraining = action === "training";
      const workflowFile = isTraining ? "train_models.yml" : "update_pipeline.yml";

      const dispatchPayload = isTraining
        ? { ref: "main" }
        : {
            ref: "main",
            inputs: { action },
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

          // Update status to running
          await updatePipelineRunStatus(runId, "running", {
            metadata: { workflowFile, message: dispatchMessage },
          });
        } else {
          // Administrator-safe error mapping without leaking secrets
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

          // Update status to failed
          await updatePipelineRunStatus(runId, "failed", {
            errorMessage: dispatchMessage,
          });
        }
      } catch (err: any) {
        dispatchMessage = "Network error communicating with GitHub Actions API.";
        await updatePipelineRunStatus(runId, "failed", {
          errorMessage: dispatchMessage,
        });
      }
    } else {
      // Local development simulation fallback
      dispatchSuccess = true;
      dispatchMessage = `Simulated ${actionName} dispatch (GITHUB_ACTION_TOKEN not configured in local environment). Target: ${repoOwner}/${repoName}`;
      await updatePipelineRunStatus(runId, "running", {
        metadata: { simulated: true, note: dispatchMessage },
      });
    }

    // 2. Record persistent audit log
    await recordAudit(
      username,
      auditEvent,
      "Data Pipeline",
      dispatchSuccess ? "success" : "failed",
      dispatchMessage
    );

    if (!dispatchSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: dispatchMessage,
          run: { ...initialRun, status: "failed", errorMessage: dispatchMessage },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      run: { ...initialRun, status: "running" },
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
