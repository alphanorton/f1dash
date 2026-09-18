import { useState, useEffect } from 'react';

const CACHE_PREFIX = 'f1_data_sync_';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}

async function fetchStaticJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

export function useCachedData<T>(cacheKey: string, staticPath: string): { data: T | null; loading: boolean; error: string | null } {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cached = getCached<T>(cacheKey);
      if (!cancelled && cached !== null) {
        setState({ data: cached, loading: false, error: null });
        return;
      }
      try {
        const staticData = await fetchStaticJson<T>(staticPath);
        if (!cancelled) {
          setState({ data: staticData, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState(s => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Load failed',
          }));
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [cacheKey, staticPath]);

  return state;
}
