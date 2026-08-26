import { isDatabaseConfigured, ensureDatabaseInitialized, query } from "@/lib/db";

export interface PipelineRun {
  id: string;
  workflowType: string;
  githubRunId?: number;
  status: "queued" | "running" | "success" | "failed";
  triggeredBy: string;
  triggerType: string; // 'admin_manual' | 'cron' | 'repository_dispatch'
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  url?: string;
}

export interface ModelTrainingRun {
  id: string;
  modelKey: string; // 'arima' | 'lag_reg' | 'lstm'
  workflowRunId?: number;
  status: "queued" | "running" | "success" | "failed";
  startedAt: string;
  completedAt?: string;
  trainingDataStart?: string;
  trainingDataEnd?: string;
  metrics?: Record<string, any>;
  artifactVersion?: string;
  artifactHash?: string;
  errorMessage?: string;
}

// In-memory fallback for local environments without PostgreSQL
let inMemoryPipelineRuns: PipelineRun[] = [
  {
    id: "run-init-1",
    workflowType: "data_update",
    status: "success",
    triggeredBy: "cron-job.org",
    triggerType: "cron",
    startedAt: "2026-08-19T08:00:00.000Z",
    completedAt: "2026-08-19T08:04:12.000Z",
    metadata: { note: "15 PSE equities updated with zero errors." },
  },
  {
    id: "run-init-2",
    workflowType: "training",
    status: "success",
    triggeredBy: "github-actions[bot]",
    triggerType: "cron",
    startedAt: "2026-08-17T00:00:00.000Z",
    completedAt: "2026-08-17T00:48:30.000Z",
    metadata: { note: "Retrained ARIMA, Lag-Reg, and LSTM models across 15 tickers." },
  },
];

let inMemoryTrainingRuns: ModelTrainingRun[] = [
  {
    id: "train-init-arima",
    modelKey: "arima",
    status: "success",
    startedAt: "2026-08-17T00:00:00.000Z",
    completedAt: "2026-08-17T00:12:10.000Z",
    trainingDataStart: "2024-01-02",
    trainingDataEnd: "2026-08-14",
    artifactVersion: "v2026.08.17-arima",
    metrics: { median_rmse: 1.45, median_mase: 0.88 },
  },
  {
    id: "train-init-lag",
    modelKey: "lag_reg",
    status: "success",
    startedAt: "2026-08-17T00:12:15.000Z",
    completedAt: "2026-08-17T00:25:30.000Z",
    trainingDataStart: "2024-01-02",
    trainingDataEnd: "2026-08-14",
    artifactVersion: "v2026.08.17-lag",
    metrics: { median_rmse: 1.38, median_mase: 0.82 },
  },
  {
    id: "train-init-lstm",
    modelKey: "lstm",
    status: "success",
    startedAt: "2026-08-17T00:25:35.000Z",
    completedAt: "2026-08-17T00:48:30.000Z",
    trainingDataStart: "2024-01-02",
    trainingDataEnd: "2026-08-14",
    artifactVersion: "v2026.08.17-lstm",
    metrics: { median_rmse: 1.52, median_mase: 0.91 },
  },
];

/**
 * Creates and persists a new pipeline execution run.
 */
export async function recordPipelineRun(run: {
  id: string;
  workflowType: string;
  githubRunId?: number;
  status: "queued" | "running" | "success" | "failed";
  triggeredBy: string;
  triggerType?: string;
  startedAt: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}): Promise<PipelineRun> {
  const fullRun: PipelineRun = {
    id: run.id,
    workflowType: run.workflowType,
    githubRunId: run.githubRunId,
    status: run.status,
    triggeredBy: run.triggeredBy,
    triggerType: run.triggerType || "admin_manual",
    startedAt: run.startedAt,
    errorMessage: run.errorMessage,
    metadata: run.metadata,
  };

  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      await query(
        `INSERT INTO pipeline_runs (
          id, workflow_type, github_run_id, status, triggered_by, trigger_type,
          started_at, error_message, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          github_run_id = COALESCE(EXCLUDED.github_run_id, pipeline_runs.github_run_id),
          status = EXCLUDED.status,
          error_message = EXCLUDED.error_message,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()`,
        [
          fullRun.id,
          fullRun.workflowType,
          fullRun.githubRunId || null,
          fullRun.status,
          fullRun.triggeredBy,
          fullRun.triggerType,
          new Date(fullRun.startedAt),
          fullRun.errorMessage || null,
          fullRun.metadata ? JSON.stringify(fullRun.metadata) : null,
        ]
      );
    } catch (err) {
      console.error("[pipeline] Failed to persist pipeline run to DB:", err);
    }
  }

  inMemoryPipelineRuns = [fullRun, ...inMemoryPipelineRuns.filter((r) => r.id !== fullRun.id)].slice(0, 100);
  return fullRun;
}

