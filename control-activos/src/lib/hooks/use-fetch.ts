"use client";

import * as React from "react";

interface UseFetchResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(url: string, defaultValue: T): UseFetchResult<T> {
  const [data, setData] = React.useState<T>(defaultValue);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const result = await response.json();

      // Validar que el resultado sea del tipo esperado
      if (Array.isArray(defaultValue)) {
        setData((Array.isArray(result) ? result : defaultValue) as T);
      } else {
        setData((result || defaultValue) as T);
      }
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      setError("Error al cargar datos");
      setData(defaultValue);
    } finally {
      setLoading(false);
    }
  }, [url, defaultValue]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
