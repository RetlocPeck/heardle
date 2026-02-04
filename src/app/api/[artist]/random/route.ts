import { NextResponse } from 'next/server';
import ITunesService from '@/lib/services/itunesService';

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
    console.error(`Failed to get random song for ${artist}:`, error);
    return NextResponse.json(
      { error: 'Failed to get random song' },
      { status: 500 }
    );
  }
}
