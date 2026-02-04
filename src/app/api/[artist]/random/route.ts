import AppleMusicService from '@/lib/services/appleMusicService';
import { createArtistRoute, getArrayParam } from '@/lib/utils/createArtistRoute';

export const GET = createArtistRoute(
  async (artist, request) => {
    const excludeTrackIds = getArrayParam(request, 'exclude');
    const service = AppleMusicService.getInstance();
    const song = await service.getRandomSong(artist, excludeTrackIds);
    return { song };
  },
  { operation: 'get random song' }
);
