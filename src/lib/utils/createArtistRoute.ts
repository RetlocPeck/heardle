import { NextResponse } from 'next/server';
import { handleApiError, createNotFoundResponse } from './apiErrorHandler';

type RouteParams = { params: Promise<{ artist: string }> };

type ArtistRouteHandler<T> = (
  artist: string,
  request: Request
) => Promise<T>;

type ArtistRouteOptions = {
  operation: string;
  allowNull?: boolean;
  nullMessage?: string;
};

/**
 * Creates a standardized API route handler for artist-based endpoints.
 * Handles params extraction, error handling, and response formatting.
 * 
 * @example
 * // Simple usage
 * export const GET = createArtistRoute(
 *   async (artist) => {
 *     const service = AppleMusicService.getInstance();
 *     return { songs: await service.searchSongs(artist) };
 *   },
 *   { operation: 'get songs' }
 * );
 * 
 * @example
 * // With null handling
 * export const GET = createArtistRoute(
 *   async (artist) => {
 *     const service = AppleMusicService.getInstance();
 *     return await service.getArtistArtwork(artist);
 *   },
 *   { operation: 'get artwork', allowNull: false, nullMessage: 'Artist artwork' }
 * );
 */
export function createArtistRoute<T>(
  handler: ArtistRouteHandler<T>,
  options: ArtistRouteOptions
) {
  return async (request: Request, { params }: RouteParams) => {
    const { artist } = await params;
    
    try {
      const result = await handler(artist, request);
      
      // Handle null results if configured
      if (result === null && options.allowNull === false) {
        return createNotFoundResponse(
          options.nullMessage || 'Resource',
          artist
        );
      }
      
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error, artist, options.operation);
    }
  };
}

/**
 * Helper to extract query parameters from request URL
 */
export function getQueryParams(request: Request): URLSearchParams {
  return new URL(request.url).searchParams;
}

/**
 * Helper to extract and parse comma-separated query parameter
 */
export function getArrayParam(request: Request, key: string): string[] {
  const param = getQueryParams(request).get(key);
  return param ? param.split(',').filter(Boolean) : [];
}
