/**
 * CacheStrategy
 * Implements advanced caching logic to handle massive traffic without 
 * constantly hitting the database over the network.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheStrategy {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private TTL = 1000 * 60 * 5; // 5 minutes

  constructor() {
    // Periodically prune stale entries every 10 minutes to maintain memory efficiency
    setInterval(() => this.prune(), 1000 * 60 * 10);
  }

  private prune() {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.memoryCache.delete(key);
      }
    }
    console.debug(`[Scaling] Cache pruned. Current size: ${this.memoryCache.size}`);
  }

  set<T>(key: string, data: T) {
    // Cap cache size at 100 entries to strictly control memory usage under extreme load
    if (this.memoryCache.size > 100) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  isValid(key: string): boolean {
    const entry = this.memoryCache.get(key);
    return !!entry && (Date.now() - entry.timestamp <= this.TTL);
  }

  invalidate(key: string) {
    this.memoryCache.delete(key);
  }

  clear() {
    this.memoryCache.clear();
  }
}

export const cacheStrategy = new CacheStrategy();
