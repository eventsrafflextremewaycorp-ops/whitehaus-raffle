import { useEffect, useState } from "react";

/**
 * Loads public data once for a page. Returns null while loading, then `{ok: true, data}` or `{ok: false, error}`
 * so pages can show a friendly message instead of crashing when the API is unreachable.
 */
export function useLoad(fn) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    let stale = false;
    fn()
      .then((data) => {
        if (!stale) setResult({ ok: true, data });
      })
      .catch((err) => {
        if (!stale) setResult({ ok: false, error: err instanceof Error && err.message ? err.message : "We couldn't load this information right now. Please try again later." });
      });
    return () => {
      stale = true;
    };
  }, [fn]);

  return result;
}
