import { Pool, neon } from "@neondatabase/serverless";

let pool: Pool | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function isDatabaseConfigured(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && url.trim().length > 0 && !url.includes("placeholder"));
}

export function getDbPool(): Pool | null {
  if (!isDatabaseConfigured()) {
    return null;
  }
  if (!pool) {
    const connectionString = getDatabaseUrl()!;
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const p = getDbPool();
  if (!p) {
    throw new Error("DATABASE_URL is not configured.");
  }
  const client = await p.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

export async function executeInTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const p = getDbPool();
  if (!p) {
    throw new Error("DATABASE_URL is not configured.");
  }
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Ensures all required PostgreSQL tables exist. Runs automatically on startup.
 */
export async function ensureDatabaseInitialized(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }
  if (isInitialized) {
    return true;
  }
  if (initPromise) {
    await initPromise;
    return isInitialized;
  }

  initPromise = (async () => {
    try {
      // 1. Create all tables if they don't exist
      await query(`
        CREATE TABLE IF NOT EXISTS site_config (
            id VARCHAR(50) PRIMARY KEY,
            version INT NOT NULL DEFAULT 1,
            layout_mode VARCHAR(20) NOT NULL DEFAULT 'standard',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
        );

        CREATE TABLE IF NOT EXISTS frontend_features (
            config_id VARCHAR(50) NOT NULL REFERENCES site_config(id) ON DELETE CASCADE,
            feature_key VARCHAR(50) NOT NULL,
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
            PRIMARY KEY (config_id, feature_key)
        );

        CREATE TABLE IF NOT EXISTS navigation_items (
            config_id VARCHAR(50) NOT NULL REFERENCES site_config(id) ON DELETE CASCADE,
            id VARCHAR(50) NOT NULL,
            href VARCHAR(255) NOT NULL,
            label VARCHAR(100) NOT NULL,
            visible BOOLEAN NOT NULL DEFAULT TRUE,
            is_immutable BOOLEAN NOT NULL DEFAULT FALSE,
            display_order INT NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
            PRIMARY KEY (config_id, id)
        );

        CREATE TABLE IF NOT EXISTS content_config (
            config_id VARCHAR(50) PRIMARY KEY REFERENCES site_config(id) ON DELETE CASCADE,
            hero_title TEXT NOT NULL,
            hero_description TEXT NOT NULL,
            data_source_text TEXT NOT NULL,
            disclaimer_text TEXT NOT NULL,
            announcement_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            announcement_text TEXT NOT NULL DEFAULT '',
            announcement_type VARCHAR(20) NOT NULL DEFAULT 'info',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
        );

        CREATE TABLE IF NOT EXISTS ai_config (
            config_id VARCHAR(50) PRIMARY KEY REFERENCES site_config(id) ON DELETE CASCADE,
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            primary_model VARCHAR(100) NOT NULL DEFAULT 'gemini-2.5-flash',
            fallback_model VARCHAR(100) NOT NULL DEFAULT 'gemini-2.5-flash-lite',
            custom_guidelines TEXT,
            starter_questions JSONB,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
        );

        CREATE TABLE IF NOT EXISTS tracked_companies (
            config_id VARCHAR(50) NOT NULL REFERENCES site_config(id) ON DELETE CASCADE,
            symbol VARCHAR(20) NOT NULL,
            visible BOOLEAN NOT NULL DEFAULT TRUE,
            featured BOOLEAN NOT NULL DEFAULT FALSE,
            display_order INT NOT NULL DEFAULT 0,
            display_name_alias VARCHAR(100),
            sector_description TEXT,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
            PRIMARY KEY (config_id, symbol)
        );

        CREATE TABLE IF NOT EXISTS forecast_publications (
            config_id VARCHAR(50) NOT NULL REFERENCES site_config(id) ON DELETE CASCADE,
            symbol VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'published',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
            PRIMARY KEY (config_id, symbol)
        );

        CREATE TABLE IF NOT EXISTS trading_calendar (
            date DATE PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            is_custom BOOLEAN NOT NULL DEFAULT TRUE,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
        );

        CREATE TABLE IF NOT EXISTS model_registry (
            model_key VARCHAR(50) PRIMARY KEY,
            model_name VARCHAR(100) NOT NULL,
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            model_type VARCHAR(50) NOT NULL,
            last_trained TIMESTAMPTZ,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
        );

        CREATE TABLE IF NOT EXISTS pipeline_runs (
            id VARCHAR(100) PRIMARY KEY,
            workflow_type VARCHAR(50) NOT NULL,
            github_run_id BIGINT,
            status VARCHAR(30) NOT NULL,
            triggered_by VARCHAR(100) NOT NULL,
            trigger_type VARCHAR(50) NOT NULL DEFAULT 'admin_manual',
            started_at TIMESTAMPTZ NOT NULL,
            completed_at TIMESTAMPTZ,
            error_message TEXT,
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created_at ON pipeline_runs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
        CREATE INDEX IF NOT EXISTS idx_pipeline_runs_workflow_type ON pipeline_runs(workflow_type);

        CREATE TABLE IF NOT EXISTS model_training_runs (
            id VARCHAR(100) PRIMARY KEY,
            model_key VARCHAR(50) NOT NULL,
            workflow_run_id BIGINT,
            status VARCHAR(30) NOT NULL,
            started_at TIMESTAMPTZ NOT NULL,
            completed_at TIMESTAMPTZ,
            training_data_start DATE,
            training_data_end DATE,
            metrics JSONB,
            artifact_version VARCHAR(50),
            artifact_hash VARCHAR(100),
            error_message TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_model_training_runs_model_key ON model_training_runs(model_key);
        CREATE INDEX IF NOT EXISTS idx_model_training_runs_completed_at ON model_training_runs(completed_at DESC);
        CREATE INDEX IF NOT EXISTS idx_model_training_runs_status ON model_training_runs(status);

        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(100) PRIMARY KEY,
            event_id VARCHAR(100) NOT NULL,
            occurred_at TIMESTAMPTZ NOT NULL,
            actor VARCHAR(100) NOT NULL,
            action VARCHAR(100) NOT NULL,
            target_type VARCHAR(100) NOT NULL,
            target_id VARCHAR(100) NOT NULL,
            result VARCHAR(30) NOT NULL,
            details TEXT,
            previous_hash VARCHAR(64) NOT NULL,
            record_hash VARCHAR(64) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred_at ON audit_logs(occurred_at DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      `);

      isInitialized = true;
    } catch (err) {
      console.error("[db] Error initializing database schema:", err);
      isInitialized = false;
    }
  })();

  await initPromise;
  return isInitialized;
}
