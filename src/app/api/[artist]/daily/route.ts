import { NextResponse } from 'next/server';
import ITunesService from '@/lib/services/itunesService';
import { getSafeDateString } from '@/lib/utils/dateUtils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artist: string }> }
) {
  try {
    const { artist } = await params;
    const url = new URL(request.url);
    
    // Get the date from client (user's local timezone) with validation
    const clientDate = url.searchParams.get('date');
    const today = getSafeDateString(clientDate);
    
    // Log for debugging timezone issues
    if (clientDate && clientDate !== today) {
      console.warn(`⚠️ Client date ${clientDate} rejected, using server date ${today} instead`);
    } else if (clientDate) {
      console.log(`📅 Using validated client date: ${clientDate}`);
    }
    
    const itunesService = ITunesService.getInstance();
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
