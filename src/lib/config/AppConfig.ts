export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    rateLimitDelay: number;
  };
  cache: {
    maxSize: number;
    ttl: number;
    enableCompression: boolean;
  };
  game: {
    maxTries: number;
    initialDuration: number;
    maxDuration: number;
    durationProgression: number[];
  };
  features: {
    enableAnalytics: boolean;
    enableSocialSharing: boolean;
    enableLeaderboards: boolean;
    enableCustomThemes: boolean;
  };
}

export const DEFAULT_CONFIG: AppConfig = {
  api: {
    baseUrl: 'https://itunes.apple.com',
    timeout: 10000,
    retryAttempts: 3,
    rateLimitDelay: 100
  },
  cache: {
    maxSize: 1000,
    ttl: 60 * 60 * 1000, // 1 hour
    enableCompression: false
  },
  game: {
    maxTries: 6,
    initialDuration: 1000,
    maxDuration: 15000,
    durationProgression: [1000, 2000, 4000, 7000, 10000, 15000]
  },
  features: {
    enableAnalytics: false,
    enableSocialSharing: true,
    enableLeaderboards: false,
    enableCustomThemes: true
  }
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadFromLocalStorage();
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.saveToLocalStorage();
  }

  update(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveToLocalStorage();
  }

  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveToLocalStorage();
  }

  // Get nested configuration value
  getNested<K extends keyof AppConfig, N extends keyof AppConfig[K]>(
    section: K, 
    key: N
  ): AppConfig[K][N] {
    return this.config[section][key];
  }

  // Set nested configuration value
  setNested<K extends keyof AppConfig, N extends keyof AppConfig[K]>(
    section: K, 
    key: N, 
    value: AppConfig[K][N]
  ): void {
    this.config[section][key] = value;
    this.saveToLocalStorage();
  }

  // Check if a feature is enabled
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  // Get all configuration
  getAll(): AppConfig {
    return { ...this.config };
  }

  // Export configuration
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // Import configuration
  import(configString: string): boolean {
    try {
      const imported = JSON.parse(configString);
      this.config = { ...DEFAULT_CONFIG, ...imported };
      this.saveToLocalStorage();
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  // Validate configuration
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate API config
    if (this.config.api.timeout <= 0) {
      errors.push('API timeout must be greater than 0');
    }
    if (this.config.api.retryAttempts < 0) {
      errors.push('API retry attempts must be non-negative');
    }

    // Validate cache config
    if (this.config.cache.maxSize <= 0) {
      errors.push('Cache max size must be greater than 0');
    }
    if (this.config.cache.ttl <= 0) {
      errors.push('Cache TTL must be greater than 0');
    }

    // Validate game config
    if (this.config.game.maxTries <= 0) {
      errors.push('Game max tries must be greater than 0');
    }
    if (this.config.game.initialDuration <= 0) {
      errors.push('Game initial duration must be greater than 0');
    }
    if (this.config.game.maxDuration <= this.config.game.initialDuration) {
      errors.push('Game max duration must be greater than initial duration');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('appConfig');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('appConfig', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }
  }
}
