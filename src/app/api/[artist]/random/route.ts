import { NextResponse } from 'next/server';
import ITunesService from '@/lib/itunes';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artist: string }> }
) {
  try {
    const { artist } = await params;
    const itunesService = ITunesService.getInstance();
    const randomSong = await itunesService.getRandomSong(artist);
    
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
