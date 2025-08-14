export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enableCompression: boolean;
}

export class CacheService<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      enableCompression: false,
      ...config
    };
  }

  set(key: string, value: T): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Check if item has expired
    if (Date.now() - item.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    averageAge: number;
  } {
    const now = Date.now();
    const ages = Array.from(this.cache.values()).map(item => now - item.timestamp);
    const averageAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need to track hits/misses
      averageAge
    };
  }

  // Update configuration
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    
    // If maxSize was reduced, evict excess items
    if (config.maxSize && config.maxSize < this.cache.size) {
      const itemsToRemove = this.cache.size - config.maxSize;
      for (let i = 0; i < itemsToRemove; i++) {
        this.evictOldest();
      }
    }
  }

  // Get all cached keys with their timestamps
  getCacheInfo(): Array<{ key: string; age: number; size: number }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: now - value.timestamp,
      size: JSON.stringify(value.data).length
    }));
  }

  // Clean expired items
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}
