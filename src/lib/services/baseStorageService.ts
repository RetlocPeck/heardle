import { Logger } from '@/lib/utils/logger';

/**
 * Base class for localStorage-based storage services.
 * Provides common CRUD operations with error handling.
 */
export abstract class BaseStorageService<T> {
  protected abstract readonly STORAGE_KEY: string;
  protected abstract getDefault(): T;

  /**
   * Check if running in browser environment
   */
  protected isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Get stored data from localStorage
   */
  protected getStored(): T {
    if (!this.isBrowser()) {
      return this.getDefault();
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return this.parseStored(stored);
      }
    } catch (error) {
      Logger.error(`Error reading from ${this.STORAGE_KEY}:`, error);
    }

    return this.getDefault();
  }

  /**
   * Parse stored JSON string. Override for custom parsing.
   */
  protected parseStored(stored: string): T {
    return JSON.parse(stored);
  }

  /**
   * Save data to localStorage
   */
  protected save(data: T): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      Logger.error(`Error saving to ${this.STORAGE_KEY}:`, error);
    }
  }

  /**
   * Clear all data from storage
   */
  protected clear(): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      Logger.error(`Error clearing ${this.STORAGE_KEY}:`, error);
    }
  }

  /**
   * Get item with a specific key pattern
   */
  protected getItem(key: string): string | null {
    if (!this.isBrowser()) return null;

    try {
      return localStorage.getItem(key);
    } catch (error) {
      Logger.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item with a specific key
   */
  protected setItem(key: string, value: string): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.setItem(key, value);
    } catch (error) {
      Logger.error(`Error writing ${key}:`, error);
    }
  }

  /**
   * Remove item with a specific key
   */
  protected removeItem(key: string): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      Logger.error(`Error removing ${key}:`, error);
    }
  }

  /**
   * Get all keys matching a prefix
   */
  protected getKeysByPrefix(prefix: string): string[] {
    if (!this.isBrowser()) return [];

    try {
      return Object.keys(localStorage).filter(key => key.startsWith(prefix));
    } catch (error) {
      Logger.error(`Error getting keys with prefix ${prefix}:`, error);
      return [];
    }
  }

  /**
   * Dispatch a custom event
   */
  protected dispatchEvent(eventName: string, detail?: unknown): void {
    if (!this.isBrowser()) return;

    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
    Logger.debug(`Dispatched ${eventName} event`, detail);
  }
}

/**
 * Mixin for singleton pattern - use with storage services
 */
export function createSingleton<T extends new () => InstanceType<T>>(
  ServiceClass: T
): T & { getInstance(): InstanceType<T> } {
  let instance: InstanceType<T> | null = null;

  return class extends (ServiceClass as new () => object) {
    constructor() {
      super();
    }

    static getInstance(): InstanceType<T> {
      if (!instance) {
        instance = new ServiceClass() as InstanceType<T>;
      }
      return instance;
    }
  } as T & { getInstance(): InstanceType<T> };
}
