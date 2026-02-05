import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Featured K-Pop Artists - K-Pop Heardle',
  description: 'Play Heardle games with our handpicked selection of the most popular K-pop artists including TWICE, BTS, BLACKPINK, LE SSERAFIM, aespa, and KATSEYE.',
  keywords: 'featured K-pop artists, popular K-pop, TWICE Heardle, BTS Heardle, BLACKPINK Heardle, LE SSERAFIM, aespa, KATSEYE, K-pop music game',
  
  openGraph: {
    title: 'Featured K-Pop Artists - K-Pop Heardle',
    description: 'Play Heardle games with our handpicked selection of the most popular K-pop artists.',
    type: 'website',
    url: 'https://heardle.live/featured',
    siteName: 'K-Pop Heardle',
    locale: 'en_US',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Featured K-Pop Artists - K-Pop Heardle',
    description: 'Play Heardle games with the most popular K-pop artists.',
    creator: '@kpopheardle',
  },
  
  alternates: {
    canonical: 'https://heardle.live/featured',
  },
};

export default function FeaturedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://heardle.live"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Featured Artists",
        "item": "https://heardle.live/featured"
      }
    ]
  };

  // CollectionPage schema for featured artists
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Featured K-Pop Artists",
    "description": "Handpicked selection of the most popular K-pop artists on K-Pop Heardle",
    "url": "https://heardle.live/featured",
    "isPartOf": {
      "@type": "WebSite",
      "name": "K-Pop Heardle",
      "url": "https://heardle.live"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      {children}
    </>
  );
}
