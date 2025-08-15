import { NextResponse } from 'next/server';
import ITunesService from '@/lib/itunes';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artist: string }> }
) {
  try {
    const { artist } = await params;
    const itunesService = ITunesService.getInstance();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dailySong = await itunesService.getDailySong(today, artist);
    
    return NextResponse.json({ song: dailySong });
  } catch (error) {
    const { artist } = await params;
    console.error(`Failed to get daily song for ${artist}:`, error);
    return NextResponse.json(
      { error: 'Failed to get daily song' },
      { status: 500 }
    );
  }
}
