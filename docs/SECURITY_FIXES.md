# Security Fixes - Image Proxy Route

## Overview

This document details critical security and error handling fixes applied to the image proxy API route.

## Bug 1: SSRF (Server-Side Request Forgery) Vulnerability

### Severity: HIGH

### Issue

The original validation used weak string matching that could be bypassed:

```typescript
// VULNERABLE CODE (before fix)
if (!imageUrl.startsWith('https://is')) {
  return error; // ❌ Allows https://is-attacker.com
}

if (!imageUrl.includes('mzstatic.com')) {
  return error; // ❌ Allows https://is-attacker.com/mzstatic.com/evil
}
```

### Attack Vector

An attacker could craft malicious URLs that pass both checks:
- `https://is-attacker.com/mzstatic.com/internal-service`
- `https://is-evil.com/path/mzstatic.com`

These URLs would pass validation but fetch from attacker-controlled domains, potentially:
1. Accessing internal services (SSRF)
2. Leaking server information
3. Using your server as a proxy for attacks

### Fix

Implemented proper URL parsing and hostname validation:

```typescript
// SECURE CODE (after fix)
// Parse URL to extract hostname
const parsedUrl = new URL(imageUrl);

// Whitelist of exact allowed hostnames
const allowedHosts = [
  'is1-ssl.mzstatic.com',
  'is2-ssl.mzstatic.com',
  'is3-ssl.mzstatic.com',
  'is4-ssl.mzstatic.com',
  'is5-ssl.mzstatic.com',
];

// Validate exact hostname match
if (!allowedHosts.includes(parsedUrl.hostname)) {
  return error; // ✅ Only allows exact Apple Music CDN domains
}

// Ensure HTTPS
if (parsedUrl.protocol !== 'https:') {
  return error; // ✅ Prevents http:// and other protocols
}
```

### Protection

Now blocks all attack attempts:
- ❌ `https://is-attacker.com/mzstatic.com/...` - hostname doesn't match
- ❌ `https://is-evil.mzstatic.com/...` - hostname doesn't match
- ❌ `http://is1-ssl.mzstatic.com/...` - protocol not HTTPS
- ✅ `https://is1-ssl.mzstatic.com/...` - valid!

## Bug 2: Incorrect Timeout Error Handling

### Severity: MEDIUM

### Issue

The error handler checked for `Error` instance, but `AbortSignal.timeout()` throws `DOMException`:

```typescript
// INCORRECT CODE (before fix)
if (error instanceof Error && error.name === 'TimeoutError') {
  return 504; // ❌ Never reached! DOMException !== Error in Node.js
}
return 500; // Always returns 500 for timeouts
```

### Problem

In Node.js, `DOMException` doesn't inherit from `Error`, so:
1. `instanceof Error` returns `false`
2. Timeout check never passes
3. Returns 500 (Internal Server Error) instead of 504 (Gateway Timeout)
4. Makes debugging harder (wrong status code)

### Fix

Properly check for DOMException timeout errors:

```typescript
// CORRECT CODE (after fix)
if (error && typeof error === 'object' && 'name' in error) {
  const errorName = (error as { name: string }).name;
  if (errorName === 'TimeoutError' || errorName === 'AbortError') {
    return 504; // ✅ Correct status code for timeouts
  }
}
return 500; // Only for actual server errors
```

### Benefits

- ✅ Returns correct 504 status for timeouts
- ✅ Works with both `TimeoutError` and `AbortError`
- ✅ Doesn't rely on prototype chain
- ✅ Better monitoring and debugging

## Testing

### Manual Testing

Test the security fixes:

```bash
# Valid Apple Music URL (should work)
curl "http://localhost:3000/api/images/proxy?url=https://is1-ssl.mzstatic.com/image/thumb/.../600x600bb.jpg"
# ✅ Returns image

# SSRF attempt 1 (should block)
curl "http://localhost:3000/api/images/proxy?url=https://is-attacker.com/mzstatic.com/evil"
# ✅ Returns 400: Invalid image URL

# SSRF attempt 2 (should block)
curl "http://localhost:3000/api/images/proxy?url=https://is-evil.mzstatic.com/path"
# ✅ Returns 400: Invalid image URL

# Non-HTTPS attempt (should block)
curl "http://localhost:3000/api/images/proxy?url=http://is1-ssl.mzstatic.com/image/..."
# ✅ Returns 400: must use HTTPS
```

## Impact

### Before Fixes
- 🔴 SSRF vulnerability (HIGH risk)
- 🟡 Incorrect error codes (MEDIUM impact)
- 🔴 Potential for internal service access
- 🟡 Harder to debug timeout issues

### After Fixes
- ✅ SSRF completely prevented
- ✅ Correct HTTP status codes
- ✅ Only approved Apple Music domains
- ✅ Better error monitoring

## Files Modified

- `src/app/api/images/proxy/route.ts` - Security and error handling fixes

## Related Documentation

- [IMAGE_OPTIMIZATION.md](./IMAGE_OPTIMIZATION.md) - Overall image optimization strategy
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
