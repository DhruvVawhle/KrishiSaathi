import { getCache, setCache, TTL } from './apiCache';

/**
 * Fetch with cache support (GET only)
 * Adds a 10s AbortController and simple in-memory caching
 */
export async function fetchWithCache(url, options = {}, ttlMs = TTL.DEFAULT) {
  const method = (options.method || 'GET').toUpperCase();
  
  // Non-GET requests bypass cache
  if (method !== 'GET') {
    return fetchWithTimeout(url, options);
  }

  // Check cache
  const cachedData = getCache(url);
  if (cachedData) {
    // Return a fake Response object that matches the fetch API
    return {
      ok: true,
      status: 200,
      json: async () => cachedData,
      text: async () => JSON.stringify(cachedData),
      headers: new Headers({
        "content-type": "application/json"
      }),
      clone: function() { return this; }
    };
  }

  // Add 10s AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal
    });

    if (res.ok) {
      // Clone response to read JSON without consuming the original
      const clone = res.clone();
      try {
        const json = await clone.json();
        setCache(url, json, ttlMs);
      } catch { /* ignore non-json */ }
    }

    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Reusable fetch utilities to handle timeouts, 
 * abort signals, JSON validation, and common error patterns.
 */

/**
 * Fetch with timeout using AbortController
 */
export async function fetchWithTimeout(resource, options = {}, timeout = 10000) {
  const { signal, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // Combine provided signal with our internal timeout signal if needed
  if (signal?.aborted) {
    clearTimeout(id);
    throw new Error('AbortError');
  }

  try {
    const response = await fetch(resource, {
      ...rest,
      signal: signal ? signal : controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Robust JSON fetch with validation
 */
export async function fetchJSON(url, options = {}, timeout = 10000) {
  try {
    const response = await fetchWithTimeout(url, options, timeout);
    
    // Check for success status
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 50)}`);
    }

    // Check for application/json content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response (HTML or plain text)");
    }

    return await response.json();
  } catch (error) {
    return handleFetchError(error);
  }
}

/**
 * Common error handler for fetch operations
 */
export function handleFetchError(error) {
  if (error.name === 'AbortError') {
    // Silently return aborted state or special object
    return { aborted: true, success: false, error: 'Request timed out or cancelled' };
  }
  
  console.warn('[fetchUtils] Fetch failed:', error.message);
  return { 
    success: false, 
    error: error.message || 'Network error',
    isNetworkError: true 
  };
}

/**
 * Helper to create a new AbortController
 */
export function createAbortController() {
  return new AbortController();
}
