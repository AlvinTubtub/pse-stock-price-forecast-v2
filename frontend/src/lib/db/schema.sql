-- ==============================================================================
-- ForecastPH V2 — PostgreSQL Database Schema (Neon Compatible)
-- Source of Truth for Admin Configuration, Operational Metadata & Audit Logs
-- ==============================================================================

-- 1. Site Configuration Master Table (Draft & Published versions)
CREATE TABLE IF NOT EXISTS site_config (
    id VARCHAR(50) PRIMARY KEY, -- 'published' or 'draft'
    version INT NOT NULL DEFAULT 1,
    layout_mode VARCHAR(20) NOT NULL DEFAULT 'standard',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
);

-- 2. Frontend Feature Flags
CREATE TABLE IF NOT EXISTS frontend_features (
    config_id VARCHAR(50) NOT NULL REFERENCES site_config(id) ON DELETE CASCADE,
    feature_key VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
    PRIMARY KEY (config_id, feature_key)
);

-- 3. Navigation Items Configuration
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

-- 4. Content & Copywriting Configuration
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

-- 5. AI Assistant Configuration
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

-- 6. Tracked Companies Configuration
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

-- 7. Forecast Publication States
CREATE TABLE IF NOT EXISTS forecast_publications (
    config_id VARCHAR(50) NOT NULL REFERENCES site_config(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published', -- 'published', 'draft', 'unpublished'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
    PRIMARY KEY (config_id, symbol)
);

-- 8. Custom PSE Trading Calendar Dates & Exceptions
CREATE TABLE IF NOT EXISTS trading_calendar (
    date DATE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_custom BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
);

-- 9. Machine Learning Model Registry
CREATE TABLE IF NOT EXISTS model_registry (
    model_key VARCHAR(50) PRIMARY KEY, -- 'arima', 'lag_reg', 'lstm'
    model_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    model_type VARCHAR(50) NOT NULL,
    last_trained TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
);

-- 10. Pipeline Execution Runs (Durable workflow dispatch & cron execution tracking)
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id VARCHAR(100) PRIMARY KEY,
    workflow_type VARCHAR(50) NOT NULL, -- 'data_update', 'inference', 'training', 'validate', 'export'
    github_run_id BIGINT,
    status VARCHAR(30) NOT NULL, -- 'queued', 'running', 'success', 'failed'
    triggered_by VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'admin_manual', -- 'admin_manual', 'cron', 'repository_dispatch'
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

-- 11. Model Training Runs (Historical training executions & metrics)
CREATE TABLE IF NOT EXISTS model_training_runs (
    id VARCHAR(100) PRIMARY KEY,
    model_key VARCHAR(50) NOT NULL,
    workflow_run_id BIGINT,
    status VARCHAR(30) NOT NULL, -- 'queued', 'running', 'success', 'failed'
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

-- 12. Persistent Append-Only Audit Logs with Cryptographic Hash Chaining
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    result VARCHAR(30) NOT NULL, -- 'success', 'failed'
    details TEXT,
    previous_hash VARCHAR(64) NOT NULL,
    record_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred_at ON audit_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
