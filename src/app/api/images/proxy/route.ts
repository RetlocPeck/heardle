import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Proxy API Route
 * 
 * Proxies images from Apple Music CDN and caches them with aggressive headers.
 * This dramatically improves image loading performance by:
 * 1. Serving from edge cache after first request
 * 2. Adding proper cache headers for browser caching
 * 3. Working as a fallback if Apple CDN is slow
 */

export async function GET(request: NextRequest) {
  try {
    // Get the image URL from query params
    const imageUrl = request.nextUrl.searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Validate it's an Apple Music CDN URL for security
    // Parse URL and validate hostname to prevent SSRF attacks
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Whitelist of allowed Apple Music CDN hostnames
    const allowedHosts = [
      'is1-ssl.mzstatic.com',
      'is2-ssl.mzstatic.com',
      'is3-ssl.mzstatic.com',
      'is4-ssl.mzstatic.com',
      'is5-ssl.mzstatic.com',
    ];

    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'Invalid image URL - must be from Apple Music CDN (is1-ssl through is5-ssl.mzstatic.com)' },
        { status: 400 }
      );
    }

    // Ensure HTTPS protocol
    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Invalid image URL - must use HTTPS' },
        { status: 400 }
      );
    }

    // Fetch the image from Apple Music CDN
    const imageResponse = await fetch(imageUrl, {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.status}` },
        { status: imageResponse.status }
      );
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Create response with aggressive caching
    const response = new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache in browser for 30 days
        'Cache-Control': 'public, max-age=2592000, immutable',
        // Cache on CDN/edge for 30 days
        'CDN-Cache-Control': 'public, max-age=2592000',
        // Vercel-specific edge caching (1 year)
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
        // Allow image to be used cross-origin
        'Access-Control-Allow-Origin': '*',
        // Help with compression
        'Vary': 'Accept-Encoding',
      },
    });

    return response;
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Handle timeout errors properly
    // AbortSignal.timeout() throws DOMException, not Error
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as { name: string }).name;
      if (errorName === 'TimeoutError' || errorName === 'AbortError') {
        return NextResponse.json(
          { error: 'Image fetch timeout' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}

// Allow CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
