import { NextResponse } from 'next/server';
import ITunesService from '@/lib/itunes';

export async function GET() {
  try {
    const itunesService = ITunesService.getInstance();
    const songs = await itunesService.searchSongs('twice');

    return NextResponse.json({ songs });
  } catch (error) {
    console.error('Failed to get iTunes songs:', error);
    return NextResponse.json(
      { error: 'Failed to get iTunes songs' },
      { status: 500 }
    );
  }
}

