export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface APIConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  rateLimitDelay: number;
}

export class APIService {
  private static instance: APIService;
  private config: APIConfig;
  private lastRequestTime: number = 0;

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  constructor() {
    this.config = {
      baseUrl: 'https://itunes.apple.com',
      timeout: 10000,
      retryAttempts: 3,
      rateLimitDelay: 100
    };
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<APIResponse<T>> {
    try {
      await this.respectRateLimit();
      
      const url = this.buildUrl(endpoint, params);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.lastRequestTime = Date.now();

      return {
        data,
        success: true,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  private async respectRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.config.rateLimitDelay - timeSinceLastRequest)
      );
    }
  }

  // Retry logic for failed requests
  async getWithRetry<T>(endpoint: string, params?: Record<string, string>): Promise<APIResponse<T>> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      const result = await this.get<T>(endpoint, params);
      
      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';
      
      if (attempt < this.config.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      data: null as T,
      success: false,
      error: `Failed after ${this.config.retryAttempts} attempts. Last error: ${lastError}`,
      timestamp: Date.now()
    };
  }

  // Update configuration
  updateConfig(config: Partial<APIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current configuration
  getConfig(): APIConfig {
    return { ...this.config };
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.get('/search', { term: 'test', limit: '1' });
      return result.success;
    } catch {
      return false;
    }
  }

  // Get request statistics
  getRequestStats(): {
    lastRequestTime: number;
    timeSinceLastRequest: number;
    config: APIConfig;
  } {
    const now = Date.now();
    return {
      lastRequestTime: this.lastRequestTime,
      timeSinceLastRequest: now - this.lastRequestTime,
      config: this.getConfig()
    };
  }
}
