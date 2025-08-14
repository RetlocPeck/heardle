# 🏗️ K-Pop Heardle - Modular Architecture

## Overview

This document describes the new modular architecture for the K-Pop Heardle application, designed for scalability, maintainability, and extensibility.

## 🎯 Architecture Goals

- **Modularity**: Separate concerns into focused, single-responsibility services
- **Scalability**: Easy to add new artists, features, and data sources
- **Maintainability**: Clear separation of concerns and consistent patterns
- **Extensibility**: Simple to add new game modes, filtering rules, and APIs
- **Performance**: Efficient caching and rate limiting
- **Testing**: Services can be tested independently

## 🏛️ Service Architecture

### Core Services

#### 1. **ServiceManager** (`src/lib/services/ServiceManager.ts`)
- **Purpose**: Central coordinator for all services
- **Responsibilities**: 
  - Service initialization and lifecycle management
  - Health checks and monitoring
  - Cache management coordination
  - System status reporting

#### 2. **ArtistService** (`src/lib/services/ArtistService.ts`)
- **Purpose**: Manages artist configuration and metadata
- **Responsibilities**:
  - Artist CRUD operations
  - Artist search and filtering
  - Theme and metadata management
  - Artist validation

#### 3. **ITunesService** (`src/lib/services/ITunesService.ts`)
- **Purpose**: Handles music data fetching from iTunes API
- **Responsibilities**:
  - Song fetching and caching
  - Artist-specific song searches
  - Daily and random song selection
  - Track deduplication

#### 4. **TrackFilterService** (`src/lib/services/TrackFilterService.ts`)
- **Purpose**: Filters and cleans track data
- **Responsibilities**:
  - Duplicate track removal
  - Unwanted version filtering
  - Language indicator filtering
  - Configurable filtering rules

#### 5. **APIService** (`src/lib/services/APIService.ts`)
- **Purpose**: HTTP client with advanced features
- **Responsibilities**:
  - Rate limiting and retry logic
  - Request timeout management
  - Error handling and response parsing
  - Health checking

#### 6. **CacheService** (`src/lib/services/CacheService.ts`)
- **Purpose**: Generic caching with TTL and size limits
- **Responsibilities**:
  - LRU eviction policy
  - Configurable TTL
  - Cache statistics and monitoring
  - Automatic cleanup

### Configuration Management

#### **ConfigManager** (`src/lib/config/AppConfig.ts`)
- **Purpose**: Centralized application configuration
- **Features**:
  - Environment-specific settings
  - Feature flags
  - Game configuration
  - API settings
  - Local storage persistence

### Utility Services

#### **StringUtils** (`src/lib/utils/stringUtils.ts`)
- String normalization and manipulation
- ID generation
- Text processing helpers

#### **DateUtils** (`src/lib/utils/dateUtils.ts`)
- Date formatting and manipulation
- Duration calculations
- Relative time display

## 🔄 Data Flow

```
User Request → ServiceManager → Specific Service → Cache Check → API Call → Data Processing → Cache Storage → Response
```

### Example: Fetching TWICE Songs

1. **User Request**: `GET /api/twice/songs`
2. **ServiceManager**: Routes to ITunesService
3. **ITunesService**: Checks cache first
4. **Cache Miss**: Calls APIService to fetch from iTunes
5. **APIService**: Makes HTTP request with rate limiting
6. **TrackFilterService**: Filters and cleans the data
7. **Cache Storage**: Stores processed results
8. **Response**: Returns filtered song list

## 🚀 Adding New Features

### Adding a New Artist

```typescript
// 1. Add to ArtistService
const newArtist: ArtistConfig = {
  id: 'newjeans',
  name: 'NewJeans',
  displayName: 'NewJeans',
  artistId: '1234567890',
  searchTerms: ['NewJeans', '뉴진스'],
  theme: {
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
    accentColor: '#45B7D1'
  },
  metadata: {
    debutDate: '2022-07-22',
    company: 'ADOR',
    genre: ['K-pop', 'Pop', 'R&B'],
    description: 'South Korean girl group formed by ADOR'
  }
};

artistService.addArtist(newArtist);
```

### Adding New Filtering Rules

