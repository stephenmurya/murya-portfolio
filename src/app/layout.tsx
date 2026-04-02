import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./palmer.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://murya.vercel.app";
const metadataBase = new URL(SITE_URL);
const title = "Stephen Murya | Product Engineer";
const description =
  "Portfolio of Stephen Murya, specializing in modern web development, architecture, and scalable systems.";
const socialDescription =
  "Explore the work and projects of Stephen Murya.";
const keywords = [
  "Stephen Murya",
  "Software Engineer",
  "Portfolio",
  "Web Developer",
];

export const metadata: Metadata = {
  metadataBase,
  title,
  description,
  keywords,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Stephen Murya",
    url: SITE_URL,
    title: "Stephen Murya | Portfolio",
    description: socialDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stephen Murya Portfolio Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stephen Murya | Portfolio",
    description: socialDescription,
    images: ["/og-image.png"],
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white">{children}</body>
    </html>
  );
}
