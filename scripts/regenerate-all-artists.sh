#!/bin/bash
# Regenerate song data for all artists
# This script uses prefetch-songs.js to regenerate all artists at once
# 
# Usage:
#   bash scripts/regenerate-all-artists.sh
#   
# Or run directly:
#   node scripts/prefetch-songs.js

echo "🔄 Regenerating song data for all artists..."
echo ""
echo "This will:"
echo "  - Fetch albums and tracks from Apple Music API"
echo "  - Apply all filters (including intro/outro/skit filter)"
echo "  - Deduplicate song versions"
echo "  - Save to public/data/songs/*.json"
echo "  - Save artwork to public/data/artwork/*.json"
echo ""
echo "⚠️  This may take 10-30 minutes depending on number of artists"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "✅ Starting regeneration..."
    node scripts/prefetch-songs.js
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully regenerated all artist data!"
        echo ""
        echo "📊 Summary:"
        echo "  - Song data: public/data/songs/*.json"
        echo "  - Artwork: public/data/artwork/*.json"
        echo "  - Summary: public/data/summary.json"
        echo ""
        echo "🎯 Next steps:"
        echo "  1. Review public/data/summary.json for any issues"
        echo "  2. Test the game to ensure no intro/outro/skit tracks appear"
        echo "  3. Commit the updated JSON files"
    else
        echo ""
        echo "❌ Regeneration failed. Check the error messages above."
        exit 1
    fi
else
    echo "❌ Cancelled"
    exit 0
fi
