import { NextRequest, NextResponse } from 'next/server';
import { ITunesService } from '@/lib/itunes/service';
import { ConfigService } from '@/lib/services/configService';
import { SongFilters } from '@/lib/itunes/filters';

export async function GET(request: NextRequest) {
  try {
    const configService = ConfigService.getInstance();
    const itunesService = ITunesService.getInstance();
    const filters = new SongFilters();
    
    // Test BTS and TWICE coverage
    const testArtists = ['bts', 'twice'];
    const results: any = {};
    
    for (const artistId of testArtists) {
      console.log(`\n🎯 Testing coverage for ${artistId.toUpperCase()}`);
      console.log('=' .repeat(50));
      
      const artist = configService.getArtist(artistId);
      if (!artist) {
        console.log(`❌ Artist ${artistId} not found in configuration`);
        continue;
      }
      
      console.log(`Artist: ${artist.displayName}`);
      console.log(`iTunes ID: ${artist.itunesArtistId}`);
      console.log(`Search Terms: ${artist.searchTerms.join(', ')}`);
      console.log(`Expected Song Count: ${artist.metadata.songCount}`);
      
      // Fetch tracks using the enhanced pipeline
      console.log(`\n🔍 Fetching tracks...`);
      const startTime = Date.now();
      
      const tracks = await itunesService.searchSongs(artistId, {
        countries: ['US', 'JP', 'KR', 'GB', 'CA'],
        limit: 200
      });
      
      const fetchTime = Date.now() - startTime;
      console.log(`⏱️  Fetch completed in ${fetchTime}ms`);
      console.log(`📊 Raw tracks found: ${tracks.length}`);
      
      // Apply filters to see what gets filtered out
      console.log(`\n🔍 Applying filters...`);
      const filterStartTime = Date.now();
      
      const filterResult = filters.processTracks(tracks);
      const filterTime = Date.now() - filterStartTime;
      
      console.log(`⏱️  Filtering completed in ${filterTime}ms`);
      console.log(`✅ Valid tracks: ${filterResult.valid.length}`);
      console.log(`❌ Filtered out: ${filterResult.filtered.length}`);
      
      // Show some filtering reasons
      const filterReasons = filterResult.filtered.reduce((acc: any, item: any) => {
        acc[item.reason] = (acc[item.reason] || 0) + 1;
        return acc;
      }, {});
      
      if (Object.keys(filterReasons).length > 0) {
        console.log(`\n📋 Filter reasons:`);
        Object.entries(filterReasons)
          .sort(([,a]: any, [,b]: any) => b - a)
          .forEach(([reason, count]) => {
            console.log(`  ${reason}: ${count} tracks`);
          });
      }
      
      // Calculate coverage percentage
      const coveragePercentage = tracks.length > 0 ? (filterResult.valid.length / tracks.length * 100).toFixed(1) : 0;
      console.log(`\n📈 Coverage: ${filterResult.valid.length}/${tracks.length} (${coveragePercentage}%)`);
      
      // Store results
      results[artistId] = {
        artist: artist.displayName,
        rawTracks: tracks.length,
        validTracks: filterResult.valid.length,
        filteredTracks: filterResult.filtered.length,
        coveragePercentage: parseFloat(coveragePercentage),
        expectedCount: artist.metadata.songCount,
        fetchTime,
        filterTime,
        filterReasons
      };
      
      console.log(`\n🎯 ${artist.displayName} Final Result: ${filterResult.valid.length} tracks`);
      console.log(`Expected: ${artist.metadata.songCount}, Actual: ${filterResult.valid.length}`);
      
      if (artistId === 'bts') {
        const btsStatus = filterResult.valid.length >= 150 && filterResult.valid.length <= 200 ? '✅ PASS' : '❌ FAIL';
        console.log(`BTS Target (150-200): ${btsStatus}`);
      } else if (artistId === 'twice') {
        const twiceStatus = filterResult.valid.length > 200 ? '✅ PASS' : '❌ FAIL';
        console.log(`TWICE Target (>200): ${twiceStatus}`);
      }
    }
    
    // Summary
    console.log(`\n📊 SUMMARY`);
    console.log('=' .repeat(50));
    Object.entries(results).forEach(([artistId, data]: [string, any]) => {
      console.log(`${data.artist}: ${data.validTracks} tracks (expected: ${data.expectedCount})`);
    });
    
    return NextResponse.json({
      success: true,
      results,
      summary: {
        bts: results.bts?.validTracks || 0,
        twice: results.twice?.validTracks || 0,
        btsTarget: results.bts?.validTracks >= 150 && results.bts?.validTracks <= 200,
        twiceTarget: results.twice?.validTracks > 200
      }
    });
    
  } catch (error) {
    console.error('❌ Test coverage failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
