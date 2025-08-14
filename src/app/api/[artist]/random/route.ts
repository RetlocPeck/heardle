import { NextResponse } from 'next/server';
import ITunesService from '@/lib/itunes';

export async function GET(
  request: Request,
  { params }: { params: { artist: string } }
) {
  try {
    const itunesService = ITunesService.getInstance();
    const randomSong = await itunesService.getRandomSong(params.artist);
    
    return NextResponse.json({ song: randomSong });
  } catch (error) {
    console.error(`Failed to get random song for ${params.artist}:`, error);
    return NextResponse.json(
      { error: 'Failed to get random song' },
      { status: 500 }
    );
  }
}
