import AppleMusicService from '@/lib/services/appleMusicService';
import { createArtistRoute } from '@/lib/utils/createArtistRoute';

export const GET = createArtistRoute(
  async (artist) => {
    const service = AppleMusicService.getInstance();
    const songs = await service.searchSongs(artist);
    return { songs };
  },
  { operation: 'get songs' }
);
