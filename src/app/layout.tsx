import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  metadataBase: new URL('https://heardle.live'),
  title: "K-Pop Heardle 🎵",
  description: "Challenge yourself with music guessing games featuring your favorite K-pop artists. Listen to short previews and test your knowledge of TWICE, LE SSERAFIM, and more!",
  keywords: "K-pop, Heardle, music game, TWICE, LE SSERAFIM, guess the song, Korean music",
  authors: [{ name: "K-Pop Heardle Team" }],
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  appleWebApp: {
    title: "Heardle",
    capable: true,
    statusBarStyle: "default",
  },

  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  manifest: "/site.webmanifest",

  openGraph: {
    title: "K-Pop Heardle 🎵",
    description: "Challenge yourself with music guessing games featuring your favorite K-pop artists. Listen to short previews and test your knowledge!",
    type: "website",
    url: "https://heardle.live",
    siteName: "K-Pop Heardle",
    images: [
      {
        url: "https://heardle.live/og-image.png",
        width: 1200,
        height: 630,
        alt: "K-Pop Heardle - Test your K-pop knowledge with music guessing games",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Pop Heardle 🎵",
    description: "Challenge yourself with music guessing games featuring your favorite K-pop artists. Listen to short previews and test your knowledge!",
    images: ["https://heardle.live/og-image.png"],
    creator: "@kpopheardle",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "K-Pop Heardle",
    "url": "https://heardle.live",
    "logo": "https://heardle.live/logo-512.png",
    "description": "Challenge yourself with music guessing games featuring your favorite K-pop artists. Listen to short previews and test your knowledge!",
    "sameAs": [
      "https://twitter.com/kpopheardle"
    ]
  };

  return (
    <html lang="en">
      <head>
        {/* Preconnect to Apple Music CDN for faster image loads */}
        <link rel="preconnect" href="https://is1-ssl.mzstatic.com" />
        <link rel="preconnect" href="https://is2-ssl.mzstatic.com" />
        <link rel="preconnect" href="https://is3-ssl.mzstatic.com" />
        <link rel="preconnect" href="https://is4-ssl.mzstatic.com" />
        <link rel="preconnect" href="https://is5-ssl.mzstatic.com" />
        {/* DNS prefetch for audio preview URLs */}
        <link rel="dns-prefetch" href="https://audio-ssl.itunes.apple.com" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-pink-500 focus:text-white focus:rounded-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
