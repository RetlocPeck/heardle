import { NextResponse } from 'next/server';
import ITunesService from '@/lib/itunes';

export async function GET(
  request: Request,
  { params }: { params: { artist: string } }
) {
  try {
    const itunesService = ITunesService.getInstance();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dailySong = await itunesService.getDailySong(today, params.artist);
    
    return NextResponse.json({ song: dailySong });
  } catch (error) {
    console.error(`Failed to get daily song for ${params.artist}:`, error);
    return NextResponse.json(
      { error: 'Failed to get daily song' },
      { status: 500 }
    );
  }
}
