import { useState, useCallback } from "react";

// LocalStorage-backed state hook (persistent preferences)
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch (e) {
      /* ignore */
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch (e) {
          /* ignore */
        }
        return resolved;
      });
    },
    [key]
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
    setValue(typeof initialValue === "function" ? initialValue() : initialValue);
  }, [key]);

  return [value, set, reset];
}
