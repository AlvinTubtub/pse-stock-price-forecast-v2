import fs from "fs";
import path from "path";
import {
  SiteConfig,
  CompanyConfig,
  PublicationStatus,
  FeatureFlags,
  NavigationItem,
  ContentConfig,
  AIConfig,
  CalendarHoliday,
  ModelStatusConfig,
} from "./types";
import {
  isDatabaseConfigured,
  ensureDatabaseInitialized,
  query,
  executeInTransaction,
} from "@/lib/db";

const CONFIG_DIR = path.join(process.cwd(), "public", "forecasts", "config");
const PUBLISHED_FILE = path.join(CONFIG_DIR, "site_config.json");
const DRAFT_FILE = path.join(CONFIG_DIR, "draft_config.json");

const ALL_SYMBOLS = [
  "ALI", "APX", "BPI", "GLO", "ICT", "JFC", "MBT", "MEG",
  "MER", "NIKL", "PGOLD", "SCC", "SECB", "SHLPH", "SMPH",
];

export function getDefaultConfig(): SiteConfig {
  const companiesMap: Record<string, CompanyConfig> = {};
  const publicationMap: Record<string, PublicationStatus> = {};

  ALL_SYMBOLS.forEach((symbol, index) => {
    companiesMap[symbol] = {
      symbol,
      visible: true,
      featured: index < 4,
      order: index + 1,
    };
    publicationMap[symbol] = "published";
  });

  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    updatedBy: "system",
    layoutMode: "standard",
    features: {
      aiAssistant: true,
      compareCompanies: true,
      sectorOverview: true,
      forecastHistory: true,
      historicalOhlcv: true,
      nextDayPrediction: true,
      backtest: true,
      forecastError: true,
      modelPerformance: true,
      learnStocks: true,
    },
    navigation: [
      { id: "home", href: "/", label: "Home", visible: true, isImmutable: true },
      { id: "companies", href: "/companies", label: "Companies", visible: true },
      { id: "compare-companies", href: "/compare-companies", label: "Compare", visible: true },
      { id: "sectors", href: "/sectors", label: "Sectors", visible: true },
      { id: "forecast-history", href: "/forecast-history", label: "History", visible: true },
      { id: "compare", href: "/compare", label: "Models", visible: true },
      { id: "learn", href: "/learn", label: "Learn", visible: true },
      { id: "about", href: "/about", label: "About", visible: true },
    ],
    content: {
      heroTitle: "Next-Day Stock Forecasting for the Philippine Stock Exchange",
      heroDescription:
        "Transparent, machine-learning powered price estimations and backtest accuracy metrics for 15 major PSE-listed equities.",
      dataSourceText: "Official PSE Daily Quotations Reports (EOD)",
      disclaimerText:
        "ForecastPH is an academic capstone research project. Forecasts and metrics are strictly educational decision-support tools and do NOT constitute financial advice, buy/sell recommendations, or guaranteed investment targets.",
      announcement: {
        enabled: false,
        text: "Welcome to ForecastPH — All forecasts updated with the latest PSE trading session settlement.",
        type: "info",
      },
    },
    companies: companiesMap,
    forecastPublication: publicationMap,
    models: {
      arima: { enabled: true, lastTrained: "2026-08-19" },
      lag_reg: { enabled: true, lastTrained: "2026-08-19" },
      lstm: { enabled: true, lastTrained: "2026-08-19" },
    },
    ai: {
      enabled: true,
      primaryModel: "gemini-3.5-flash-lite",
      fallbackModel: "gemini-3.5-flash",
      customGuidelines:
        "Strictly adhere to educational explanations. Do not provide financial advice, buy/sell recommendations, or price guarantees.",
    },
    customHolidays: [],
  };
}

function normalizeAiModel(model: string | undefined, defaultModel: string): string {
  if (!model || model.trim() === "" || model.includes("gemini-2.5")) {
    return defaultModel;
  }
  return model.trim();
}

