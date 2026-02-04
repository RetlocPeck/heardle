import { useState, useEffect } from 'react';
import { ConfigService } from '@/lib/services/configService';
import type { ArtistConfig } from '@/config/artists';

export function useArtistConfig(artistId: string | null) {
  const [artist, setArtist] = useState<ArtistConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) {
      setArtist(null);
      setIsLoading(false);
      setError('No artist ID provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const configService = ConfigService.getInstance();
      const artistConfig = configService.getArtist(artistId);
      
      if (!artistConfig) {
        setError(`Artist '${artistId}' not found`);
        setArtist(null);
      } else {
        // Validate the artist configuration
        const validation = configService.validateArtist(artistId);
        if (!validation.isValid) {
          console.warn(`Artist '${artistId}' has validation errors:`, validation.errors);
          setError(`Invalid artist configuration: ${validation.errors.join(', ')}`);
          setArtist(null);
        } else {
          setArtist(artistConfig);
          setError(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setArtist(null);
    } finally {
      setIsLoading(false);
    }
  }, [artistId]);

  return {
    artist,
    isLoading,
    error,
    // Helper methods
    getTheme: () => artist?.theme || null,
    getDisplayName: () => artist?.displayName || artistId?.toUpperCase() || 'Unknown Artist',
    getSearchTerms: () => artist?.searchTerms || [],
  };
}