/**
 * Updates an existing pipeline run's status and conclusion.
 */
export async function updatePipelineRunStatus(
  id: string,
  status: "queued" | "running" | "success" | "failed",
  details?: {
    completedAt?: string;
    errorMessage?: string;
    githubRunId?: number;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const completedDate = details?.completedAt ? new Date(details.completedAt) : status === "success" || status === "failed" ? new Date() : null;

  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      await query(
        `UPDATE pipeline_runs SET
          status = $2,
          completed_at = COALESCE($3, completed_at),
          error_message = COALESCE($4, error_message),
          github_run_id = COALESCE($5, github_run_id),
          metadata = CASE WHEN $6::jsonb IS NOT NULL THEN metadata || $6::jsonb ELSE metadata END,
          updated_at = NOW()
        WHERE id = $1`,
        [
          id,
          status,
          completedDate,
          details?.errorMessage || null,
          details?.githubRunId || null,
          details?.metadata ? JSON.stringify(details.metadata) : null,
        ]
      );
    } catch (err) {
      console.error("[pipeline] Failed to update pipeline run in DB:", err);
    }
  }

  inMemoryPipelineRuns = inMemoryPipelineRuns.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        status,
        completedAt: completedDate ? completedDate.toISOString() : r.completedAt,
        errorMessage: details?.errorMessage || r.errorMessage,
        githubRunId: details?.githubRunId || r.githubRunId,
        metadata: details?.metadata ? { ...(r.metadata || {}), ...details.metadata } : r.metadata,
      };
    }
    return r;
  });
}

/**
 * Retrieves latest pipeline runs from PostgreSQL.
 */
