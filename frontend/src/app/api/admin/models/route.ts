import { NextResponse } from "next/server";
import { getModelTrainingRuns } from "@/lib/admin/pipeline";
import { getSiteConfig } from "@/lib/admin/config";

export async function GET() {
  try {
    const [config, arimaRuns, lagRuns, lstmRuns] = await Promise.all([
      getSiteConfig(false),
      getModelTrainingRuns("arima", 1),
      getModelTrainingRuns("lag_reg", 1),
      getModelTrainingRuns("lstm", 1),
    ]);

    const latestRuns = {
      arima: arimaRuns[0] || null,
      lag_reg: lagRuns[0] || null,
      lstm: lstmRuns[0] || null,
    };

    return NextResponse.json({
      models: config.models,
      latestRuns,
    });
  } catch (err: any) {
    console.error("[api/admin/models] Error fetching model metadata:", err);
    return NextResponse.json({ error: "Failed to fetch model metadata." }, { status: 500 });
  }
}
