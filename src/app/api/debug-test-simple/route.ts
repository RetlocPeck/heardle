import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/lib/services/configService';

export async function GET(request: NextRequest) {
  try {
    const configService = ConfigService.getInstance();
    
    // Test BTS configuration
    const bts = configService.getArtist('bts');
    const twice = configService.getArtist('twice');
    
    if (!bts || !twice) {
      return NextResponse.json({
        success: false,
        error: 'Artist configuration not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      bts: {
        name: bts.displayName,
        searchTerms: bts.searchTerms,
        itunesId: bts.itunesArtistId,
        expectedCount: bts.metadata.songCount
      },
      twice: {
        name: twice.displayName,
        searchTerms: twice.searchTerms,
        itunesId: twice.itunesArtistId,
        expectedCount: twice.metadata.songCount
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
