// Main service export
export { default } from './service';

// Individual module exports
export * from './types';
export * from './client';
export * from './searchPipeline';
export * from './filters';
export * from './repository';
export * from './debug';

// Re-export Song type for backward compatibility
export type { Song } from '@/types/song';