export async function getPipelineRuns(limit = 30): Promise<PipelineRun[]> {
  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      const rows = await query(
        `SELECT id, workflow_type, github_run_id, status, triggered_by, trigger_type,
                started_at, completed_at, error_message, metadata
         FROM pipeline_runs
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );

      if (rows.length > 0) {
        return rows.map((r: any): PipelineRun => ({
          id: r.id,
          workflowType: r.workflow_type,
          githubRunId: r.github_run_id ? Number(r.github_run_id) : undefined,
          status: r.status,
          triggeredBy: r.triggered_by,
          triggerType: r.trigger_type,
          startedAt: r.started_at ? new Date(r.started_at).toISOString() : new Date().toISOString(),
          completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
          errorMessage: r.error_message || undefined,
          metadata: r.metadata || undefined,
        }));
      }
    } catch (err) {
      console.error("[pipeline] Failed to query pipeline runs from DB:", err);
    }
  }

  return inMemoryPipelineRuns.slice(0, limit);
}

/**
 * Records a model training run into model_training_runs and updates model_registry.
 */
export async function recordModelTrainingRun(run: {
  id: string;
  modelKey: string;
  workflowRunId?: number;
  status: "queued" | "running" | "success" | "failed";
  startedAt: string;
  completedAt?: string;
  trainingDataStart?: string;
  trainingDataEnd?: string;
  metrics?: Record<string, any>;
  artifactVersion?: string;
  artifactHash?: string;
  errorMessage?: string;
}): Promise<ModelTrainingRun> {
  const fullRun: ModelTrainingRun = {
    id: run.id,
    modelKey: run.modelKey,
    workflowRunId: run.workflowRunId,
    status: run.status,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    trainingDataStart: run.trainingDataStart,
    trainingDataEnd: run.trainingDataEnd,
    metrics: run.metrics,
    artifactVersion: run.artifactVersion,
    artifactHash: run.artifactHash,
    errorMessage: run.errorMessage,
  };

  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      await query(
        `INSERT INTO model_training_runs (
          id, model_key, workflow_run_id, status, started_at, completed_at,
          training_data_start, training_data_end, metrics, artifact_version,
          artifact_hash, error_message, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          completed_at = EXCLUDED.completed_at,
          metrics = EXCLUDED.metrics,
          artifact_version = EXCLUDED.artifact_version,
          artifact_hash = EXCLUDED.artifact_hash,
          error_message = EXCLUDED.error_message,
          updated_at = NOW()`,
        [
          fullRun.id,
          fullRun.modelKey,
          fullRun.workflowRunId || null,
          fullRun.status,
          new Date(fullRun.startedAt),
          fullRun.completedAt ? new Date(fullRun.completedAt) : null,
          fullRun.trainingDataStart ? new Date(fullRun.trainingDataStart) : null,
          fullRun.trainingDataEnd ? new Date(fullRun.trainingDataEnd) : null,
          fullRun.metrics ? JSON.stringify(fullRun.metrics) : null,
          fullRun.artifactVersion || null,
          fullRun.artifactHash || null,
          fullRun.errorMessage || null,
        ]
      );

      // If training succeeded, update model_registry last_trained timestamp
      if (fullRun.status === "success") {
        await query(
          `UPDATE model_registry SET
             last_trained = COALESCE($2, NOW()),
             updated_at = NOW(),
             updated_by = 'training-pipeline'
           WHERE model_key = $1`,
          [fullRun.modelKey, fullRun.completedAt ? new Date(fullRun.completedAt) : null]
        );
      }
    } catch (err) {
      console.error("[pipeline] Failed to persist model training run:", err);
    }
  }

  inMemoryTrainingRuns = [fullRun, ...inMemoryTrainingRuns.filter((r) => r.id !== fullRun.id)].slice(0, 50);
  return fullRun;
}

/**
 * Retrieves historical training runs for a specific model key or all models.
 */
export async function getModelTrainingRuns(modelKey?: string, limit = 20): Promise<ModelTrainingRun[]> {
  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      const sql = modelKey
        ? `SELECT id, model_key, workflow_run_id, status, started_at, completed_at,
                  training_data_start, training_data_end, metrics, artifact_version,
                  artifact_hash, error_message
           FROM model_training_runs
           WHERE model_key = $1
           ORDER BY created_at DESC
           LIMIT $2`
        : `SELECT id, model_key, workflow_run_id, status, started_at, completed_at,
                  training_data_start, training_data_end, metrics, artifact_version,
                  artifact_hash, error_message
           FROM model_training_runs
           ORDER BY created_at DESC
           LIMIT $1`;

      const params = modelKey ? [modelKey, limit] : [limit];
      const rows = await query(sql, params);

      if (rows.length > 0) {
        return rows.map((r: any): ModelTrainingRun => ({
          id: r.id,
          modelKey: r.model_key,
          workflowRunId: r.workflow_run_id ? Number(r.workflow_run_id) : undefined,
          status: r.status,
          startedAt: r.started_at ? new Date(r.started_at).toISOString() : new Date().toISOString(),
          completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
          trainingDataStart: r.training_data_start ? new Date(r.training_data_start).toISOString().substring(0, 10) : undefined,
          trainingDataEnd: r.training_data_end ? new Date(r.training_data_end).toISOString().substring(0, 10) : undefined,
          metrics: r.metrics || undefined,
          artifactVersion: r.artifact_version || undefined,
          artifactHash: r.artifact_hash || undefined,
          errorMessage: r.error_message || undefined,
        }));
      }
    } catch (err) {
      console.error("[pipeline] Failed to query model training runs from DB:", err);
    }
  }

  if (modelKey) {
    return inMemoryTrainingRuns.filter((r) => r.modelKey === modelKey).slice(0, limit);
  }
  return inMemoryTrainingRuns.slice(0, limit);
}

/**
 * Retrieves the latest successful training run for a model.
 */
export async function getLatestTrainingRun(modelKey: string): Promise<ModelTrainingRun | null> {
  const runs = await getModelTrainingRuns(modelKey, 1);
  return runs.length > 0 ? runs[0] : null;
}
