// iTunes API types and pagination interfaces
export interface PageOpts {
  limit?: number;
  offset?: number;
  entity?: string;
  media?: string;
  country?: string;      // Single country for backward compatibility
  countries?: string[];  // Multiple countries for multi-country search
  attribute?: string;    // Additional search attribute (e.g., 'artistTerm')
}

export interface Paged<T> {
  data: T[];
  total: number;
  hasNext: boolean;
  nextOffset?: number;
}

// iTunes API specific types
export interface ITunesLookupParams {
  id: string;
  entity?: string;
  limit?: number;
  offset?: number;
}

export interface ITunesSearchParams {
  term: string;
  entity?: string;
  media?: string;
  limit?: number;
  offset?: number;
}

// iTunes API response types
export interface ITunesResponse {
  resultCount: number;
  results: any[];
}

// Search strategy types
export interface SearchStrategy {
  name: string;
  execute(artist: any, opts?: PageOpts): Promise<any[]>;
}

// Repository types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

export interface Repository<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

// Filter types
export interface FilterResult {
  valid: any[];
  filtered: any[];
}

// Pagination result types
export interface PaginationResult {
  tracks: any[];
  totalAvailable: number;
  pagesFetched: number;
  hasMore: boolean;
}
