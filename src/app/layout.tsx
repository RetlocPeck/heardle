import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "K-Pop Heardle 🎵 | Test Your K-Pop Knowledge",
  description: "Challenge yourself with music guessing games featuring your favorite K-pop artists. Listen to short previews and test your knowledge of TWICE, LE SSERAFIM, and more!",
  keywords: "K-pop, Heardle, music game, TWICE, LE SSERAFIM, guess the song, Korean music",
  authors: [{ name: "K-Pop Heardle Team" }],
  openGraph: {
    title: "K-Pop Heardle 🎵",
    description: "Test your K-pop knowledge with interactive music guessing games!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Pop Heardle 🎵",
    description: "Test your K-pop knowledge with interactive music guessing games!",
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
      >
        {children}
      </body>
    </html>
  );
}
