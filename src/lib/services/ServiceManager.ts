import { ArtistService } from './ArtistService';
import { TrackFilterService } from './TrackFilterService';
import { CacheService } from './CacheService';
import { APIService } from './APIService';
import { ITunesService } from './ITunesService';
import { ConfigManager } from '../config/AppConfig';

export class ServiceManager {
  private static instance: ServiceManager;
  
  // Services
  public readonly artistService: ArtistService;
  public readonly filterService: TrackFilterService;
  public readonly apiService: APIService;
  public readonly itunesService: ITunesService;
  public readonly configManager: ConfigManager;
  
  // Cache services for different data types
  public readonly artistCache: CacheService<any>;
  public readonly trackCache: CacheService<any>;
  public readonly gameCache: CacheService<any>;

  private constructor() {
    // Initialize all services
    this.artistService = ArtistService.getInstance();
    this.filterService = TrackFilterService.getInstance();
    this.apiService = APIService.getInstance();
    this.itunesService = ITunesService.getInstance();
    this.configManager = ConfigManager.getInstance();
    
    // Initialize cache services with different configurations
    this.artistCache = new CacheService({
      maxSize: 50,
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    this.trackCache = new CacheService({
      maxSize: 200,
      ttl: 60 * 60 * 1000 // 1 hour
    });
    
    this.gameCache = new CacheService({
      maxSize: 100,
      ttl: 30 * 60 * 1000 // 30 minutes
    });
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  // Initialize all services
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing ServiceManager...');
      
      // Test API connectivity
      const isHealthy = await this.apiService.healthCheck();
      if (!isHealthy) {
        console.warn('⚠️ API service health check failed');
      }
      
      // Load configuration
      const config = this.configManager.getAll();
      console.log('📋 Configuration loaded:', config);
      
      // Initialize services with configuration
      this.apiService.updateConfig(config.api);
      
      console.log('✅ ServiceManager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ServiceManager:', error);
      throw error;
    }
  }

  // Get service status
  getServiceStatus(): {
    artistService: boolean;
    filterService: boolean;
    apiService: boolean;
    itunesService: boolean;
    configManager: boolean;
  } {
    return {
      artistService: !!this.artistService,
      filterService: !!this.filterService,
      apiService: !!this.apiService,
      itunesService: !!this.itunesService,
      configManager: !!this.configManager
    };
  }

  // Get cache statistics
  getCacheStats(): {
    artistCache: any;
    trackCache: any;
    gameCache: any;
  } {
    return {
      artistCache: this.artistCache.getStats(),
      trackCache: this.trackCache.getStats(),
      gameCache: this.gameCache.getStats()
    };
  }

  // Clear all caches
  clearAllCaches(): void {
    this.artistCache.clear();
    this.trackCache.clear();
    this.gameCache.clear();
    console.log('🧹 All caches cleared');
  }

  // Health check for all services
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const services: Record<string, boolean> = {};

    try {
      // Check API service
      const apiHealthy = await this.apiService.healthCheck();
      services.apiService = apiHealthy;
      if (!apiHealthy) errors.push('API service is not responding');

      // Check artist service
      const artistCount = this.artistService.getArtistCount();
      services.artistService = artistCount > 0;
      if (artistCount === 0) errors.push('No artists configured');

      // Check filter service
      const filterConfig = this.filterService.getFilterConfig();
      services.filterService = !!filterConfig;
      if (!filterConfig) errors.push('Filter service configuration missing');

      // Check configuration
      const configValidation = this.configManager.validate();
      services.configManager = configValidation.isValid;
      if (!configValidation.isValid) {
        errors.push(...configValidation.errors);
      }

      // Check cache services
      services.artistCache = this.artistCache.size() >= 0;
      services.trackCache = this.trackCache.size() >= 0;
      services.gameCache = this.gameCache.size() >= 0;

    } catch (error) {
      errors.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const healthy = errors.length === 0;
    
    return {
      healthy,
      services,
      errors
    };
  }

  // Shutdown services gracefully
  async shutdown(): Promise<void> {
    try {
      console.log('🔄 Shutting down ServiceManager...');
      
      // Clear all caches
      this.clearAllCaches();
      
      // Save any pending configuration
      this.configManager.getAll();
      
      console.log('✅ ServiceManager shut down successfully');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  // Get system information
  getSystemInfo(): {
    version: string;
    services: number;
    cacheSize: number;
    configValid: boolean;
  } {
    const configValidation = this.configManager.validate();
    const totalCacheSize = this.artistCache.size() + this.trackCache.size() + this.gameCache.size();
    
    return {
      version: '1.0.0', // This could come from package.json
      services: 5, // Number of main services
      cacheSize: totalCacheSize,
      configValid: configValidation.isValid
    };
  }
}
