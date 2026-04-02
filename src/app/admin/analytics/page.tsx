import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { isDevelopmentEnvironment } from "@/lib/cms/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Website Analytics | Stephen Murya",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminAnalyticsPage() {
  if (!isDevelopmentEnvironment()) {
    notFound();
  }

  return <AnalyticsDashboard />;
}
