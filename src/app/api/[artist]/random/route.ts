import { NextResponse } from 'next/server';
import ITunesService from '@/lib/services/itunesService';
import { handleApiError } from '@/lib/utils/apiErrorHandler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artist: string }> }
) {
  try {
    const { artist } = await params;
    const url = new URL(request.url);
    
    // Get excluded track IDs from query parameters (sent from client)
    const excludeParam = url.searchParams.get('exclude');
    const excludeTrackIds = excludeParam ? excludeParam.split(',') : [];
    
    const itunesService = ITunesService.getInstance();
    const randomSong = await itunesService.getRandomSong(artist, excludeTrackIds);
    
    return NextResponse.json({ song: randomSong });
  } catch (error) {
    const { artist } = await params;
    return handleApiError(error, artist, 'get random song');
  }
}
