import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GA from "@/components/GA";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://getcotto.com"),
  title: "COTTO",
  description:
    "COTTO is reimagining cottage cheese with elevated, protein-packed dips made with clean ingredients. Join the waitlist to be the first to try.",
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
      <body className={`${montserrat.variable} antialiased min-h-dvh flex flex-col`}>
        <GA />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
