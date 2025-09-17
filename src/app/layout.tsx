import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "K-Pop Heardle 🎵",
  description: "Challenge yourself with music guessing games featuring your favorite K-pop artists. Listen to short previews and test your knowledge of TWICE, LE SSERAFIM, and more!",
  keywords: "K-pop, Heardle, music game, TWICE, LE SSERAFIM, guess the song, Korean music",
  authors: [{ name: "K-Pop Heardle Team" }],

  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  manifest: "/site.webmanifest",

  openGraph: {
    title: "K-Pop Heardle 🎵",
    description: "Test your K-pop knowledge with interactive music guessing games!",
    type: "website",
    url: "https://heardle.live",
    siteName: "K-Pop Heardle",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "K-Pop Heardle - Music Guessing Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Pop Heardle 🎵",
    description: "Test your K-pop knowledge with interactive music guessing games!",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
