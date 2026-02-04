import { NextResponse } from 'next/server';
import ITunesService from '@/lib/services/itunesService';
import { handleApiError } from '@/lib/utils/apiErrorHandler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artist: string }> }
) {
  try {
    const { artist } = await params;
    const itunesService = ITunesService.getInstance();
    const songs = await itunesService.searchSongs(artist);

    return NextResponse.json({ songs });
  } catch (error) {
    const { artist } = await params;
    return handleApiError(error, artist, 'get songs');
  }
}
