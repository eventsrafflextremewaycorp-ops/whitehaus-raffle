import { useEffect, useReducer, useState } from "react";
import { ApiError, getRegisteredCustomers } from "@/lib/api";
export const PER_PAGE = 25;
export const DEFAULT_FILTERS = { search: "", dateFrom: "", dateTo: "", status: "all" };
/**
 * One reducer owns search, date range, status and page, so they always describe
 * the same result set. Any filter change sends the user back to page 1.
 */
function reducer(state, action) {
    switch (action.type) {
        case "filters":
            return { ...state, filters: { ...state.filters, ...action.patch }, page: 1 };
        case "reset":
            return { ...state, filters: DEFAULT_FILTERS, page: 1 };
        case "page":
            return { ...state, page: Math.max(1, action.page) };
        case "reload":
            return { ...state, reload: state.reload + 1 };
    }
}
/** Server-side search, date filtering and pagination for the Registered Customers table. */
export function useRegisteredCustomers(onUnauthenticated) {
    const [state, dispatch] = useReducer(reducer, { filters: DEFAULT_FILTERS, page: 1, reload: 0 });
    const [result, setResult] = useState(null);
    const [lastData, setLastData] = useState(null);
    const key = JSON.stringify(state);
    useEffect(() => {
        const { filters, page } = JSON.parse(key);
        // Ignore responses from superseded requests instead of aborting them
        // (aborting makes fetch reject with AbortError, which dev overlays report).
        let stale = false;
        getRegisteredCustomers(filters, page, PER_PAGE)
            .then((data) => {
            if (stale)
                return;
            // The page we asked for no longer exists (e.g. rows were validated away): jump to the last page.
            if (data.data.length === 0 && data.meta.total > 0 && page > data.meta.last_page) {
                dispatch({ type: "page", page: data.meta.last_page });
                return;
            }
            setLastData(data);
            setResult({ key, data });
        })
            .catch((error) => {
            if (stale)
                return;
            const apiError = error instanceof ApiError ? error : new ApiError(0, "Could not load registrations.");
            if (apiError.isUnauthenticated)
                onUnauthenticated();
            setResult({ key, error: apiError });
        });
        return () => {
            stale = true;
        };
    }, [key, onUnauthenticated]);
    const loading = result?.key !== key;
    return {
        filters: state.filters,
        page: state.page,
        data: lastData,
        loading,
        error: !loading ? (result?.error ?? null) : null,
        setFilters: (patch) => dispatch({ type: "filters", patch }),
        resetFilters: () => dispatch({ type: "reset" }),
        goToPage: (page) => dispatch({ type: "page", page }),
        reload: () => dispatch({ type: "reload" }),
    };
}