```typescript
// 1. Update TrackFilterService
filterService.addUnwantedPattern('acoustic');
filterService.addLanguagePattern('chinese');

// 2. Or update configuration
filterService.updateFilterConfig({
  checkParentheses: true,
  checkBrackets: false
});
```

### Adding New Game Modes

```typescript
// 1. Create new service
class ChallengeModeService {
  async createChallenge(artistId: string, difficulty: string) {
    // Implementation
  }
}

// 2. Register with ServiceManager
serviceManager.challengeService = new ChallengeModeService();
```

## 📊 Performance Features

### Caching Strategy
- **Artist Cache**: 24-hour TTL (rarely changes)
- **Track Cache**: 1-hour TTL (moderate changes)
- **Game Cache**: 30-minute TTL (frequent changes)

### Rate Limiting
- **API Calls**: 100ms minimum between requests
- **Retry Logic**: 3 attempts with exponential backoff
- **Timeout**: 10 seconds per request

### Memory Management
- **LRU Eviction**: Removes oldest items when cache is full
- **Size Limits**: Configurable per cache type
- **Automatic Cleanup**: Removes expired items

## 🧪 Testing Strategy

### Unit Testing
- Each service can be tested independently
- Mock dependencies for isolated testing
- Test configuration changes and edge cases

### Integration Testing
- Test service interactions
- Test cache behavior
- Test API responses

### Performance Testing
- Cache hit/miss ratios
- API response times
- Memory usage patterns

## 🔧 Configuration Options

### API Configuration
```typescript
{
  api: {
    baseUrl: 'https://itunes.apple.com',
    timeout: 10000,
    retryAttempts: 3,
    rateLimitDelay: 100
  }
}
```

### Cache Configuration
```typescript
{
  cache: {
    maxSize: 1000,
    ttl: 3600000, // 1 hour
    enableCompression: false
  }
}
```

### Game Configuration
```typescript
{
  game: {
    maxTries: 6,
    initialDuration: 1000,
    maxDuration: 15000,
    durationProgression: [1000, 2000, 4000, 7000, 10000, 15000]
  }
}
```

## 🚀 Future Enhancements

### Planned Features
- **Multi-API Support**: Spotify, YouTube Music integration
- **User Accounts**: Progress tracking and leaderboards
- **Custom Playlists**: User-created song collections
- **Social Features**: Share results and challenge friends
- **Analytics Dashboard**: Game statistics and insights

### Scalability Improvements
- **Database Integration**: Replace localStorage with proper database
- **CDN Integration**: Cache static assets globally
- **Microservices**: Split into separate deployable services
- **Event Streaming**: Real-time updates and notifications

## 📝 Best Practices

### Service Design
- **Single Responsibility**: Each service has one clear purpose
- **Dependency Injection**: Services receive dependencies via constructor
- **Error Handling**: Consistent error handling patterns
- **Logging**: Structured logging for debugging and monitoring

### Code Organization
- **Consistent Naming**: Clear, descriptive names for all components
- **Type Safety**: Full TypeScript coverage with proper interfaces
- **Documentation**: JSDoc comments for public methods
- **Testing**: Unit tests for all service methods

### Performance
- **Lazy Loading**: Services initialized only when needed
- **Connection Pooling**: Reuse API connections when possible
- **Batch Operations**: Group multiple operations when feasible
- **Memory Monitoring**: Track memory usage and optimize

## 🔍 Troubleshooting

### Common Issues

#### Service Not Initializing
```typescript
// Check service status
const status = serviceManager.getServiceStatus();
console.log('Service Status:', status);
```

#### Cache Issues
```typescript
// Clear specific cache
serviceManager.trackCache.clear();

// Check cache stats
const stats = serviceManager.getCacheStats();
console.log('Cache Stats:', stats);
```

#### API Rate Limiting
```typescript
// Check API configuration
const config = serviceManager.apiService.getConfig();
console.log('API Config:', config);

// Check request stats
const stats = serviceManager.apiService.getRequestStats();
console.log('Request Stats:', stats);
```

## 📚 Additional Resources

- **iTunes API Documentation**: [Apple Developer](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)
- **Next.js Documentation**: [Next.js](https://nextjs.org/docs)
- **TypeScript Handbook**: [TypeScript](https://www.typescriptlang.org/docs/)

---

*This architecture is designed to grow with your application. Each service is independent and can be enhanced or replaced without affecting others.*
