import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { inputClasses } from "@/components/ui/FormField";
/** Debounced search box shared by the tickets and receipts lists. */
export function ListSearch({ label, placeholder, onSearch }) {
    const [draft, setDraft] = useState("");
    const timer = useRef(null);
    useEffect(() => () => {
        if (timer.current)
            clearTimeout(timer.current);
    }, []);
    return (<div className="w-full md:max-w-sm">
      <label htmlFor="list-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden/>
        <input id="list-search" type="search" value={draft} maxLength={100} placeholder={placeholder} className={`${inputClasses} pl-9`} onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            if (timer.current)
                clearTimeout(timer.current);
            timer.current = setTimeout(() => onSearch(next.trim()), 350);
        }}/>
      </div>
    </div>);
}
export function SegmentedTabs({ label, value, options, onChange, }) {
    return (<div role="group" aria-label={label} className="inline-flex rounded-lg border border-ink-700 bg-ink-900 p-1">
      {options.map((o) => (<button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${value === o.value ? "bg-ink-700 text-heading" : "text-ink-400 hover:text-heading"}`}>
          {o.label}
        </button>))}
    </div>);
}
