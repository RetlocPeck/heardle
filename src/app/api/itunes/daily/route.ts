import { NextResponse } from 'next/server';
import ITunesService from '@/lib/itunes';

export async function GET() {
  try {
    const itunesService = ITunesService.getInstance();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dailySong = await itunesService.getDailySong(today);
    
    return NextResponse.json({ song: dailySong });
  } catch (error) {
    console.error('Failed to get daily song from iTunes:', error);
    return NextResponse.json(
      { error: 'Failed to get daily song' },
      { status: 500 }
    );
  }
}

