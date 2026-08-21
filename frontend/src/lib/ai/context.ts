import {
  getCompanyDetail,
  getCompanies,
  getDashboard,
  getMetrics,
  getLatest,
  getAllSymbols,
} from "@/lib/data";
import { formatPeso, formatPct, formatNum } from "@/lib/format";

export interface ContextOptions {
  route?: string;
  symbol?: string;
}

/**
 * Builds a compact, accurate context string for a specific company page (/companies/[symbol]).
 */
export async function buildCompanyContext(symbol: string): Promise<string> {
  const cleanSymbol = symbol.toUpperCase().trim();
  const company = await getCompanyDetail(cleanSymbol);

  if (!company) {
    return `[Context: Company ${cleanSymbol}]
Status: No specific data found for ticker symbol "${cleanSymbol}". Available tracked tickers: ALI, APX, BPI, GLO, ICT, JFC, MBT, MEG, MER, NIKL, PGOLD, SCC, SECB, SHLPH, SMPH.`;
  }

  const modelLabels: Record<string, string> = {
    lag_reg: "Lag-Informed Regression",
    arima: "ARIMA",
    lstm: "LSTM",
    naive: "Naive baseline",
  };

  const metricsLines = Object.entries(company.metrics)
    .map(([key, m]) => {
      const name = modelLabels[key] || key;
      const maseVal = parseFloat(String(m.mase));
      const maseNote =
        !isNaN(maseVal) && maseVal < 1.0
          ? "(beats naive baseline)"
          : !isNaN(maseVal) && maseVal === 1.0
          ? "(equals naive baseline)"
          : "(worse than naive baseline)";
      return `- ${name}: RMSE=₱${formatNum(m.rmse, 4)}, MAE=₱${formatNum(m.mae, 4)}, MASE=${formatNum(m.mase, 4)} ${maseNote}, R²=${formatNum(m.r2, 4)}`;
    })
    .join("\n");

  const nextCloseLines = Object.entries(company.nextClose || {})
    .map(([key, price]) => {
      const name = modelLabels[key] || key;
      return `- ${name}: ₱${Number(price).toFixed(2)}`;
    })
    .join("\n");

  const selectedModelKey =
    Object.keys(modelLabels).find((k) => modelLabels[k] === company.model) || "arima";
  const selectedMetric = company.metrics[selectedModelKey];
  const selectedMase = selectedMetric ? parseFloat(String(selectedMetric.mase)) : NaN;
  const beatsNaive = !isNaN(selectedMase) && selectedMase < 1.0;

  // Backtest recent summary (last 5 sessions)
  let backtestSummary = "N/A";
  if (
    company.backtestDates &&
    company.backtestDates.length > 0 &&
    company.backtestActual &&
    company.backtestActual.length > 0
  ) {
    const len = company.backtestDates.length;
    const start = Math.max(0, len - 5);
    const recentRows = [];
    for (let i = start; i < len; i++) {
      const d = company.backtestDates[i];
      const act = company.backtestActual[i];
      const pred = company.backtestByModel?.[company.model]?.[i];
      recentRows.push(
        `${d}: Actual=₱${act !== undefined ? act.toFixed(2) : "--"}, Predicted(${company.model})=₱${pred !== undefined ? pred.toFixed(2) : "--"}`
      );
    }
    backtestSummary = recentRows.join("; ");
  }

  return `[Context: Company Detail — ${company.symbol} (${company.name})]
- Sector: ${company.sector}
- Data As Of: ${company.dataAsOf || "Recent Session"}
- Forecast Target Date: ${company.forecastDate || "Next Trading Session"}
- Previous Close: ${formatPeso(company.previousClose)}
- Forecasted Close: ${formatPeso(company.predictedClose)}
- Expected Change: ${formatPeso(company.pesoChange)} (${formatPct(company.pctChange)}) [${company.direction.toUpperCase()}]
- Selected Model: ${company.model} (Selected strictly because it achieved the lowest test-set RMSE on the 15% out-of-sample test split)
- Selected Model Beats Naive Baseline? ${beatsNaive ? "Yes (MASE < 1.0)" : "No (MASE >= 1.0, baseline equivalent)"}

Model Performance Metrics on Held-out Test Set:
${metricsLines}

Next-Day Price Predictions by Model:
${nextCloseLines}

Recent Backtest Observations (Last 5 sessions):
${backtestSummary}`;
}

