import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { inputClasses } from "@/components/ui/FormField";
/** Debounced search box; Enter applies immediately, the × button clears it. */
export function CustomerSearch({ value, onSearch }) {
    const [draft, setDraft] = useState(value);
    const [synced, setSynced] = useState(value);
    const timer = useRef(null);
    // Follow external resets (e.g. "Clear filters").
    if (value !== synced) {
        setSynced(value);
        setDraft(value);
    }
    useEffect(() => () => {
        if (timer.current)
            clearTimeout(timer.current);
    }, []);
    function schedule(next) {
        setDraft(next);
        if (timer.current)
            clearTimeout(timer.current);
        timer.current = setTimeout(() => onSearch(next.trim()), 350);
    }
    function applyNow(next) {
        if (timer.current)
            clearTimeout(timer.current);
        onSearch(next.trim());
    }
    return (<form role="search" className="relative w-full md:max-w-sm" onSubmit={(e) => {
            e.preventDefault();
            applyNow(draft);
        }}>
      <label htmlFor="customer-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-400">
        Search
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden/>
        <input id="customer-search" type="search" value={draft} onChange={(e) => schedule(e.target.value)} placeholder="Name, email, reference, ticket, branch…" maxLength={100} className={`${inputClasses} pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden`}/>
        {draft && (<button type="button" aria-label="Clear search" onClick={() => {
                setDraft("");
                applyNow("");
            }} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-400 hover:bg-ink-700 hover:text-heading">
            <X className="size-4" aria-hidden/>
          </button>)}
      </div>
    </form>);
}
