# Scripts

## generate-apple-music-token.js

Generates JWT developer tokens for Apple Music API access.

### Prerequisites

1. Apple Developer Program membership
2. MusicKit Private Key (.p8 file) from Apple Developer Portal
3. Team ID and Key ID

### Usage

1. Download your MusicKit key (.p8 file) and place in project root
2. Edit the script and update:
   - `TEAM_ID` - Your 10-character team ID
   - `KEY_ID` - Your 10-character key ID
   - `KEY_FILE` - Your .p8 filename
3. Run: `node scripts/generate-apple-music-token.js`
4. Token will be saved to `.env.local`

### Token Expiry

- Max lifetime: 180 days
- Set a calendar reminder to regenerate before expiry
- Script will show expiration date when run

### Security

- Never commit `.env.local` or `.p8` files to git
- Add them to `.gitignore` if not already present
- Tokens are sensitive - treat like passwords
