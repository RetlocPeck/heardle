import { NextResponse } from 'next/server';
import ITunesService from '@/lib/itunes';

export async function GET(
  request: Request,
  { params }: { params: { artist: string } }
) {
  try {
    const itunesService = ITunesService.getInstance();
    const songs = await itunesService.searchSongs(params.artist);

    return NextResponse.json({ songs });
  } catch (error) {
    console.error(`Failed to get songs for ${params.artist}:`, error);
    return NextResponse.json(
      { error: 'Failed to get songs' },
      { status: 500 }
    );
  }
}
