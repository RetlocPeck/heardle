import { NextResponse } from 'next/server';
import ITunesService from '@/lib/itunes';

export async function GET() {
  try {
    const itunesService = ITunesService.getInstance();
    const randomSong = await itunesService.getRandomSong('twice');
    
    return NextResponse.json({ song: randomSong });
  } catch (error) {
    console.error('Failed to get random song from iTunes:', error);
    return NextResponse.json(
      { error: 'Failed to get random song' },
      { status: 500 }
    );
  }
}

