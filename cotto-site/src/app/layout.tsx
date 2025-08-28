import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GA from "@/components/GA";

const fraunces = Fraunces({ 
  subsets: ["latin"], 
  variable: "--font-fraunces", 
  display: "swap"
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter", 
  display: "swap" 
});

export const metadata: Metadata = {
  metadataBase: new URL("https://getcotto.com"),
  title: "COTTO",
  description:
    "COTTO is reimagining cottage cheese with elevated, protein-packed dips made with clean ingredients. Join the waitlist to be the first to try.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "COTTO",
    description:
      "COTTO is reimagining cottage cheese with elevated, protein-packed dips made with clean ingredients. Join the waitlist to be the first to try.",
    url: "https://getcotto.com",
    siteName: "COTTO",
    images: [
      {
        url: "/cotto-og-image.png",
        width: 1200,
        height: 630,
        alt: "COTTO",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "COTTO",
    description:
      "COTTO is reimagining cottage cheese with elevated, protein-packed dips made with clean ingredients. Join the waitlist to be the first to try.",
    images: ["/cotto-og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} antialiased min-h-dvh flex flex-col bg-brand-cream text-brand-red`}>
        <GA />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* Klaviyo script with Company ID */}
        <script
          defer
          src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=RMBPUm"
        />
      </body>
    </html>
  );
}
