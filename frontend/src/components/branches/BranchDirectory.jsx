import { Globe, MapPin, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/States";
import { inputClasses } from "@/components/ui/FormField";
const REGION_ORDER = ["Metro Manila", "North Luzon", "South Luzon", "Visayas & Mindanao", "Website"];
/** Filters the (small, public) branch list in the browser. */
export function BranchDirectory({ branches }) {
    const [query, setQuery] = useState("");
    const [region, setRegion] = useState("all");
    const regions = REGION_ORDER.filter((r) => branches.some((b) => b.region === r));
    const grouped = useMemo(() => {
        const q = query.trim().toLowerCase();
        const matches = branches.filter((b) => (region === "all" || b.region === region) && (!q || b.name.toLowerCase().includes(q) || b.region.toLowerCase().includes(q)));
        return REGION_ORDER.map((r) => ({ region: r, items: matches.filter((b) => b.region === r) })).filter((g) => g.items.length > 0);
    }, [branches, query, region]);
    const total = grouped.reduce((n, g) => n + g.items.length, 0);
    return (<div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <label htmlFor="branch-search" className="sr-only">
            Search branches
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden/>
          <input id="branch-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by mall or city" className={`${inputClasses} pl-9`}/>
        </div>

        <div role="group" aria-label="Filter by region" className="flex flex-wrap gap-2">
          {["all", ...regions].map((r) => (<button key={r} type="button" aria-pressed={region === r} onClick={() => setRegion(r)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${region === r ? "border-brand-500 bg-brand-600 text-white" : "border-ink-600 text-ink-300 hover:border-ink-400 hover:text-heading"}`}>
              {r === "all" ? "All regions" : r}
            </button>))}
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-400" aria-live="polite">
        {total} {total === 1 ? "location" : "locations"}
      </p>

      {total === 0 ? (<div className="mt-6">
          <EmptyState icon={<MapPin className="size-6" aria-hidden/>} title="No branches match your search" action={<button type="button" onClick={() => {
                    setQuery("");
                    setRegion("all");
                }} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-300 hover:text-brand-400">
                <X className="size-4" aria-hidden/> Clear filters
              </button>}/>
        </div>) : (<div className="mt-6 space-y-10">
          {grouped.map((g) => (<section key={g.region} aria-labelledby={`region-${g.region}`}>
              <h2 id={`region-${g.region}`} className="mb-4 flex items-baseline gap-3 text-xl font-semibold text-heading">
                {g.region}
                <span className="text-sm font-normal text-ink-400">{g.items.length}</span>
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((b) => (<li key={b.id} className="flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-900 p-4">
                    <span className="mt-0.5 text-brand-400">
                      {b.is_online ? <Globe className="size-4" aria-hidden/> : <MapPin className="size-4" aria-hidden/>}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-heading">{b.is_online ? "WhiteHaus official website" : `WhiteHaus ${b.name}`}</p>
                      {b.address &&
                        (b.is_online ? (<a href={b.address} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-300 hover:underline">
                            {b.address.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </a>) : (<p className="text-sm text-ink-400">{b.address}</p>))}
                    </div>
                  </li>))}
              </ul>
            </section>))}
        </div>)}
    </div>);
}