/**
 * Builds context for Compare Companies (/compare-companies).
 */
export async function buildCompareCompaniesContext(): Promise<string> {
  const [companies, metrics] = await Promise.all([getCompanies(), getMetrics()]);

  const modelKeyMap: Record<string, string> = {
    "Lag-Informed Regression": "lag_reg",
    ARIMA: "arima",
    LSTM: "lstm",
    "Naive baseline": "naive",
  };

  const rows = companies.map((c) => {
    const perComp = metrics?.perCompany?.[c.symbol];
    const key = modelKeyMap[c.bestModel] || "arima";
    const m = perComp?.metrics?.[key];
    const rmse = m ? formatNum(m.rmse, 2) : "--";
    const mase = m ? formatNum(m.mase, 2) : "--";
    const maseNum = m ? parseFloat(String(m.mase)) : NaN;
    const beatsNaive = !isNaN(maseNum) && maseNum < 1.0 ? "Yes" : "No";

    return `- ${c.symbol} (${c.name}, ${c.sector}): Prev=₱${c.latestClose.toFixed(2)}, Forecast=₱${c.predictedClose.toFixed(2)} (${formatPct(c.pctChange)}), Model=${c.bestModel}, Test RMSE=₱${rmse}, MASE=${mase} (Beats Naive: ${beatsNaive})`;
  }).join("\n");

  return `[Context: Compare Companies Analytics]
- Feature Overview: Allows users to select 2 to 4 PSE companies side-by-side to compare expected price changes, selected forecasting architectures, and out-of-sample error metrics (RMSE, MASE).
- Total Available Companies: ${companies.length}

All Tracked Companies Data:
${rows}`;
}

/**
 * Builds context for Sector Overview (/sectors).
 */
export async function buildSectorsContext(): Promise<string> {
  const [companies, dashboard] = await Promise.all([getCompanies(), getDashboard()]);

  const map: Record<string, typeof companies> = {};
  for (const c of companies) {
    if (!map[c.sector]) map[c.sector] = [];
    map[c.sector].push(c);
  }

  const sectorSummary = Object.entries(map).map(([sectorName, list]) => {
    const gainers = list.filter((c) => c.pctChange > 0).length;
    const losers = list.filter((c) => c.pctChange < 0).length;
    const unchanged = list.filter((c) => c.pctChange === 0).length;

    const changes = list.map((c) => c.pctChange).sort((a, b) => a - b);
    const mid = Math.floor(changes.length / 2);
    const medianChange = changes.length % 2 !== 0 ? changes[mid] : (changes[mid - 1] + changes[mid]) / 2;

    const comps = list.map((c) => `${c.symbol} (${formatPct(c.pctChange)})`).join(", ");

    return `- ${sectorName} (${list.length} stocks): Median Expected Change = ${formatPct(medianChange)}, Direction Breadth = ${gainers} Gainers / ${losers} Decliners / ${unchanged} Flat. Constituents: ${comps}`;
  }).join("\n");

  return `[Context: Sector Overview Analytics]
- Scope: 5 PSE Industry Sectors (Financials, Industrial, Mining and Oil, Property, Services).
- Summary: Aggregated next-session median price momentum and forecast distribution by industry.

Sector Breakdown:
${sectorSummary}`;
}

/**
 * Builds context for Forecast History (/forecast-history).
 */
