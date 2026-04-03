/**
 * Simple in-memory cache for API requests
 */
const cache = new Map();

/**
 * TTL constants in milliseconds
 */
export const TTL = {
  MANDI_RATES: 5 * 60 * 1000,     // 5 minutes
  RECOMMENDATIONS: 1 * 60 * 1000, // 1 minute
  DEFAULT: 2 * 60 * 1000          // 2 minutes
};

/**
 * Set data in cache
 * @param {string} key 
 * @param {any} data 
 * @param {number} ttlMs 
 */
export const setCache = (key, data, ttlMs = TTL.DEFAULT) => {
  const expiry = Date.now() + ttlMs;
  cache.set(key, { data, expiry });
};

/**
 * Get data from cache
 * @param {string} key 
 * @returns {any|null}
 */
export const getCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }

  return cached.data;
};

/**
 * Clear specific cache key
 * @param {string} key 
 */
export const clearCache = (key) => {
  cache.delete(key);
};

/**
 * Clear entire cache
 */
export const clearAllCache = () => {
  cache.clear();
};
