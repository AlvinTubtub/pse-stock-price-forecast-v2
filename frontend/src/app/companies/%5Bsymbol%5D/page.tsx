import { notFound } from "next/navigation";
import HistoryChart from "@/components/charts/HistoryChart";
import NextDayPredictionChart from "@/components/charts/NextDayPredictionChart";
import PredictionChart from "@/components/charts/PredictionChart";
import ErrorChart from "@/components/charts/ErrorChart";
import ChangeBadge from "@/components/ChangeBadge";
import ForecastSummaryCard from "@/components/ForecastSummaryCard";
import ModelReliabilitySnapshot from "@/components/ModelReliabilitySnapshot";
import BeginnerGuideModal from "@/components/BeginnerGuideModal";
import ChartHelpModal from "@/components/ChartHelpModal";
import StickyCompanyNav from "@/components/StickyCompanyNav";
import { getAllSymbols, getCompanyDetail } from "@/lib/data";
import { getSiteConfig } from "@/lib/admin/config";
import { formatDate, formatNum, formatPeso, formatPct } from "@/lib/format";

export async function generateStaticParams() {
  const symbols = await getAllSymbols();
  return symbols.map((symbol) => ({ symbol }));
}

export default async function CompanyDetailPage({ params }: { params: { symbol: string } }) {
  if (!params || !params.symbol) notFound();
  const [company, siteConfig] = await Promise.all([
    getCompanyDetail(params.symbol),
    getSiteConfig(),
  ]);

  if (!company) notFound();

  // Check if company is unpublished by admin
  const pubStatus = siteConfig.forecastPublication?.[company.symbol] || "published";
  const compConfig = siteConfig.companies?.[company.symbol];
  if (pubStatus === "unpublished" || (compConfig && compConfig.visible === false)) {
    // Graceful notice or notFound
    return (
      <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
        <p className="text-4xl">🔒</p>
        <h1 className="text-xl font-bold text-white">Forecast Temporarily Unpublished</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          The forecast for {company.symbol} is currently in draft or maintenance review by administrators.
        </p>
        <a
          href="/companies"
          className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
        >
          ← Return to Company Directory
        </a>
      </div>
    );
  }

  const modelOrder = ["lag_reg", "arima", "lstm", "naive"];
  const modelLabels: Record<string, string> = {
    lag_reg: "Lag-Informed Regression",
    arima: "ARIMA",
    lstm: "LSTM",
    naive: "Naive baseline",
  };

  const selectedModelKey =
    Object.keys(modelLabels).find((key) => modelLabels[key] === company.model) || "arima";
  const selectedMetrics = company.metrics[selectedModelKey] || {
    rmse: "--",
    mae: "--",
    mase: "--",
    r2: "--",
  };

  const maseVal = parseFloat(String(selectedMetrics.mase));
  const beatsNaive = !isNaN(maseVal) && maseVal < 1.0;

  const isPositive = company.pctChange > 0;
  const isNegative = company.pctChange < 0;

  const features = siteConfig.features;
  const layoutMode = siteConfig.layoutMode || "standard";
  const isBeginner = layoutMode === "beginner";

  return (
    <div className="space-y-8">
      {/* 1. Top Breadcrumb & Executive Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border/60">
        <div>
          <a
            href="/companies"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-wider mb-2 inline-flex items-center gap-1"
          >
            ← Back to Companies
          </a>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {compConfig?.displayNameAlias || company.symbol}
            </h1>
            <span className="text-xs px-3 py-1 rounded-full bg-dark-card border border-dark-border text-slate-300 font-medium">
              {company.sector}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{company.name}</p>
        </div>

        {/* Action button & Date context pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <BeginnerGuideModal />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 bg-dark-card border border-dark-border px-3.5 py-2 rounded-xl">
            {company.dataAsOf && (
              <div>
                <span className="text-slate-500">Data as of: </span>
                <strong className="text-slate-200 font-medium font-mono">
                  {formatDate(company.dataAsOf)}
                </strong>
              </div>
            )}
            {company.dataAsOf && company.forecastDate && <span>&middot;</span>}
            {company.forecastDate && (
              <div>
                <span className="text-slate-500">Forecast for: </span>
                <strong className="text-brand-300 font-semibold font-mono">
                  {formatDate(company.forecastDate)}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sticky Subnavigation */}
      <StickyCompanyNav symbol={company.symbol} name={company.name} />

      {/* 3. Section: Overview */}
      <section id="overview" className="space-y-6">
        {/* Forecast Summary Card */}
        <ForecastSummaryCard
          symbol={compConfig?.displayNameAlias || company.symbol}
          name={company.name}
          previousClose={company.previousClose}
          predictedClose={company.predictedClose}
          pesoChange={company.pesoChange}
          pctChange={company.pctChange}
          model={company.model}
          forecastDate={company.forecastDate}
          dataAsOf={company.dataAsOf}
        />

        {/* Model Reliability Snapshot */}
        <ModelReliabilitySnapshot
          symbol={company.symbol}
          selectedModel={company.model}
          metrics={selectedMetrics}
        />

        {/* At a Glance Information Panel */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
          <div className="pb-3 border-b border-dark-border/60 mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              At a Glance
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">PSE Quotations Pipeline</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3.5">
              <span className="text-slate-500 block mb-0.5">Sector</span>
              <span className="font-semibold text-white text-sm truncate block">{company.sector}</span>
            </div>

            <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3.5">
              <span className="text-slate-500 block mb-0.5">Last Settlement</span>
              <span className="font-semibold text-white text-sm font-mono">
                {formatDate(company.dataAsOf)}
              </span>
            </div>

            <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3.5">
              <span className="text-slate-500 block mb-0.5">Forecast Horizon</span>
              <span className="font-semibold text-brand-300 text-sm">1 Trading Day</span>
            </div>

            <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3.5">
              <span className="text-slate-500 block mb-0.5">Selected Model</span>
              <span className="font-semibold text-white text-sm truncate block" title={company.model}>
                {company.model}
              </span>
            </div>

            <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3.5">
              <span className="text-slate-500 block mb-0.5">MASE Score</span>
              <span className={`font-semibold text-sm font-mono ${beatsNaive ? "text-emerald-400" : "text-amber-400"}`}>
                {formatNum(selectedMetrics.mase, 3)}
              </span>
            </div>

            <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3.5">
              <span className="text-slate-500 block mb-0.5">Forecast Direction</span>
              <span className={`font-semibold text-sm ${isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-slate-300"}`}>
                {isPositive ? "↑ Gain" : isNegative ? "↓ Loss" : "→ Flat"} ({formatPct(company.pctChange)})
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: Historical OHLCV */}
      {features.historicalOhlcv !== false && (
        <section id="ohlcv" className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="pb-3 border-b border-dark-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Historical OHLCV Data
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official historical Open, High, Low, Close, and Volume time-series sourced from PSE reports.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <ChartHelpModal type="ohlcv" title="Historical OHLCV" />
              </div>
            </div>
          </div>
          <HistoryChart data={company.ohlcv} />
        </section>
      )}

      {/* 5. Section: Next-Day Prediction */}
      {features.nextDayPrediction !== false && (
        <section id="prediction" className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="pb-3 border-b border-dark-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Next-Day Prediction vs Recent Trend
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Latest actual closing prices alongside step-ahead model estimates for tomorrow&apos;s session.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <ChartHelpModal type="prediction" title="Next-Day Prediction" />
              </div>
            </div>
          </div>
          <NextDayPredictionChart
            ohlcv={company.ohlcv}
            previousClose={company.previousClose}
            nextClose={company.nextClose}
            forecastDate={company.forecastDate}
            dataAsOf={company.dataAsOf}
          />
        </section>
      )}

      {/* 6. Section: Backtest: Predicted vs. Actual */}
      {features.backtest !== false && (
        <section id="backtest" className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="pb-3 border-b border-dark-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Backtest: Predicted vs. Actual (Held-Out Test Window)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological out-of-sample backtest comparing step-ahead predictions with actual settlement prices.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <ChartHelpModal type="backtest" title="Backtest Comparison" />
              </div>
            </div>
          </div>
          <PredictionChart
            dates={company.backtestDates}
            actual={company.backtestActual}
            byModel={company.backtestByModel}
            selectedModel={company.model}
          />
        </section>
      )}

      {/* 7. Section: Forecast Error Over Time */}
      {features.forecastError !== false && !isBeginner && (
        <section id="errors" className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="pb-3 border-b border-dark-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Forecast Error Over Time (Residuals)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Session-by-session forecast residuals across the backtest window: Predicted Close − Actual Close (₱).
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <ChartHelpModal type="error" title="Forecast Error Residuals" />
              </div>
            </div>
          </div>
          <ErrorChart
            dates={company.backtestDates}
            actual={company.backtestActual}
            byModel={company.backtestByModel}
            selectedModel={company.model}
          />
        </section>
      )}

      {/* 8. Section: Model Performance Table */}
      {features.modelPerformance !== false && (
        <section id="models" className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 shadow-sm overflow-x-auto space-y-4">
          <div className="pb-3 border-b border-dark-border/60">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Advanced Model Performance Details for {company.symbol}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Out-of-sample evaluation metrics across all machine-learning candidate architectures and the naive baseline.
            </p>
          </div>

          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 uppercase bg-dark-bg/80 border-b border-dark-border">
              <tr>
                <th className="text-left py-2.5 px-3">Model</th>
                <th className="text-right py-2.5 px-3">RMSE (₱)</th>
                <th className="text-right py-2.5 px-3">MAE (₱)</th>
                <th className="text-right py-2.5 px-3">MASE</th>
                <th className="text-right py-2.5 px-3">R²</th>
                <th className="text-center py-2.5 px-3">Beats Naive?</th>
              </tr>
            </thead>
            <tbody>
              {modelOrder
                .filter((m) => company.metrics[m])
                .map((m) => {
                  const isSelected = modelLabels[m] === company.model;
                  const isNaive = m === "naive";
                  const rowMase = parseFloat(String(company.metrics[m].mase));
                  const rowBeatsNaive = !isNaN(rowMase) && rowMase < 1.0;

                  return (
                    <tr
                      key={m}
                      className={`border-b border-dark-border/50 transition-colors ${
                        isSelected ? "bg-brand-500/10 font-medium" : "hover:bg-dark-bg/40"
                      }`}
                    >
                      <td className="py-3 px-3 text-white flex items-center gap-2">
                        <span>{modelLabels[m]}</span>
                        {isSelected && (
                          <span className="text-[10px] uppercase font-bold text-brand-400 border border-brand-500/40 bg-brand-500/20 rounded px-2 py-0.5">
                            Selected Winner
                          </span>
                        )}
                        {isNaive && (
                          <span className="text-[10px] uppercase font-bold text-slate-400 border border-slate-600 bg-dark-bg rounded px-2 py-0.5">
                            Benchmark
                          </span>
                        )}
                      </td>
                      <td className="text-right py-3 px-3 font-mono text-slate-200">
                        ₱{formatNum(company.metrics[m].rmse)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono text-slate-200">
                        ₱{formatNum(company.metrics[m].mae)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono">
                        <span className={rowBeatsNaive ? "text-emerald-400 font-semibold" : "text-slate-300"}>
                          {formatNum(company.metrics[m].mase)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3 font-mono text-slate-200">
                        {formatNum(company.metrics[m].r2)}
                      </td>
                      <td className="text-center py-3 px-3">
                        {isNaive ? (
                          <span className="text-slate-500 text-xs font-mono">—</span>
                        ) : rowBeatsNaive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            ✓ Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            ⚠ No
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <div className="mt-4 pt-3 border-t border-dark-border/60 text-xs text-slate-400 space-y-1.5 leading-relaxed">
            <p>
              &bull; <strong className="text-slate-300">Selection Criterion: </strong>
              Autonomous selection is governed strictly by the lowest test-set RMSE on the 15% chronological held-out test split.
            </p>
            <p>
              &bull; <strong className="text-slate-300">MASE Benchmark: </strong>
              Mean Absolute Scaled Error &lt; 1.0 indicates higher predictive accuracy than the naive persistence baseline (tomorrow&apos;s price equals today&apos;s price).
            </p>
            <p>
              &bull; <strong className="text-slate-300">R² Interpretation: </strong>
              Measures test-set explained variance in price levels and is not a forecast probability or confidence score.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
