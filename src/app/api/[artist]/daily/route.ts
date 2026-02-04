import AppleMusicService from '@/lib/services/appleMusicService';
import { getSafeDateString } from '@/lib/utils/dateUtils';
import { createArtistRoute, getQueryParams } from '@/lib/utils/createArtistRoute';
import { Logger } from '@/lib/utils/logger';

export const GET = createArtistRoute(
  async (artist, request) => {
    const clientDate = getQueryParams(request).get('date');
    const today = getSafeDateString(clientDate);
    
    // Log for debugging timezone issues
    if (clientDate && clientDate !== today) {
      Logger.warn(`Client date ${clientDate} rejected, using server date ${today}`);
    } else if (clientDate) {
      Logger.debug(`Using validated client date: ${clientDate}`);
    }
    
    const service = AppleMusicService.getInstance();
    const song = await service.getDailySong(today, artist);
    return { song };
  },
  { operation: 'get daily song' }
);
