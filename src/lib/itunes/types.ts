// iTunes API types and pagination interfaces
export interface PageOpts {
  limit?: number;
  offset?: number;
  entity?: string;
  media?: string;
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
}

export interface ITunesSearchParams {
  term: string;
  entity?: string;
  media?: string;
  limit?: number;
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