let inMemoryPublishedConfig: SiteConfig | null = null;
let inMemoryDraftConfig: SiteConfig | null = null;

/**
 * Load initial configuration from existing JSON file if present, else defaults.
 */
function loadFileConfigOrDefault(): SiteConfig {
  try {
    if (fs.existsSync(PUBLISHED_FILE)) {
      const data = fs.readFileSync(PUBLISHED_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("[config] Failed to read published config file:", err);
  }
  return getDefaultConfig();
}

/**
 * Reads full site configuration from PostgreSQL (or fallback).
 */
export async function getSiteConfig(draft = false): Promise<SiteConfig> {
  const configId = draft ? "draft" : "published";

  if (isDatabaseConfigured()) {
    try {
      const dbReady = await ensureDatabaseInitialized();
      if (dbReady) {
        // Query site_config
        const siteRows = await query(
          "SELECT version, layout_mode, updated_at, updated_by FROM site_config WHERE id = $1",
          [configId]
        );

        if (siteRows.length === 0) {
          // Seed database from current file config or defaults
          const seedConfig = loadFileConfigOrDefault();
          await saveSiteConfigToDatabase(seedConfig, "system", false);
          if (draft) {
            await saveSiteConfigToDatabase(seedConfig, "system", true);
          }
          return seedConfig;
        }

        const siteRow = siteRows[0];

        // Query all sub-tables
        const [
          featureRows,
          navRows,
          contentRows,
          aiRows,
          companyRows,
          pubRows,
          holidayRows,
          modelRows,
        ] = await Promise.all([
          query("SELECT feature_key, enabled FROM frontend_features WHERE config_id = $1", [configId]),
          query("SELECT id, href, label, visible, is_immutable, display_order FROM navigation_items WHERE config_id = $1 ORDER BY display_order ASC", [configId]),
          query("SELECT hero_title, hero_description, data_source_text, disclaimer_text, announcement_enabled, announcement_text, announcement_type FROM content_config WHERE config_id = $1", [configId]),
          query("SELECT enabled, primary_model, fallback_model, custom_guidelines, starter_questions FROM ai_config WHERE config_id = $1", [configId]),
          query("SELECT symbol, visible, featured, display_order, display_name_alias, sector_description FROM tracked_companies WHERE config_id = $1 ORDER BY display_order ASC", [configId]),
          query("SELECT symbol, status FROM forecast_publications WHERE config_id = $1", [configId]),
          query("SELECT date, name, is_custom FROM trading_calendar ORDER BY date ASC"),
          query("SELECT model_key, enabled, last_trained FROM model_registry"),
        ]);

        // Assemble FeatureFlags
        const defaultFeatures = getDefaultConfig().features;
        const features: FeatureFlags = { ...defaultFeatures };
        featureRows.forEach((r: any) => {
          if (r.feature_key in features) {
            (features as any)[r.feature_key] = Boolean(r.enabled);
          }
        });

        // Assemble NavigationItems
        const navigation: NavigationItem[] = navRows.map((r: any) => ({
          id: r.id,
          href: r.href,
          label: r.label,
          visible: Boolean(r.visible),
          isImmutable: Boolean(r.is_immutable),
        }));

        // Assemble ContentConfig
        const cRow = contentRows[0] || {};
        const content: ContentConfig = {
          heroTitle: cRow.hero_title || getDefaultConfig().content.heroTitle,
          heroDescription: cRow.hero_description || getDefaultConfig().content.heroDescription,
          dataSourceText: cRow.data_source_text || getDefaultConfig().content.dataSourceText,
          disclaimerText: cRow.disclaimer_text || getDefaultConfig().content.disclaimerText,
          announcement: {
            enabled: Boolean(cRow.announcement_enabled),
            text: cRow.announcement_text || "",
            type: (cRow.announcement_type as any) || "info",
          },
        };

        // Assemble AIConfig
        const aRow = aiRows[0] || {};
        const ai: AIConfig = {
          enabled: Boolean(aRow.enabled ?? true),
          primaryModel: normalizeAiModel(aRow.primary_model, "gemini-3.5-flash-lite"),
          fallbackModel: normalizeAiModel(aRow.fallback_model, "gemini-3.5-flash"),
          customGuidelines: aRow.custom_guidelines || undefined,
          starterQuestions: aRow.starter_questions || undefined,
        };

        // Assemble Companies
        const companies: Record<string, CompanyConfig> = {};
        companyRows.forEach((r: any) => {
          companies[r.symbol] = {
            symbol: r.symbol,
            visible: Boolean(r.visible),
            featured: Boolean(r.featured),
            order: Number(r.display_order),
            displayNameAlias: r.display_name_alias || undefined,
            sectorDescription: r.sector_description || undefined,
          };
        });

        // Assemble ForecastPublications
        const forecastPublication: Record<string, PublicationStatus> = {};
        pubRows.forEach((r: any) => {
          forecastPublication[r.symbol] = (r.status as PublicationStatus) || "published";
        });

        // Assemble CustomHolidays
        const customHolidays: CalendarHoliday[] = holidayRows.map((r: any) => ({
          date: typeof r.date === "string" ? r.date.substring(0, 10) : r.date.toISOString().substring(0, 10),
          name: r.name,
          isCustom: Boolean(r.is_custom),
        }));

        // Assemble ModelRegistry
        const models: ModelStatusConfig = {
          arima: { enabled: true, lastTrained: "2026-08-19" },
          lag_reg: { enabled: true, lastTrained: "2026-08-19" },
          lstm: { enabled: true, lastTrained: "2026-08-19" },
        };
        modelRows.forEach((r: any) => {
          if (r.model_key in models) {
            (models as any)[r.model_key] = {
              enabled: Boolean(r.enabled),
              lastTrained: r.last_trained ? new Date(r.last_trained).toISOString().substring(0, 10) : undefined,
            };
          }
        });

        const fullConfig: SiteConfig = {
          version: Number(siteRow.version || 1),
          lastUpdated: siteRow.updated_at ? new Date(siteRow.updated_at).toISOString() : new Date().toISOString(),
          updatedBy: siteRow.updated_by || "system",
          layoutMode: siteRow.layout_mode || "standard",
          features,
          navigation: navigation.length > 0 ? navigation : getDefaultConfig().navigation,
          content,
          companies: Object.keys(companies).length > 0 ? companies : getDefaultConfig().companies,
          forecastPublication: Object.keys(forecastPublication).length > 0 ? forecastPublication : getDefaultConfig().forecastPublication,
          models,
          ai,
          customHolidays,
        };

        if (draft) inMemoryDraftConfig = fullConfig;
        else inMemoryPublishedConfig = fullConfig;

        return fullConfig;
      }
    } catch (err) {
      console.warn("[config] Database query failed, using memory/file fallback.", err);
    }
  }

  // Filesystem & memory fallback
  const memoryCache = draft ? inMemoryDraftConfig : inMemoryPublishedConfig;
  if (memoryCache) return memoryCache;

  const targetFile = draft ? DRAFT_FILE : PUBLISHED_FILE;
  try {
    if (fs.existsSync(targetFile)) {
      const data = await fs.promises.readFile(targetFile, "utf-8");
      const parsed = JSON.parse(data);
      if (draft) inMemoryDraftConfig = parsed;
      else inMemoryPublishedConfig = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn(`[config] Failed to read ${targetFile}, using defaults.`, err);
  }

  const defaultConfig = getDefaultConfig();
  if (draft) inMemoryDraftConfig = defaultConfig;
  else inMemoryPublishedConfig = defaultConfig;
  return defaultConfig;
}

/**
 * Saves full site configuration to PostgreSQL in an atomic transaction.
 */
async function saveSiteConfigToDatabase(
  config: SiteConfig,
  username: string,
  asDraft = false
): Promise<void> {
  const configId = asDraft ? "draft" : "published";
  const now = new Date();

  await executeInTransaction(async (client) => {
    // 1. Upsert site_config
    await client.query(
      `INSERT INTO site_config (id, version, layout_mode, updated_at, updated_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         version = site_config.version + 1,
         layout_mode = EXCLUDED.layout_mode,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by`,
      [configId, config.version || 1, config.layoutMode || "standard", now, username]
    );

    // 2. Upsert frontend_features
    for (const [key, enabled] of Object.entries(config.features || {})) {
      await client.query(
        `INSERT INTO frontend_features (config_id, feature_key, enabled, updated_at, updated_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (config_id, feature_key) DO UPDATE SET
           enabled = EXCLUDED.enabled,
           updated_at = EXCLUDED.updated_at,
           updated_by = EXCLUDED.updated_by`,
        [configId, key, Boolean(enabled), now, username]
      );
    }

    // 3. Upsert navigation_items
    for (let i = 0; i < (config.navigation || []).length; i++) {
      const item = config.navigation[i];
      await client.query(
        `INSERT INTO navigation_items (config_id, id, href, label, visible, is_immutable, display_order, updated_at, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (config_id, id) DO UPDATE SET
           href = EXCLUDED.href,
           label = EXCLUDED.label,
           visible = EXCLUDED.visible,
           is_immutable = EXCLUDED.is_immutable,
           display_order = EXCLUDED.display_order,
           updated_at = EXCLUDED.updated_at,
           updated_by = EXCLUDED.updated_by`,
        [
          configId,
          item.id,
          item.href,
          item.label,
          Boolean(item.visible),
          Boolean(item.isImmutable),
          i + 1,
          now,
          username,
        ]
      );
    }

    // 4. Upsert content_config
    const c = config.content || getDefaultConfig().content;
    await client.query(
      `INSERT INTO content_config (config_id, hero_title, hero_description, data_source_text, disclaimer_text, announcement_enabled, announcement_text, announcement_type, updated_at, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (config_id) DO UPDATE SET
         hero_title = EXCLUDED.hero_title,
         hero_description = EXCLUDED.hero_description,
         data_source_text = EXCLUDED.data_source_text,
         disclaimer_text = EXCLUDED.disclaimer_text,
         announcement_enabled = EXCLUDED.announcement_enabled,
         announcement_text = EXCLUDED.announcement_text,
         announcement_type = EXCLUDED.announcement_type,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by`,
      [
        configId,
        c.heroTitle,
        c.heroDescription,
        c.dataSourceText,
        c.disclaimerText,
        Boolean(c.announcement?.enabled),
        c.announcement?.text || "",
        c.announcement?.type || "info",
        now,
        username,
      ]
    );

    // 5. Upsert ai_config
    const a = config.ai || getDefaultConfig().ai;
    await client.query(
      `INSERT INTO ai_config (config_id, enabled, primary_model, fallback_model, custom_guidelines, starter_questions, updated_at, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (config_id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         primary_model = EXCLUDED.primary_model,
         fallback_model = EXCLUDED.fallback_model,
         custom_guidelines = EXCLUDED.custom_guidelines,
         starter_questions = EXCLUDED.starter_questions,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by`,
      [
        configId,
        Boolean(a.enabled),
        normalizeAiModel(a.primaryModel, "gemini-3.5-flash-lite"),
        normalizeAiModel(a.fallbackModel, "gemini-3.5-flash"),
        a.customGuidelines || null,
        JSON.stringify(a.starterQuestions || {}),
        now,
        username,
      ]
    );

    // 6. Upsert tracked_companies
    for (const [symbol, comp] of Object.entries(config.companies || {})) {
      await client.query(
        `INSERT INTO tracked_companies (config_id, symbol, visible, featured, display_order, display_name_alias, sector_description, updated_at, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (config_id, symbol) DO UPDATE SET
           visible = EXCLUDED.visible,
           featured = EXCLUDED.featured,
           display_order = EXCLUDED.display_order,
           display_name_alias = EXCLUDED.display_name_alias,
           sector_description = EXCLUDED.sector_description,
           updated_at = EXCLUDED.updated_at,
           updated_by = EXCLUDED.updated_by`,
        [
          configId,
          symbol,
          Boolean(comp.visible),
          Boolean(comp.featured),
          Number(comp.order || 0),
          comp.displayNameAlias || null,
          comp.sectorDescription || null,
          now,
          username,
        ]
      );
    }

    // 7. Upsert forecast_publications
    for (const [symbol, status] of Object.entries(config.forecastPublication || {})) {
      await client.query(
        `INSERT INTO forecast_publications (config_id, symbol, status, updated_at, updated_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (config_id, symbol) DO UPDATE SET
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at,
           updated_by = EXCLUDED.updated_by`,
        [configId, symbol, status || "published", now, username]
      );
    }

    // 8. Sync trading_calendar (custom dates)
    if (config.customHolidays) {
      for (const h of config.customHolidays) {
        await client.query(
          `INSERT INTO trading_calendar (date, name, is_custom, updated_at, updated_by)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (date) DO UPDATE SET
             name = EXCLUDED.name,
             is_custom = EXCLUDED.is_custom,
             updated_at = EXCLUDED.updated_at,
             updated_by = EXCLUDED.updated_by`,
          [h.date, h.name, Boolean(h.isCustom ?? true), now, username]
        );
      }
    }

    // 9. Sync model_registry
    if (config.models) {
      for (const [mKey, mVal] of Object.entries(config.models)) {
        await client.query(
          `INSERT INTO model_registry (model_key, model_name, enabled, model_type, last_trained, updated_at, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (model_key) DO UPDATE SET
             enabled = EXCLUDED.enabled,
             last_trained = COALESCE(EXCLUDED.last_trained, model_registry.last_trained),
             updated_at = EXCLUDED.updated_at,
             updated_by = EXCLUDED.updated_by`,
          [
            mKey,
            mKey.toUpperCase(),
            Boolean(mVal.enabled),
            mKey === "arima" ? "ARIMA" : mKey === "lstm" ? "Deep Learning" : "Machine Learning",
            mVal.lastTrained ? new Date(mVal.lastTrained) : null,
            now,
            username,
          ]
        );
      }
    }
  });
}

/**
 * Saves site configuration to PostgreSQL (with file backup).
 */
export async function saveSiteConfig(
  config: SiteConfig,
  username: string,
  asDraft = false
): Promise<SiteConfig> {
  const updatedConfig: SiteConfig = {
    ...config,
    version: (config.version || 1) + 1,
    lastUpdated: new Date().toISOString(),
    updatedBy: username,
  };

  if (asDraft) {
    inMemoryDraftConfig = updatedConfig;
  } else {
    inMemoryPublishedConfig = updatedConfig;
    inMemoryDraftConfig = updatedConfig;
  }

  // 1. Persist to PostgreSQL if configured
  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      await saveSiteConfigToDatabase(updatedConfig, username, asDraft);
      if (!asDraft) {
        await saveSiteConfigToDatabase(updatedConfig, username, true); // Sync draft
      }
    } catch (err) {
      console.error("[config] Failed to persist configuration to PostgreSQL:", err);
    }
  }

  // 2. Write file cache backup
  const targetFile = asDraft ? DRAFT_FILE : PUBLISHED_FILE;
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
    }
    await fs.promises.writeFile(targetFile, JSON.stringify(updatedConfig, null, 2), "utf-8");
    if (!asDraft && fs.existsSync(DRAFT_FILE)) {
      await fs.promises.writeFile(DRAFT_FILE, JSON.stringify(updatedConfig, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn(`[config] Could not write to disk (${targetFile}).`, err);
  }

  return updatedConfig;
}

export async function publishDraftConfig(username: string): Promise<SiteConfig> {
  const draft = await getSiteConfig(true);
  return saveSiteConfig(draft, username, false);
}
