import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All K-Pop Artists - K-Pop Heardle',
  description: 'Browse our complete collection of 100+ K-pop artists. Play Heardle games featuring TWICE, BTS, BLACKPINK, and many more. Find your favorite artists and test your music knowledge!',
  keywords: 'K-pop artists, K-pop Heardle, all artists, TWICE, BTS, BLACKPINK, K-pop music game, artist directory',
  
  openGraph: {
    title: 'All K-Pop Artists - K-Pop Heardle',
    description: 'Browse our complete collection of 100+ K-pop artists. Find your favorites and test your music knowledge!',
    type: 'website',
    url: 'https://heardle.live/artists',
    siteName: 'K-Pop Heardle',
    locale: 'en_US',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'All K-Pop Artists - K-Pop Heardle',
    description: 'Browse our complete collection of 100+ K-pop artists.',
    creator: '@kpopheardle',
  },
  
  alternates: {
    canonical: 'https://heardle.live/artists',
  },
};

export default function ArtistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // BreadcrumbList schema for the artists index page
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
        "name": "All Artists",
        "item": "https://heardle.live/artists"
      }
    ]
  };

  // CollectionPage schema
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "All K-Pop Artists",
    "description": "Complete directory of K-pop artists available on K-Pop Heardle",
    "url": "https://heardle.live/artists",
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
