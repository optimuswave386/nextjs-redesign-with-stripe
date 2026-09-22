"use client";
import { useCallback, useEffect, useState } from "react";

// Reads after mount so server and client markup match, then persists on change.
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore corrupted or blocked storage */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, ready]);

  const update = useCallback((next: T | ((prev: T) => T)) => setValue(next), []);
  return [value, update, ready] as const;
}
