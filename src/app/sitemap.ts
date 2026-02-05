import type { MetadataRoute } from 'next';
import { getAllArtists } from '@/config/artists';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://heardle.live';
  const currentDate = new Date().toISOString();
  
  // Get all artists
  const artists = getAllArtists();
  
  // Homepage and category pages
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/featured`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
  
  // Add all artist routes
  artists.forEach((artist) => {
    routes.push({
      url: `${baseUrl}/${artist.id}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: artist.featured ? 0.9 : 0.8, // Higher priority for featured artists
    });
  });
  
  return routes;
}
