"use client";

import * as React from "react";

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

  const fetchData = React.useCallback(async () => {
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
        setData((Array.isArray(result) ? result : safeDefaultValue) as T);
      } else {
        setData((result || safeDefaultValue) as T);
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
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
