"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, ChartColumnIncreasing, RefreshCw } from "lucide-react";

type AnalyticsPoint = {
  date: string;
  visitors: number;
  pageviews: number;
};

type AnalyticsPayload = {
  series: AnalyticsPoint[];
  summary: {
    totalVisitors: number;
    totalPageviews: number;
    topReferrer: string;
  };
};

function formatAxisDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function formatMetricValue(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadAnalytics() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/analytics", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | AnalyticsPayload
        | { error?: string }
        | undefined;

      if (!response.ok || !payload || !("series" in payload) || !("summary" in payload)) {
        throw new Error(
          payload && "error" in payload
            ? payload.error || "Failed to fetch analytics data."
            : "Failed to fetch analytics data."
        );
      }

      setData(payload);
    } catch (error) {
      setData(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to fetch analytics data. Check your API token."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const chartData = useMemo(() => data?.series ?? [], [data]);
  const latestDateLabel = useMemo(() => {
    const latestDate = chartData.at(-1)?.date;

    return latestDate ? formatAxisDate(latestDate) : "No data yet";
  }, [chartData]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Admin Analytics
            </p>
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Website Analytics
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                A development-only view of time-series traffic data fetched through
                the local analytics proxy so secrets never leave the server.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadAnalytics()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Refreshing..." : "Refresh Data"}</span>
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Admin</span>
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Total Visitors
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {data ? formatMetricValue(data.summary.totalVisitors) : "—"}
            </p>
            <p className="mt-2 text-sm text-zinc-400">Last 30 days</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Total Pageviews
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {data ? formatMetricValue(data.summary.totalPageviews) : "—"}
            </p>
            <p className="mt-2 text-sm text-zinc-400">Latest point: {latestDateLabel}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Top Referrer
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {data ? data.summary.topReferrer : "—"}
            </p>
            <p className="mt-2 text-sm text-zinc-400">Most valuable traffic source</p>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-black/30 p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                Traffic Trend
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Visitors vs. Pageviews
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
              <ChartColumnIncreasing className="h-4 w-4" />
              <span>30-day window</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-zinc-300">
                <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span>Loading analytics…</span>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-red-500/30 bg-red-500/10 px-6 text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-red-200/80">
                Analytics Error
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-white">
                Failed to fetch analytics data.
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-red-100/80">
                {errorMessage || "Check your API token and site identifier in .env.local."}
              </p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                No Data Yet
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-white">
                No analytics points were returned.
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
                Confirm that analytics is enabled for the site and that your
                provider account has traffic for the selected date range.
              </p>
            </div>
          ) : (
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
                  <defs>
                    <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f4f4f5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f4f4f5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pageviewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatAxisDate}
                    stroke="rgba(255,255,255,0.4)"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(9, 9, 11, 0.92)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "16px",
                      color: "#ffffff",
                    }}
                    labelFormatter={(value) => formatAxisDate(String(value))}
                    formatter={(value, name) => [
                      formatMetricValue(Number(value ?? 0)),
                      name === "visitors" ? "Visitors" : "Pageviews",
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "visitors" ? "Visitors" : "Pageviews"
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="#f4f4f5"
                    strokeWidth={2}
                    fill="url(#visitorsGradient)"
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    stroke="#d97706"
                    strokeWidth={2}
                    fill="url(#pageviewsGradient)"
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