export async function buildForecastHistoryContext(): Promise<string> {
  const [metrics, companies] = await Promise.all([getMetrics(), getCompanies()]);

  return `[Context: Forecast History & Track Record Analytics]
- Scope: Chronological 60-session out-of-sample test window logs for all 15 tracked PSE companies.
- Forecast Error Definition: Error = Predicted Close - Actual Close (₱). Positive error means the model overestimated; negative error means the model underestimated.
- Accuracy Metrics:
  1. Mean Absolute Error (MAE): Average absolute prediction deviation in Pesos.
  2. Root Mean Squared Error (RMSE): Quadratic error metric penalizing large misses.
  3. Mean Absolute Scaled Error (MASE): Error scaled relative to naive persistence (tomorrow = today). MASE < 1.0 confirms the model outperformed naive persistence.
- Tracked Companies: ${companies.map((c) => c.symbol).join(", ")}.`;
}

/**
 * Builds a compact context string for the Home Dashboard (/).
 */
export async function buildHomeContext(): Promise<string> {
  const [dashboard, companies, latest] = await Promise.all([
    getDashboard(),
    getCompanies(),
    getLatest(),
  ]);

  const topGainerText = dashboard?.topGainer
    ? `${dashboard.topGainer.symbol} (${dashboard.topGainer.name}): ${formatPct(dashboard.topGainer.pctChange)} (Forecast: ₱${dashboard.topGainer.predictedClose.toFixed(2)})`
    : "N/A";

  const topLoserText = dashboard?.topLoser
    ? `${dashboard.topLoser.symbol} (${dashboard.topLoser.name}): ${formatPct(dashboard.topLoser.pctChange)} (Forecast: ₱${dashboard.topLoser.predictedClose.toFixed(2)})`
    : "N/A";

  const sectorsText = dashboard?.sectors
    ? dashboard.sectors.map((s) => `${s.name} (${s.count} stocks)`).join(", ")
    : "N/A";

  const companiesList = companies
    .map(
      (c) =>
        `- ${c.symbol} (${c.name}, ${c.sector}): Last=₱${c.latestClose.toFixed(2)}, Forecast=₱${c.predictedClose.toFixed(2)} (${formatPct(c.pctChange)}), Selected Model=${c.bestModel}`
    )
    .join("\n");

  return `[Context: Home Dashboard / Market Overview]
- Total Tracked PSE Companies: ${companies.length}
- Forecast Target Date: ${latest?.forecastDate || dashboard?.forecastDate || "Next Trading Session"}
- Market Outlook Summary: Gainers=${dashboard?.marketSummary?.gainers ?? 0}, Losers=${dashboard?.marketSummary?.losers ?? 0}, Unchanged=${dashboard?.marketSummary?.unchanged ?? 0}
- Top Forecasted Gainer: ${topGainerText}
- Top Forecasted Loser: ${topLoserText}
- Tracked Sectors: ${sectorsText}

All Tracked Companies Overview:
${companiesList}`;
}

/**
 * Builds a compact context string for Model Performance & Comparison (/compare).
 */
