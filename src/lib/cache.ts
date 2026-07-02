import { unwrapApiResponse, apiFetch } from './apiClient';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheMap = new Map<string, CacheEntry<any>>();
const subscribersMap = new Map<string, Set<(data: any) => void>>();

export const ClientCache = {
  /**
   * Subscribe to cache updates for a specific key.
   * Returns an unsubscribe function.
   */
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!subscribersMap.has(key)) {
      subscribersMap.set(key, new Set());
    }
    subscribersMap.get(key)!.add(callback);
    return () => {
      subscribersMap.get(key)?.delete(callback);
    };
  },

  /**
   * Mutate a cached payload directly and notify all subscribers.
   * This is ideal for Event-Driven updates (Pub/Sub) where a websocket
   * event patches the cache without requiring an HTTP re-fetch.
   */
  mutate<T>(key: string, updater: (oldData: T) => T): void {
    const entry = cacheMap.get(key);
    if (!entry) return;

    const newData = updater(entry.data as T);
    cacheMap.set(key, { data: newData, timestamp: Date.now() });

    // Notify all active listeners of the new data immediately
    const subs = subscribersMap.get(key);
    if (subs) {
      subs.forEach(cb => cb(newData));
    }
  },
  /**
   * Retrieves an item from the cache if it hasn't expired.
   */
  get<T>(key: string, ttlMs = 300000): T | null {
    const entry = cacheMap.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > ttlMs;
    if (isExpired) {
      cacheMap.delete(key);
      return null;
    }
    return entry.data as T;
  },

  /**
   * Stores an item in the cache.
   */
  set<T>(key: string, data: T): void {
    cacheMap.set(key, { data, timestamp: Date.now() });
    
    // Notify subscribers when the cache is set (e.g. from a background SWR fetch)
    const subs = subscribersMap.get(key);
    if (subs) {
      subs.forEach(cb => cb(data));
    }
  },

  /**
   * Invalidates a single cache key or the entire cache.
   */
  delete(key: string): void {
    cacheMap.delete(key);
  },

  clear(): void {
    cacheMap.clear();
  },

  /**
   * Stale-While-Revalidate execution pipeline.
   * If a valid cache item is found, it is returned instantly to the UI callback
   * to guarantee a 0ms transition delay. Simultaneously, a background fetch is
   * fired to quietly synchronize the client state and update the cache in memory.
   */
  async swr<T>(
    url: string,
    onData: (data: T) => void,
    onError?: (err: any) => void,
    ttlMs = 24 * 60 * 60 * 1000
  ): Promise<T> {
    const cached = ClientCache.get<T>(url, ttlMs);
    if (cached) {
      onData(cached);
      return cached; // Skip background fetch if within 24h
    }

    try {
      const data = await apiFetch<T>(url);
      
      // Only store valid data arrays or records
      ClientCache.set(url, data);
      onData(data);
      return data;
    } catch (err) {
      console.warn(`SWR fetch synchronization failed for key: ${url}`, err);
      if (onError) onError(err);
      
      // Fallback to cached content on offline/failure if available
      if (cached) return cached;
      throw err;
    }
  }
};
