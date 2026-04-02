import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDevelopmentEnvironment } from "@/lib/cms/admin";

export const metadata: Metadata = {
  title: "Admin | Stephen Murya",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isDevelopmentEnvironment()) {
    notFound();
  }

  return children;
}
