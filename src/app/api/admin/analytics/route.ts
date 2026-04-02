import {
  createDevelopmentOnlyForbiddenResponse,
  isDevelopmentEnvironment,
} from "@/lib/cms/admin";

type PlausibleRow = {
  dimensions: string[];
  metrics: number[];
};

type PlausibleResponse = {
  results?: PlausibleRow[];
  meta?: {
    time_labels?: string[];
  };
};

type AnalyticsPoint = {
  date: string;
  visitors: number;
  pageviews: number;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function runPlausibleQuery(
  baseUrl: string,
  token: string,
  query: Record<string, unknown>
) {
  const response = await fetch(`${baseUrl}/api/v2/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Analytics provider request failed (${response.status}): ${
        errorText || response.statusText
      }`
    );
  }

  return (await response.json()) as PlausibleResponse;
}

function normalizeTimeseries(response: PlausibleResponse): AnalyticsPoint[] {
  const labels =
    response.meta?.time_labels ??
    response.results?.map((row) => row.dimensions[0]).filter(Boolean) ??
    [];
  const byDate = new Map(
    (response.results ?? []).map((row) => [
      row.dimensions[0],
      {
        visitors: Number(row.metrics[0] ?? 0),
        pageviews: Number(row.metrics[1] ?? 0),
      },
    ])
  );

  return labels.map((date) => {
    const metrics = byDate.get(date);

    return {
      date,
      visitors: metrics?.visitors ?? 0,
      pageviews: metrics?.pageviews ?? 0,
    };
  });
}

export const runtime = "nodejs";

export async function GET() {
  if (!isDevelopmentEnvironment()) {
    return createDevelopmentOnlyForbiddenResponse();
  }

  try {
    const token = getRequiredEnv("ANALYTICS_API_TOKEN");
    const siteId = getRequiredEnv("ANALYTICS_SITE_ID");
    const baseUrl =
      process.env.ANALYTICS_API_BASE_URL?.trim().replace(/\/$/u, "") ||
      "https://plausible.io";

    const [timeseriesResponse, referrerResponse] = await Promise.all([
      runPlausibleQuery(baseUrl, token, {
        site_id: siteId,
        metrics: ["visitors", "pageviews"],
        date_range: "30d",
        dimensions: ["time:day"],
        order_by: [["time:day", "asc"]],
        include: {
          time_labels: true,
        },
      }),
      runPlausibleQuery(baseUrl, token, {
        site_id: siteId,
        metrics: ["visitors"],
        date_range: "30d",
        dimensions: ["visit:referrer"],
        order_by: [["visitors", "desc"]],
        pagination: {
          limit: 1,
          offset: 0,
        },
      }),
    ]);

    const series = normalizeTimeseries(timeseriesResponse);
    const topReferrer =
      referrerResponse.results?.[0]?.dimensions?.[0]?.trim() || "Direct / Unknown";
    const summary = series.reduce(
      (totals, point) => ({
        totalVisitors: totals.totalVisitors + point.visitors,
        totalPageviews: totals.totalPageviews + point.pageviews,
      }),
      {
        totalVisitors: 0,
        totalPageviews: 0,
      }
    );

    return Response.json({
      series,
      summary: {
        ...summary,
        topReferrer,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch analytics data. Check your API token.",
      },
      { status: 500 }
    );
  }
}
