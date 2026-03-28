"use client";

import * as React from "react";

const CLIENT_CACHE_TTL_MS = 15_000;
const clientCache = new Map<string, { data: unknown; timestamp: number }>();

interface UseFetchResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(url: string, defaultValue: T): UseFetchResult<T> {
  const defaultValueRef = React.useRef(defaultValue);
  const [data, setData] = React.useState<T>(defaultValue);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (force = false) => {
    const cached = clientCache.get(url);
    const cacheIsFresh =
      cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS;

    if (!force && cacheIsFresh) {
      setData(cached.data as T);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const result = await response.json();

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
      console.error(`Error fetching ${url}:`, err);
      setError("Error al cargar datos");
      setData(defaultValueRef.current);
    } finally {
      setLoading(false);
    }
  }, [url]);

  React.useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  return { data, loading, error, refetch: () => fetchData(true) };
}
