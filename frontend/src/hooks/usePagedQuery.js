import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
/**
 * Loads one server page whenever `deps` change. Responses of superseded requests are ignored
 * (no AbortController, so no AbortError reaches dev overlays). `reload()` refetches.
 */
export function usePagedQuery(load, deps, onUnauthenticated) {
    const [reloadCount, setReloadCount] = useState(0);
    const [result, setResult] = useState(null);
    const [last, setLast] = useState(null);
    const key = JSON.stringify([deps, reloadCount]);
    useEffect(() => {
        let stale = false;
        load()
            .then((data) => {
            if (stale)
                return;
            setLast(data);
            setResult({ key, data });
        })
            .catch((e) => {
            if (stale)
                return;
            const error = e instanceof ApiError ? e : new ApiError(0, "Could not load the data.");
            if (error.isUnauthenticated)
                onUnauthenticated();
            setResult({ key, error });
        });
        return () => {
            stale = true;
        };
        // `load` closes over `deps`; `key` captures them.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, onUnauthenticated]);
    const loading = result?.key !== key;
    return {
        data: last,
        loading,
        error: !loading ? (result?.error ?? null) : null,
        reload: () => setReloadCount((n) => n + 1),
    };
}
