# PowerShell script to regenerate song data for all artists
# This script uses prefetch-songs.js to regenerate all artists at once
# 
# Usage:
#   powershell scripts/regenerate-all-artists.ps1
#   
# Or run directly:
#   node scripts/prefetch-songs.js

Write-Host "🔄 Regenerating song data for all artists..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:"
Write-Host "  - Fetch albums and tracks from Apple Music API"
Write-Host "  - Apply all filters (including intro/outro/skit filter)"
Write-Host "  - Deduplicate song versions"
Write-Host "  - Save to public/data/songs/*.json"
Write-Host "  - Save artwork to public/data/artwork/*.json"
Write-Host ""
Write-Host "⚠️  This may take 10-30 minutes depending on number of artists" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Continue? (y/n)"

if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    Write-Host "✅ Starting regeneration..." -ForegroundColor Green
    node scripts/prefetch-songs.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Successfully regenerated all artist data!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Summary:" -ForegroundColor Cyan
        Write-Host "  - Song data: public/data/songs/*.json"
        Write-Host "  - Artwork: public/data/artwork/*.json"
        Write-Host "  - Summary: public/data/summary.json"
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Review public/data/summary.json for any issues"
        Write-Host "  2. Test the game to ensure no intro/outro/skit tracks appear"
        Write-Host "  3. Commit the updated JSON files"
    } else {
        Write-Host ""
        Write-Host "❌ Regeneration failed. Check the error messages above." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 0
}
