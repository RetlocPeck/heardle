// Re-export the refactored iTunes service
export { default } from './itunes/service';

// Re-export Song type for backward compatibility during transition
export type { Song } from '@/types/song';

// Re-export pagination types for advanced usage
export type { PageOpts, Paged, PaginationResult } from './itunes/types';