export async function buildCompareContext(): Promise<string> {
  const [metrics, companies] = await Promise.all([getMetrics(), getCompanies()]);

  if (!metrics || !metrics.perCompany) {
    return `[Context: Model Performance]
Model evaluation data is currently being generated.`;
  }

  const symbols = Object.keys(metrics.perCompany).sort();
  const totalCompanies = symbols.length;

  const MODEL_CONFIGS = [
    { id: "arima", name: "ARIMA", isTrained: true },
    { id: "lag_reg", name: "Lag-Informed Regression", isTrained: true },
    { id: "lstm", name: "LSTM", isTrained: true },
    { id: "naive", name: "Naive baseline", isTrained: false },
  ];

  const modelSummary = MODEL_CONFIGS.map((config) => {
    const wins = config.isTrained
      ? symbols.filter((s) => metrics.perCompany[s]?.bestModel === config.name).length
      : 0;
    const winRate = config.isTrained && totalCompanies > 0 ? ((wins / totalCompanies) * 100).toFixed(1) : "—";

    let beatNaiveCount = 0;
    for (const sym of symbols) {
      const m = metrics.perCompany[sym]?.metrics?.[config.id];
      if (m) {
        const mase = typeof m.mase === "number" ? m.mase : parseFloat(String(m.mase));
        if (!isNaN(mase) && mase < 1.0) beatNaiveCount++;
      }
    }
    const beatNaivePct = totalCompanies > 0 ? ((beatNaiveCount / totalCompanies) * 100).toFixed(1) : "0.0";

    return `- ${config.name}: ${config.isTrained ? `Won ${wins}/${totalCompanies} companies (${winRate}% win rate)` : "Benchmark persistence model"}. Beats Naive on ${beatNaiveCount}/${totalCompanies} stocks (${beatNaivePct}%).`;
  }).join("\n");

  const statTests = (metrics.statisticalTests || {}) as Record<string, any>;
  const friedman = statTests.friedman;
  const consistency = statTests.best_model_consistency;

  let statsText = "Statistical tests conducted:\n";
  if (friedman) {
    statsText += `- Friedman Omnibus Test: Chi-square statistic = ${formatNum(friedman.statistic, 2)}, p-value = ${friedman.p_value < 0.001 ? "< 0.001 (Statistically Significant difference across models)" : formatNum(friedman.p_value, 4)}\n`;
  }
  if (consistency) {
    statsText += `- Best Model Consistency Check: Dominant model = ${consistency.dominant_model}, Won = ${consistency.dominant_count}/${consistency.total_companies} companies (${consistency.pass ? "Pass" : "Fail"})\n`;
  }

  const perCompanyWinners = symbols
    .map((sym) => `${sym}: ${metrics.perCompany[sym]?.bestModel || "N/A"}`)
    .join(", ");

  return `[Context: Model Comparison & Performance]
- Total Tracked Companies: ${totalCompanies}
- Evaluation Rule: Per-company winning model is determined strictly by lowest test-set RMSE on chronological backtest.
- Cross-company aggregation uses median metrics because stock price levels range from ₱2 to ₱2,000 across the PSE.

Cross-Company Model Summary:
${modelSummary}

${statsText}
Per-Company Selected Winners:
${perCompanyWinners}`;
}

/**
 * Builds context for general pages (/learn, /about, /live, etc.).
 */
export async function buildGeneralContext(): Promise<string> {
  const [dashboard, companies] = await Promise.all([getDashboard(), getCompanies()]);
  const symbols = companies.map((c) => c.symbol).join(", ");

  return `[Context: General PSE Stock Price Forecast Dashboard]
- Scope: Educational forecasting tool tracking 15 major Philippine Stock Exchange (PSE) listed companies: ${symbols}.
- Models Evaluated:
  1. ARIMA (AutoRegressive Integrated Moving Average) - statistical classical time series model based on historical Close values.
  2. Lag-Informed Regression - linear machine learning model with multi-day lag price and volume features with LASSO regularization.
  3. LSTM (Long Short-Term Memory) - recurrent neural network capturing non-linear temporal sequence patterns.
  4. Naive Baseline - persistence benchmark where tomorrow's forecast equals today's closing price.
- Evaluation Metrics: RMSE (Root Mean Squared Error), MAE (Mean Absolute Error), MASE (Mean Absolute Scaled Error), R² (Goodness of Fit).
- Model Selection: For each company, the model with the lowest test-set RMSE on the held-out test window is automatically selected.`;
}

/**
 * Assembles the full page-aware context payload based on request options.
 */
export async function buildContextForRequest(options?: ContextOptions): Promise<string> {
  const route = options?.route || "";
  const symbol = options?.symbol;

  if (symbol || route.startsWith("/companies/")) {
    const sym = symbol || route.replace("/companies/", "").split("/")[0];
    if (sym && sym !== "undefined") {
      return buildCompanyContext(sym);
    }
  }

  if (route === "/compare-companies") {
    return buildCompareCompaniesContext();
  }

  if (route === "/sectors") {
    return buildSectorsContext();
  }

  if (route === "/forecast-history") {
    return buildForecastHistoryContext();
  }

  if (route === "/compare") {
    return buildCompareContext();
  }

  if (route === "/" || route === "/companies" || route === "") {
    return buildHomeContext();
  }

  return buildGeneralContext();
}
