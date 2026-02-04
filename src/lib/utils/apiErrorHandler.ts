import { NextResponse } from 'next/server';

/**
 * Standardized error response for API routes
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
}

/**
 * Handle API errors with consistent logging and response format
 * @param error - The caught error
 * @param artist - The artist ID for logging context
 * @param operation - Description of the operation that failed
 * @returns NextResponse with error status
 */
export function handleApiError(
  error: unknown,
  artist: string,
  operation: string
): NextResponse<ApiErrorResponse> {
  console.error(`Failed to ${operation} for ${artist}:`, error);
  
  return NextResponse.json(
    { error: `Failed to ${operation}` },
    { status: 500 }
  );
}

/**
 * Create a standardized not found response
 */
export function createNotFoundResponse(
  resource: string,
  artist: string
): NextResponse<ApiErrorResponse> {
  console.warn(`${resource} not found for ${artist}`);
  
  return NextResponse.json(
    { error: `${resource} not found` },
    { status: 404 }
  );
}

/**
 * Create a standardized bad request response
 */
export function createBadRequestResponse(
  message: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}
