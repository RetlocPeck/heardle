import { NextResponse } from 'next/server';
import ITunesService from '@/lib/itunes';

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
    console.error(`Failed to get songs for ${artist}:`, error);
    return NextResponse.json(
      { error: 'Failed to get songs' },
      { status: 500 }
    );
  }
}
