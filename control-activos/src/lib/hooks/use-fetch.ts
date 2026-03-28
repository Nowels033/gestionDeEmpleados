"use client";

import * as React from "react";

const CLIENT_CACHE_TTL_MS = 60_000;
const clientCache = new Map<string, { data: unknown; timestamp: number }>();
const inflightRequests = new Map<string, Promise<unknown>>();

interface UseFetchResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(url: string, defaultValue: T): UseFetchResult<T> {
  const defaultValueRef = React.useRef(defaultValue);
  const cachedAtInit = clientCache.get(url);
  const [data, setData] = React.useState<T>(
    (cachedAtInit?.data as T | undefined) ?? defaultValue
  );
  const [loading, setLoading] = React.useState(!cachedAtInit);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (force = false, silent = false) => {
    const cached = clientCache.get(url);
    const cacheIsFresh =
      cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS;

    if (!force && cacheIsFresh) {
      setData(cached.data as T);
      setLoading(false);
      setError(null);
      return;
    }

    if (!force && cached && !cacheIsFresh) {
      setData(cached.data as T);
      setLoading(false);
      setError(null);
    }

    try {
      if (!silent && !cached) {
        setLoading(true);
      }
      setError(null);

      let request = inflightRequests.get(url);
      if (!request || force) {
        request = fetch(url).then(async (response) => {
          if (!response.ok) {
            throw new Error(`Error ${response.status}`);
          }
          return response.json();
        });
        inflightRequests.set(url, request);
      }

      const result = await request;
      if (inflightRequests.get(url) === request) {
        inflightRequests.delete(url);
      }

      const safeDefaultValue = defaultValueRef.current;

      // Validar que el resultado sea del tipo esperado
      if (Array.isArray(safeDefaultValue)) {
        const safeResult = (Array.isArray(result) ? result : safeDefaultValue) as T;
        setData(safeResult);
        clientCache.set(url, { data: safeResult, timestamp: Date.now() });
      } else {
        const safeResult = (result || safeDefaultValue) as T;
        setData(safeResult);
        clientCache.set(url, { data: safeResult, timestamp: Date.now() });
      }
    } catch (err) {
      inflightRequests.delete(url);
      console.error(`Error fetching ${url}:`, err);
      setError("Error al cargar datos");
      const staleCache = clientCache.get(url);
      setData((staleCache?.data as T | undefined) ?? defaultValueRef.current);
    } finally {
      setLoading(false);
    }
  }, [url]);

  React.useEffect(() => {
    const hasCache = clientCache.has(url);
    fetchData(false, hasCache);
  }, [fetchData, url]);

  return { data, loading, error, refetch: () => fetchData(true) };
}
