import fs from "fs";
import path from "path";
import { SiteConfig, CompanyConfig, PublicationStatus } from "./types";

const CONFIG_DIR = path.join(process.cwd(), "public", "forecasts", "config");
const PUBLISHED_FILE = path.join(CONFIG_DIR, "site_config.json");
const DRAFT_FILE = path.join(CONFIG_DIR, "draft_config.json");

const ALL_SYMBOLS = [
  "ALI", "APX", "BPI", "GLO", "ICT", "JFC", "MBT", "MEG",
  "MER", "NIKL", "PGOLD", "SCC", "SECB", "SHLPH", "SMPH"
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
      primaryModel: "gemini-2.5-flash",
      fallbackModel: "gemini-2.5-flash-lite",
      customGuidelines:
        "Strictly adhere to educational explanations. Do not provide financial advice, buy/sell recommendations, or price guarantees.",
    },
    customHolidays: [],
  };
}

let inMemoryPublishedConfig: SiteConfig | null = null;
let inMemoryDraftConfig: SiteConfig | null = null;

export async function getSiteConfig(draft = false): Promise<SiteConfig> {
  const targetFile = draft ? DRAFT_FILE : PUBLISHED_FILE;
  const memoryCache = draft ? inMemoryDraftConfig : inMemoryPublishedConfig;

  if (memoryCache) {
    return memoryCache;
  }

  try {
    if (fs.existsSync(targetFile)) {
      const data = await fs.promises.readFile(targetFile, "utf-8");
      const parsed = JSON.parse(data);
      if (draft) inMemoryDraftConfig = parsed;
      else inMemoryPublishedConfig = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn(`[config] Failed to read ${targetFile}, falling back to defaults.`, err);
  }

  const defaultConfig = getDefaultConfig();
  if (draft) inMemoryDraftConfig = defaultConfig;
  else inMemoryPublishedConfig = defaultConfig;
  return defaultConfig;
}

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

  const targetFile = asDraft ? DRAFT_FILE : PUBLISHED_FILE;

  if (asDraft) {
    inMemoryDraftConfig = updatedConfig;
  } else {
    inMemoryPublishedConfig = updatedConfig;
    inMemoryDraftConfig = updatedConfig; // Sync draft to published
  }

  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
    }
    await fs.promises.writeFile(targetFile, JSON.stringify(updatedConfig, null, 2), "utf-8");
    if (!asDraft && fs.existsSync(DRAFT_FILE)) {
      await fs.promises.writeFile(DRAFT_FILE, JSON.stringify(updatedConfig, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn(`[config] Could not persist to disk (${targetFile}), relying on memory cache.`, err);
  }

  return updatedConfig;
}

export async function publishDraftConfig(username: string): Promise<SiteConfig> {
  const draft = await getSiteConfig(true);
  return saveSiteConfig(draft, username, false);
}
