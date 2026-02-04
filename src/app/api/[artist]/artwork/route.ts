import AppleMusicService from '@/lib/services/appleMusicService';
import { createArtistRoute } from '@/lib/utils/createArtistRoute';

export const GET = createArtistRoute(
  async (artist) => {
    const service = AppleMusicService.getInstance();
    const artwork = await service.getArtistArtwork(artist);
    return artwork ? { artwork } : null;
  },
  { operation: 'get artwork', allowNull: false, nullMessage: 'Artist artwork' }
);
