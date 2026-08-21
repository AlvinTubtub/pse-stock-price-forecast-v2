export type LayoutMode = "beginner" | "standard" | "advanced";

export type PublicationStatus = "published" | "draft" | "unpublished";

export interface FeatureFlags {
  aiAssistant: boolean;
  compareCompanies: boolean;
  sectorOverview: boolean;
  forecastHistory: boolean;
  historicalOhlcv: boolean;
  nextDayPrediction: boolean;
  backtest: boolean;
  forecastError: boolean;
  modelPerformance: boolean;
  learnStocks: boolean;
}

export interface NavigationItem {
  id: string;
  href: string;
  label: string;
  visible: boolean;
  isImmutable?: boolean;
}

export interface ContentConfig {
  heroTitle: string;
  heroDescription: string;
  dataSourceText: string;
  disclaimerText: string;
  announcement: {
    enabled: boolean;
    text: string;
    type: "info" | "warning" | "success";
  };
}

export interface CompanyConfig {
  symbol: string;
  visible: boolean;
  featured: boolean;
  order: number;
  displayNameAlias?: string;
  sectorDescription?: string;
}

export interface ModelStatusConfig {
  arima: { enabled: boolean; lastTrained?: string };
  lag_reg: { enabled: boolean; lastTrained?: string };
  lstm: { enabled: boolean; lastTrained?: string };
}

export interface AIConfig {
  enabled: boolean;
  primaryModel: string;
  fallbackModel: string;
  customGuidelines?: string;
  starterQuestions?: Record<string, string[]>;
}

export interface CalendarHoliday {
  date: string;
  name: string;
  isCustom?: boolean;
}

export interface SiteConfig {
  version: number;
  lastUpdated: string;
  updatedBy: string;
  layoutMode: LayoutMode;
  features: FeatureFlags;
  navigation: NavigationItem[];
  content: ContentConfig;
  companies: Record<string, CompanyConfig>;
  forecastPublication: Record<string, PublicationStatus>;
  models: ModelStatusConfig;
  ai: AIConfig;
  customHolidays: CalendarHoliday[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string in PHT
  username: string;
  action: string;
  target: string;
  result: "success" | "failed";
  details?: string;
}
